import type { Database } from "@/lib/supabase/types";

type ConversationRow = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationMemberRow =
  Database["public"]["Tables"]["conversation_members"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface ConversationListItem {
  id: Database["public"]["Tables"]["conversations"]["Row"]["id"];
  name: string;
  avatarUrl: string | null;
  lastMessage: Database["public"]["Tables"]["messages"]["Row"]["content"];
  lastMessageAt:
    | Database["public"]["Tables"]["messages"]["Row"]["created_at"]
    | Database["public"]["Tables"]["conversations"]["Row"]["last_message_at"];
  isGroup: Database["public"]["Tables"]["conversations"]["Row"]["is_group"];
}

export type ConversationQueryRow = Pick<
  ConversationRow,
  "id" | "is_group" | "name" | "group_image" | "last_message_at"
> & {
  conversation_members: Array<
    Pick<ConversationMemberRow, "user_id"> & {
      profiles: Pick<
        ProfileRow,
        "id" | "username" | "full_name" | "avatar_url"
      > | null;
    }
  >;
  messages: Array<Pick<MessageRow, "content" | "created_at">>;
};
