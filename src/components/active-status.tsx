"use client";

import { useActiveList } from "@/hooks/use-active-list";
import { useRealtimePresence } from "@/hooks/use-realtime-presence";

interface ActiveStatusProps {
  userId: string;
}

export function ActiveStatus({ userId }: ActiveStatusProps) {
  const { set } = useActiveList();

  useRealtimePresence({
    userId,
    onSync: set,
    enabled: Boolean(userId),
  });

  return null;
}
