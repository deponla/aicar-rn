import type { ImagePickerAsset } from "expo-image-picker";
import { Platform } from "react-native";
import { File } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { postAnalyzeMedia } from "@/api/post";
import i18n from "@/i18n";
import {
  AiAnalysisType,
  AiMediaType,
  type AiAnalysisPayload,
  type AiUrgency,
  type AiOverallStatus,
  type AnalyzeMediaRequest,
  type AnalyzeMediaResponse,
} from "@/types/ai";
import { uploadAsset, getAssetMediaType } from "./CloudflareUploadService";

// ---------------------------------------------------------------------------
// Local AI constants (dev-only)
// ---------------------------------------------------------------------------

const LOCAL_AI_TIMEOUT_MS = 240_000;
const LOCAL_AI_MODEL = "google/gemma-4-31b";
const LOCAL_AI_MAX_TOKENS = 1_024;
const LOCAL_AI_MAX_IMAGE_DIMENSION = 1_024;
const LOCAL_AI_IMAGE_COMPRESS = 0.7;

const ANALYSIS_TYPE_LABELS: Record<AiAnalysisType, string> = {
  [AiAnalysisType.DASHBOARD]: "dashboard warning lights or gauge cluster",
  [AiAnalysisType.WARNING_LIGHT]: "warning light identification",
  [AiAnalysisType.OBD_CODE]: "OBD fault code diagnostics",
  [AiAnalysisType.GENERAL]: "general vehicle inspection",
};

const JSON_SCHEMA =
  '{"title":"string","summary":"string","description":"string","recommendation":"string","urgency":"critical|warning|info","overallStatus":"ok|warning|critical","warnings":[{"name":"string","severity":"low|medium|high|critical","description":"string","recommendation":"string"}]}';

// ---------------------------------------------------------------------------
// Local AI helpers (dev-only)
// ---------------------------------------------------------------------------

function getLocalAiBaseUrl(): string {
  if (Platform.OS === "android") {
    return "http://10.0.2.2:1234";
  }

  return "http://127.0.0.1:1234";
}

function normalizeAssetUri(uri: string): string {
  return Platform.OS === "ios" && !uri.startsWith("file://")
    ? `file://${uri}`
    : uri;
}

async function readAssetAsBase64(uri: string): Promise<string> {
  const normalizedUri = normalizeAssetUri(uri);

  console.log("[AI] Reading asset as base64:", normalizedUri);
  const file = new File(normalizedUri);
  const b64 = await file.base64();
  console.log(
    `[AI] Base64 read complete (${Math.round(b64.length / 1024)} KB)`,
  );
  return b64;
}

async function prepareAssetForLocalAI(
  asset: ImagePickerAsset,
): Promise<{ uri: string; mimeType: string; width?: number; height?: number }> {
  const originalUri = normalizeAssetUri(asset.uri);
  const mimeType = asset.mimeType ?? "image/jpeg";
  const width = asset.width ?? null;
  const height = asset.height ?? null;
  const longestSide = Math.max(width ?? 0, height ?? 0);
  const shouldResize = longestSide > LOCAL_AI_MAX_IMAGE_DIMENSION;
  const shouldConvert = shouldResize || mimeType === "image/png";

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
      manipulator.resize({ width: LOCAL_AI_MAX_IMAGE_DIMENSION });
    } else {
      manipulator.resize({ height: LOCAL_AI_MAX_IMAGE_DIMENSION });
    }
  }

  const rendered = await manipulator.renderAsync();
  const saved = await rendered.saveAsync({
    compress: LOCAL_AI_IMAGE_COMPRESS,
    format: SaveFormat.JPEG,
  });

  console.log("[AI] Image prepared for local AI", {
    originalMimeType: mimeType,
    originalWidth: asset.width,
    originalHeight: asset.height,
    preparedWidth: saved.width,
    preparedHeight: saved.height,
  });

  return {
    uri: saved.uri,
    mimeType: "image/jpeg",
    width: saved.width,
    height: saved.height,
  };
}

