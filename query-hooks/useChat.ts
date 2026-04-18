import { getChatConversations, getChatMessages } from "@/api/get";
import {
  postMarkConversationRead,
  postSendMessage,
  postStartConversation,
} from "@/api/post";
import type {
  Conversation,
  ConversationQuery,
  Message,
  MessageQuery,
  SendMessageRequest,
  StartConversationRequest,
} from "@/types/chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum ChatQueryKeys {
  CONVERSATIONS = "chat-conversations",
  MESSAGES = "chat-messages",
}

export const useGetChatConversations = ({
  filters,
  enabled = true,
}: {
  filters?: ConversationQuery;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: [ChatQueryKeys.CONVERSATIONS, filters],
    queryFn: () => getChatConversations(filters),
    enabled,
    gcTime: 0,
    staleTime: 0,
  });
};

export const useGetChatMessages = ({
  conversationId,
  filters,
  enabled = true,
}: {
  conversationId: string;
  filters?: Omit<MessageQuery, "conversationId">;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [ChatQueryKeys.MESSAGES, conversationId, filters],
    queryFn: () =>
      getChatMessages({
        conversationId: conversationId,
        filters,
      }),
    enabled: enabled && !!conversationId,
  });
};

export const useStartChatConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartConversationRequest) =>
      postStartConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [ChatQueryKeys.CONVERSATIONS],
      });
    },
  });
};

export const useSendChatMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SendMessageRequest) => postSendMessage(payload),
    onSuccess: (data, variables) => {
      const incoming = data.result;
      if (!incoming?.conversationId) return;

      queryClient.setQueriesData<{
        results: Message[];
        page: number;
        limit: number;
        count: number;
      }>(
        { queryKey: [ChatQueryKeys.MESSAGES, variables.conversationId] },
        (previous) => {
          if (!previous) {
            return {
              results: [incoming],
              page: 0,
              limit: 100,
              count: 1,
            };
          }

          if (previous.results.some((item) => item.id === incoming.id)) {
            return previous;
          }

          const nextResults = [...previous.results, incoming].sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );

          return {
            ...previous,
            results: nextResults,
            count: Math.max(previous.count, nextResults.length),
          };
        },
      );

      queryClient.setQueriesData<{
        results: Conversation[];
        page: number;
        limit: number;
        count: number;
      }>({ queryKey: [ChatQueryKeys.CONVERSATIONS] }, (previous) => {
        if (!previous) return previous;

        const nextResults = previous.results
          .map((conversation) =>
            conversation.id === incoming.conversationId
              ? {
                  ...conversation,
                  lastMessage: incoming.content,
                  lastMessageAt: incoming.createdAt,
                }
              : conversation,
          )
          .sort((a, b) => {
            const first = a.lastMessageAt ?? a.createdAt;
            const second = b.lastMessageAt ?? b.createdAt;
            return new Date(second).getTime() - new Date(first).getTime();
          });

        return { ...previous, results: nextResults };
      });
    },
  });
};

export const useMarkChatConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) =>
      postMarkConversationRead(conversationId),
    onSuccess: (_data, conversationId) => {
      queryClient.invalidateQueries({
        queryKey: [ChatQueryKeys.MESSAGES, conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: [ChatQueryKeys.CONVERSATIONS],
      });
    },
  });
};
