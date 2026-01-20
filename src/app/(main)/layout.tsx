import { redirect } from "next/navigation";

import { ActiveStatus } from "@/components/active-status";
import { Sidebar } from "@/components/sidebar/sidebar";
import { createClient } from "@/lib/supabase/server";

export default async function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  const userName =
    profile?.full_name ??
    profile?.username ??
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    "You";
  const userAvatarUrl =
    profile?.avatar_url ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture ??
    null;

  return (
    <div className="flex h-svh w-full">
      <ActiveStatus userId={user.id} />
      <aside className="hidden h-svh w-80 flex-col border-r bg-sidebar md:flex">
        <Sidebar
          userId={user.id}
          userName={userName}
          userAvatarUrl={userAvatarUrl}
        />
      </aside>
      <main className="flex min-w-0 flex-1 flex-col bg-background">
        {children}
      </main>
    </div>
  );
}
