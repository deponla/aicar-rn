import { RefreshRequest, UserResponseData } from "@/types/auth";
import { DevicePermissions, DeviceResponse, RegisterDevicePayload } from "@/types/device";
import {
  ConversationResponse,
  MessageResponse,
  SendMessageRequest,
  StartConversationRequest,
} from "@/types/chat";
import { CreateFavoriteRequest, FavoriteResponse } from "@/types/favorite";
import {
  CreateFavoriteCategoriesRequest,
  FavoriteCategoriesResponse,
} from "@/types/favorite-categories";
import {
  ChangePasswordRequest,
  EmailVerificationResponse,
  IdentityVerificationRequest,
  IdentityVerificationResponse,
  SendSmsOtpRequest,
  SendSmsOtpResponse,
  VerifySmsOtpRequest,
  VerifySmsOtpResponse,
} from "@/types/user";
import {
  WarehousePostRequest,
  WarehouseRequestConfirmUploadPostRequest,
  WarehouseRequestConfirmUploadPostResponse,
  WarehouseRequestsUploadUrlPostResponse,
  WarehouseResponse,
} from "@/types/warehouse-requests";
import { instance } from "./config";

export async function postRefreshToken(
  d: RefreshRequest,
): Promise<UserResponseData> {
  return instance.post("v1/auth/refresh", d).then((r) => r.data);
}

export async function postWarehouseRequest(
  d: WarehousePostRequest,
): Promise<WarehouseResponse> {
  return instance.post("v1/warehouse-requests", d).then((r) => r.data);
}

export async function postWarehouseRequestsUploadUrl(): Promise<WarehouseRequestsUploadUrlPostResponse> {
  return instance.post("v1/warehouse-requests/upload-url").then((r) => r.data);
}

export async function postWarehouseRequestConfirmUpload(
  d: WarehouseRequestConfirmUploadPostRequest,
): Promise<WarehouseRequestConfirmUploadPostResponse> {
  return instance
    .post("v1/warehouse-requests/confirm-upload", d)
    .then((r) => r.data);
}

// Favorites
export async function postFavorite(
  payload: CreateFavoriteRequest,
): Promise<FavoriteResponse> {
  return instance.post("v1/favorites", payload).then((r) => r.data);
}

// Favorite Categories
export async function postFavoriteCategory(
  payload: CreateFavoriteCategoriesRequest,
): Promise<FavoriteCategoriesResponse> {
  return instance.post("v1/favorite-categories", payload).then((r) => r.data);
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
): Promise<MessageResponse> {
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
): Promise<MessageResponse> {
  return instance.post("v1/auth/change-password", d).then((r) => r.data);
}

export async function postDeleteAccount(): Promise<MessageResponse> {
  return instance.post("v1/auth/delete-account").then((r) => r.data);
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

export async function postIdentityVerification(
  d: IdentityVerificationRequest,
): Promise<IdentityVerificationResponse> {
  return instance
    .post("v1/identity-verification/submit", d)
    .then((r) => r.data);
}

// Devices
export async function postRegisterDevice(
  payload: RegisterDevicePayload,
): Promise<DeviceResponse> {
  return instance.post("v1/devices", payload).then((r) => r.data);
}
