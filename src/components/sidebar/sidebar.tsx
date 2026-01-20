import { Suspense } from "react";

import { ConversationList } from "@/components/sidebar/conversation-list";
import { ConversationListSkeleton } from "@/components/sidebar/conversation-list-skeleton";
import { SearchInput } from "@/components/sidebar/search-input";
import { SidebarHeader } from "@/components/sidebar/sidebar-header";

type SidebarProps = {
  userId: string;
  userName: string;
  userAvatarUrl: string | null;
  activeConversationId?: string;
};

export function Sidebar({
  userId,
  userName,
  userAvatarUrl,
  activeConversationId,
}: SidebarProps) {
  return (
    <div className="flex h-full flex-col">
      <SidebarHeader userName={userName} userAvatarUrl={userAvatarUrl} />
      <div className="px-3 pb-3 pt-2">
        <SearchInput />
      </div>
      <Suspense fallback={<ConversationListSkeleton />}>
        <ConversationList
          userId={userId}
          activeConversationId={activeConversationId}
        />
      </Suspense>
    </div>
  );
}
