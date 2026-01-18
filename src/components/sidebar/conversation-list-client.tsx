"use client";

import type { ConversationListItem } from "@/actions/conversations";
import { ConversationItem } from "@/components/sidebar/conversationI-item";
import { useRealtimeConversations } from "@/hooks/use-realtime-conversations";

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
  const { conversations } = useRealtimeConversations(
    userId,
    initialConversations,
  );

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
