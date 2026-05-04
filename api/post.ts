import { RefreshRequest, UserResponseData } from "@/types/auth";
import { DeviceResponse, RegisterDevicePayload } from "@/types/device";
import {
  ConversationResponse,
  MessageResponse as ChatMessageResponse,
  SendMessageRequest,
  StartConversationRequest,
} from "@/types/chat";
import {
  ChangePasswordRequest,
  ConfirmUploadRequest,
  ConfirmUploadResponse,
  DeleteAccountRequest,
  DeletePhotoRequest,
  DeletePhotoResponse,
  EmailVerificationResponse,
  MessageResponse as UserMessageResponse,
  ReactivateAccountRequest,
  SendSmsOtpRequest,
  SendSmsOtpResponse,
  UploadUrlResponse,
  VerifySmsOtpRequest,
  VerifySmsOtpResponse,
} from "@/types/user";
import { CheckVersionRequest, CheckVersionResponse } from "@/types/app-version";
import { CreateFeedbackRequest, FeedbackResponse } from "@/types/feedback";
import {
  AiImageUploadInitResponse,
  AiUploadCompleteResponse,
  AiVideoUploadInitResponse,
  AnalyzeMediaRequest,
  AnalyzeMediaResponse,
} from "@/types/ai";
import { instance } from "./config";

export async function postRefreshToken(
  d: RefreshRequest,
): Promise<UserResponseData> {
  return instance.post("v1/auth/refresh", d).then((r) => r.data);
}

// Chat
export async function postStartConversation(
  payload: StartConversationRequest,
): Promise<ConversationResponse> {
  return instance
    .post("v1/chat/conversations/start", payload)
    .then((r) => r.data);
}

export async function postSendMessage(
  payload: SendMessageRequest,
): Promise<ChatMessageResponse> {
  return instance.post("v1/chat/messages", payload).then((r) => r.data);
}

export async function postMarkConversationRead(
  conversationId: string,
): Promise<void> {
  return instance
    .post(`v1/chat/conversations/${conversationId}/read`)
    .then((r) => r.data);
}

export async function postSendEmailVerification(): Promise<EmailVerificationResponse> {
  return instance.post("v1/auth/send-verification-email").then((r) => r.data);
}

export async function postChangePassword(
  d: ChangePasswordRequest,
): Promise<UserMessageResponse> {
  return instance.post("v1/auth/change-password", d).then((r) => r.data);
}

export async function postFreezeAccount(): Promise<UserMessageResponse> {
  return instance.post("v1/auth/freeze-account").then((r) => r.data);
}

export async function postDeleteAccount(
  payload: DeleteAccountRequest,
): Promise<UserMessageResponse> {
  return instance.post("v1/auth/delete-account", payload).then((r) => r.data);
}

export async function postReactivateAccount(
  payload: ReactivateAccountRequest,
): Promise<UserResponseData> {
  return instance
    .post("v1/auth/reactivate-account", payload)
    .then((r) => r.data);
}

export async function postCreateFeedback(
  payload: CreateFeedbackRequest,
): Promise<FeedbackResponse> {
  return instance.post("v1/feedback", payload).then((r) => r.data);
}

export async function postSendSmsOtp(
  d: SendSmsOtpRequest,
): Promise<SendSmsOtpResponse> {
  return instance.post("v1/auth/send-sms-otp", d).then((r) => r.data);
}

export async function postVerifySmsOtp(
  d: VerifySmsOtpRequest,
): Promise<VerifySmsOtpResponse> {
  return instance.post("v1/auth/verify-sms-otp", d).then((r) => r.data);
}

// Devices
export async function postRegisterDevice(
  payload: RegisterDevicePayload,
): Promise<DeviceResponse> {
  return instance.post("v1/devices", payload).then((r) => r.data);
}

export async function postInitializeAiImageUpload(): Promise<AiImageUploadInitResponse> {
  return instance.post("v1/ai/uploads/images/init").then((r) => r.data);
}

export async function postCompleteAiImageUpload(payload: {
  id: string;
}): Promise<AiUploadCompleteResponse> {
  return instance
    .post("v1/ai/uploads/images/complete", payload)
    .then((r) => r.data);
}

export async function postInitializeAiVideoUpload(): Promise<AiVideoUploadInitResponse> {
  return instance.post("v1/ai/uploads/videos/init").then((r) => r.data);
}

export async function postCompleteAiVideoUpload(payload: {
  videoId: string;
}): Promise<AiUploadCompleteResponse> {
  return instance
    .post("v1/ai/uploads/videos/complete", payload)
    .then((r) => r.data);
}

export async function postAnalyzeMedia(
  payload: AnalyzeMediaRequest,
): Promise<AnalyzeMediaResponse> {
  return instance.post("v1/ai/analyze", payload).then((r) => r.data);
}

// User Photo
export async function postUploadUrl(): Promise<UploadUrlResponse> {
  return instance.post("v1/users/upload-url").then((r) => r.data);
}

export async function postConfirmUpload(
  payload: ConfirmUploadRequest,
): Promise<ConfirmUploadResponse> {
  return instance.post("v1/users/confirm-upload", payload).then((r) => r.data);
}

export async function postDeletePhoto(
  payload: DeletePhotoRequest,
): Promise<DeletePhotoResponse> {
  return instance.post("v1/users/delete-photo", payload).then((r) => r.data);
}

// App Version
export async function postCheckAppVersion(
  payload: CheckVersionRequest,
): Promise<CheckVersionResponse> {
  return instance.post("v1/app-version/check", payload).then((r) => r.data);
}
