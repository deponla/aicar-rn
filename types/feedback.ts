import { IPagination, IPaginationQuery } from "./utils";

export enum FeedbackType {
  COMPLAINT = "complaint",
  SUGGESTION = "suggestion",
}

export enum FeedbackStatus {
  NEW = "new",
  IN_REVIEW = "in_review",
  RESOLVED = "resolved",
  CLOSED = "closed",
}

export interface Feedback {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  userId: string;
  type: FeedbackType;
  status: FeedbackStatus;
  subject: string;
  message: string;
  adminNotes?: string | null;
  resolvedAt?: string | null;
}

export interface CreateFeedbackRequest {
  type: FeedbackType;
  subject: string;
  message: string;
}

export interface FeedbackQuery extends IPaginationQuery {
  type?: FeedbackType;
  status?: FeedbackStatus;
}

export interface FeedbackResponse {
  result: Feedback;
}

export interface FeedbackListResponse extends IPagination {
  results: Feedback[];
  count: number;
}
