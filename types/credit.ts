import { IPaginationQuery } from "./utils";

export enum CreditPackageStatusEnum {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum TransactionPlatformEnum {
  IOS = "ios",
  ANDROID = "android",
  WEB = "web",
}

export enum TransactionStatusEnum {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface CreditPackage {
  id: string;
  name: string;
  productId: string;
  creditAmount: number;
  price: number;
  currency: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  status: CreditPackageStatusEnum;
  createdAt: string;
  updatedAt: string;
  isPopular?: boolean;
}

export interface CreditPackageListResponse {
  results: CreditPackage[];
  page: number;
  limit: number;
  count: number;
}

export interface UserCredits {
  remaining: number;
  total: number;
  lastUpdated: string;
}

export interface CreditBalanceResponse {
  remainingCredits: number;
  isPremium: boolean;
  premiumExpiresAt: string | null;
}

export interface Account {
  id: string;
  userId: string;
  remainingCredits: number;
  totalCreditsUsed: number;
  totalCreditsPurchased: number;
  isPremium: boolean;
  premiumExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AccountResponse {
  result: Account;
}

export interface PurchaseCreditsRequest {
  packageId: string;
  platform: TransactionPlatformEnum;
  receiptId?: string;
}

export interface VerifyReceiptRequest {
  transactionId: string;
  receiptData: string;
}

export interface Transaction {
  id: string;
  userId: string;
  packageId: string;
  creditAmount: number;
  pricePaid: number;
  currency: string;
  platform: TransactionPlatformEnum;
  receiptId?: string;
  status: TransactionStatusEnum;
  reason?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface TransactionResponse {
  result: Transaction;
}

export interface TransactionListResponse {
  results: Transaction[];
  page: number;
  limit: number;
  count: number;
}

export interface TransactionQuery extends IPaginationQuery {
  status?: TransactionStatusEnum;
}
