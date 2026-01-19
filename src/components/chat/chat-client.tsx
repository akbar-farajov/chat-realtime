"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

import type { Message } from "@/actions/messages";
import { sendMessage } from "@/actions/messages";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useRealtimeBroadcast } from "@/hooks/use-realtime-subscription";
import { createClient } from "@/lib/supabase/client";

interface ChatClientProps {
  initialMessages: Message[];
  conversationId?: string;
  currentUserId: string;
  targetUserId?: string;
  isNew?: boolean;
}

interface NewConversationEvent {
  conversationId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

async function notifyTargetUser(
  targetUserId: string,
  event: NewConversationEvent,
) {
  const supabase = createClient();
  const channel = supabase.channel(`user:${targetUserId}:inbox`);

  await channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.send({
        type: "broadcast",
        event: "new-conversation",
        payload: event,
      });
      setTimeout(() => supabase.removeChannel(channel), 1000);
    }
  });
}

export function ChatClient({
  initialMessages,
  conversationId,
  currentUserId,
  targetUserId,
  isNew,
}: ChatClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [currentConversationId, setCurrentConversationId] =
    useState(conversationId);
  const { containerRef } = useChatScroll(messages);

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

  const { broadcast } = useRealtimeBroadcast<Message>({
    channelName: `conversation:${currentConversationId}`,
    eventName: "new-message",
    onMessage: handleNewMessage,
    enabled: Boolean(currentConversationId),
  });

  const handleSendMessage = async (
    content: string,
    type: "text" | "image" = "text",
    fileUrl?: string,
  ) => {
    const createdAt = new Date().toISOString();

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversationId ?? "",
      senderId: currentUserId,
      content: content || null,
      type,
      fileUrl: fileUrl || null,
      createdAt,
      isEdited: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    startTransition(async () => {
      const result = await sendMessage({
        conversationId: isNew ? undefined : currentConversationId,
        targetUserId: isNew ? targetUserId : undefined,
        content,
        type,
        fileUrl,
      });

      if (result.success && result.data) {
        const finalConversationId = result.data.conversationId;
        const wasNewConversation =
          isNew && finalConversationId !== currentConversationId;

        const finalMessage: Message = {
          ...optimisticMessage,
          id: result.data.messageId,
          conversationId: finalConversationId,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? finalMessage : m)),
        );

        if (wasNewConversation) {
          setCurrentConversationId(finalConversationId);
          router.replace(`/conversations/${finalConversationId}`);

          if (targetUserId) {
            notifyTargetUser(targetUserId, {
              conversationId: finalConversationId,
              lastMessage: type === "image" ? "📷 Image" : content,
              lastMessageAt: createdAt,
            });
          }
        }

        broadcast(finalMessage);
      }
    });
  };

  return (
    <>
      <ChatMessageList
        messages={messages}
        currentUserId={currentUserId}
        containerRef={containerRef}
      />
      <ChatInput onSendMessage={handleSendMessage} disabled={isPending} />
    </>
  );
}
