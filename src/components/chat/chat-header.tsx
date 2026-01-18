import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserProfile } from "@/actions/users";

interface ChatHeaderProps {
  profile: UserProfile | null;
  isGroup?: boolean;
  groupName?: string | null;
  groupImage?: string | null;
}

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function ChatHeader({
  profile,
  isGroup,
  groupName,
  groupImage,
}: ChatHeaderProps) {
  const displayName = isGroup
    ? groupName ?? "Group"
    : profile?.fullName ?? profile?.username ?? "Unknown";

  const avatarUrl = isGroup ? groupImage : profile?.avatarUrl;
  const status = !isGroup ? profile?.status : null;

  return (
    <header className="flex items-center gap-3 border-b px-4 py-3">
      <Avatar className="size-10">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{displayName}</div>
        {status && (
          <div className="text-xs text-muted-foreground capitalize">
            {status}
          </div>
        )}
      </div>
    </header>
  );
}
