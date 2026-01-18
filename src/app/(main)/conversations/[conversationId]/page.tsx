import { notFound, redirect } from "next/navigation";

import { getProfile } from "@/actions/users";
import { ChatArea } from "@/components/chat/chat-area";
import { createClient } from "@/lib/supabase/server";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ userId?: string }>;
}

export default async function ConversationPage({
  params,
  searchParams,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const { userId: targetUserId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isNewConversation = conversationId === "new";

  if (isNewConversation) {
    if (!targetUserId) {
      redirect("/");
    }

    const targetProfile = await getProfile(targetUserId);
    if (!targetProfile) {
      notFound();
    }

    return (
      <ChatArea
        isNew
        targetUserId={targetUserId}
        targetProfile={targetProfile}
        currentUserId={user.id}
      />
    );
  }

  const { data: conversation } = await supabase
    .from("conversations")
    .select(
      `
      id,
      is_group,
      name,
      group_image,
      conversation_members (
        user_id,
        profiles (
          id,
          username,
          full_name,
          avatar_url,
          status
        )
      )
    `,
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (!conversation) {
    notFound();
  }

  const isMember = conversation.conversation_members.some(
    (member) => member.user_id === user.id,
  );

  if (!isMember) {
    notFound();
  }

  const otherMember = conversation.conversation_members.find(
    (member) => member.user_id !== user.id,
  );

  const chatPartner = otherMember?.profiles
    ? {
        id: otherMember.profiles.id,
        username: otherMember.profiles.username,
        fullName: otherMember.profiles.full_name,
        avatarUrl: otherMember.profiles.avatar_url,
        status: otherMember.profiles.status,
      }
    : null;

  return (
    <ChatArea
      conversationId={conversationId}
      conversation={conversation}
      chatPartner={chatPartner}
      currentUserId={user.id}
    />
  );
}
