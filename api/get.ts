import { MeResponse } from "@/types/auth";
import {
  ConversationListResponse,
  ConversationQuery,
  MessageListResponse,
  MessageQuery,
} from "@/types/chat";
import {
  AccountResponse,
  CreditBalanceResponse,
  CreditPackageListResponse,
  TransactionListResponse,
  TransactionQuery,
} from "@/types/credit";
import { FeedbackListResponse, FeedbackQuery } from "@/types/feedback";
import { Session, SessionResponse } from "@/types/session";
import { CarListResponse, CarQuery, CarResponse } from "@/types/car";
import {
  NotificationListResponse,
  NotificationQuery,
} from "@/types/notification";
import { LegalDocument } from "@/types/legal";
import { AnalyzeMediaLog } from "@/types/ai";
import {
  CarReminderListResponse,
  CarReminderQuery,
  CarReminderResponse,
} from "@/types/car-reminder";
import { instance } from "./config";

export async function getMe({ token }: { token: string }): Promise<MeResponse> {
  return instance
    .get("v1/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((r) => r.data);
}

export async function getCreditBalance(): Promise<CreditBalanceResponse> {
  return instance.get("v1/account/balance").then((r) => r.data);
}

export async function getFeedbacks(
  filters?: FeedbackQuery,
): Promise<FeedbackListResponse> {
  return instance.get("v1/feedback", { params: filters }).then((r) => r.data);
}

export async function getChatConversations(
  filters?: ConversationQuery,
): Promise<ConversationListResponse> {
  return instance
    .get("v1/chat/conversations", { params: filters })
    .then((r) => r.data);
}

export async function getChatMessages({
  conversationId,
  filters,
}: {
  conversationId: string;
  filters?: Omit<MessageQuery, "conversationId">;
}): Promise<MessageListResponse> {
  return instance
    .get(`v1/chat/conversations/${conversationId}/messages`, {
      params: filters,
    })
    .then((r) => r.data);
}

// Sessions
export async function getActiveSessions(): Promise<Session[]> {
  return instance.get("v1/sessions/active").then((r) => {
    const response = r.data as SessionResponse[];

    return response.map((item) => item.result);
  });
}

// Cars
export async function getCars(filters?: CarQuery): Promise<CarListResponse> {
  return instance.get("v1/cars", { params: filters }).then((r) => r.data);
}

export async function getCar(id: string): Promise<CarResponse> {
  return instance.get(`v1/cars/${id}`).then((r) => r.data);
}

// Car Reminders
export async function getCarReminders(
  filters?: CarReminderQuery,
): Promise<CarReminderListResponse> {
  return instance
    .get("v1/car-reminders", { params: filters })
    .then((r) => r.data);
}

export async function getCarReminder(id: string): Promise<CarReminderResponse> {
  return instance.get(`v1/car-reminders/${id}`).then((r) => r.data);
}

// Notifications
export async function getNotifications(
  filters?: NotificationQuery,
): Promise<NotificationListResponse> {
  return instance
    .get("v1/notifications", { params: filters })
    .then((r) => r.data);
}

// Credit Packages
export async function getCreditPackages(): Promise<CreditPackageListResponse> {
  return instance.get("v1/credit-packages").then((r) => r.data);
}

// Account
export async function getMyAccount(): Promise<AccountResponse> {
  return instance.get("v1/account").then((r) => r.data);
}

// Transactions
export async function getTransactions(
  filters?: TransactionQuery,
): Promise<TransactionListResponse> {
  return instance
    .get("v1/transactions", { params: filters })
    .then((r) => r.data);
}

export async function getTransaction(
  id: string,
): Promise<{ result: import("@/types/credit").Transaction }> {
  return instance.get(`v1/transactions/${id}`).then((r) => r.data);
}

// Legal
export async function getLegalDocuments({
  language,
}: {
  language?: string;
} = {}): Promise<LegalDocument[]> {
  return instance.get("v1/legal", { params: { language } }).then((r) => r.data);
}

// Analysis Logs
export async function getAnalysisLogs(filters?: {
  limit?: number;
  page?: number;
  carId?: string;
  sort?: string;
}): Promise<{
  results: AnalyzeMediaLog[];
  count: number;
  page: number;
  limit: number;
}> {
  return instance
    .get("v1/analysis-logs", { params: filters })
    .then((r) => r.data);
}
