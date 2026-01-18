"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useTransition } from "react";

import { sendMessage } from "@/actions/messages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatInputProps {
  conversationId?: string;
  targetUserId?: string;
  isNew?: boolean;
}

export function ChatInput({
  conversationId,
  targetUserId,
  isNew,
}: ChatInputProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const content = inputRef.current?.value.trim();
    if (!content) return;

    startTransition(async () => {
      const result = await sendMessage({
        conversationId: isNew ? undefined : conversationId,
        targetUserId: isNew ? targetUserId : undefined,
        content,
      });

      if (result.success && result.data) {
        if (inputRef.current) {
          inputRef.current.value = "";
        }

        if (isNew) {
          router.replace(`/conversations/${result.data.conversationId}`);
        }
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t px-4 py-3"
    >
      <Input
        ref={inputRef}
        placeholder="Type a message..."
        disabled={isPending}
        className="flex-1"
        autoComplete="off"
      />
      <Button
        type="submit"
        size="icon"
        disabled={isPending}
        aria-label="Send message"
      >
        <Send className="size-4" />
      </Button>
    </form>
  );
}
