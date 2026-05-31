import { create } from "axios";
import type { AxiosError } from "axios";
import { ErrorResponse } from "../types/utils";
import i18n, { getCurrentLanguage } from "@/i18n";
import {
  isUnauthorizedStatus,
  triggerUnauthorizedHandler,
} from "@/api/auth-session";
import { API_URL } from "@/utils/env";

interface ApiErrorResponse extends Partial<ErrorResponse> {
  message?: string;
  statusCode?: number;
  reason?: string;
  nextAction?: string;
  reactivationEmail?: string;
  path?: string;
  timestamp?: string;
  isRetryable?: boolean;
  requestErrorCode?: ApiRequestErrorCode;
}

export type ApiRequestErrorCode =
  | "http_error"
  | "network_error"
  | "request_timeout";

export class ApiRequestError extends Error {
  readonly statusCode?: number;
  readonly reason?: string;
  readonly nextAction?: string;
  readonly reactivationEmail?: string;
  readonly path?: string;
  readonly timestamp?: string;
  readonly errors?: string[];
  readonly isRetryable: boolean;
  readonly requestErrorCode: ApiRequestErrorCode;

  constructor(data: ApiErrorResponse = {}, fallbackMessage = "Request failed") {
    super(data.message || fallbackMessage);
    this.name = "ApiRequestError";
    this.statusCode = data.statusCode;
    this.reason = data.reason;
    this.nextAction = data.nextAction;
    this.reactivationEmail = data.reactivationEmail;
    this.path = data.path;
    this.timestamp = data.timestamp;
    this.errors = data.errors;
    this.isRetryable = data.isRetryable ?? false;
    this.requestErrorCode = data.requestErrorCode ?? "http_error";
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

function getRequestFailedMessage() {
  return i18n.t("common.requestFailed", {
    lng: getCurrentLanguage(),
    defaultValue: "Request failed",
  });
}

function getNetworkErrorMessage() {
  return i18n.t("common.networkError", {
    lng: getCurrentLanguage(),
    defaultValue: "Network error",
  });
}

function getRequestTimedOutMessage() {
  return i18n.t("common.requestTimedOut", {
    lng: getCurrentLanguage(),
    defaultValue: "Request timed out",
  });
}

function isRetryableStatus(statusCode?: number) {
  return (
    statusCode === 408 ||
    statusCode === 429 ||
    (typeof statusCode === "number" && statusCode >= 500)
  );
}

function isTimeoutError(error: AxiosError) {
  return (
    error.code === "ECONNABORTED" ||
    error.message.toLowerCase().includes("timeout")
  );
}

function isApiRequestError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}

export function isRetryableApiRequestError(
  error: unknown,
): error is ApiRequestError {
  return isApiRequestError(error) && error.isRetryable;
}

export const instance = create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers["Accept-Language"] = getCurrentLanguage();

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    const statusCode =
      error.response?.status ?? error.response?.data?.statusCode;

    if (!error.response) {
      const isTimeout = isTimeoutError(error);
      const message = isTimeout
        ? getRequestTimedOutMessage()
        : getNetworkErrorMessage();

      throw new ApiRequestError(
        {
          message,
          isRetryable: true,
          requestErrorCode: isTimeout ? "request_timeout" : "network_error",
        },
        message,
      );
    }

    if (isUnauthorizedStatus(statusCode)) {
      void triggerUnauthorizedHandler();
    }

    const responseData = error.response.data;

    if (
      responseData?.errors &&
      Array.isArray(responseData.errors) &&
      responseData.errors.length > 0
    ) {
      throw new ApiRequestError(
        {
          ...responseData,
          statusCode,
          message: responseData.errors.join(", "),
          isRetryable: isRetryableStatus(statusCode),
          requestErrorCode: "http_error",
        },
        error.message || getRequestFailedMessage(),
      );
    }

    throw new ApiRequestError(
      responseData
        ? {
            ...responseData,
            statusCode,
            message:
              responseData.message ||
              error.message ||
              getRequestFailedMessage(),
            isRetryable: isRetryableStatus(statusCode),
            requestErrorCode: "http_error",
          }
        : {
            message: error.message || getRequestFailedMessage(),
            isRetryable: isRetryableStatus(statusCode),
            requestErrorCode: "http_error",
          },
      error.message || getRequestFailedMessage(),
    );
  },
);
