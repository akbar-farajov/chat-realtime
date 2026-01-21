"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

interface UseRealtimePresenceOptions {
  userId: string;
  onSync: (userIds: string[]) => void;
  enabled?: boolean;
  channelName?: string;
}

export function useRealtimePresence({
  userId,
  onSync,
  enabled = true,
  channelName = "global_presence",
}: UseRealtimePresenceOptions) {
  useEffect(() => {
    if (!enabled || !userId) return;

    const supabase = createClient();
    const channel = supabase.channel(channelName, {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        onSync(Object.keys(state));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          channel.track({ user_id: userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelName, enabled, onSync, userId]);
}
