import { useNotification } from "@/components/Notification";
import {
  getActiveAiChatConversationId,
  subscribeAiChatTaskCompletions,
} from "@/services/AiChatTaskService";
import { Href, useRouter } from "expo-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function AiChatNotificationBridge() {
  const { notify } = useNotification();
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    return subscribeAiChatTaskCompletions((event) => {
      if (getActiveAiChatConversationId() === event.conversationId) {
        return;
      }

      if (event.error) {
        notify({
          type: "error",
          title: t("aiChat.responseFailedTitle"),
          message: event.error.message,
          duration: 5000,
        });
        return;
      }

      notify({
        type: "info",
        title: t("aiChat.responseReadyTitle"),
        message: event.content || t("aiChat.responseReadyMessage"),
        duration: 7000,
        onPress: () => {
          router.push(`/ai-chat/${event.conversationId}` as Href);
        },
      });
    });
  }, [notify, router, t]);

  return null;
}
