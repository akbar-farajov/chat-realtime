import { getConversations } from "@/actions/conversations";
import { ConversationItem } from "@/components/sidebar/conversationI-item";

type ConversationListProps = {
  userId: string;
  activeConversationId?: string;
};

export async function ConversationList({
  userId,
  activeConversationId,
}: ConversationListProps) {
  const result = await getConversations(userId);
  const conversations = result.data ?? [];

  if (conversations.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-sm">
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
