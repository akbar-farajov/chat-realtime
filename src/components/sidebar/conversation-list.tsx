import { getConversations } from "@/actions/conversations";
import { ConversationListClient } from "@/components/sidebar/conversation-list-client";

interface ConversationListProps {
  userId: string;
  activeConversationId?: string;
}

export async function ConversationList({
  userId,
  activeConversationId,
}: ConversationListProps) {
  const result = await getConversations(userId);
  const conversations = result.data ?? [];

  return (
    <ConversationListClient
      initialConversations={conversations}
      userId={userId}
      activeConversationId={activeConversationId}
    />
  );
}
