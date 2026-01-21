"use client";

import { useEffect } from "react";

import type { Message, MessageStatus } from "@/actions/messages";
import { useRealtimeBroadcast } from "@/hooks/use-realtime-subscription";
import { createClient } from "@/lib/supabase/client";

interface UseRealtimeMessagesOptions {
  conversationId?: string;
  onMessage: (message: Message) => void;
  onStatusUpdate: (messageId: string, status: MessageStatus) => void;
  enabled?: boolean;
}

export function useRealtimeMessages({
  conversationId,
  onMessage,
  onStatusUpdate,
  enabled = true,
}: UseRealtimeMessagesOptions) {
  const isEnabled = enabled && Boolean(conversationId);

  const { broadcast: broadcastMessage } = useRealtimeBroadcast<Message>({
    channelName: `conversation:${conversationId}`,
    eventName: "new-message",
    onMessage,
    enabled: isEnabled,
  });

  useEffect(() => {
    if (!isEnabled || !conversationId) return;

    const supabase = createClient();
    const channel = supabase.channel(`conversation:${conversationId}:updates`);

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as {
            id?: string;
            status?: string | null;
          };

          if (!updated?.id) return;

          const status: MessageStatus =
            updated.status === "read" ? "read" : "sent";
          onStatusUpdate(updated.id, status);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, isEnabled, onStatusUpdate]);

  return { broadcastMessage };
}
