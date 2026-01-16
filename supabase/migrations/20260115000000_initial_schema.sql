create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  status text default 'offline' check (status in ('online', 'offline')),
  last_seen timestamptz default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  is_group boolean default false,
  name text,
  group_image text,
  last_message_at timestamptz default now()
);

create table public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz default now(),
  unique (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  content text,
  type text default 'text' check (type in ('text', 'image', 'video', 'audio')),
  file_url text,
  created_at timestamptz default now(),
  is_edited boolean default false
);

create index idx_conversation_members_user_id on public.conversation_members (user_id);
create index idx_conversation_members_conversation_id on public.conversation_members (conversation_id);
create index idx_messages_conversation_id on public.messages (conversation_id);
create index idx_messages_sender_id on public.messages (sender_id);
create index idx_messages_created_at on public.messages (created_at desc);
create index idx_conversations_last_message_at on public.conversations (last_message_at desc);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Users can view conversations they belong to"
  on public.conversations for select
  to authenticated
  using (
    id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
  );

create policy "Users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

create policy "Users can update conversations they belong to"
  on public.conversations for update
  to authenticated
  using (
    id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
  )
  with check (
    id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
  );

create policy "Users can view members of their conversations"
  on public.conversation_members for select
  to authenticated
  using (
    conversation_id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
  );

create policy "Users can add members to conversations they belong to"
  on public.conversation_members for insert
  to authenticated
  with check (
    conversation_id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
    or user_id = (select auth.uid())
  );

create policy "Admins can remove members from conversations"
  on public.conversation_members for delete
  to authenticated
  using (
    conversation_id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid()) and role = 'admin'
    )
    or user_id = (select auth.uid())
  );

create policy "Users can view messages in their conversations"
  on public.messages for select
  to authenticated
  using (
    conversation_id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
  );

create policy "Users can send messages to their conversations"
  on public.messages for insert
  to authenticated
  with check (
    conversation_id in (
      select conversation_id
      from public.conversation_members
      where user_id = (select auth.uid())
    )
    and sender_id = (select auth.uid())
  );

create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (sender_id = (select auth.uid()))
  with check (sender_id = (select auth.uid()));

create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (sender_id = (select auth.uid()));
