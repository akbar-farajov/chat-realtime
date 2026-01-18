"use client";

import { useEffect, useRef } from "react";

import type { Message } from "@/actions/messages";
import { cn } from "@/lib/utils";

interface ChatBodyProps {
  messages: Message[];
  currentUserId: string;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

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
          isOwn ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">
          {message.content}
        </p>
        <div
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {time}
        </div>
      </div>
    </div>
  );
}

export function ChatBody({ messages, currentUserId }: ChatBodyProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          No messages yet. Start the conversation!
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex flex-col gap-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
