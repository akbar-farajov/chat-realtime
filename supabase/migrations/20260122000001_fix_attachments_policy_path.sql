drop policy if exists "attachments_member_select" on storage.objects;
drop policy if exists "attachments_member_insert" on storage.objects;

create policy "attachments_member_select"
on storage.objects for select
using (
  bucket_id = 'attachments'
  and name like 'conversations/%'
  and exists (
    select 1
    from public.conversation_members cm
    where cm.user_id = auth.uid()
      and cm.conversation_id::text = split_part(name, '/', 2)
  )
);

create policy "attachments_member_insert"
on storage.objects for insert
with check (
  bucket_id = 'attachments'
  and auth.role() = 'authenticated'
  and name like 'conversations/%'
  and exists (
    select 1
    from public.conversation_members cm
    where cm.user_id = auth.uid()
      and cm.conversation_id::text = split_part(name, '/', 2)
  )
);
