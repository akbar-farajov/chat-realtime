"use client";

import type { RefObject } from "react";

import type { Message } from "@/actions/messages";
import { ChatMessage } from "@/components/chat/chat-message";

interface ChatMessageListProps {
  messages: Message[];
  currentUserId: string;
  containerRef: RefObject<HTMLDivElement | null>;
}

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

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted-foreground">
        No messages yet. Start the conversation!
      </p>
    </div>
  );
}

export function ChatMessageList({
  messages,
  currentUserId,
  containerRef,
}: ChatMessageListProps) {
  if (messages.length === 0) {
    return <EmptyState />;
  }

  let lastDate = "";

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto py-4 px-12">
      <div className="flex flex-col gap-2">
        {messages.map((message) => {
          const messageDate = getDateLabel(message.createdAt);
          const showDate = messageDate !== lastDate;
          lastDate = messageDate;

          return (
            <div key={message.id}>
              {showDate && messageDate && <DateSeparator date={messageDate} />}
              <ChatMessage
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
