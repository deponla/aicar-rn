import type { IPagination, IPaginationQuery } from "./utils";

export enum AiMessageRole {
  USER = "user",
  ASSISTANT = "assistant",
}

export interface AiConversation {
  id: string;
  userId: string;
  title?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  imageUrls: string[];
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
}

export interface AiConversationListResponse extends IPagination {
  results: AiConversation[];
  count: number;
}

export interface AiMessageListResponse extends IPagination {
  results: AiMessage[];
  count: number;
}

export interface AiConversationResponse {
  result: AiConversation;
}

export interface AiMessageResponse {
  result: AiMessage;
}

export interface AiConversationQuery extends IPaginationQuery {
  sort?: string;
}

export interface AiMessageQuery extends IPaginationQuery {
  sort?: string;
}

export interface SendAiMessageRequest {
  conversationId: string;
  content: string;
  imageUrls?: string[];
}

export interface CreateAiConversationRequest {
  title?: string;
}

export interface AiChatStreamChunk {
  type: "chunk";
  content: string;
}

export interface AiChatStreamDone {
  type: "done";
  messageId: string;
}

export interface AiChatStreamError {
  type: "error";
  message: string;
}

export type AiChatStreamEvent =
  | AiChatStreamChunk
  | AiChatStreamDone
  | AiChatStreamError;
