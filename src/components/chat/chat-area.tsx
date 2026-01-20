import { Suspense } from "react";

import { getMessages } from "@/actions/messages";
import type { UserProfile } from "@/actions/users";
import { ChatClient } from "./chat-client";
import { ChatHeader } from "./chat-header";
import { ChatInputSkeleton, ChatMessagesSkeleton } from "./chat-skeleton";

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

async function ChatMessages({
  conversationId,
  currentUserId,
  targetUserId,
  isNew,
}: {
  conversationId?: string;
  currentUserId: string;
  targetUserId?: string;
  isNew?: boolean;
}) {
  const messagesResult = conversationId
    ? await getMessages(conversationId)
    : null;
  const initialMessages = messagesResult?.data ?? [];

  return (
    <ChatClient
      initialMessages={initialMessages}
      conversationId={conversationId}
      currentUserId={currentUserId}
      targetUserId={targetUserId}
      isNew={isNew}
    />
  );
}

function ChatMessagesFallback() {
  return (
    <>
      <ChatMessagesSkeleton />
      <ChatInputSkeleton />
    </>
  );
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
      <Suspense fallback={<ChatMessagesFallback />}>
        <ChatMessages
          conversationId={conversationId}
          currentUserId={currentUserId}
          targetUserId={targetUserId}
          isNew={isNew}
        />
      </Suspense>
    </div>
  );
}
