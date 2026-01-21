alter table public.messages
add column status text not null default 'sent' check (status in ('sent', 'read'));

create or replace function public.mark_messages_read(p_conversation_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare updated_count int;
begin
  update public.messages
  set status = 'read'
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and status = 'sent'
    and conversation_id in (
      select conversation_id
      from public.conversation_members
      where user_id = auth.uid()
    );
  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

revoke all on function public.mark_messages_read(uuid) from public;
grant execute on function public.mark_messages_read(uuid) to authenticated;
