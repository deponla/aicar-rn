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

function buildUrlObject(url: string) {
  if (url.includes("://")) {
    return new URL(url);
  }

  return new URL(url, "https://aicar.local");
}

function parseSession(urlObj: URL): UserResponseData | null {
  const sessionParam = urlObj.searchParams.get("session");

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

// Deep link URL'inden session verisini parse eden fonksiyon
export function parseSessionFromUrl(url: string): UserResponseData | null {
  const authCallback = parseAuthCallbackFromUrl(url);

  if (!authCallback || authCallback.type !== "session") {
    return null;
  }

  return authCallback.session;
}

export function parseAuthCallbackFromUrl(
  url: string,
): AuthCallbackResult | null {
  try {
    const urlObj = buildUrlObject(url);
    const session = parseSession(urlObj);

    if (session) {
      return {
        type: "session",
        session,
      };
    }

    const action = urlObj.searchParams.get("action");

    if (action) {
      return {
        type: "intent",
        action,
        reason: urlObj.searchParams.get("reason") || undefined,
        email: urlObj.searchParams.get("email") || undefined,
      };
    }
  } catch (error) {
    console.error("Session parse error:", error);
  }
  return null;
}
