"use client";

import { useCallback } from "react";

import { createClient } from "@/lib/supabase/client";

interface BroadcastToInboxParams<T> {
  userId: string;
  event: string;
  payload: T;
  channelName?: string;
}

export function useRealtimeInbox() {
  const broadcastToInbox = useCallback(
    async <T,>({
      userId,
      event,
      payload,
      channelName,
    }: BroadcastToInboxParams<T>) => {
      const supabase = createClient();
      const channel = supabase.channel(
        channelName ?? `user:${userId}:inbox`,
      );

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.send({
            type: "broadcast",
            event,
            payload,
          });
          setTimeout(() => supabase.removeChannel(channel), 1000);
        }
      });
    },
    [],
  );

  return { broadcastToInbox };
}
