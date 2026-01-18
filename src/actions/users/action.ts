"use server";

import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UserSearchResult } from "./types";

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, status")
    .eq("id", userId)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    username: data.username,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    status: data.status,
  };
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const searchTerm = `%${query.trim()}%`;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url")
    .neq("id", user.id)
    .or(`username.ilike.${searchTerm},full_name.ilike.${searchTerm}`)
    .limit(10);

  if (error) {
    return [];
  }

  return (data ?? []).map((profile) => ({
    id: profile.id,
    username: profile.username,
    fullName: profile.full_name,
    avatarUrl: profile.avatar_url,
  }));
}
