import { UserResponseData } from "@/types/auth";

export const AUTH_CALLBACK_ACTIONS = {
  REACTIVATE_ACCOUNT: "reactivate-account",
} as const;

export type AuthCallbackResult =
  | {
      type: "session";
      session: UserResponseData;
    }
  | {
      type: "intent";
      action: string;
      reason?: string;
      email?: string;
    };

function getSearchParams(url: string) {
  if (url.includes("://")) {
    return new URL(url).searchParams;
  }

  if (url.startsWith("?")) {
    return new URLSearchParams(url.slice(1));
  }

  const queryIndex = url.indexOf("?");

  if (queryIndex >= 0) {
    return new URLSearchParams(url.slice(queryIndex + 1));
  }

  return new URLSearchParams();
}

function parseSession(searchParams: URLSearchParams): UserResponseData | null {
  const sessionParam = searchParams.get("session");

  if (!sessionParam) {
    return null;
  }

  const candidates = [sessionParam, decodeURIComponent(sessionParam)];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as UserResponseData;
    } catch {
      continue;
    }
  }

  return null;
}

export function parseAuthCallbackFromUrl(
  url: string,
): AuthCallbackResult | null {
  try {
    const searchParams = getSearchParams(url);
    const session = parseSession(searchParams);

    if (session) {
      return {
        type: "session",
        session,
      };
    }

    const action = searchParams.get("action");

    if (action) {
      return {
        type: "intent",
        action,
        reason: searchParams.get("reason") || undefined,
        email: searchParams.get("email") || undefined,
      };
    }
  } catch (error) {
    console.error("Session parse error:", error);
  }
  return null;
}

export function hasAuthCallbackPayload(url: string) {
  const searchParams = getSearchParams(url);

  return searchParams.has("session") || searchParams.has("action");
}
