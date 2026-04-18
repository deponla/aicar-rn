import ChatWarehouseCard from "@/components/ChatWarehouseCard";
import { Colors, tokens } from "@/constants/theme";
import {
  ChatQueryKeys,
  useGetChatConversations,
  useGetChatMessages,
  useMarkChatConversationRead,
  useSendChatMessage,
} from "@/query-hooks/useChat";
import { useChatSocket } from "@/query-hooks/useChatSocket";
import { useAuthStore } from "@/store/useAuth";
import type {
  ChatReadEventPayload,
  ChatSocketMessagePayload,
  Conversation,
  Message,
} from "@/types/chat";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getConversationName(conversation?: Conversation): string {
  if (!conversation) return "Sohbet";
  const participant = conversation.participant;
  if (participant?.name && participant?.surname) {
    return `${participant.name} ${participant.surname}`;
  }
  if (participant?.email) {
    return participant.email;
  }
  return "Bilinmeyen Kullanıcı";
}

export default function ChatDetailScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const auth = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const flatListRef = useRef<FlatList>(null);
  const t = tokens;

  const [messageText, setMessageText] = useState("");

  const conversationsQuery = useGetChatConversations({
    filters: { page: 0, limit: 50 },
  });

  const conversation = conversationsQuery.data?.results?.find(
    (c) => c.id === conversationId,
  );

  const messagesQuery = useGetChatMessages({
    conversationId,
    filters: { page: 0, limit: 100 },
    enabled: !!conversationId,
  });

  const sendMessage = useSendChatMessage();
  const markConversationRead = useMarkChatConversationRead();

  // ---------- Socket handlers ----------
  const handleIncomingMessage = useCallback(
    (payload: ChatSocketMessagePayload) => {
      const incoming = payload.result;
      if (!incoming?.conversationId) return;

      const currentUserId = auth.user?.user.id;
      if (incoming.senderId === currentUserId) return;

      queryClient.setQueriesData<{
        results: Message[];
        page: number;
        limit: number;
        count: number;
      }>(
        { queryKey: [ChatQueryKeys.MESSAGES, incoming.conversationId] },
        (previous) => {
          if (!previous) {
            return { results: [incoming], page: 0, limit: 100, count: 1 };
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

      queryClient.setQueriesData(
        { queryKey: [ChatQueryKeys.CONVERSATIONS] },
        (previous?: {
          results: Conversation[];
          page: number;
          limit: number;
          count: number;
        }) => {
          if (!previous) return previous;

          const hasConversation = previous.results.some(
            (c) => c.id === incoming.conversationId,
          );

          if (!hasConversation) {
            queryClient.invalidateQueries({
              queryKey: [ChatQueryKeys.CONVERSATIONS],
            });
            return previous;
          }

          const nextResults = previous.results
            .map((c) =>
              c.id === incoming.conversationId
                ? {
                    ...c,
                    lastMessage: incoming.content,
                    lastMessageAt: incoming.createdAt,
                  }
                : c,
            )
            .sort((a, b) => {
              const first = a.lastMessageAt ?? a.createdAt;
              const second = b.lastMessageAt ?? b.createdAt;
              return new Date(second).getTime() - new Date(first).getTime();
            });

          return { ...previous, results: nextResults };
        },
      );
    },
    [queryClient, auth.user?.user.id],
  );

  const handleReadEvent = useCallback(
    (payload: ChatReadEventPayload) => {
      queryClient.setQueriesData<{
        results: Message[];
        page: number;
        limit: number;
        count: number;
      }>(
        { queryKey: [ChatQueryKeys.MESSAGES, payload.conversationId] },
        (previous) => {
          if (!previous) return previous;
          const updated = previous.results.map((message) =>
            message.senderId === payload.readerId
              ? message
              : { ...message, isRead: true },
          );
          return { ...previous, results: updated };
        },
      );
    },
    [queryClient],
  );

  const { isConnected, emitJoin, emitRead } = useChatSocket({
    onMessage: handleIncomingMessage,
    onRead: handleReadEvent,
  });

  // ---------- Join & mark read ----------
  useEffect(() => {
    if (!conversationId) return;
    if (isConnected) {
      emitJoin(conversationId);
      emitRead(conversationId);
    }
    markConversationRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isConnected, emitJoin, emitRead]);

  // ---------- Scroll to bottom on new messages ----------
  useEffect(() => {
    if (messagesQuery.data?.results?.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messagesQuery.data?.results?.length]);

  // ---------- Send ----------
  const handleSend = useCallback(() => {
    if (!conversationId || !messageText.trim()) return;

    const text = messageText.trim();
    setMessageText("");
    Keyboard.dismiss();

    sendMessage.mutate(
      { conversationId, content: text },
      {
        onSuccess: () => {
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 150);
        },
      },
    );
  }, [conversationId, messageText, sendMessage]);

  // ---------- Render message bubble ----------
  const renderMessage = useCallback(
    ({ item }: { item: Message }) => {
      const isMine = item.senderId === auth.user?.user.id;
      return (
        <View
          style={[
            styles.messageBubbleRow,
            isMine ? styles.messageBubbleRowRight : styles.messageBubbleRowLeft,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMine ? styles.messageTextMine : styles.messageTextOther,
              ]}
            >
              {item.content}
            </Text>
            <View style={styles.messageFooter}>
              <Text
                style={[
                  styles.messageTime,
                  isMine ? styles.messageTimeMine : styles.messageTimeOther,
                ]}
              >
                {dayjs(item.createdAt).format("HH:mm")}
              </Text>
              {isMine && item.isRead && (
                <Text style={styles.readIndicator}>• Görüldü</Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [auth.user?.user.id],
  );

  const conversationName = getConversationName(conversation);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: t.bgSurface }]}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top, backgroundColor: t.bgSurface },
        ]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={22}
              color={t.textPrimary}
            />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text
              style={[styles.headerTitle, { color: t.textPrimary }]}
              numberOfLines={1}
            >
              {conversationName}
            </Text>
            {isConnected && (
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Çevrimiçi</Text>
              </View>
            )}
          </View>
          <View style={styles.headerRight} />
        </View>
        {conversation?.relatedWarehouseId && (
          <View
            style={[
              styles.warehouseCardContainer,
              { backgroundColor: t.bgSurface },
            ]}
          >
            <ChatWarehouseCard warehouseId={conversation.relatedWarehouseId} />
          </View>
        )}
        <View
          style={[styles.headerBorder, { backgroundColor: t.borderDefault }]}
        />
      </View>

      {/* Messages */}
      <View style={[styles.messagesContainer, { backgroundColor: t.bgBase }]}>
        {messagesQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        )}
        {!messagesQuery.isLoading && !messagesQuery.data?.results?.length && (
          <View style={styles.emptyMessages}>
            <Text style={[styles.emptyMessagesText, { color: t.textTertiary }]}>
              Henüz mesaj yok. İlk mesajı gönderin!
            </Text>
          </View>
        )}
        {!messagesQuery.isLoading && !!messagesQuery.data?.results?.length && (
          <FlatList
            ref={flatListRef}
            data={messagesQuery.data.results}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: false });
            }}
          />
        )}
      </View>

      {/* Input Bar */}
      <View
        style={[
          styles.inputBar,
          {
            paddingBottom: Math.max(insets.bottom, 8),
            backgroundColor: t.bgSurface,
            borderTopColor: t.borderDefault,
          },
        ]}
      >
        <TextInput
          style={[
            styles.textInput,
            { backgroundColor: t.bgSubtle, color: t.textPrimary },
          ]}
          placeholder="Mesajınızı yazın..."
          placeholderTextColor={t.textPlaceholder}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          maxLength={2000}
          returnKeyType="default"
          blurOnSubmit={false}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !messageText.trim() && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!messageText.trim() || sendMessage.isPending}
          activeOpacity={0.7}
        >
          {sendMessage.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 0,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  onlineIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#34C759",
    marginRight: 4,
  },
  onlineText: {
    fontSize: 12,
    color: "#34C759",
  },
  headerRight: {
    width: 40,
  },
  headerBorder: {
    height: StyleSheet.hairlineWidth,
  },
  warehouseCardContainer: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyMessages: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyMessagesText: {
    fontSize: 15,
    textAlign: "center",
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageBubbleRow: {
    marginBottom: 8,
    flexDirection: "row",
  },
  messageBubbleRowRight: {
    justifyContent: "flex-end",
  },
  messageBubbleRowLeft: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  messageBubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMine: {
    color: "#FFFFFF",
  },
  messageTextOther: {
    color: "#1C1C1E",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  messageTimeMine: {
    color: "rgba(255,255,255,0.7)",
  },
  messageTimeOther: {
    color: "#8E8E93",
  },
  readIndicator: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
