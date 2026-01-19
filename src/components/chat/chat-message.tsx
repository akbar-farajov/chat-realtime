import Image from "next/image";

import type { Message } from "@/actions/messages";
import { ImageModal } from "@/components/chat/image-modal";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function MessageTime({ time, isOwn }: { time: string; isOwn: boolean }) {
  return (
    <span
      className={cn(
        "text-[10px]",
        isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
      )}
    >
      {time}
    </span>
  );
}

function ImageMessage({
  message,
  isOwn,
  time,
}: {
  message: Message;
  isOwn: boolean;
  time: string;
}) {
  if (!message.fileUrl) return null;

  return (
    <ImageModal src={message.fileUrl}>
      <button type="button" className="block text-left">
        <Image
          src={message.fileUrl}
          alt="Attachment"
          width={300}
          height={200}
          unoptimized
          className="h-auto max-w-full rounded-t-lg object-cover"
        />
        {message.content && (
          <p className="whitespace-pre-wrap px-3 py-2 text-sm text-wrap-break-word">
            {message.content}
          </p>
        )}
        <div className="px-3 pb-2 text-right">
          <MessageTime time={time} isOwn={isOwn} />
        </div>
      </button>
    </ImageModal>
  );
}

function TextMessage({
  message,
  isOwn,
  time,
}: {
  message: Message;
  isOwn: boolean;
  time: string;
}) {
  return (
    <div className="px-3 py-2">
      <p className="whitespace-pre-wrap text-sm text-wrap-break-word">
        {message.content}
      </p>
      <div className="mt-1 text-right">
        <MessageTime time={time} isOwn={isOwn} />
      </div>
    </div>
  );
}

export function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const time = message.createdAt
    ? timeFormatter.format(new Date(message.createdAt))
    : "";

  const isImage = message.type === "image" && message.fileUrl;

  return (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[70%] overflow-hidden rounded-lg",
          isOwn
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-bl-sm bg-muted",
        )}
      >
        {isImage ? (
          <ImageMessage message={message} isOwn={isOwn} time={time} />
        ) : (
          <TextMessage message={message} isOwn={isOwn} time={time} />
        )}
      </div>
    </div>
  );
}
