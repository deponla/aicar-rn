const SETTINGS_ITEM_KEYS = {
  appSettings: {
    fallbackSectionKey: "settings.sections.appSettings",
    itemKey: "settings.items.appSettings",
  },
  security: {
    fallbackSectionKey: "settings.sections.security",
    itemKey: "settings.items.security",
  },
} as const;

type SettingsItemKey = keyof typeof SETTINGS_ITEM_KEYS;

function toDisplayTitle(value: string, language?: string) {
  const locale = language?.split("-")[0] || undefined;
  const lower = value.toLocaleLowerCase(locale);

  return lower.replace(/(^|[\s-])\S/g, (match) =>
    match.toLocaleUpperCase(locale),
  );
}

export function getSettingsItemLabel(
  translate: (key: string) => string,
  item: SettingsItemKey,
  language?: string,
) {
  const { fallbackSectionKey, itemKey } = SETTINGS_ITEM_KEYS[item];
  const label = translate(itemKey);

  if (label !== itemKey) {
    return label;
  }

  const fallbackLabel = translate(fallbackSectionKey);

  if (fallbackLabel === fallbackSectionKey) {
    return label;
  }

  return toDisplayTitle(fallbackLabel, language);
}