function parseAiJson(text: string): AiAnalysisPayload {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain valid JSON");
  }

  const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

  const validUrgencies: AiUrgency[] = ["critical", "warning", "info"];
  const validStatuses: AiOverallStatus[] = ["ok", "warning", "critical"];

  return {
    title: String(parsed.title ?? "Analysis"),
    summary: String(parsed.summary ?? ""),
    description: String(parsed.description ?? ""),
    recommendation: String(parsed.recommendation ?? ""),
    urgency: validUrgencies.includes(parsed.urgency as AiUrgency)
      ? (parsed.urgency as AiUrgency)
      : "info",
    overallStatus: validStatuses.includes(
      parsed.overallStatus as AiOverallStatus,
    )
      ? (parsed.overallStatus as AiOverallStatus)
      : "ok",
    warnings: Array.isArray(parsed.warnings)
      ? (parsed.warnings as AiAnalysisPayload["warnings"])
      : [],
  };
}

async function analyzeWithLocalAI(
  asset: ImagePickerAsset,
  analysisType: AiAnalysisType,
): Promise<AiAnalysisPayload> {
  console.log("[AI] analyzeWithLocalAI started", {
    type: asset.type,
    mimeType: asset.mimeType,
    analysisType,
    uri: asset.uri.slice(0, 80),
  });

  if (asset.type === "video" || asset.mimeType?.startsWith("video/")) {
    throw new Error(
      i18n.t("scanScreen.alerts.videoNotSupportedInDev", {
        defaultValue: "Video analysis is not supported in dev mode",
      }),
    );
  }

  console.log("[AI] Step 1/4: Preparing and reading image...");
  const preparedAsset = await prepareAssetForLocalAI(asset);
  const base64 = await readAssetAsBase64(preparedAsset.uri);
  const mimeType = preparedAsset.mimeType;
  const dataUri = `data:${mimeType};base64,${base64}`;
  const language = i18n.language?.split("-")[0] ?? "en";
  const languageName =
    language === "tr" ? "Turkish" : language === "de" ? "German" : "English";
  const typeLabel = ANALYSIS_TYPE_LABELS[analysisType];

  const prompt = [
    `Analyze this image for an automotive diagnostic use case focused on ${typeLabel}.`,
    `Respond in ${languageName}.`,
    "Keep the summary, description and recommendation concise.",
    "Do not include chain-of-thought or reasoning steps.",
    "Return JSON only with this schema:",
    JSON_SCHEMA,
  ].join("\n");

  const baseUrl = getLocalAiBaseUrl();
  const url = `${baseUrl}/v1/chat/completions`;
  console.log("[AI] Step 2/4: Sending request to local AI", {
    url,
    model: LOCAL_AI_MODEL,
    language: languageName,
    analysisType: typeLabel,
    imageSize: `${Math.round(base64.length / 1024)} KB`,
    preparedWidth: preparedAsset.width,
    preparedHeight: preparedAsset.height,
  });

  const body = JSON.stringify({
    model: LOCAL_AI_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an automotive diagnostic assistant. Analyze the provided media and respond only with valid JSON.",
      },
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: dataUri } },
        ],
      },
    ],
    temperature: 0.2,
    max_tokens: LOCAL_AI_MAX_TOKENS,
  });

  console.log(`[AI] Request body size: ${Math.round(body.length / 1024)} KB`);

  try {
    const { status, responseText } = await new Promise<{
      status: number;
      responseText: string;
    }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.timeout = LOCAL_AI_TIMEOUT_MS;
      xhr.onload = () =>
        resolve({ status: xhr.status, responseText: xhr.responseText });
      xhr.onerror = () =>
        reject(new Error(`Network error connecting to ${url}`));
      xhr.ontimeout = () => reject(new Error("Local AI request timed out"));
      xhr.send(body);
    });

    console.log(`[AI] Step 3/4: Response received (status: ${status})`);

    if (status < 200 || status >= 300) {
      console.error("[AI] Error response body:", responseText);
      throw new Error(
        `Local AI returned ${status}: ${responseText || "Unknown error"}`,
      );
    }

    const data = JSON.parse(responseText) as {
      choices?: {
        message?: { content?: string; reasoning_content?: string };
      }[];
    };

    const message = data.choices?.[0]?.message;
    const contentCandidates = [message?.content, message?.reasoning_content]
      .filter((candidate): candidate is string => !!candidate?.trim())
      .sort(
        (left, right) =>
          Number(right.includes("{")) - Number(left.includes("{")),
      );
    const content = contentCandidates[0];
    if (!content) {
      console.error(
        "[AI] Empty response from AI, full data:",
        JSON.stringify(data).slice(0, 500),
      );
      throw new Error("Local AI returned an empty response");
    }

    console.log("[AI] Step 4/4: Parsing AI JSON response...");
    console.log("[AI] Raw content (first 300 chars):", content.slice(0, 300));
    const parsed = parseAiJson(content);
    console.log("[AI] Analysis complete:", {
      title: parsed.title,
      urgency: parsed.urgency,
      overallStatus: parsed.overallStatus,
      warningCount: parsed.warnings.length,
    });
    return parsed;
  } catch (error) {
    console.error(
      "[AI] Analysis failed:",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface AnalyzeAssetOptions {
  asset: ImagePickerAsset;
  carId?: string;
  analysisType?: AiAnalysisType;
}

export interface AnalyzeAssetResult {
  response: AnalyzeMediaResponse;
  thumbnailUrl?: string;
  mediaType: AiMediaType;
}

/**
 * End-to-end pipeline: upload an asset to Cloudflare, then send the
 * resulting URL to the backend AI analysis endpoint.
 *
 * In __DEV__ mode, skips Cloudflare upload and sends the image
 * directly to the local AI service for faster iteration.
 */
export async function analyzeAsset(
  options: AnalyzeAssetOptions,
): Promise<AnalyzeAssetResult> {
  const { asset, carId, analysisType = AiAnalysisType.GENERAL } = options;
  const mediaType = getAssetMediaType(asset);

  console.log("[AI] analyzeAsset called", {
    mediaType,
    analysisType,
    carId: carId ?? "none",
    dev: __DEV__,
  });

  // Dev mode: skip CF upload, call local AI directly
  if (__DEV__) {
    console.log("[AI] DEV mode: using local AI (skipping Cloudflare)");
    const aiResponse = await analyzeWithLocalAI(asset, analysisType);

    const now = new Date().toISOString();
    const mockResponse: AnalyzeMediaResponse = {
      result: {
        id: `dev-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        mediaUrl: asset.uri,
        mediaType,
        analysisType,
        status: "COMPLETED",
        creditCost: 0,
        aiResponse,
      },
      balance: {
        remainingCredits: 999,
        isPremium: true,
        premiumExpiresAt: null,
      },
    };

    return {
      response: mockResponse,
      thumbnailUrl: undefined,
      mediaType,
    };
  }

  // Production: upload to Cloudflare, then analyze via backend
  console.log("[AI] PROD mode: uploading to Cloudflare...");
  const uploaded = await uploadAsset(asset);
  console.log("[AI] Upload complete:", {
    mediaUrl: uploaded.mediaUrl?.slice(0, 80),
    mediaType: uploaded.mediaType,
    thumbnailUrl: !!uploaded.thumbnailUrl,
  });

  if (
    uploaded.mediaType === AiMediaType.VIDEO &&
    uploaded.readyToStream === false
  ) {
    throw new Error("Video is not ready for streaming");
  }

  const request: AnalyzeMediaRequest = {
    mediaUrl: uploaded.mediaUrl,
    mediaType: uploaded.mediaType,
    analysisType,
    ...(uploaded.thumbnailUrl ? { thumbnailUrl: uploaded.thumbnailUrl } : {}),
    ...(uploaded.videoId ? { videoId: uploaded.videoId } : {}),
    ...(carId ? { carId } : {}),
  };

  console.log("[AI] Sending analysis request to backend...", {
    analysisType,
    mediaType: request.mediaType,
  });
  const response = await postAnalyzeMedia(request);
  console.log("[AI] Backend analysis complete:", {
    status: response.result.status,
    urgency: response.result.aiResponse?.urgency,
    creditCost: response.result.creditCost,
  });

  return {
    response,
    thumbnailUrl: uploaded.thumbnailUrl,
    mediaType,
  };
}
