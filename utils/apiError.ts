import type { NotificationOptions } from "@/components/Notification";

type ErrorWithResponseMessage = {
  response?: {
    data?: {
      message?: string;
    };
  };
};

type Notify = (opts: NotificationOptions) => void;

export function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  const responseMessage = (error as ErrorWithResponseMessage | undefined)
    ?.response?.data?.message;

  if (
    typeof responseMessage === "string" &&
    responseMessage.trim().length > 0
  ) {
    return responseMessage;
  }

  return fallbackMessage;
}

export function notifyApiError({
  error,
  fallbackMessage,
  notify,
  title,
}: {
  error: unknown;
  fallbackMessage: string;
  notify: Notify;
  title: string;
}) {
  notify({
    type: "error",
    title,
    message: getApiErrorMessage(error, fallbackMessage),
  });
}
