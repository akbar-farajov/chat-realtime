"use client";

import { Loader2, MessageSquarePlus, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getExistingConversationId } from "@/actions/conversations";
import { searchUsers, type UserSearchResult } from "@/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";

const getInitials = (value: string) =>
  value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

function UserResultItem({
  user,
  onSelect,
  isLoading,
}: {
  user: UserSearchResult;
  onSelect: (userId: string) => void;
  isLoading: boolean;
}) {
  const displayName = user.fullName || user.username || "Unknown User";

  return (
    <button
      type="button"
      onClick={() => onSelect(user.id)}
      disabled={isLoading}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
    >
      <Avatar className="size-10">
        <AvatarImage src={user.avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{displayName}</div>
        {user.username && user.fullName && (
          <div className="truncate text-xs text-muted-foreground">
            @{user.username}
          </div>
        )}
      </div>
    </button>
  );
}

export function NewChatModal() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isPending, startTransition] = useTransition();

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setUsers([]);
      return;
    }

    setIsSearching(true);
    searchUsers(debouncedQuery)
      .then(setUsers)
      .finally(() => setIsSearching(false));
  }, [debouncedQuery]);

  const handleSelectUser = (userId: string) => {
    startTransition(async () => {
      const result = await getExistingConversationId(userId);

      if ("error" in result) {
        return;
      }

      setIsOpen(false);
      setQuery("");
      setUsers([]);

      if (result.id) {
        router.push(`/conversations/${result.id}`);
      } else {
        router.push(`/conversations/new?userId=${userId}`);
      }
    });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setQuery("");
      setUsers([]);
    }
  };

  const showEmptyState =
    debouncedQuery.length >= 2 && !isSearching && users.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="New chat">
          <MessageSquarePlus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>
          <div className="max-h-64 min-h-32 overflow-y-auto">
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            )}
            {!isSearching && users.length > 0 && (
              <div className="space-y-1">
                {users.map((user) => (
                  <UserResultItem
                    key={user.id}
                    user={user}
                    onSelect={handleSelectUser}
                    isLoading={isPending}
                  />
                ))}
              </div>
            )}
            {showEmptyState && (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                No users found
              </div>
            )}
            {!isSearching &&
              users.length === 0 &&
              debouncedQuery.length < 2 && (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
