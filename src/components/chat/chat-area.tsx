import { getMessages } from "@/actions/messages";
import type { UserProfile } from "@/actions/users";
import { ChatBody } from "./chat-body";
import { ChatHeader } from "./chat-header";
import { ChatInput } from "./chat-input";

interface ConversationData {
  id: string;
  is_group: boolean | null;
  name: string | null;
  group_image: string | null;
}

interface ChatAreaProps {
  conversationId?: string;
  conversation?: ConversationData;
  chatPartner?: UserProfile | null;
  currentUserId: string;
  isNew?: boolean;
  targetUserId?: string;
  targetProfile?: UserProfile;
}

export async function ChatArea({
  conversationId,
  conversation,
  chatPartner,
  currentUserId,
  isNew,
  targetUserId,
  targetProfile,
}: ChatAreaProps) {
  const messagesResult = conversationId
    ? await getMessages(conversationId)
    : null;
  const initialMessages = messagesResult?.data ?? [];

  const profile = isNew ? targetProfile : chatPartner;
  const isGroup = conversation?.is_group ?? false;

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        profile={profile ?? null}
        isGroup={isGroup}
        groupName={conversation?.name}
        groupImage={conversation?.group_image}
      />
      <ChatBody
        initialMessages={initialMessages}
        conversationId={conversationId}
        currentUserId={currentUserId}
      />
      <ChatInput
        conversationId={conversationId}
        targetUserId={targetUserId}
        isNew={isNew}
      />
    </div>
  );
}
