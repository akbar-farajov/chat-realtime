"use client";

import { useEffect, useRef, useState } from "react";

import type { ConversationListItem } from "@/actions/conversations";
import { ConversationItem } from "@/components/sidebar/conversationI-item";
import { createClient } from "@/lib/supabase/client";

interface ConversationListClientProps {
  initialConversations: ConversationListItem[];
  userId: string;
  activeConversationId?: string;
}

export function ConversationListClient({
  initialConversations,
  userId,
  activeConversationId,
}: ConversationListClientProps) {
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations);
  const conversationIdsRef = useRef<string[]>([]);

  useEffect(() => {
    setConversations(initialConversations);
    conversationIdsRef.current = initialConversations.map((c) => c.id);
  }, [initialConversations]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`user:${userId}:conversations`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMessage = payload.new as {
            id: string;
            conversation_id: string;
            content: string | null;
            created_at: string | null;
          };

          if (!conversationIdsRef.current.includes(newMessage.conversation_id))
            return;

          setConversations((prev) => {
            const updated = prev.map((conv) => {
              if (conv.id === newMessage.conversation_id) {
                return {
                  ...conv,
                  lastMessage: newMessage.content,
                  lastMessageAt: newMessage.created_at,
                };
              }
              return conv;
            });

            return updated.sort((a, b) => {
              const dateA = a.lastMessageAt
                ? new Date(a.lastMessageAt).getTime()
                : 0;
              const dateB = b.lastMessageAt
                ? new Date(b.lastMessageAt).getTime()
                : 0;
              return dateB - dateA;
            });
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <ul className="flex flex-col">
        {conversations.map((conversation) => (
          <li key={conversation.id}>
            <ConversationItem
              data={conversation}
              selected={conversation.id === activeConversationId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
