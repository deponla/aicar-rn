import { postSendAiMessage } from "@/api/post";
import { useAuthStore } from "@/store/useAuth";
import type { AiChatStreamEvent, SendAiMessageRequest } from "@/types/ai-chat";
import { API_URL } from "@/utils/env";
import { Platform } from "react-native";

function buildApiUrl(path: string) {
  return `${API_URL}/${path.replace(/^\/+/, "")}`;
}

async function sendAiMessageWithoutStreaming(
  data: SendAiMessageRequest,
  onChunk: (text: string) => void,
  onDone: (messageId: string) => void,
  onError: (error: Error) => void,
) {
  try {
    const response = await postSendAiMessage(data);
    const message = response.result;

    if (!message) {
      onError(new Error("AI response did not include a message"));
      return;
    }

    onChunk(message.content);
    onDone(message.id);
  } catch (error) {
    onError(
      error instanceof Error ? error : new Error("AI chat request failed"),
    );
  }
}

export async function sendAiMessageStreaming(
  data: SendAiMessageRequest,
  onChunk: (text: string) => void,
  onDone: (messageId: string) => void,
  onError: (error: Error) => void,
  signal?: AbortSignal,
): Promise<void> {
  const authState = useAuthStore.getState();
  const token = authState.user?.accessToken?.token;

  if (!token) {
    onError(new Error("Not authenticated"));
    return;
  }

  if (Platform.OS !== "web") {
    await sendAiMessageWithoutStreaming(data, onChunk, onDone, onError);
    return;
  }

  const url = buildApiUrl("v1/ai-chat/messages/stream");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Request failed");
      onError(new Error(errorText));
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      await sendAiMessageWithoutStreaming(data, onChunk, onDone, onError);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const event: AiChatStreamEvent = JSON.parse(jsonStr);

          switch (event.type) {
            case "chunk":
              onChunk(event.content);
              break;
            case "done":
              onDone(event.messageId);
              break;
            case "error":
              onError(new Error(event.message));
              break;
          }
        } catch {
          // Skip malformed JSON lines
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) return;
    onError(
      error instanceof Error ? error : new Error("Stream connection failed"),
    );
  }
}
