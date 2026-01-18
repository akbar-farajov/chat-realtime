"use server";

import { createSafeAction } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UserSearchResult } from "./types";

export const getProfile = createSafeAction(
  async (userId: string): Promise<UserProfile> => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, status")
      .eq("id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Profile not found");

    return {
      id: data.id,
      username: data.username,
      fullName: data.full_name,
      avatarUrl: data.avatar_url,
      status: data.status,
    };
  },
);

export const searchUsers = createSafeAction(
  async (query: string): Promise<UserSearchResult[]> => {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url")
      .neq("id", user.id)
      .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
      .limit(10);

    if (error) throw new Error(error.message);

    return (data ?? []).map((profile) => ({
      id: profile.id,
      username: profile.username,
      fullName: profile.full_name,
      avatarUrl: profile.avatar_url,
    }));
  },
);
