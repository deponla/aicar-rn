export interface UserUpdateRequest {
  name?: string;
  surname?: string;
  email?: string;
  phone?: string;
  language?: string;
}

export enum SmsOtpType {
  PHONE_VERIFICATION = "phone_verification",
  LOGIN = "login",
  PASSWORD_RESET = "password_reset",
}

export enum UserAccountType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
}

export enum UserStatus {
  ORGANIZER = "organizer",
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  DELETED = "deleted",
  BANNED = "banned",
}

export interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  userAccountType: UserAccountType;
  name: string;
  surname: string;
  email: string;
  phone: string;
  status: UserStatus;
  language: string;
  authProvider: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  photo: string | null;
  enabledPolicies: string[];
}

export interface UserGetResponse {
  result: User;
}

export interface EmailVerificationResponse {
  message: string;
}

export interface MessageResponse {
  message: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface SendSmsOtpRequest {
  type?: SmsOtpType;
}

export interface SendSmsOtpResponse {
  success: boolean;
  message: string;
  expiresAt: string;
  cooldownUntil?: string;
}

export interface VerifySmsOtpRequest {
  otpCode: string;
  type?: SmsOtpType;
}

export interface VerifySmsOtpResponse {
  success: boolean;
  message: string;
  phoneNumber: string;
  verifiedAt: string;
}

export interface IdentityVerificationPersonalInfo {
  firstName: string;
  lastName: string;
  fullName: string;
  gender: string;
  nationality: string;
  dateOfBirth: string;
  placeOfBirth: string;
  personalNumber: string;
  telephone?: string | null;
  profession?: string | null;
  title?: string | null;
}

export interface IdentityVerificationDocumentInfo {
  documentNumber: string;
  serialNumber: string;
  expiryDate: string;
  issuingAuthority: string;
  dateOfIssue?: string | null;
  endorsements?: string | null;
  taxOrExitRequirements?: string | null;
}

export interface IdentityVerificationResult {
  isVerified: boolean;
  activeAuthentication: boolean;
  passiveAuthentication: boolean;
  nfcDataGroups: string[];
}

export interface IdentityVerificationImages {
  faceImageBase64: string;
  signatureImageBase64?: string | null;
}

export interface IdentityVerificationMetadata {
  scannedAt: string;
  mrzRaw: string;
}

export interface IdentityVerificationRequest {
  personalInfo: IdentityVerificationPersonalInfo;
  documentInfo: IdentityVerificationDocumentInfo;
  verification: IdentityVerificationResult;
  images: IdentityVerificationImages;
  metadata: IdentityVerificationMetadata;
}

export interface IdentityVerificationResponse {
  result: {
    id: string;
    status: string;
    isIdentityVerified?: boolean;
  };
}
