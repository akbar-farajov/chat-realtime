"use client";

import { useEffect, useState } from "react";

import type { Message } from "@/actions/messages";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ChatBodyProps {
  initialMessages: Message[];
  conversationId?: string;
  currentUserId: string;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});

function getDateLabel(dateStr: string | null): string {
  if (!dateStr) return "";

  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return dateFormatter.format(date);
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center justify-center py-2">
      <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
        {date}
      </span>
    </div>
  );
}

function MessageBubble({
  message,
  isOwn,
}: {
  message: Message;
  isOwn: boolean;
}) {
  const time = message.createdAt
    ? timeFormatter.format(new Date(message.createdAt))
    : "";

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] rounded-lg px-3 py-2",
          isOwn
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted",
        )}
      >
        <p className="whitespace-pre-wrap text-sm text-wrap-break-word">
          {message.content}
        </p>
        <div
          className={cn(
            "mt-1 text-right text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

export function ChatBody({
  initialMessages,
  conversationId,
  currentUserId,
}: ChatBodyProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const { containerRef } = useChatScroll(messages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupSubscription = async () => {
      channel = supabase
        .channel(`conversation:${conversationId}:messages`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as {
              id: string;
              conversation_id: string;
              sender_id: string;
              content: string | null;
              type: string | null;
              file_url: string | null;
              created_at: string | null;
              is_edited: boolean | null;
            };

            const message: Message = {
              id: newMessage.id,
              conversationId: newMessage.conversation_id,
              senderId: newMessage.sender_id,
              content: newMessage.content,
              type: newMessage.type,
              fileUrl: newMessage.file_url,
              createdAt: newMessage.created_at,
              isEdited: newMessage.is_edited,
            };

            setMessages((prev) => {
              if (prev.some((m) => m.id === message.id)) return prev;
              return [...prev, message];
            });
          },
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [conversationId]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  let lastDate = "";

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        {messages.map((message) => {
          const messageDate = getDateLabel(message.createdAt);
          const showDate = messageDate !== lastDate;
          lastDate = messageDate;

          return (
            <div key={message.id}>
              {showDate && messageDate && <DateSeparator date={messageDate} />}
              <MessageBubble
                message={message}
                isOwn={message.senderId === currentUserId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
