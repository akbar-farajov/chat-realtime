"use client";

import { useEffect } from "react";

import { useActiveList } from "@/hooks/use-active-list";
import { createClient } from "@/lib/supabase/client";

interface ActiveStatusProps {
  userId: string;
}

export function ActiveStatus({ userId }: ActiveStatusProps) {
  const { set } = useActiveList();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("global_presence", {
      config: { presence: { key: userId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ user_id: string }>();
        const userIds = Object.keys(state);
        set(userIds);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, set]);

  return null;
}
