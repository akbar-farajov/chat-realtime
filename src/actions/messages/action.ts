"use server";

import { revalidatePath } from "next/cache";

import {
  createConversation,
  getDirectConversation,
} from "@/actions/conversations";
import { createClient } from "@/lib/supabase/server";
import type { Message, SendMessageParams, SendMessageResult } from "./types";

export async function getMessages(conversationId: string): Promise<Message[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    return [];
  }

  return (data ?? []).map((msg) => ({
    id: msg.id,
    conversationId: msg.conversation_id,
    senderId: msg.sender_id,
    content: msg.content,
    type: msg.type,
    fileUrl: msg.file_url,
    createdAt: msg.created_at,
    isEdited: msg.is_edited,
  }));
}

export async function sendMessage({
  conversationId,
  targetUserId,
  content,
  type = "text",
}: SendMessageParams): Promise<SendMessageResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    return { success: false, error: "Message cannot be empty" };
  }

  let finalConversationId = conversationId;

  if (!conversationId || conversationId === "new") {
    if (!targetUserId) {
      return {
        success: false,
        error: "Target user is required for new conversation",
      };
    }

    if (targetUserId === user.id) {
      return { success: false, error: "Cannot message yourself" };
    }

    const existingId = await getDirectConversation(user.id, targetUserId);

    if (existingId) {
      finalConversationId = existingId;
    } else {
      const result = await createConversation({
        memberIds: [user.id, targetUserId],
        creatorId: user.id,
      });

      if ("error" in result) {
        return { success: false, error: result.error };
      }

      finalConversationId = result.id;
    }
  }

  if (!finalConversationId) {
    return { success: false, error: "Failed to determine conversation" };
  }

  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id: finalConversationId,
      sender_id: user.id,
      content: trimmedContent,
      type,
    })
    .select("id")
    .single();

  if (messageError) {
    return { success: false, error: messageError.message };
  }

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", finalConversationId);

  revalidatePath("/");
  revalidatePath(`/conversations/${finalConversationId}`);

  return {
    success: true,
    conversationId: finalConversationId,
    messageId: message.id,
  };
}
