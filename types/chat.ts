import type { IPagination, IPaginationQuery } from "./utils";

export interface Conversation {
  id: string;
  participant: {
    name?: string;
    surname?: string;
    email?: string;
    phone?: string;
  };
  relatedWarehouseId?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface ConversationListResponse extends IPagination {
  results: Conversation[];
  count: number;
}

export interface MessageListResponse extends IPagination {
  results: Message[];
  count: number;
}

export interface ConversationResponse {
  result: Conversation;
}

export interface MessageResponse {
  result: Message;
}

export interface ConversationQuery extends IPaginationQuery {
  relatedWarehouseId?: string;
}

export interface MessageQuery extends IPaginationQuery {
  conversationId: string;
}

export interface StartConversationRequest {
  participantId: string;
  relatedWarehouseId?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
}

export interface ChatSocketMessagePayload {
  result: Message;
}

export interface ChatReadEventPayload {
  conversationId: string;
  readerId: string;
}

export interface ChatJoinPayload {
  conversationId: string;
}
