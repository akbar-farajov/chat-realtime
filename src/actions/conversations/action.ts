import { createClient } from "@/lib/supabase/server";
import { mapConversationRows } from "./helpers";
import type { ConversationListItem, ConversationQueryRow } from "./types";

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

  return mapConversationRows(conversations, userId);
}
