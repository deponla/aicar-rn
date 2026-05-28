import { RefreshRequest, UserResponseData } from "@/types/auth";
import { DeviceResponse, RegisterDevicePayload } from "@/types/device";
import {
  MessageResponse as ChatMessageResponse,
  SendMessageRequest,
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
import {
  CarResponse,
  CarUploadUrlResponse,
  ConfirmCarPhotoRequest,
  ConfirmCarPhotoResponse,
  CreateCarRequest,
  DeleteCarPhotoRequest,
  DeleteCarPhotoResponse,
} from "@/types/car";
import {
  AccountResponse,
  PurchaseCreditsRequest,
  TransactionResponse,
  VerifyReceiptRequest,
} from "@/types/credit";
import {
  AiConversationResponse,
  AiMessageResponse as AiChatMessageResponse,
  CreateAiConversationRequest,
  SendAiMessageRequest,
} from "@/types/ai-chat";
import {
  CarReminderResponse,
  CompleteCarReminderRequest,
  CreateCarReminderRequest,
} from "@/types/car-reminder";
import { AI_CHAT_TIMEOUT_MS } from "@/utils/env";
import { instance } from "./config";

export async function postRefreshToken(
  d: RefreshRequest,
): Promise<UserResponseData> {
  return instance.post("v1/auth/refresh", d).then((r) => r.data);
}

// Chat
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

// Auth Logout
export async function postLogout(
  tokenUUID: string,
): Promise<{ message: string }> {
  return instance.post("v1/auth/logout", { tokenUUID }).then((r) => r.data);
}

// Cars
export async function postCreateCar(
  payload: CreateCarRequest,
): Promise<CarResponse> {
  return instance.post("v1/cars", payload).then((r) => r.data);
}

export async function postCarUploadUrl(): Promise<CarUploadUrlResponse> {
  return instance.post("v1/cars/upload-url").then((r) => r.data);
}

export async function postConfirmCarPhoto(
  payload: ConfirmCarPhotoRequest,
): Promise<ConfirmCarPhotoResponse> {
  return instance.post("v1/cars/confirm-upload", payload).then((r) => r.data);
}

export async function postDeleteCarPhoto(
  payload: DeleteCarPhotoRequest,
): Promise<DeleteCarPhotoResponse> {
  return instance.post("v1/cars/delete-photo", payload).then((r) => r.data);
}

// Car Reminders
export async function postCreateCarReminder(
  payload: CreateCarReminderRequest,
): Promise<CarReminderResponse> {
  return instance.post("v1/car-reminders", payload).then((r) => r.data);
}

export async function postCompleteCarReminder(
  id: string,
  payload: CompleteCarReminderRequest,
): Promise<CarReminderResponse> {
  return instance
    .post(`v1/car-reminders/${id}/complete`, payload)
    .then((r) => r.data);
}

// Account / Credits
export async function postPurchaseCredits(
  payload: PurchaseCreditsRequest,
): Promise<TransactionResponse> {
  return instance.post("v1/account/purchase", payload).then((r) => r.data);
}

export async function postVerifyReceipt(
  payload: VerifyReceiptRequest,
): Promise<AccountResponse> {
  return instance
    .post("v1/account/verify-receipt", payload)
    .then((r) => r.data);
}

// AI Chat
export async function postCreateAiConversation(
  payload?: CreateAiConversationRequest,
): Promise<AiConversationResponse> {
  return instance
    .post("v1/ai-chat/conversations", payload ?? {})
    .then((r) => r.data);
}

export async function postSendAiMessage(
  payload: SendAiMessageRequest,
): Promise<AiChatMessageResponse> {
  return instance
    .post("v1/ai-chat/messages", payload, { timeout: AI_CHAT_TIMEOUT_MS })
    .then((r) => r.data);
}
