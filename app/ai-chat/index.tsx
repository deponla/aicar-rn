import { Colors, FontFamily, tokens } from "@/constants/theme";
import {
    useCreateAiConversation,
    useDeleteAiConversation,
    useGetAiConversations,
} from "@/query-hooks/useAiChat";
import { useAuthStore } from "@/store/useAuth";
import { AuthStatusEnum } from "@/types/auth";
import LoginRequired from "@/components/LoginRequired";
import type { AiConversation } from "@/types/ai-chat";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { Href, useRouter } from "expo-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AiChatListScreen() {
    const auth = useAuthStore();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { t: translate } = useTranslation();
    const isLoggedIn = auth.status === AuthStatusEnum.LOGGED_IN && !!auth.user;

    const conversationsQuery = useGetAiConversations({
        filters: { page: 0, limit: 50 },
        enabled: isLoggedIn,
    });

    const createConversation = useCreateAiConversation();
    const deleteConversation = useDeleteAiConversation();

    const handleCreateConversation = useCallback(() => {
        createConversation.mutate(undefined, {
            onSuccess: (data) => {
                router.push(`/ai-chat/${data.result.id}` as Href);
            },
        });
    }, [createConversation, router]);

    const handleOpenConversation = useCallback(
        (id: string) => {
            router.push(`/ai-chat/${id}` as Href);
        },
        [router],
    );

    const handleDeleteConversation = useCallback(
        (id: string) => {
            Alert.alert(
                translate("aiChat.deleteTitle"),
                translate("aiChat.deleteConfirm"),
                [
                    { text: translate("common.cancel"), style: "cancel" },
                    {
                        text: translate("common.delete"),
                        style: "destructive",
                        onPress: () => deleteConversation.mutate(id),
                    },
                ],
            );
        },
        [deleteConversation, translate],
    );

    const renderConversation = useCallback(
        ({ item }: { item: AiConversation }) => {
            const timeAgo = item.lastMessageAt
                ? dayjs(item.lastMessageAt).fromNow()
                : dayjs(item.createdAt).fromNow();

            return (
                <TouchableOpacity
                    style={styles.conversationItem}
                    onPress={() => handleOpenConversation(item.id)}
                    onLongPress={() => handleDeleteConversation(item.id)}
                    activeOpacity={0.7}
                >
                    <View style={styles.conversationIcon}>
                        <MaterialIcons name="smart-toy" size={24} color={Colors.primary} />
                    </View>
                    <View style={styles.conversationContent}>
                        <Text style={styles.conversationTitle} numberOfLines={1}>
                            {item.title || translate("aiChat.newConversation")}
                        </Text>
                        {item.lastMessage ? (
                            <Text style={styles.conversationPreview} numberOfLines={2}>
                                {item.lastMessage}
                            </Text>
                        ) : null}
                    </View>
                    <Text style={styles.conversationTime}>{timeAgo}</Text>
                </TouchableOpacity>
            );
        },
        [handleOpenConversation, handleDeleteConversation, translate],
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
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
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
                <Text style={styles.headerTitle}>{translate("aiChat.title")}</Text>
                <View style={styles.headerRight} />
            </View>
            <View style={[styles.headerBorder, { backgroundColor: tokens.borderDefault }]} />

            {/* Content */}
            {conversationsQuery.isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            ) : !conversationsQuery.data?.results?.length ? (
                <View style={styles.centerContainer}>
                    <MaterialIcons
                        name="smart-toy"
                        size={64}
                        color={tokens.textPlaceholder}
                    />
                    <Text style={styles.emptyTitle}>{translate("aiChat.emptyTitle")}</Text>
                    <Text style={styles.emptyDescription}>
                        {translate("aiChat.emptyDescription")}
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={conversationsQuery.data.results}
                    keyExtractor={(item) => item.id}
                    renderItem={renderConversation}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                />
            )}

            {/* FAB */}
            <TouchableOpacity
                style={[styles.fab, { bottom: Math.max(insets.bottom, 16) + 16 }]}
                onPress={handleCreateConversation}
                activeOpacity={0.8}
                disabled={createConversation.isPending}
            >
                {createConversation.isPending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                    <MaterialIcons name="add" size={28} color="#FFFFFF" />
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: tokens.bgSurface,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        height: 56,
    },
    backButton: {
        padding: 4,
        marginRight: 8,
    },
    headerTitle: {
        flex: 1,
        fontFamily: FontFamily.semiBold,
        fontSize: 17,
        color: tokens.textPrimary,
    },
    headerRight: {
        width: 40,
    },
    headerBorder: {
        height: StyleSheet.hairlineWidth,
    },
    centerContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 18,
        color: tokens.textPrimary,
        marginTop: 16,
        textAlign: "center",
    },
    emptyDescription: {
        fontFamily: FontFamily.regular,
        fontSize: 14,
        color: tokens.textSecondary,
        marginTop: 8,
        textAlign: "center",
        lineHeight: 20,
    },
    listContent: {
        paddingVertical: 8,
    },
    conversationItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        gap: 12,
    },
    conversationIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: `${Colors.primary}10`,
        justifyContent: "center",
        alignItems: "center",
    },
    conversationContent: {
        flex: 1,
        gap: 2,
    },
    conversationTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: 15,
        color: tokens.textPrimary,
    },
    conversationPreview: {
        fontFamily: FontFamily.regular,
        fontSize: 13,
        color: tokens.textSecondary,
        lineHeight: 18,
    },
    conversationTime: {
        fontFamily: FontFamily.medium,
        fontSize: 12,
        color: tokens.textTertiary,
        alignSelf: "flex-start",
        marginTop: 2,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: tokens.borderSubtle,
        marginHorizontal: 16,
    },
    fab: {
        position: "absolute",
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary,
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
    },
});
