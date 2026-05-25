import { File } from "expo-file-system";
import type { ImagePickerAsset } from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

export interface PreparedImageAsset {
  height?: number;
  mimeType: string;
  uri: string;
  width?: number;
}

export interface PreparedBase64ImageAsset extends PreparedImageAsset {
  base64: string;
  dataUri: string;
  sizeKb: number;
}

interface PrepareImageAssetOptions {
  compress: number;
  forceJpeg?: boolean;
  maxDimension: number;
}

export function normalizeAssetUri(uri: string): string {
  return Platform.OS === "ios" && !uri.startsWith("file://")
    ? `file://${uri}`
    : uri;
}

export async function readAssetAsBase64(uri: string): Promise<string> {
  const file = new File(normalizeAssetUri(uri));
  return file.base64();
}

export async function prepareImageAsset(
  asset: ImagePickerAsset,
  options: PrepareImageAssetOptions,
): Promise<PreparedImageAsset> {
  const originalUri = normalizeAssetUri(asset.uri);
  const mimeType = asset.mimeType ?? "image/jpeg";
  const width = asset.width ?? null;
  const height = asset.height ?? null;
  const longestSide = Math.max(width ?? 0, height ?? 0);
  const shouldResize = longestSide > options.maxDimension;
  const shouldConvert =
    shouldResize || options.forceJpeg === true || mimeType === "image/png";

  if (!shouldConvert) {
    return {
      uri: originalUri,
      mimeType,
      ...(asset.width ? { width: asset.width } : {}),
      ...(asset.height ? { height: asset.height } : {}),
    };
  }

  const manipulator = ImageManipulator.manipulate(originalUri);
  if (shouldResize && width && height) {
    if (width >= height) {
      manipulator.resize({ width: options.maxDimension });
    } else {
      manipulator.resize({ height: options.maxDimension });
    }
  }

  const saved = await (
    await manipulator.renderAsync()
  ).saveAsync({
    compress: options.compress,
    format: SaveFormat.JPEG,
  });

  return {
    uri: saved.uri,
    mimeType: "image/jpeg",
    width: saved.width,
    height: saved.height,
  };
}

export async function prepareImageAssetAsBase64(
  asset: ImagePickerAsset,
  options: PrepareImageAssetOptions,
): Promise<PreparedBase64ImageAsset> {
  const preparedAsset = await prepareImageAsset(asset, options);
  const base64 = await readAssetAsBase64(preparedAsset.uri);

  return {
    ...preparedAsset,
    base64,
    dataUri: `data:${preparedAsset.mimeType};base64,${base64}`,
    sizeKb: Math.round(base64.length / 1024),
  };
}
