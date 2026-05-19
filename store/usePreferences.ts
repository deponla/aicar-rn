import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import {
  DEFAULT_TEXT_SIZE_PRESET,
  normalizeTextSizePreset,
  type TextSizePreset,
} from "@/utils/textSize";

const PREFERENCES_KEY = "app_preferences";

let hydratePreferencesPromise: Promise<void> | null = null;

type PreferencesStore = {
  hydrated: boolean;
  textSizePreset: TextSizePreset;
  hydrate: () => Promise<void>;
  setTextSizePreset: (preset: TextSizePreset) => Promise<void>;
};

async function persistPreferences(textSizePreset: TextSizePreset) {
  await SecureStore.setItemAsync(
    PREFERENCES_KEY,
    JSON.stringify({ textSizePreset }),
  );
}

export const usePreferencesStore = create<PreferencesStore>()((set) => ({
  hydrated: false,
  textSizePreset: DEFAULT_TEXT_SIZE_PRESET,
  hydrate: async () => {
    if (!hydratePreferencesPromise) {
      hydratePreferencesPromise = (async () => {
        try {
          const storedPreferences =
            await SecureStore.getItemAsync(PREFERENCES_KEY);

          if (!storedPreferences) {
            set({ hydrated: true });
            return;
          }

          const parsedPreferences = JSON.parse(storedPreferences) as {
            textSizePreset?: unknown;
          };

          set({
            hydrated: true,
            textSizePreset: normalizeTextSizePreset(
              parsedPreferences.textSizePreset,
            ),
          });
        } catch {
          set({ hydrated: true, textSizePreset: DEFAULT_TEXT_SIZE_PRESET });
        }
      })().finally(() => {
        hydratePreferencesPromise = null;
      });
    }

    return hydratePreferencesPromise;
  },
  setTextSizePreset: async (preset) => {
    set({ textSizePreset: preset });

    try {
      await persistPreferences(preset);
    } catch {
      // Keep the in-memory preference even if persistence fails.
    }
  },
}));
