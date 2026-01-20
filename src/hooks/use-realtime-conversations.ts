"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  type ConversationListItem,
  getConversationById,
} from "@/actions/conversations";
import { useRealtimeBroadcast } from "@/hooks/use-realtime-subscription";

interface NewConversationEvent {
  conversationId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
}

interface MessageUpdateEvent {
  conversationId: string;
  content: string | null;
  createdAt: string | null;
}

export function useRealtimeConversations(
  userId: string,
  initialConversations: ConversationListItem[],
): {
  conversations: ConversationListItem[];
  notifyNewConversation: (event: NewConversationEvent) => void;
  notifyMessageUpdate: (event: MessageUpdateEvent) => void;
} {
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations);
  const conversationIdsRef = useRef<Set<string>>(new Set());
  const fetchingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setConversations(initialConversations);
    conversationIdsRef.current = new Set(initialConversations.map((c) => c.id));
  }, [initialConversations]);

  const handleNewConversation = useCallback(
    async (event: NewConversationEvent) => {
      const { conversationId, lastMessage, lastMessageAt } = event;

      if (conversationIdsRef.current.has(conversationId)) return;
      if (fetchingRef.current.has(conversationId)) return;

      fetchingRef.current.add(conversationId);

      const result = await getConversationById(conversationId);

      fetchingRef.current.delete(conversationId);

      if (!result.success || !result.data) return;

      const newConversation: ConversationListItem = {
        id: result.data.id,
        name: result.data.name,
        avatarUrl: result.data.avatarUrl,
        lastMessage: lastMessage ?? result.data.lastMessage,
        lastMessageAt: lastMessageAt ?? result.data.lastMessageAt,
        isGroup: result.data.isGroup,
        otherUserId: result.data.otherUserId,
      };

      conversationIdsRef.current.add(conversationId);

      setConversations((prev) => {
        if (prev.some((c) => c.id === conversationId)) return prev;
        return [newConversation, ...prev];
      });
    },
    [],
  );

  const handleMessageUpdate = useCallback((event: MessageUpdateEvent) => {
    const { conversationId, content, createdAt } = event;

    if (!conversationIdsRef.current.has(conversationId)) return;

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === conversationId) {
          return {
            ...conv,
            lastMessage: content,
            lastMessageAt: createdAt,
          };
        }
        return conv;
      });

      return updated.sort((a, b) => {
        const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return dateB - dateA;
      });
    });
  }, []);

  const { broadcast: broadcastNewConversation } =
    useRealtimeBroadcast<NewConversationEvent>({
      channelName: `user:${userId}:inbox`,
      eventName: "new-conversation",
      onMessage: handleNewConversation,
      enabled: Boolean(userId),
    });

  const { broadcast: broadcastMessageUpdate } =
    useRealtimeBroadcast<MessageUpdateEvent>({
      channelName: `user:${userId}:inbox`,
      eventName: "message-update",
      onMessage: handleMessageUpdate,
      enabled: Boolean(userId),
    });

  return {
    conversations,
    notifyNewConversation: broadcastNewConversation,
    notifyMessageUpdate: broadcastMessageUpdate,
  };
}
