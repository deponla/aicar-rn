import { instance } from "@/api/config";
import { changeAppLanguage } from "@/i18n";
import { postLogout } from "@/api/post";
import { useCreditsStore } from "@/store/useCredits";
import { queryClient } from "@/utils/queryClient";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { AuthStatusEnum, UserResponseData } from "../types/auth";

export const SECURE_STORE_KEY = "auth";

let clearLocalAuthStatePromise: Promise<void> | null = null;

type AuthStore = {
  user: UserResponseData | null;
  status: AuthStatusEnum;
  login: (user: UserResponseData) => void;
  logout: () => Promise<void>;
};

function applyAuthenticatedSession(session: UserResponseData) {
  useAuthStore.setState({
    user: session,
    status: AuthStatusEnum.LOGGED_IN,
  });
  instance.defaults.headers.common["Authorization"] =
    `Bearer ${session.accessToken.token}`;
}

async function persistAuthenticatedSession(session: UserResponseData) {
  await SecureStore.setItemAsync(SECURE_STORE_KEY, JSON.stringify(session));
}

export const useAuthStore = create<AuthStore>()((set, get) => ({
  user: null,
  status: AuthStatusEnum.LOADING,
  login: (user: UserResponseData) => {
    void changeAppLanguage(user.user.language);
    set({ user, status: AuthStatusEnum.LOGGED_IN });
    instance.defaults.headers.common["Authorization"] =
      `Bearer ${user.accessToken.token}`;
  },
  logout: async () => {
    const currentUser = get().user;
    if (currentUser?.sessionId) {
      try {
        await postLogout(currentUser.sessionId);
      } catch {
        // Proceed with local logout even if API call fails
      }
    }
    await clearLocalAuthState();
  },
}));

export function clearLocalAuthState() {
  if (!clearLocalAuthStatePromise) {
    clearLocalAuthStatePromise = (async () => {
      await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
      useCreditsStore.getState().reset();
      useAuthStore.setState({ user: null, status: AuthStatusEnum.LOGGED_OUT });
      delete instance.defaults.headers.common["Authorization"];
      void changeAppLanguage();
      queryClient.clear();
    })().finally(() => {
      clearLocalAuthStatePromise = null;
    });
  }

  return clearLocalAuthStatePromise;
}

export function mergeAuthenticatedUser(
  userPatch: Partial<UserResponseData["user"]>,
) {
  const authState = useAuthStore.getState();

  if (!authState.user) {
    return Promise.resolve();
  }

  const nextSession = {
    ...authState.user,
    user: {
      ...authState.user.user,
      ...userPatch,
    },
  };

  applyAuthenticatedSession(nextSession);

  return persistAuthenticatedSession(nextSession).catch(() => {
    // Keep in-memory auth data aligned with the latest user patch even if
    // persisting the session snapshot fails.
  });
}
