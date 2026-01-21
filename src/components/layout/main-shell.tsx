"use client";

import { usePathname } from "next/navigation";

import { ActiveStatus } from "@/components/active-status";
import { cn } from "@/lib/utils";

interface MainShellProps {
  userId: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

export function MainShell({ userId, sidebar, children }: MainShellProps) {
  const pathname = usePathname();
  const isConversationView = pathname.startsWith("/conversations/");

  return (
    <div className="flex h-svh min-h-dvh w-full">
      <ActiveStatus userId={userId} />
      <aside
        className={cn(
          "h-svh w-full flex-col border-r bg-sidebar md:flex md:w-80 md:shrink-0",
          isConversationView ? "hidden" : "flex",
        )}
      >
        {sidebar}
      </aside>
      <main
        className={cn(
          "flex min-w-0 flex-1 flex-col bg-background",
          isConversationView ? "flex" : "hidden",
          "md:flex",
        )}
      >
        {children}
      </main>
    </div>
  );
}
