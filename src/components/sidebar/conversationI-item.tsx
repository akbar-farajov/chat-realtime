import Link from "next/link";

import type { ConversationListItem } from "@/actions/conversations";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type ConversationItemProps = {
  data: ConversationListItem;
  selected?: boolean;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function ConversationItem({
  data,
  selected = false,
}: ConversationItemProps) {
  const lastMessageText = data.lastMessage ?? "No messages yet";
  const lastMessageDate = data.lastMessageAt
    ? new Date(data.lastMessageAt)
    : null;
  const timeLabel =
    lastMessageDate && !Number.isNaN(lastMessageDate.getTime())
      ? timeFormatter.format(lastMessageDate)
      : "";

  return (
    <Link
      href={`/conversations/${data.id}`}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "flex gap-3 px-4 py-3 transition-colors",
        selected ? "bg-zinc-200" : "hover:bg-zinc-100",
      )}
    >
      <Avatar className="size-12">
        <AvatarImage src={data.avatarUrl ?? undefined} alt={data.name} />
        <AvatarFallback>{getInitials(data.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium text-zinc-900">
            {data.name}
          </div>
          <div className="text-xs text-zinc-500">{timeLabel}</div>
        </div>
        <div className="truncate text-sm text-zinc-500">{lastMessageText}</div>
      </div>
    </Link>
  );
}
