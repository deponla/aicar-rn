import { ambientShadow, Colors, FontFamily, tokens } from "@/constants/theme";
import {
    AiChatQueryKeys,
    useGetAiMessages,
} from "@/query-hooks/useAiChat";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import LoginRequired from "@/components/LoginRequired";
import type { AiMessage } from "@/types/ai-chat";
import { AiMessageRole } from "@/types/ai-chat";
import { sendAiMessageStreaming } from "@/services/AiChatService";
import { MaterialIcons } from "@expo/vector-icons";
import { LegendList, type LegendListRef } from "@legendapp/list";
import { useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { prepareImageAssetAsBase64 } from "@/services/ImageAssetService";

interface StreamingMessage {
    id: string;
    role: AiMessageRole;
    content: string;
    isStreaming: boolean;
}

interface PendingImage {
    base64: string;
    uri: string;
}

const AI_CHAT_MAX_IMAGE_DIMENSION = 1024;
const AI_CHAT_IMAGE_COMPRESS = 0.65;

function toDisplayImageUri(value: string) {
    if (/^(https?:\/\/|file:\/\/|data:)/i.test(value)) {
        return value;
    }

    return `data:image/jpeg;base64,${value}`;
}

async function prepareImageForAiChat(
    asset: ImagePicker.ImagePickerAsset,
): Promise<PendingImage> {
    const preparedAsset = await prepareImageAssetAsBase64(asset, {
        maxDimension: AI_CHAT_MAX_IMAGE_DIMENSION,
        compress: AI_CHAT_IMAGE_COMPRESS,
        forceJpeg: true,
    });

    return {
        base64: preparedAsset.base64,
        uri: preparedAsset.uri,
    };
}

export default function AiChatDetailScreen() {
    const { conversationId } = useLocalSearchParams<{
        conversationId: string;
    }>();
    const auth = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const listRef = useRef<LegendListRef>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const { t: translate } = useTranslation();
    const isLoggedIn = auth.status === AuthStatusEnum.LOGGED_IN && !!auth.user;

    const [messageText, setMessageText] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
    const [streamingMessage, setStreamingMessage] =
        useState<StreamingMessage | null>(null);
    const hasStreamingMessage = streamingMessage != null;
    const streamingMessageContent = streamingMessage?.content;

    const messagesQuery = useGetAiMessages({
        conversationId,
        filters: { page: 0, limit: 100 },
        enabled: isLoggedIn && !!conversationId,
    });

    // Scroll to bottom on new messages
    useEffect(() => {
        if (messagesQuery.data?.results?.length || hasStreamingMessage) {
            setTimeout(() => {
                listRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [
        hasStreamingMessage,
        messagesQuery.data?.results?.length,
        streamingMessageContent,
    ]);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    const handlePickImage = useCallback(async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert(
                translate("aiChat.permissionTitle"),
                translate("aiChat.permissionDescription"),
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.7,
            allowsMultipleSelection: false,
        });

        if (result.canceled || !result.assets?.length) return;

        const asset = result.assets[0];
        setIsUploading(true);

        try {
            const preparedImage = await prepareImageForAiChat(asset);

            setPendingImages((prev) => [...prev, preparedImage]);
        } catch (error) {
            console.error("Failed to prepare AI chat image:", error);
            Alert.alert(
                translate("common.error"),
                translate("aiChat.uploadFailed"),
            );
        } finally {
            setIsUploading(false);
        }
    }, [translate]);

    const handleRemoveImage = useCallback((index: number) => {
        setPendingImages((prev) => prev.filter((_, i) => i !== index));
    }, []);

    const handleSend = useCallback(() => {
        if (!conversationId || (!messageText.trim() && !pendingImages.length))
            return;

        const text = messageText.trim();
        const images = pendingImages.map((image) => image.base64);
        setMessageText("");
        setPendingImages([]);
        setIsSending(true);
        Keyboard.dismiss();

        // Add user message to local list optimistically
        const tempUserMsg: AiMessage = {
            id: `temp-user-${Date.now()}`,
            conversationId,
            role: AiMessageRole.USER,
            content: text,
            imageUrls: images,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
        };

        queryClient.setQueriesData<{
            results: AiMessage[];
            page: number;
            limit: number;
            count: number;
        }>(
            { queryKey: [AiChatQueryKeys.MESSAGES, conversationId] },
            (previous) => {
                if (!previous) {
                    return { results: [tempUserMsg], page: 0, limit: 100, count: 1 };
                }
                return {
                    ...previous,
                    results: [...previous.results, tempUserMsg],
                    count: previous.count + 1,
                };
            },
        );

        // Start streaming
        setStreamingMessage({
            id: `streaming-${Date.now()}`,
            role: AiMessageRole.ASSISTANT,
            content: "",
            isStreaming: true,
        });

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        sendAiMessageStreaming(
            {
                conversationId,
                content: text,
                imageUrls: images.length > 0 ? images : undefined,
            },
            // onChunk
            (chunk) => {
                setStreamingMessage((prev) =>
                    prev ? { ...prev, content: prev.content + chunk } : null,
                );
            },
            // onDone
            (_messageId) => {
                setStreamingMessage(null);
                setIsSending(false);
                abortControllerRef.current = null;
                // Refresh messages from server to get proper IDs
                queryClient.invalidateQueries({
                    queryKey: [AiChatQueryKeys.MESSAGES, conversationId],
                });
                queryClient.invalidateQueries({
                    queryKey: [AiChatQueryKeys.CONVERSATIONS],
                });
            },
            // onError
            (error) => {
                setStreamingMessage(null);
                setIsSending(false);
                abortControllerRef.current = null;
                Alert.alert(translate("common.error"), error.message);
                queryClient.invalidateQueries({
                    queryKey: [AiChatQueryKeys.MESSAGES, conversationId],
                });
            },
            abortController.signal,
        );
    }, [conversationId, messageText, pendingImages, queryClient, translate]);

    // Build display data: messages + streaming message
    const displayMessages: (AiMessage | StreamingMessage)[] = [
        ...(messagesQuery.data?.results ?? []),
        ...(streamingMessage ? [streamingMessage] : []),
    ];

    const renderMessage = useCallback(
        ({ item }: { item: AiMessage | StreamingMessage }) => {
            const isUser = item.role === AiMessageRole.USER;
            const isStreaming = "isStreaming" in item && item.isStreaming;

            return (
                <View
                    style={[
                        styles.messageBubbleRow,
                        isUser ? styles.messageBubbleRowRight : styles.messageBubbleRowLeft,
                    ]}
                >
                    {!isUser && (
                        <View style={styles.aiAvatar}>
                            <MaterialIcons name="smart-toy" size={16} color={Colors.primary} />
                        </View>
                    )}
                    <View
                        style={[
                            styles.messageBubble,
                            isUser ? styles.messageBubbleMine : styles.messageBubbleOther,
                        ]}
                    >
                        {"imageUrls" in item && item.imageUrls?.length > 0 && (
                            <View style={styles.messageImages}>
                                {item.imageUrls.map((url, idx) => (
                                    <Image
                                        key={idx}
                                        source={{ uri: toDisplayImageUri(url) }}
                                        style={styles.messageImage}
                                        resizeMode="cover"
                                    />
                                ))}
                            </View>
                        )}
                        {item.content ? (
                            <Text
                                style={[
                                    styles.messageText,
                                    isUser ? styles.messageTextMine : styles.messageTextOther,
                                ]}
                            >
                                {item.content}
                            </Text>
                        ) : null}
                        {isStreaming && !item.content && (
                            <View style={styles.typingIndicator}>
                                <View style={[styles.typingDot, styles.typingDot1]} />
                                <View style={[styles.typingDot, styles.typingDot2]} />
                                <View style={[styles.typingDot, styles.typingDot3]} />
                            </View>
                        )}
                        {!isStreaming && "createdAt" in item && (
                            <Text
                                style={[
                                    styles.messageTime,
                                    isUser ? styles.messageTimeMine : styles.messageTimeOther,
                                ]}
                            >
                                {dayjs(item.createdAt).format("HH:mm")}
                            </Text>
                        )}
                    </View>
                </View>
            );
        },
        [],
    );

    if (!isLoggedIn) {
        return (
            <LoginRequired
                pageTitle={translate("aiChat.title")}
                title={translate("aiChat.loginTitle")}
                description={translate("aiChat.loginDescription")}
            />
        );
    }

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: tokens.bgSurface }]}
            behavior="padding"
            keyboardVerticalOffset={0}
        >
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <View style={styles.headerContent}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialIcons
                            name="arrow-back-ios"
                            size={22}
                            color={tokens.textPrimary}
                        />
                    </TouchableOpacity>
                    <View style={styles.headerTitleContainer}>
                        <Text style={styles.headerTitle} numberOfLines={1}>
                            {translate("aiChat.assistantName")}
                        </Text>
                        <View style={styles.onlineIndicator}>
                            <View style={styles.onlineDot} />
                            <Text style={styles.onlineText}>AI</Text>
                        </View>
                    </View>
                    <View style={styles.headerRight} />
                </View>
                <View
                    style={[styles.headerBorder, { backgroundColor: tokens.borderDefault }]}
                />
            </View>

            {/* Messages */}
            <View style={[styles.messagesContainer, { backgroundColor: tokens.bgBase }]}>
                {messagesQuery.isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                    </View>
                )}
                {!messagesQuery.isLoading && displayMessages.length === 0 && (
                    <View style={styles.emptyMessages}>
                        <MaterialIcons
                            name="smart-toy"
                            size={48}
                            color={tokens.textPlaceholder}
                        />
                        <Text
                            style={[styles.emptyMessagesText, { color: tokens.textTertiary }]}
                        >
                            {translate("aiChat.startConversation")}
                        </Text>
                    </View>
                )}
                {!messagesQuery.isLoading && displayMessages.length > 0 && (
                    <LegendList
                        ref={listRef}
                        data={displayMessages}
                        keyExtractor={(item) => item.id}
                        renderItem={renderMessage}
                        estimatedItemSize={96}
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

            {/* Pending images preview */}
            {pendingImages.length > 0 && (
                <View style={styles.pendingImagesBar}>
                    {pendingImages.map((image, idx) => (
                        <View key={idx} style={styles.pendingImageContainer}>
                            <Image
                                source={{ uri: image.uri }}
                                style={styles.pendingImage}
                                resizeMode="cover"
                            />
                            <TouchableOpacity
                                style={styles.removeImageButton}
                                onPress={() => handleRemoveImage(idx)}
                            >
                                <MaterialIcons name="close" size={14} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            {/* Input Bar */}
            <View
                style={[
                    styles.inputBar,
                    {
                        paddingBottom: Math.max(insets.bottom, 8),
                        backgroundColor: tokens.bgSurface,
                        borderTopColor: tokens.borderDefault,
                    },
                ]}
            >
                <TouchableOpacity
                    style={styles.attachButton}
                    onPress={handlePickImage}
                    disabled={isUploading || isSending}
                    activeOpacity={0.7}
                >
                    {isUploading ? (
                        <ActivityIndicator size="small" color={Colors.primary} />
                    ) : (
                        <MaterialIcons
                            name="photo-camera"
                            size={24}
                            color={
                                isUploading || isSending
                                    ? tokens.textPlaceholder
                                    : Colors.primary
                            }
                        />
                    )}
                </TouchableOpacity>

                <TextInput
                    style={[
                        styles.textInput,
                        { backgroundColor: tokens.bgSubtle, color: tokens.textPrimary },
                    ]}
                    placeholder={translate("aiChat.messagePlaceholder")}
                    placeholderTextColor={tokens.textPlaceholder}
                    value={messageText}
                    onChangeText={setMessageText}
                    multiline
                    maxLength={2000}
                    returnKeyType="default"
                    blurOnSubmit={false}
                    editable={!isSending}
                />
                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        !messageText.trim() && !pendingImages.length && styles.sendButtonDisabled,
                    ]}
                    onPress={handleSend}
                    disabled={
                        (!messageText.trim() && !pendingImages.length) || isSending
                    }
                    activeOpacity={0.7}
                >
                    {isSending ? (
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
        color: tokens.textPrimary,
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
        gap: 12,
    },
    emptyMessagesText: {
        fontSize: 15,
        textAlign: "center",
        fontFamily: FontFamily.regular,
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
        alignItems: "flex-end",
    },
    messageBubbleRowRight: {
        justifyContent: "flex-end",
    },
    messageBubbleRowLeft: {
        justifyContent: "flex-start",
    },
    aiAvatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: `${Colors.primary}10`,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 6,
        marginBottom: 2,
    },
    messageBubble: {
        maxWidth: "78%",
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
    messageImages: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 4,
        marginBottom: 6,
    },
    messageImage: {
        width: 120,
        height: 120,
        borderRadius: 12,
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
    messageTime: {
        fontFamily: FontFamily.medium,
        fontSize: 11,
        marginTop: 4,
    },
    messageTimeMine: {
        color: "rgba(255,255,255,0.7)",
    },
    messageTimeOther: {
        color: tokens.textTertiary,
    },
    typingIndicator: {
        flexDirection: "row",
        gap: 4,
        paddingVertical: 4,
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: tokens.textTertiary,
    },
    typingDot1: {
        opacity: 0.4,
    },
    typingDot2: {
        opacity: 0.6,
    },
    typingDot3: {
        opacity: 0.8,
    },
    pendingImagesBar: {
        flexDirection: "row",
        paddingHorizontal: 16,
        paddingVertical: 8,
        gap: 8,
        backgroundColor: tokens.bgSurface,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: tokens.borderSubtle,
    },
    pendingImageContainer: {
        position: "relative",
    },
    pendingImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    removeImageButton: {
        position: "absolute",
        top: -6,
        right: -6,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
    },
    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        paddingHorizontal: 12,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        gap: 8,
    },
    attachButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
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
