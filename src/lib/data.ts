import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

export type ConversationListItem = {
  id: Database["public"]["Tables"]["conversations"]["Row"]["id"];
  name: string;
  avatarUrl: string | null;
  lastMessage: Database["public"]["Tables"]["messages"]["Row"]["content"];
  lastMessageAt:
    | Database["public"]["Tables"]["messages"]["Row"]["created_at"]
    | Database["public"]["Tables"]["conversations"]["Row"]["last_message_at"];
  isGroup: Database["public"]["Tables"]["conversations"]["Row"]["is_group"];
};

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationMemberRow =
  Database["public"]["Tables"]["conversation_members"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

type ConversationQueryRow = Pick<
  ConversationRow,
  "id" | "is_group" | "name" | "group_image" | "last_message_at"
> & {
  conversation_members: Array<
    Pick<ConversationMemberRow, "user_id"> & {
      profiles: Pick<
        ProfileRow,
        "id" | "username" | "full_name" | "avatar_url"
      > | null;
    }
  >;
  messages: Array<Pick<MessageRow, "content" | "created_at">>;
};

export async function getConversations(
  userId: string,
): Promise<ConversationListItem[]> {
  const supabase = await createClient();

  const { data: memberRows, error: memberError } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);

  if (memberError) {
    return [];
  }

  const conversationIds = (memberRows ?? [])
    .map((row) => row.conversation_id)
    .filter((id): id is string => Boolean(id));

  if (conversationIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
        id,
        is_group,
        name,
        group_image,
        last_message_at,
        conversation_members (
          user_id,
          profiles (
            id,
            username,
            full_name,
            avatar_url
          )
        ),
        messages (
          content,
          created_at
        )
      `,
    )
    .in("id", conversationIds)
    .order("last_message_at", { ascending: false })
    .order("created_at", { referencedTable: "messages", ascending: false })
    .limit(1, { referencedTable: "messages" });

  if (error) {
    return [];
  }

  const conversations = (data ?? []) as unknown as ConversationQueryRow[];

  return conversations.map((conversation) => {
    const isGroup = Boolean(conversation.is_group);
    const members = conversation.conversation_members ?? [];
    const otherMember =
      members.find((member) => member.user_id !== userId)?.profiles ?? null;

    const name = isGroup
      ? (conversation.name ?? "Unnamed group")
      : (otherMember?.username ?? otherMember?.full_name ?? "Unknown user");
    const avatarUrl = isGroup
      ? (conversation.group_image ?? null)
      : (otherMember?.avatar_url ?? null);
    const lastMessage = conversation.messages?.[0]?.content ?? null;
    const lastMessageAt =
      conversation.messages?.[0]?.created_at ??
      conversation.last_message_at ??
      null;

    return {
      id: conversation.id,
      name,
      avatarUrl,
      lastMessage,
      lastMessageAt,
      isGroup,
    };
  });
}
