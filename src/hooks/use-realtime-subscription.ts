"use client";

import { useEffect, useRef, useState } from "react";

import { createClient } from "@/lib/supabase/client";

interface UseRealtimeBroadcastOptions<T> {
  channelName: string;
  eventName: string;
  onMessage: (payload: T) => void;
  enabled?: boolean;
}

export function useRealtimeBroadcast<T>({
  channelName,
  eventName,
  onMessage,
  enabled = true,
}: UseRealtimeBroadcastOptions<T>) {
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef(onMessage);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof createClient>["channel"]
  > | null>(null);

  useEffect(() => {
    callbackRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!enabled) return;

    const supabase = createClient();
    const channel = supabase.channel(channelName);

    channel
      .on("broadcast", { event: eventName }, (payload) => {
        callbackRef.current(payload.payload as T);
      })
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelName, eventName, enabled]);

  const broadcast = async (payload: T) => {
    if (!channelRef.current || !isConnected) return;

    await channelRef.current.send({
      type: "broadcast",
      event: eventName,
      payload,
    });
  };

  return { isConnected, broadcast };
}
