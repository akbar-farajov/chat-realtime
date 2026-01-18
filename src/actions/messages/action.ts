"use server";

import { revalidatePath } from "next/cache";

import {
  createConversation,
  getDirectConversation,
} from "@/actions/conversations";
import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import type { Message, SendMessageParams, SendMessageResult } from "./types";

export const getMessages = createSafeAction(
  async (conversationId: string): Promise<Message[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

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
  },
);

export const sendMessage = createSafeAction(
  async ({
    conversationId,
    targetUserId,
    content,
    type = "text",
  }: SendMessageParams): Promise<SendMessageResult> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const trimmedContent = content.trim();
    if (!trimmedContent) throw new Error("Message cannot be empty");

    let finalConversationId = conversationId;

    if (!conversationId || conversationId === "new") {
      if (!targetUserId) {
        throw new Error("Target user is required for new conversation");
      }

      if (targetUserId === user.id) {
        throw new Error("Cannot message yourself");
      }

      const existingId = await getDirectConversation(user.id, targetUserId);

      if (existingId) {
        finalConversationId = existingId;
      } else {
        const result = await createConversation({
          memberIds: [user.id, targetUserId],
          creatorId: user.id,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error ?? "Failed to create conversation");
        }

        finalConversationId = result.data.id;
      }
    }

    if (!finalConversationId) {
      throw new Error("Failed to determine conversation");
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

    if (messageError) throw new Error(messageError.message);

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", finalConversationId);

    revalidatePath("/");
    revalidatePath(`/conversations/${finalConversationId}`);

    return {
      conversationId: finalConversationId,
      messageId: message.id,
    };
  },
);
