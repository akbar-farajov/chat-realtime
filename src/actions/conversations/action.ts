"use server";

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

export async function getDirectConversation(
  userId: string,
  otherUserId: string,
): Promise<string | null> {
  const supabase = await createClient();

  const { data: userConversations } = await supabase
    .from("conversation_members")
    .select("conversation_id")
    .eq("user_id", userId);

  const conversationIds = (userConversations ?? []).map(
    (row) => row.conversation_id,
  );

  if (conversationIds.length === 0) return null;

  const { data } = await supabase
    .from("conversations")
    .select("id, conversation_members!inner(user_id)")
    .in("id", conversationIds)
    .eq("is_group", false)
    .eq("conversation_members.user_id", otherUserId)
    .maybeSingle();

  return data?.id ?? null;
}

interface CreateConversationParams {
  memberIds: string[];
  isGroup?: boolean;
  name?: string;
}

export async function createConversation({
  memberIds,
  isGroup = false,
  name,
  creatorId,
}: CreateConversationParams & { creatorId: string }): Promise<
  { id: string } | { error: string }
> {
  const supabase = await createClient();

  const conversationId = crypto.randomUUID();

  const { error: conversationError } = await supabase
    .from("conversations")
    .insert({ id: conversationId, is_group: isGroup, name });

  if (conversationError) {
    return { error: conversationError.message };
  }

  const { error: creatorError } = await supabase
    .from("conversation_members")
    .insert({ conversation_id: conversationId, user_id: creatorId });

  if (creatorError) {
    await supabase.from("conversations").delete().eq("id", conversationId);
    return { error: creatorError.message };
  }

  const otherMembers = memberIds
    .filter((id) => id !== creatorId)
    .map((userId) => ({ conversation_id: conversationId, user_id: userId }));

  if (otherMembers.length > 0) {
    const { error: membersError } = await supabase
      .from("conversation_members")
      .insert(otherMembers);

    if (membersError) {
      await supabase.from("conversations").delete().eq("id", conversationId);
      return { error: membersError.message };
    }
  }

  return { id: conversationId };
}

export async function getExistingConversationId(
  otherUserId: string,
): Promise<{ id: string | null } | { error: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };
  if (user.id === otherUserId) {
    return { error: "Cannot start a conversation with yourself" };
  }

  const existingId = await getDirectConversation(user.id, otherUserId);
  return { id: existingId };
}
