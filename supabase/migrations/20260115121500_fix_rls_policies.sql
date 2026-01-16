drop policy if exists "Users can view conversations they belong to" on public.conversations;
drop policy if exists "Users can create conversations" on public.conversations;
drop policy if exists "Users can update conversations they belong to" on public.conversations;

drop policy if exists "Users can view members of their conversations" on public.conversation_members;
drop policy if exists "Users can add members to conversations they belong to" on public.conversation_members;
drop policy if exists "Admins can remove members from conversations" on public.conversation_members;

drop policy if exists "Users can view messages in their conversations" on public.messages;
drop policy if exists "Users can send messages to their conversations" on public.messages;
drop policy if exists "Users can update their own messages" on public.messages;
drop policy if exists "Users can delete their own messages" on public.messages;

create or replace function public.is_conversation_member(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_members.conversation_id = target_conversation_id
      and conversation_members.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_conversation_admin(target_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select exists (
    select 1
    from public.conversation_members
    where conversation_members.conversation_id = target_conversation_id
      and conversation_members.user_id = (select auth.uid())
      and conversation_members.role = 'admin'
  );
$$;

create policy "Users can view conversations they belong to"
  on public.conversations for select
  to authenticated
  using (public.is_conversation_member(id));

create policy "Users can create conversations"
  on public.conversations for insert
  to authenticated
  with check (true);

create policy "Users can update conversations they belong to"
  on public.conversations for update
  to authenticated
  using (public.is_conversation_member(id))
  with check (public.is_conversation_member(id));

create policy "Users can view members of their conversations"
  on public.conversation_members for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "Users can add members to conversations they belong to"
  on public.conversation_members for insert
  to authenticated
  with check (
    public.is_conversation_member(conversation_id)
    or user_id = (select auth.uid())
  );

create policy "Admins can remove members from conversations"
  on public.conversation_members for delete
  to authenticated
  using (
    public.is_conversation_admin(conversation_id)
    or user_id = (select auth.uid())
  );

create policy "Users can view messages in their conversations"
  on public.messages for select
  to authenticated
  using (public.is_conversation_member(conversation_id));

create policy "Users can send messages to their conversations"
  on public.messages for insert
  to authenticated
  with check (
    public.is_conversation_member(conversation_id)
    and sender_id = (select auth.uid())
  );

create policy "Users can update their own messages"
  on public.messages for update
  to authenticated
  using (
    public.is_conversation_member(conversation_id)
    and sender_id = (select auth.uid())
  )
  with check (
    public.is_conversation_member(conversation_id)
    and sender_id = (select auth.uid())
  );

create policy "Users can delete their own messages"
  on public.messages for delete
  to authenticated
  using (
    public.is_conversation_member(conversation_id)
    and sender_id = (select auth.uid())
  );
