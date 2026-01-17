import type { ConversationListItem, ConversationQueryRow } from "./types";

function getOtherMember(
  members: ConversationQueryRow["conversation_members"],
  userId: string,
) {
  return members.find((member) => member.user_id !== userId)?.profiles ?? null;
}

function resolveConversationName(
  conversation: ConversationQueryRow,
  otherMember: ConversationQueryRow["conversation_members"][number]["profiles"],
  isGroup: boolean,
) {
  if (isGroup) {
    return conversation.name ?? "Unnamed group";
  }

  return otherMember?.username ?? otherMember?.full_name ?? "Unknown user";
}

function resolveConversationAvatar(
  conversation: ConversationQueryRow,
  otherMember: ConversationQueryRow["conversation_members"][number]["profiles"],
  isGroup: boolean,
) {
  if (isGroup) {
    return conversation.group_image ?? null;
  }

  return otherMember?.avatar_url ?? null;
}

function resolveLastMessage(conversation: ConversationQueryRow) {
  return conversation.messages?.[0]?.content ?? null;
}

function resolveLastMessageAt(conversation: ConversationQueryRow) {
  return (
    conversation.messages?.[0]?.created_at ??
    conversation.last_message_at ??
    null
  );
}

export function mapConversationRows(
  conversations: ConversationQueryRow[],
  userId: string,
): ConversationListItem[] {
  return conversations.map((conversation) => {
    const isGroup = Boolean(conversation.is_group);
    const members = conversation.conversation_members ?? [];
    const otherMember = getOtherMember(members, userId);

    return {
      id: conversation.id,
      name: resolveConversationName(conversation, otherMember, isGroup),
      avatarUrl: resolveConversationAvatar(conversation, otherMember, isGroup),
      lastMessage: resolveLastMessage(conversation),
      lastMessageAt: resolveLastMessageAt(conversation),
      isGroup,
    };
  });
}
