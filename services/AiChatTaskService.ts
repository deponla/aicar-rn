import { sendAiMessageStreaming } from "@/services/AiChatService";
import type { SendAiMessageRequest } from "@/types/ai-chat";
import { queryClient } from "@/utils/queryClient";

const AI_CHAT_CONVERSATIONS_QUERY_KEY = "ai-chat-conversations";
const AI_CHAT_MESSAGES_QUERY_KEY = "ai-chat-messages";

export type AiChatTaskStatus = "running" | "completed" | "error";

export interface AiChatTaskSnapshot {
  conversationId: string;
  content: string;
  status: AiChatTaskStatus;
  messageId?: string;
  error?: Error;
}

export interface AiChatTaskCompletionEvent {
  conversationId: string;
  content: string;
  messageId?: string;
  error?: Error;
}

const tasks = new Map<string, AiChatTaskSnapshot>();
const taskListeners = new Set<() => void>();
const completionListeners = new Set<(event: AiChatTaskCompletionEvent) => void>();

let activeConversationId: string | null = null;

function emitTaskChange() {
  taskListeners.forEach((listener) => listener());
}

function emitCompletion(event: AiChatTaskCompletionEvent) {
  completionListeners.forEach((listener) => listener(event));
}

function invalidateAiChatQueries(conversationId: string) {
  void queryClient.invalidateQueries({
    queryKey: [AI_CHAT_MESSAGES_QUERY_KEY, conversationId],
  });
  void queryClient.invalidateQueries({
    queryKey: [AI_CHAT_CONVERSATIONS_QUERY_KEY],
  });
}

export function getActiveAiChatConversationId() {
  return activeConversationId;
}

export function setActiveAiChatConversationId(conversationId: string | null) {
  activeConversationId = conversationId;
}

export function getAiChatTask(conversationId: string) {
  return tasks.get(conversationId) ?? null;
}

export function subscribeAiChatTasks(listener: () => void) {
  taskListeners.add(listener);

  return () => {
    taskListeners.delete(listener);
  };
}

export function subscribeAiChatTaskCompletions(
  listener: (event: AiChatTaskCompletionEvent) => void,
) {
  completionListeners.add(listener);

  return () => {
    completionListeners.delete(listener);
  };
}

export function startAiChatResponseTask(payload: SendAiMessageRequest) {
  const currentTask = tasks.get(payload.conversationId);
  if (currentTask?.status === "running") {
    return;
  }

  tasks.set(payload.conversationId, {
    conversationId: payload.conversationId,
    content: "",
    status: "running",
  });
  emitTaskChange();

  void sendAiMessageStreaming(
    payload,
    (chunk) => {
      const task = tasks.get(payload.conversationId);
      if (!task || task.status !== "running") {
        return;
      }

      tasks.set(payload.conversationId, {
        ...task,
        content: task.content + chunk,
      });
      emitTaskChange();
    },
    (messageId) => {
      const task = tasks.get(payload.conversationId);
      const content = task?.content ?? "";

      tasks.set(payload.conversationId, {
        conversationId: payload.conversationId,
        content,
        messageId,
        status: "completed",
      });
      invalidateAiChatQueries(payload.conversationId);
      emitTaskChange();
      emitCompletion({
        conversationId: payload.conversationId,
        content,
        messageId,
      });

      setTimeout(() => {
        const latestTask = tasks.get(payload.conversationId);
        if (latestTask?.status === "completed") {
          tasks.delete(payload.conversationId);
          emitTaskChange();
        }
      }, 1000);
    },
    (error) => {
      tasks.set(payload.conversationId, {
        conversationId: payload.conversationId,
        content: "",
        error,
        status: "error",
      });
      invalidateAiChatQueries(payload.conversationId);
      emitTaskChange();
      emitCompletion({
        conversationId: payload.conversationId,
        content: "",
        error,
      });

      setTimeout(() => {
        const latestTask = tasks.get(payload.conversationId);
        if (latestTask?.status === "error") {
          tasks.delete(payload.conversationId);
          emitTaskChange();
        }
      }, 5000);
    },
  );
}
