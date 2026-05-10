import axios, { AxiosError } from "axios";
import { ErrorResponse } from "../types/utils";
import i18n, { getCurrentLanguage } from "@/i18n";

interface ApiErrorResponse extends Partial<ErrorResponse> {
  message?: string;
  statusCode?: number;
  reason?: string;
  nextAction?: string;
  reactivationEmail?: string;
  path?: string;
  timestamp?: string;
}

export class ApiRequestError extends Error {
  readonly statusCode?: number;
  readonly reason?: string;
  readonly nextAction?: string;
  readonly reactivationEmail?: string;
  readonly path?: string;
  readonly timestamp?: string;
  readonly errors?: string[];

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
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

export const instance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/",
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
    const responseData = error.response?.data;
    if (
      responseData?.errors &&
      Array.isArray(responseData.errors) &&
      responseData.errors.length > 0
    ) {
      throw new ApiRequestError(
        {
          ...responseData,
          message: responseData.errors.join(", "),
        },
        error.message || i18n.t("common.requestFailed"),
      );
    }

    throw new ApiRequestError(
      responseData
        ? {
            ...responseData,
            message:
              responseData.message ||
              error.message ||
              i18n.t("common.requestFailed"),
          }
        : { message: error.message || i18n.t("common.requestFailed") },
      error.message || i18n.t("common.requestFailed"),
    );
  },
);
