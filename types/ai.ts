export enum AiMediaType {
  IMAGE = "image",
  VIDEO = "video",
}

export enum AiAnalysisType {
  DASHBOARD = "dashboard",
  WARNING_LIGHT = "warning_light",
  OBD_CODE = "obd_code",
  GENERAL = "general",
}

export type AiWarningSeverity = "low" | "medium" | "high" | "critical";
export type AiUrgency = "critical" | "warning" | "info";
export type AiOverallStatus = "ok" | "warning" | "critical";

export interface AiImageUploadInitResponse {
  uploadUrl: string;
  id: string;
}

export interface AiVideoUploadInitResponse {
  uploadUrl: string;
  videoId: string;
  expiresAt: string;
}

export interface AiUploadCompleteResponse {
  mediaUrl: string;
  mediaType: AiMediaType;
  id?: string;
  videoId?: string;
  thumbnailUrl?: string;
  readyToStream?: boolean;
}

export interface AnalyzeMediaRequest {
  mediaUrl: string;
  mediaType: AiMediaType;
  thumbnailUrl?: string;
  videoId?: string;
  carId?: string;
  prompt?: string;
  analysisType?: AiAnalysisType;
}

export interface AiWarning {
  name: string;
  severity: AiWarningSeverity;
  description: string;
  recommendation: string;
}

export interface AiAnalysisPayload {
  title: string;
  summary: string;
  description: string;
  recommendation: string;
  urgency: AiUrgency;
  overallStatus: AiOverallStatus;
  warnings: AiWarning[];
  rawResponse?: string;
}

export interface AnalyzeMediaLog {
  id: string;
  createdAt: string;
  updatedAt: string;
  mediaUrl?: string;
  mediaType?: AiMediaType;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoId?: string;
  prompt?: string;
  analysisType: string;
  status: string;
  creditCost: number;
  errorMessage?: string;
  aiResponse?: AiAnalysisPayload;
}

export interface AnalyzeMediaBalance {
  remainingCredits: number;
  isPremium: boolean;
  premiumExpiresAt?: string | null;
}

export interface AnalyzeMediaResponse {
  result: AnalyzeMediaLog;
  balance: AnalyzeMediaBalance;
}
