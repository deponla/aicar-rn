import { instance } from "@/api/config";
import { changeAppLanguage } from "@/i18n";
import { postLogout } from "@/api/post";
import { queryClient } from "@/utils/queryClient";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { AuthStatusEnum, UserResponseData } from "../types/auth";

export const SECURE_STORE_KEY = "auth";

type AuthStore = {
  user: UserResponseData | null;
  status: AuthStatusEnum;
  login: (user: UserResponseData) => void;
  logout: () => Promise<void>;
};

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
    await SecureStore.deleteItemAsync(SECURE_STORE_KEY);
    set({ user: null, status: AuthStatusEnum.LOGGED_OUT });
    delete instance.defaults.headers.common["Authorization"];
    void changeAppLanguage();
    queryClient.clear();
  },
}));

export function mergeAuthenticatedUser(
  userPatch: Partial<UserResponseData["user"]>,
) {
  const authState = useAuthStore.getState();

  if (!authState.user) {
    return;
  }

  authState.login({
    ...authState.user,
    user: {
      ...authState.user.user,
      ...userPatch,
    },
  });
}
