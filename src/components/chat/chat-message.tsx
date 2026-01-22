import { Check, CheckCheck } from "lucide-react";
import Image from "next/image";

import type { Message } from "@/actions/messages";
import { ImageModal } from "@/components/chat/image-modal";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  isPartnerOnline: boolean;
  showStatus: boolean;
}

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

function StatusIcon({
  status,
  isPartnerOnline,
}: {
  status: Message["status"];
  isPartnerOnline: boolean;
}) {
  if (status === "read") {
    return <CheckCheck className="size-5 text-blue-300" />;
  }

  if (isPartnerOnline) {
    return <CheckCheck className="size-5 text-primary-foreground/60" />;
  }

  return <Check className="size-5 text-primary-foreground/60" />;
}

function MessageTime({
  time,
  isOwn,
  showStatus,
  status,
  isPartnerOnline,
}: {
  time: string;
  isOwn: boolean;
  showStatus: boolean;
  status: Message["status"];
  isPartnerOnline: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs",
        isOwn ? "text-white" : "text-muted",
      )}
    >
      {time}
      {isOwn && showStatus && (
        <StatusIcon status={status} isPartnerOnline={isPartnerOnline} />
      )}
    </span>
  );
}

function ImageMessage({
  message,
  isOwn,
  time,
  showStatus,
  isPartnerOnline,
}: {
  message: Message;
  isOwn: boolean;
  time: string;
  showStatus: boolean;
  isPartnerOnline: boolean;
}) {
  if (!message.fileUrl) return null;

  return (
    <ImageModal src={message.fileUrl}>
      <button type="button" className="block text-left relative">
        <Image
          src={message.fileUrl}
          alt="Attachment"
          width={200}
          height={200}
          unoptimized
          className="h-auto max-w-full rounded-t-lg object-cover"
        />
        {message.content && (
          <p className="whitespace-pre-wrap px-3 py-2 text-sm text-wrap-break-word">
            {message.content}
          </p>
        )}
        <div className="absolute bottom-0 right-0 z-10">
          <MessageTime
            time={time}
            isOwn={isOwn}
            showStatus={showStatus}
            status={message.status}
            isPartnerOnline={isPartnerOnline}
          />
        </div>
      </button>
    </ImageModal>
  );
}

function TextMessage({
  message,
  isOwn,
  time,
  showStatus,
  isPartnerOnline,
}: {
  message: Message;
  isOwn: boolean;
  time: string;
  showStatus: boolean;
  isPartnerOnline: boolean;
}) {
  return (
    <div className="px-3 pt-1 flex gap-1">
      <p className="whitespace-pre-wrap text-sm text-wrap-break-word font-medium">
        {message.content}
      </p>
      <div className="text-right pt-1">
        <MessageTime
          time={time}
          isOwn={isOwn}
          showStatus={showStatus}
          status={message.status}
          isPartnerOnline={isPartnerOnline}
        />
      </div>
    </div>
  );
}

export function ChatMessage({
  message,
  isOwn,
  showStatus,
  isPartnerOnline,
}: ChatMessageProps) {
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
            ? "rounded-br-sm bg-muted"
            : "rounded-bl-sm bg-primary text-primary-foreground",
        )}
      >
        {isImage ? (
          <ImageMessage
            message={message}
            isOwn={isOwn}
            time={time}
            showStatus={showStatus}
            isPartnerOnline={isPartnerOnline}
          />
        ) : (
          <TextMessage
            message={message}
            isOwn={isOwn}
            time={time}
            showStatus={showStatus}
            isPartnerOnline={isPartnerOnline}
          />
        )}
      </div>
    </div>
  );
}
