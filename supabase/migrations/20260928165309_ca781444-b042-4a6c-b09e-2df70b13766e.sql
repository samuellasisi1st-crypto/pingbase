CREATE POLICY "Members upload attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND public.is_workspace_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Members read attachments" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND public.is_workspace_member(((storage.foldername(name))[1])::uuid));