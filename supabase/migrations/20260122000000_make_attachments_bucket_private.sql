do $$
begin
  begin
    alter table storage.objects enable row level security;
  exception
    when insufficient_privilege then null;
  end;
end $$;

update storage.buckets
set public = false
where id = 'attachments';

drop policy if exists "attachments_public_select" on storage.objects;
drop policy if exists "attachments_authenticated_insert" on storage.objects;
drop policy if exists "attachments_owner_update" on storage.objects;
drop policy if exists "attachments_owner_delete" on storage.objects;

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

create policy "attachments_owner_update"
on storage.objects for update
using (
  bucket_id = 'attachments'
  and owner = auth.uid()
)
with check (
  bucket_id = 'attachments'
  and owner = auth.uid()
);

create policy "attachments_owner_delete"
on storage.objects for delete
using (
  bucket_id = 'attachments'
  and owner = auth.uid()
);
