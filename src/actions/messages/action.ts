"use server";

import { revalidatePath } from "next/cache";

import {
  createConversation,
  getDirectConversation,
} from "@/actions/conversations";
import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import type {
  MarkMessagesReadResult,
  Message,
  SendMessageParams,
  SendMessageResult,
} from "./types";

export const getMessages = createSafeAction(
  async (conversationId: string): Promise<Message[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    const SIGNED_URL_TTL = 60 * 60;
    const rows = data ?? [];

    const messages = await Promise.all(
      rows.map(async (msg) => {
        let fileUrl: string | null = null;

        if (msg.file_url) {
          const { data: signedData } = await supabase.storage
            .from("attachments")
            .createSignedUrl(msg.file_url, SIGNED_URL_TTL);

          fileUrl = signedData?.signedUrl ?? null;
        }

        return {
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          content: msg.content,
          type: msg.type,
          fileUrl,
          createdAt: msg.created_at,
          isEdited: msg.is_edited,
          status: msg.status ?? "sent",
        };
      }),
    );

    return messages;
  },
);

export const sendMessage = createSafeAction(
  async ({
    conversationId,
    targetUserId,
    content,
    type = "text",
    filePath,
  }: SendMessageParams): Promise<SendMessageResult> => {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const trimmedContent = content.trim();
    if (!trimmedContent && !filePath) throw new Error("Message cannot be empty");

    let finalConversationId = conversationId;
    let createdConversation = false;

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
        createdConversation = true;
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
        content: trimmedContent || null,
        type,
        file_url: filePath || null,
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
      createdConversation,
    };
  },
);

export const markMessagesRead = createSafeAction(
  async (conversationId: string): Promise<MarkMessagesReadResult> => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc("mark_messages_read", {
      p_conversation_id: conversationId,
    });

    if (error) throw new Error(error.message);

    return { updatedCount: data ?? 0 };
  },
);
