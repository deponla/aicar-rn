import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import {
  ChatQueryKeys,
  useGetChatConversations,
  useGetChatMessages,
  useMarkChatConversationRead,
  useSendChatMessage,
} from "@/query-hooks/useChat";
import { useChatSocket } from "@/query-hooks/useChatSocket";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import LoginRequired from "@/components/LoginRequired";
import type {
  ChatReadEventPayload,
  ChatSocketMessagePayload,
  Conversation,
  Message,
} from "@/types/chat";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList, type LegendListRef } from "@legendapp/list";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getConversationName(
  conversation: Conversation | undefined,
  fallbackTitle: string,
  unknownUserTitle: string,
): string {
  if (!conversation) return fallbackTitle;
  const participant = conversation.participant;
  if (participant?.name && participant?.surname) {
    return `${participant.name} ${participant.surname}`;
  }
  if (participant?.email) {
    return participant.email;
  }
  return unknownUserTitle;
}

export default function ChatDetailScreen() {
  const { conversationId } = useLocalSearchParams<{
    conversationId: string;
  }>();
  const auth = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const listRef = useRef<LegendListRef>(null);
  const t = tokens;
  const { t: translate } = useTranslation();
  const isLoggedIn = auth.status === AuthStatusEnum.LOGGED_IN && !!auth.user;

  const [messageText, setMessageText] = useState("");

  const conversationsQuery = useGetChatConversations({
    filters: { page: 0, limit: 50 },
    enabled: isLoggedIn,
  });

  const conversation = conversationsQuery.data?.results?.find(
    (c) => c.id === conversationId,
  );

  const messagesQuery = useGetChatMessages({
    conversationId,
    filters: { page: 0, limit: 100 },
    enabled: isLoggedIn && !!conversationId,
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
    if (!isLoggedIn || !conversationId) return;
    if (isConnected) {
      emitJoin(conversationId);
      emitRead(conversationId);
    }
    markConversationRead.mutate(conversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, isConnected, emitJoin, emitRead, isLoggedIn]);

  // ---------- Scroll to bottom on new messages ----------
  useEffect(() => {
    if (messagesQuery.data?.results?.length) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
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
            listRef.current?.scrollToEnd({ animated: true });
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
                <Text style={styles.readIndicator}>• {translate("chatScreen.readIndicator")}</Text>
              )}
            </View>
          </View>
        </View>
      );
    },
    [auth.user?.user.id, translate],
  );

  const conversationName = getConversationName(
    conversation,
    translate("chatScreen.defaultTitle"),
    translate("chatScreen.unknownUser"),
  );

  if (!isLoggedIn) {
    return (
      <LoginRequired
        pageTitle={translate("chatScreen.pageTitle")}
        title={translate("chatScreen.loginTitle")}
        description={translate("chatScreen.loginDescription")}
      />
    );
  }

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
                <Text style={styles.onlineText}>{translate("chatScreen.online")}</Text>
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
            <Text style={{ color: t.textSecondary, fontSize: 13 }}>
              {translate("chatScreen.warehouseLabel")}: {conversation.relatedWarehouseId}
            </Text>
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
              {translate("chatScreen.emptyMessages")}
            </Text>
          </View>
        )}
        {!messagesQuery.isLoading && !!messagesQuery.data?.results?.length && (
          <LegendList
            ref={listRef}
            data={messagesQuery.data.results}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            estimatedItemSize={80}
            initialContainerPoolRatio={4}
            recycleItems
            style={styles.messagesListView}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              listRef.current?.scrollToEnd({ animated: false });
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
          placeholder={translate("chatScreen.messagePlaceholder")}
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
    fontFamily: FontFamily.semiBold,
    fontSize: 17,
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
    backgroundColor: tokens.success,
    marginRight: 4,
  },
  onlineText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    color: tokens.success,
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
  messagesListView: {
    flex: 1,
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
    backgroundColor: tokens.surfaceContainerLowest,
    borderBottomLeftRadius: 4,
    ...ambientShadow,
  },
  messageText: {
    fontFamily: FontFamily.regular,
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextMine: {
    color: tokens.textInverse,
  },
  messageTextOther: {
    color: tokens.textPrimary,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
  },
  messageTimeMine: {
    color: "rgba(255,255,255,0.7)",
  },
  messageTimeOther: {
    color: tokens.textTertiary,
  },
  readIndicator: {
    fontFamily: FontFamily.medium,
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
    fontFamily: FontFamily.regular,
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
