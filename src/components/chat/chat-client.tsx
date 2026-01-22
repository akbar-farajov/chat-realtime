"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { ensureDirectConversation } from "@/actions/conversations";
import type { Message, MessageStatus } from "@/actions/messages";
import { markMessagesRead, sendMessage } from "@/actions/messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useRealtimeInbox } from "@/hooks/use-realtime-inbox";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";

interface ChatClientProps {
  initialMessages: Message[];
  conversationId?: string;
  currentUserId: string;
  targetUserId?: string;
  isNew?: boolean;
  partnerId?: string;
  isGroup?: boolean;
}

interface SendMessagePayload {
  content: string;
  type?: "text" | "image" | "video" | "audio";
  filePath?: string;
  fileUrl?: string;
  conversationId?: string;
}

export function ChatClient({
  initialMessages,
  conversationId,
  currentUserId,
  targetUserId,
  isNew,
  partnerId,
  isGroup,
}: ChatClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentConversationId, setCurrentConversationId] =
    useState(conversationId);
  const { containerRef } = useChatScroll(messages);
  const readInFlightRef = useRef(false);
  const createdConversationRef = useRef(false);
  const { broadcastToInbox } = useRealtimeInbox();

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (message.senderId === currentUserId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    [currentUserId],
  );

  const handleStatusUpdate = useCallback(
    (messageId: string, status: MessageStatus) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId ? { ...message, status } : message,
        ),
      );
    },
    [],
  );

  const { broadcastMessage } = useRealtimeMessages({
    conversationId: currentConversationId,
    onMessage: handleNewMessage,
    onStatusUpdate: handleStatusUpdate,
    enabled: Boolean(currentConversationId),
  });

  const ensureConversationId = useCallback(async () => {
    if (currentConversationId) return currentConversationId;
    if (!isNew || !targetUserId) return null;

    const result = await ensureDirectConversation(targetUserId);
    if (!result.success || !result.data) return null;

    createdConversationRef.current = result.data.isNew;
    setCurrentConversationId(result.data.id);
    router.replace(`/conversations/${result.data.id}`);
    return result.data.id;
  }, [currentConversationId, isNew, router, targetUserId]);

  useEffect(() => {
    if (!currentConversationId) return;
    if (isGroup) return;
    if (readInFlightRef.current) return;

    const unreadIds = messages
      .filter(
        (message) =>
          message.senderId !== currentUserId && message.status !== "read",
      )
      .map((message) => message.id);

    if (unreadIds.length === 0) return;

    readInFlightRef.current = true;

    markMessagesRead(currentConversationId)
      .then((result) => {
        if (!result.success) return;

        setMessages((prev) =>
          prev.map((message) =>
            unreadIds.includes(message.id)
              ? { ...message, status: "read" }
              : message,
          ),
        );
      })
      .finally(() => {
        readInFlightRef.current = false;
      });
  }, [messages, currentConversationId, currentUserId, isGroup]);

  const handleSendMessage = async ({
    content,
    type = "text",
    filePath,
    fileUrl,
    conversationId: conversationIdOverride,
  }: SendMessagePayload) => {
    if (conversationIdOverride && !currentConversationId) {
      setCurrentConversationId(conversationIdOverride);
    }

    const createdAt = new Date().toISOString();
    const resolvedConversationId =
      conversationIdOverride ?? currentConversationId ?? "";

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: resolvedConversationId,
      senderId: currentUserId,
      content: content || null,
      type,
      fileUrl: fileUrl ?? null,
      createdAt,
      isEdited: false,
      status: "sent",
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    startTransition(async () => {
      const shouldCreateConversation = isNew && !resolvedConversationId;
      const result = await sendMessage({
        conversationId: shouldCreateConversation
          ? undefined
          : resolvedConversationId,
        targetUserId: shouldCreateConversation ? targetUserId : undefined,
        content,
        type,
        filePath,
      });

      if (result.success && result.data) {
        const finalConversationId = result.data.conversationId;
        const shouldNavigate =
          isNew && finalConversationId !== currentConversationId;

        const finalMessage: Message = {
          ...optimisticMessage,
          id: result.data.messageId,
          conversationId: finalConversationId,
          status: "sent",
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? finalMessage : m)),
        );

        if (shouldNavigate) {
          setCurrentConversationId(finalConversationId);
          router.replace(`/conversations/${finalConversationId}`);
        }

        const shouldBroadcastNewConversation =
          createdConversationRef.current || result.data.createdConversation;

        if (shouldBroadcastNewConversation && targetUserId) {
          broadcastToInbox({
            userId: targetUserId,
            event: "new-conversation",
            payload: {
              conversationId: finalConversationId,
              lastMessage: type === "image" ? "📷 Image" : content,
              lastMessageAt: createdAt,
            },
          });
        }

        createdConversationRef.current = false;
        broadcastMessage(finalMessage);
      }
    });
  };

  return (
    <>
      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        containerRef={containerRef}
        partnerId={partnerId ?? targetUserId}
        showStatus={!isGroup}
      />
      <ChatInput
        onSendMessage={handleSendMessage}
        conversationId={currentConversationId}
        ensureConversationId={ensureConversationId}
        disabled={isPending}
      />
    </>
  );
}
