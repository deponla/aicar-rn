import { UserResponseData } from "@/types/auth";

// Deep link URL'inden session verisini parse eden fonksiyon
export function parseSessionFromUrl(url: string): UserResponseData | null {
  try {
    const urlObj = new URL(url);
    const sessionParam = urlObj.searchParams.get("session");

    if (sessionParam) {
      const decodedSession = decodeURIComponent(sessionParam);
      const sessionData = JSON.parse(decodedSession) as UserResponseData;
      return sessionData;
    }
  } catch (error) {
    console.error("Session parse error:", error);
  }
  return null;
}
