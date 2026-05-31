function readPublicEnv(name: string) {
  const value = process.env[name];

  if (typeof value !== "string") {
    return undefined;
  }

  const normalizedValue = value.trim();

  return normalizedValue.length > 0 ? normalizedValue : undefined;
}

function requirePublicEnv(name: string) {
  const value = readPublicEnv(name);

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function normalizeBaseUrl(value: string) {
  return trimTrailingSlash(value);
}

function normalizeRouteSegment(value: string) {
  return value.startsWith("/") ? value : `/${value}`;
}

function buildAbsoluteUrl(baseUrl: string, path: string) {
  return new URL(normalizeRouteSegment(path), `${baseUrl}/`).toString();
}

export const API_URL = normalizeBaseUrl(
  requirePublicEnv("EXPO_PUBLIC_API_URL"),
);

export const FRONTEND_URL = readPublicEnv("EXPO_PUBLIC_FRONTEND_URL");

const SITE_URL = normalizeBaseUrl(
  readPublicEnv("EXPO_PUBLIC_SITE_URL") || FRONTEND_URL || "",
);

if (!SITE_URL) {
  throw new Error(
    "EXPO_PUBLIC_SITE_URL or EXPO_PUBLIC_FRONTEND_URL is not defined",
  );
}

export const SOCKET_URL = normalizeBaseUrl(
  readPublicEnv("EXPO_PUBLIC_SOCKET_URL") || API_URL,
);

export const SOCKET_PATH = normalizeRouteSegment(
  readPublicEnv("EXPO_PUBLIC_SOCKET_PATH") || "/socket.io",
);

export const SOCKET_NAMESPACE = normalizeRouteSegment(
  readPublicEnv("EXPO_PUBLIC_SOCKET_NAMESPACE") || "/chat",
);

export const AI_CHAT_TIMEOUT_MS = Number(
  readPublicEnv("EXPO_PUBLIC_AI_CHAT_TIMEOUT_MS") ?? 240_000,
);

export const TERMS_URL = buildAbsoluteUrl(SITE_URL, "/terms");
export const PRIVACY_URL = buildAbsoluteUrl(SITE_URL, "/privacy");
export const OPEN_SOURCE_LICENSES_URL = buildAbsoluteUrl(
  SITE_URL,
  "/open-source-licenses",
);
