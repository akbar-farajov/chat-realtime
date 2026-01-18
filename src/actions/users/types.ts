export interface UserSearchResult {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}

export interface UserProfile {
  id: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  status: string | null;
}
