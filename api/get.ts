import { MeResponse } from "@/types/auth";
import {
  ConversationListResponse,
  ConversationQuery,
  MessageListResponse,
  MessageQuery,
} from "@/types/chat";
import { CreditBalanceResponse } from "@/types/credit";
import { FeedbackListResponse, FeedbackQuery } from "@/types/feedback";
import { Session, SessionResponse } from "@/types/session";
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
