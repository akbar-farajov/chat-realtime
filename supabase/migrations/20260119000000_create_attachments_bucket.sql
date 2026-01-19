-- migration: create attachments storage bucket
-- purpose: creates a public storage bucket for chat attachments (images, files)
-- affected: storage.buckets, storage.objects

-- create the attachments bucket
-- this bucket will store all chat attachments like images
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true);

-- policy: allow everyone to read from attachments bucket
-- rationale: attachments in chats should be viewable by anyone with the link
create policy "attachments_public_select"
on storage.objects for select
using (bucket_id = 'attachments');

-- policy: allow authenticated users to upload to attachments bucket
-- rationale: only logged-in users should be able to upload files
create policy "attachments_authenticated_insert"
on storage.objects for insert
with check (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- policy: allow users to update their own uploads
-- rationale: users should be able to modify files they uploaded
create policy "attachments_owner_update"
on storage.objects for update
using (bucket_id = 'attachments' and auth.uid() = owner)
with check (bucket_id = 'attachments' and auth.uid() = owner);

-- policy: allow users to delete their own uploads
-- rationale: users should be able to remove files they uploaded
create policy "attachments_owner_delete"
on storage.objects for delete
using (bucket_id = 'attachments' and auth.uid() = owner);
