export const TEXT_SIZE_PRESETS = [
  "small",
  "medium",
  "large",
  "extraLarge",
] as const;

export type TextSizePreset = (typeof TEXT_SIZE_PRESETS)[number];

export const DEFAULT_TEXT_SIZE_PRESET: TextSizePreset = "medium";

function isTextSizePreset(value: unknown): value is TextSizePreset {
  return (
    typeof value === "string" &&
    TEXT_SIZE_PRESETS.includes(value as TextSizePreset)
  );
}

export function normalizeTextSizePreset(value: unknown): TextSizePreset {
  return isTextSizePreset(value) ? value : DEFAULT_TEXT_SIZE_PRESET;
}

export function getTextSizeLabelKey(preset: TextSizePreset) {
  return `textSize.options.${preset}`;
}
