import { getAiConversations, getAiMessages } from "@/api/get";
import { postCreateAiConversation } from "@/api/post";
import { deleteAiConversation } from "@/api/delete";
import type {
  AiConversationQuery,
  AiMessageQuery,
  CreateAiConversationRequest,
} from "@/types/ai-chat";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export enum AiChatQueryKeys {
  CONVERSATIONS = "ai-chat-conversations",
  MESSAGES = "ai-chat-messages",
}

export const useGetAiConversations = ({
  filters,
  enabled = true,
}: {
  filters?: AiConversationQuery;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: [AiChatQueryKeys.CONVERSATIONS, filters],
    queryFn: () => getAiConversations(filters),
    enabled,
  });
};

export const useGetAiMessages = ({
  conversationId,
  filters,
  enabled = true,
}: {
  conversationId: string;
  filters?: AiMessageQuery;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: [AiChatQueryKeys.MESSAGES, conversationId, filters],
    queryFn: () =>
      getAiMessages({
        conversationId,
        filters,
      }),
    enabled: enabled && !!conversationId,
  });
};

export const useCreateAiConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload?: CreateAiConversationRequest) =>
      postCreateAiConversation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [AiChatQueryKeys.CONVERSATIONS],
      });
    },
  });
};

export const useDeleteAiConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAiConversation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [AiChatQueryKeys.CONVERSATIONS],
      });
    },
  });
};
