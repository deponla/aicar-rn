export const TEXT_SIZE_PRESETS = [
  "small",
  "medium",
  "large",
  "extraLarge",
] as const;

export type TextSizePreset = (typeof TEXT_SIZE_PRESETS)[number];

export const DEFAULT_TEXT_SIZE_PRESET: TextSizePreset = "medium";

export const TEXT_SIZE_SCALE: Record<TextSizePreset, number> = {
  small: 0.9,
  medium: 1,
  large: 1.12,
  extraLarge: 1.24,
};

const SCALABLE_TEXT_STYLE_KEYS = [
  "fontSize",
  "lineHeight",
  "letterSpacing",
] as const;

type ScalableTextStyleKey = (typeof SCALABLE_TEXT_STYLE_KEYS)[number];

type ScalableTextStyle = Partial<Record<ScalableTextStyleKey, number>> & {
  [key: string]: unknown;
};

export function isTextSizePreset(value: unknown): value is TextSizePreset {
  return (
    typeof value === "string" &&
    TEXT_SIZE_PRESETS.includes(value as TextSizePreset)
  );
}

export function normalizeTextSizePreset(value: unknown): TextSizePreset {
  return isTextSizePreset(value) ? value : DEFAULT_TEXT_SIZE_PRESET;
}

export function getTextSizeScale(preset: TextSizePreset) {
  return TEXT_SIZE_SCALE[preset];
}

function scaleTypographyMetric(value: number, scale: number) {
  return Math.round(value * scale * 100) / 100;
}

export function scaleTextStyle<TStyle extends ScalableTextStyle | undefined>(
  style: TStyle,
  scale: number,
): TStyle {
  if (!style || scale === 1) {
    return style;
  }

  let hasTypographyValue = false;

  const nextStyle = { ...style } as ScalableTextStyle;

  for (const key of SCALABLE_TEXT_STYLE_KEYS) {
    const value = style[key];

    if (typeof value !== "number") {
      continue;
    }

    hasTypographyValue = true;
    nextStyle[key] = scaleTypographyMetric(value, scale);
  }

  return (hasTypographyValue ? nextStyle : style) as TStyle;
}

export function getTextSizeLabelKey(preset: TextSizePreset) {
  return `textSize.options.${preset}`;
}
