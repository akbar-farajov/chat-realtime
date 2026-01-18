import { LogOut, MessageSquarePlus } from "lucide-react";
import { logOut } from "@/actions/auth/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type SidebarHeaderProps = {
  userName: string;
  userAvatarUrl: string | null;
};

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

export function SidebarHeader({ userName, userAvatarUrl }: SidebarHeaderProps) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3">
      <Avatar className="size-10">
        <AvatarImage src={userAvatarUrl ?? undefined} alt={userName} />
        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon-sm" aria-label="New chat">
          <MessageSquarePlus className="size-4" />
        </Button>
        <form action={logOut}>
          <Button variant="ghost" size="icon-sm" aria-label="Settings">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
