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
  month: "long",
  day: "numeric",
  year: "numeric",
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
      <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
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

function groupMessagesByDate(messages: Message[]) {
  const groups: { dateLabel: string; messages: Message[] }[] = [];

  for (const message of messages) {
    const dateLabel = getDateLabel(message.createdAt);
    const lastGroup = groups[groups.length - 1];

    if (!lastGroup || lastGroup.dateLabel !== dateLabel) {
      groups.push({ dateLabel, messages: [message] });
      continue;
    }

    lastGroup.messages.push(message);
  }

  return groups;
}

export function ChatMessageList({
  messages,
  currentUserId,
  containerRef,
}: ChatMessageListProps) {
  if (messages.length === 0) {
    return <EmptyState />;
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <div
      ref={containerRef}
      className="chat-doodle flex-1 overflow-y-auto px-4 py-4 md:px-12"
    >
      <div className="flex flex-col gap-2">
        {groupedMessages.map((group) => (
          <div key={group.dateLabel || group.messages[0]?.id}>
            {group.dateLabel && <DateSeparator date={group.dateLabel} />}
            <div className="flex flex-col gap-2">
              {group.messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === currentUserId}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
