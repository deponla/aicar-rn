export enum UserStatus {
  ORGANIZER = "organizer",
  PENDING = "pending",
  ACTIVE = "active",
  INACTIVE = "inactive",
  BLOCKED = "blocked",
  DELETED = "deleted",
  BANNED = "banned",
}

export enum UserAccountType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
}

interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  name: string;
  surname: string;
  email: string;
  phone: string;
  role: string;
  status: UserStatus;
  language: string;
  authProvider: string;
  birthDate: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  isPhoneVerified: boolean;
  isIdentityVerified: boolean;
  userAccountType: UserAccountType;
  enabledPolicies: string[];
  photo: string | null;
}

interface Token {
  token: string;
  expires: string;
}

export interface UserResponseData {
  user: User;
  accessToken: Token;
  refreshToken: Token;
}

export enum AuthStatusEnum {
  LOADING = "LOADING",
  LOGGED_IN = "LOGGED_IN",
  LOGGED_OUT = "LOGGED_OUT",
}

export interface MeResponse {
  user: User;
}

export interface RefreshRequest {
  token: string;
}
