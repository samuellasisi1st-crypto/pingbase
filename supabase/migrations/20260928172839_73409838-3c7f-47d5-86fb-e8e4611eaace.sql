CREATE POLICY "Members read workspace files objects" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[2] = 'files' AND public.is_workspace_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Members upload workspace files objects" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attachments' AND (storage.foldername(name))[2] = 'files' AND public.is_workspace_member(((storage.foldername(name))[1])::uuid));
CREATE POLICY "Members delete workspace files objects" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'attachments' AND (storage.foldername(name))[2] = 'files' AND public.is_workspace_member(((storage.foldername(name))[1])::uuid));