import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import de from "@/i18n/locales/de.json";
import en from "@/i18n/locales/en.json";
import tr from "@/i18n/locales/tr.json";

export const SUPPORTED_LANGUAGES = ["de", "en", "tr"] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = "en";
export const DEFAULT_NAMESPACE = "translation" as const;

export function normalizeLanguage(language?: string | null): AppLanguage {
  const baseLanguage = language?.toLowerCase().split("-")[0];

  if (
    baseLanguage &&
    SUPPORTED_LANGUAGES.includes(baseLanguage as AppLanguage)
  ) {
    return baseLanguage as AppLanguage;
  }

  return DEFAULT_LANGUAGE;
}

function getDeviceLanguage(): AppLanguage {
  const locale = getLocales()[0];

  return normalizeLanguage(locale?.languageCode ?? locale?.languageTag ?? null);
}

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    defaultNS: DEFAULT_NAMESPACE,
    fallbackLng: DEFAULT_LANGUAGE,
    interpolation: {
      escapeValue: false,
    },
    lng: getDeviceLanguage(),
    ns: [DEFAULT_NAMESPACE],
    resources: {
      de: { [DEFAULT_NAMESPACE]: de },
      en: { [DEFAULT_NAMESPACE]: en },
      tr: { [DEFAULT_NAMESPACE]: tr },
    },
    supportedLngs: [...SUPPORTED_LANGUAGES],
  });
}

export function getCurrentLanguage(): AppLanguage {
  return normalizeLanguage(i18n.resolvedLanguage || i18n.language);
}

export async function changeAppLanguage(
  language?: string | null,
): Promise<AppLanguage> {
  const nextLanguage = normalizeLanguage(language ?? getDeviceLanguage());

  if (getCurrentLanguage() !== nextLanguage) {
    await i18n.changeLanguage(nextLanguage);
  }

  return nextLanguage;
}

export default i18n;
