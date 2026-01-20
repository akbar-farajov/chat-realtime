"use client";

import type { UserProfile } from "@/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/user-avatar";
import { useActiveList } from "@/hooks/use-active-list";

interface ChatHeaderProps {
  profile: UserProfile | null;
  isGroup?: boolean;
  groupName?: string | null;
  groupImage?: string | null;
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function ChatHeader({
  profile,
  isGroup,
  groupName,
  groupImage,
}: ChatHeaderProps) {
  const { members } = useActiveList();

  const displayName = isGroup
    ? (groupName ?? "Group")
    : (profile?.fullName ?? profile?.username ?? "Unknown");

  const isOnline = profile?.id ? members.includes(profile.id) : false;

  return (
    <header className="flex items-center gap-3 border-b px-4 py-3">
      {isGroup ? (
        <Avatar className="size-10">
          <AvatarImage src={groupImage ?? undefined} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      ) : (
        <UserAvatar
          userId={profile?.id}
          src={profile?.avatarUrl}
          name={displayName}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{displayName}</div>
        {!isGroup && (
          <div
            className={`text-xs ${isOnline ? "text-green-500" : "text-muted-foreground"}`}
          >
            {isOnline ? "Online" : "Offline"}
          </div>
        )}
      </div>
    </header>
  );
}
