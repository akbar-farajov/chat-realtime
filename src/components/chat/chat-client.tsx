"use client";

import { Paperclip, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, useTransition } from "react";

import type { Message } from "@/actions/messages";
import { sendMessage } from "@/actions/messages";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { useRealtimeBroadcast } from "@/hooks/use-realtime-subscription";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface ChatClientProps {
  initialMessages: Message[];
  conversationId?: string;
  currentUserId: string;
  targetUserId?: string;
  isNew?: boolean;
}

interface NewConversationEvent {
  conversationId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
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

async function notifyTargetUser(
  targetUserId: string,
  event: NewConversationEvent,
) {
  const supabase = createClient();
  const channel = supabase.channel(`user:${targetUserId}:inbox`);

  await channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      channel.send({
        type: "broadcast",
        event: "new-conversation",
        payload: event,
      });
      setTimeout(() => supabase.removeChannel(channel), 1000);
    }
  });
}

export function ChatClient({
  initialMessages,
  conversationId,
  currentUserId,
  targetUserId,
  isNew,
}: ChatClientProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [currentConversationId, setCurrentConversationId] =
    useState(conversationId);
  const { containerRef } = useChatScroll(messages);

  const canSend = inputValue.trim().length > 0 && !isPending;

  const handleNewMessage = useCallback(
    (message: Message) => {
      if (message.senderId === currentUserId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    },
    [currentUserId],
  );

  const { broadcast } = useRealtimeBroadcast<Message>({
    channelName: `conversation:${currentConversationId}`,
    eventName: "new-message",
    onMessage: handleNewMessage,
    enabled: Boolean(currentConversationId),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const content = inputValue.trim();
    if (!content) return;

    setInputValue("");

    const createdAt = new Date().toISOString();

    const optimisticMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: currentConversationId ?? "",
      senderId: currentUserId,
      content,
      type: "text",
      fileUrl: null,
      createdAt,
      isEdited: false,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    startTransition(async () => {
      const result = await sendMessage({
        conversationId: isNew ? undefined : currentConversationId,
        targetUserId: isNew ? targetUserId : undefined,
        content,
      });

      if (result.success && result.data) {
        const finalConversationId = result.data.conversationId;
        const wasNewConversation =
          isNew && finalConversationId !== currentConversationId;

        const finalMessage: Message = {
          ...optimisticMessage,
          id: result.data.messageId,
          conversationId: finalConversationId,
        };

        setMessages((prev) =>
          prev.map((m) => (m.id === optimisticMessage.id ? finalMessage : m)),
        );

        if (wasNewConversation) {
          setCurrentConversationId(finalConversationId);
          router.replace(`/conversations/${finalConversationId}`);

          if (targetUserId) {
            notifyTargetUser(targetUserId, {
              conversationId: finalConversationId,
              lastMessage: content,
              lastMessageAt: createdAt,
            });
          }
        }

        broadcast(finalMessage);
      }
    });
  };

  let lastDate = "";

  return (
    <>
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-2">
            {messages.map((message) => {
              const messageDate = getDateLabel(message.createdAt);
              const showDate = messageDate !== lastDate;
              lastDate = messageDate;

              return (
                <div key={message.id}>
                  {showDate && messageDate && (
                    <DateSeparator date={messageDate} />
                  )}
                  <MessageBubble
                    message={message}
                    isOwn={message.senderId === currentUserId}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="px-4 py-3">
        <div className="flex h-12 items-center gap-2 rounded-full bg-input px-1">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="size-5" />
          </button>
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            disabled={isPending}
            className="h-full flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="size-5" />
          </button>
        </div>
      </form>
    </>
  );
}
