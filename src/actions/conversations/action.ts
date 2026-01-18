"use server";

import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { mapConversationRows } from "./helpers";
import type { ConversationListItem, ConversationQueryRow } from "./types";

export const getConversations = createSafeAction(
  async (userId: string): Promise<ConversationListItem[]> => {
    const supabase = await createClient();

    const { data: memberRows, error: memberError } = await supabase
      .from("conversation_members")
      .select("conversation_id")
      .eq("user_id", userId);

    if (memberError) throw new Error(memberError.message);

    const conversationIds = (memberRows ?? [])
      .map((row) => row.conversation_id)
      .filter((id): id is string => Boolean(id));

    if (conversationIds.length === 0) return [];

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

    if (error) throw new Error(error.message);

    const conversations = (data ?? []) as unknown as ConversationQueryRow[];
    return mapConversationRows(conversations, userId);
  },
);

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
  creatorId: string;
}

export const createConversation = createSafeAction(
  async ({
    memberIds,
    isGroup = false,
    name,
    creatorId,
  }: CreateConversationParams): Promise<{ id: string }> => {
    const supabase = await createClient();

    const conversationId = crypto.randomUUID();

    const { error: conversationError } = await supabase
      .from("conversations")
      .insert({ id: conversationId, is_group: isGroup, name });

    if (conversationError) throw new Error(conversationError.message);

    const { error: creatorError } = await supabase
      .from("conversation_members")
      .insert({ conversation_id: conversationId, user_id: creatorId });

    if (creatorError) {
      await supabase.from("conversations").delete().eq("id", conversationId);
      throw new Error(creatorError.message);
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
        throw new Error(membersError.message);
      }
    }

    return { id: conversationId };
  },
);

export const getExistingConversationId = createSafeAction(
  async (otherUserId: string): Promise<string | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");
    if (user.id === otherUserId) {
      throw new Error("Cannot start a conversation with yourself");
    }

    return getDirectConversation(user.id, otherUserId);
  },
);

export const getConversationById = createSafeAction(
  async (conversationId: string): Promise<ConversationListItem | null> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

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
      .eq("id", conversationId)
      .order("created_at", { referencedTable: "messages", ascending: false })
      .limit(1, { referencedTable: "messages" })
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) return null;

    const conversations = mapConversationRows(
      [data] as unknown as ConversationQueryRow[],
      user.id,
    );

    return conversations[0] ?? null;
  },
);
