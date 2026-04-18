import { useAuthStore } from "@/store/useAuth";
import type {
  ChatReadEventPayload,
  ChatSocketMessagePayload,
} from "@/types/chat";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface UseChatSocketOptions {
  onMessage?: (payload: ChatSocketMessagePayload) => void;
  onRead?: (payload: ChatReadEventPayload) => void;
  onError?: (error: { message: string }) => void;
  onConnectError?: (error: Error) => void;
}

export function useChatSocket(options?: UseChatSocketOptions) {
  const auth = useAuthStore();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const tokenRef = useRef<string | undefined>(undefined);
  const isInitializedRef = useRef(false);
  const currentConversationRef = useRef<string | null>(null);

  const onMessageRef = useRef(options?.onMessage);
  const onReadRef = useRef(options?.onRead);
  const onErrorRef = useRef(options?.onError);
  const onConnectErrorRef = useRef(options?.onConnectError);

  useEffect(() => {
    onMessageRef.current = options?.onMessage;
    onReadRef.current = options?.onRead;
    onErrorRef.current = options?.onError;
    onConnectErrorRef.current = options?.onConnectError;
  }, [
    options?.onMessage,
    options?.onRead,
    options?.onError,
    options?.onConnectError,
  ]);

  const socketConfig = useMemo(() => {
    return {
      origin: "https://warehouse-api-mpxj.onrender.com",
      path: "/socket.io",
      namespace: "/chat",
    };
  }, []);

  useEffect(() => {
    const token = auth.user?.accessToken.token;

    if (!token || !socketConfig) {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    if (socketRef.current && tokenRef.current !== token) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }

    if (socketRef.current && tokenRef.current === token) {
      return;
    }

    if (isInitializedRef.current && tokenRef.current === token) {
      return;
    }

    isInitializedRef.current = true;
    tokenRef.current = token;

    const socket = io(`${socketConfig.origin}${socketConfig.namespace}`, {
      auth: { token },
      path: socketConfig.path,
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      if (currentConversationRef.current) {
        socket.emit("conversation.join", {
          conversationId: currentConversationRef.current,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      if (reason === "io server disconnect") {
        console.warn(
          "Socket disconnected by server, might need to re-authenticate",
        );
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      onConnectErrorRef.current?.(error);
    });

    socket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
      onErrorRef.current?.(error);
    });

    socket.on("message.receive", (payload: ChatSocketMessagePayload) => {
      onMessageRef.current?.(payload);
    });

    socket.on("message.read", (payload: ChatReadEventPayload) => {
      onReadRef.current?.(payload);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
      tokenRef.current = undefined;
      isInitializedRef.current = false;
      setIsConnected(false);
    };
  }, [auth.user?.accessToken.token, socketConfig]);

  const emitRead = useCallback((conversationId: string) => {
    socketRef.current?.emit("message.read", { conversationId });
  }, []);

  const emitJoin = useCallback((conversationId: string) => {
    currentConversationRef.current = conversationId;
    socketRef.current?.emit("conversation.join", { conversationId });
  }, []);

  const emitSend = useCallback((conversationId: string, content: string) => {
    socketRef.current?.emit("message.send", { conversationId, content });
  }, []);

  const reconnect = useCallback(() => {
    if (socketRef.current && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, []);

  return {
    socketRef,
    isConnected,
    emitRead,
    emitJoin,
    emitSend,
    reconnect,
  };
}
