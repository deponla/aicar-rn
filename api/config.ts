import axios, { AxiosError } from "axios";
import { ErrorResponse } from "../types/utils";

interface ApiErrorResponse extends ErrorResponse {
  message?: string;
}

export const instance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/",
  headers: {
    "Content-Type": "application/json",
  },
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (
      error.response?.data?.errors &&
      Array.isArray(error.response.data.errors)
    ) {
      const errorMessage = error.response.data.errors.join(", ");
      throw new Error(errorMessage);
    }

    const errorMessage =
      error.response?.data?.message || error.message || "Request failed";
    throw new Error(errorMessage);
  },
);
