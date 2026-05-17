import {
  AuthCallbackResult,
  parseAuthCallbackFromUrl,
} from "@/utils/parseSessionFromUrl";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";

type AuthFlowType = "login" | "register";

type AuthSessionConfig = {
  authUrl: string;
  redirectUrl: string;
  useEmbeddedBrowserFallback: boolean;
};

export type StartAuthSessionResult =
  | {
      type: "completed";
      authCallback: AuthCallbackResult;
    }
  | {
      type: "opened-in-browser";
    }
  | {
      type: "cancelled";
    }
  | {
      type: "invalid-callback";
    };

export function buildAuthSessionConfig(
  type: AuthFlowType,
  frontendUrlMissingMessage: string,
): AuthSessionConfig {
  const frontendUrl = process.env.EXPO_PUBLIC_FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error(frontendUrlMissingMessage);
  }

  const redirectUrl = Linking.createURL("/auth/callback");
  const authUrl = new URL(`/auth/${type}`, frontendUrl);

  authUrl.searchParams.set("from", "app");
  authUrl.searchParams.set("redirect_uri", redirectUrl);

  return {
    authUrl: authUrl.toString(),
    redirectUrl,
    useEmbeddedBrowserFallback:
      Platform.OS === "ios" && authUrl.protocol !== "https:",
  };
}

export async function startAuthSession(
  type: AuthFlowType,
  frontendUrlMissingMessage: string,
): Promise<StartAuthSessionResult> {
  const { authUrl, redirectUrl, useEmbeddedBrowserFallback } =
    buildAuthSessionConfig(type, frontendUrlMissingMessage);

  if (useEmbeddedBrowserFallback) {
    await WebBrowser.openBrowserAsync(authUrl);
    return { type: "opened-in-browser" };
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

  if (result.type !== "success" || !result.url) {
    return { type: "cancelled" };
  }

  const authCallback = parseAuthCallbackFromUrl(result.url);

  if (!authCallback) {
    return { type: "invalid-callback" };
  }

  return {
    type: "completed",
    authCallback,
  };
}
