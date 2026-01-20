"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useActiveList } from "@/hooks/use-active-list";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  userId?: string | null;
  src?: string | null;
  name: string;
  className?: string;
  showStatus?: boolean;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserAvatar({
  userId,
  src,
  name,
  className,
  showStatus = true,
}: UserAvatarProps) {
  const { members } = useActiveList();
  const isOnline = userId ? members.includes(userId) : false;

  return (
    <div className="relative">
      <Avatar className={cn("size-10", className)}>
        <AvatarImage src={src ?? undefined} alt={name} />
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      </Avatar>
      {showStatus && isOnline && (
        <span className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-background bg-green-500" />
      )}
    </div>
  );
}
