import { Platform } from "react-native";
import type { ImagePickerAsset } from "expo-image-picker";
import i18n from "@/i18n";
import {
  postCompleteAiImageUpload,
  postCompleteAiVideoUpload,
  postInitializeAiImageUpload,
  postInitializeAiVideoUpload,
} from "@/api/post";
import { AiMediaType, type AiUploadCompleteResponse } from "@/types/ai";

const VIDEO_POLL_ATTEMPTS = 5;
const VIDEO_POLL_INTERVAL_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function getAssetMediaType(asset: ImagePickerAsset): AiMediaType {
  if (asset.type === "video" || asset.mimeType?.startsWith("video/")) {
    return AiMediaType.VIDEO;
  }

  return AiMediaType.IMAGE;
}

function getAssetMimeType(
  asset: ImagePickerAsset,
  mediaType: AiMediaType,
): string {
  if (asset.mimeType) {
    return asset.mimeType;
  }

  return mediaType === AiMediaType.VIDEO ? "video/mp4" : "image/jpeg";
}

function buildAssetFileName(
  asset: ImagePickerAsset,
  mediaType: AiMediaType,
): string {
  if (asset.fileName) {
    return asset.fileName;
  }

  const extension = mediaType === AiMediaType.VIDEO ? "mp4" : "jpg";
  return `scan-${Date.now()}.${extension}`;
}

function normalizeFileUri(uri: string): string {
  if (Platform.OS === "ios" && !uri.startsWith("file://")) {
    return `file://${uri}`;
  }

  return uri;
}

async function uploadImageAsset(
  asset: ImagePickerAsset,
): Promise<AiUploadCompleteResponse> {
  const init = await postInitializeAiImageUpload();

  const formData = new FormData();
  formData.append("file", {
    uri: normalizeFileUri(asset.uri),
    name: buildAssetFileName(asset, AiMediaType.IMAGE),
    type: getAssetMimeType(asset, AiMediaType.IMAGE),
  } as unknown as Blob);

  const uploadResponse = await fetch(init.uploadUrl, {
    method: "POST",
    body: formData,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text().catch(() => "");
    throw new Error(body || i18n.t("scanScreen.alerts.imageUploadFailed"));
  }

  return postCompleteAiImageUpload({ id: init.id });
}

async function resolveVideoUpload(
  videoId: string,
): Promise<AiUploadCompleteResponse> {
  let latest: AiUploadCompleteResponse | null = null;

  for (let attempt = 0; attempt < VIDEO_POLL_ATTEMPTS; attempt += 1) {
    latest = await postCompleteAiVideoUpload({ videoId });

    if (latest.readyToStream !== false) {
      return latest;
    }

    await sleep(VIDEO_POLL_INTERVAL_MS);
  }

  if (!latest) {
    throw new Error(i18n.t("scanScreen.alerts.videoProcessingFailed"));
  }

  return latest;
}

async function uploadVideoAsset(
  asset: ImagePickerAsset,
): Promise<AiUploadCompleteResponse> {
  const init = await postInitializeAiVideoUpload();
  const fileResponse = await fetch(normalizeFileUri(asset.uri));
  const fileBlob = await fileResponse.blob();

  const uploadResponse = await fetch(init.uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": getAssetMimeType(asset, AiMediaType.VIDEO),
    },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error(i18n.t("scanScreen.alerts.videoUploadFailed"));
  }

  return resolveVideoUpload(init.videoId);
}

/**
 * Upload an image or video asset to Cloudflare via the backend's
 * init → direct-upload → complete flow.
 *
 * Automatically detects the media type from the asset and uses the
 * appropriate upload strategy (FormData for images, blob for videos).
 */
export async function uploadAsset(
  asset: ImagePickerAsset,
): Promise<AiUploadCompleteResponse> {
  const mediaType = getAssetMediaType(asset);

  return mediaType === AiMediaType.VIDEO
    ? uploadVideoAsset(asset)
    : uploadImageAsset(asset);
}
