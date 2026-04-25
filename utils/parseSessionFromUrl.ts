import { UserResponseData } from "@/types/auth";

function buildUrlObject(url: string) {
  if (url.includes("://")) {
    return new URL(url);
  }

  return new URL(url, "https://aicar.local");
}

// Deep link URL'inden session verisini parse eden fonksiyon
export function parseSessionFromUrl(url: string): UserResponseData | null {
  try {
    const urlObj = buildUrlObject(url);
    const sessionParam = urlObj.searchParams.get("session");

    if (sessionParam) {
      const candidates = [sessionParam, decodeURIComponent(sessionParam)];

      for (const candidate of candidates) {
        try {
          return JSON.parse(candidate) as UserResponseData;
        } catch {
          continue;
        }
      }
    }
  } catch (error) {
    console.error("Session parse error:", error);
  }
  return null;
}
