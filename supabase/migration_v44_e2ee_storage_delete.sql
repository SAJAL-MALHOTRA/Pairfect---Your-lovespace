-- Migration v44: Add Storage DELETE policy for memories bucket
-- Required so client-side photo strip deletion (EncryptedMemoryImage cleanup)
-- and pair unlink storage cleanup calls can succeed under RLS.
--
-- The policy mirrors the existing SELECT/INSERT policies: a user can only
-- delete storage objects whose top-level folder matches a pair they are
-- currently an active member of.

create policy "Users can delete memories from their pair folder"
  on storage.objects for delete using (
    bucket_id = 'memories' and (
      exists (
        select 1 from public.pairs
        where pairs.id::text = (storage.foldername(name))[1]
          and (pairs.user_a_id = auth.uid() or pairs.user_b_id = auth.uid())
          and pairs.status = 'active'
      )
    )
  );
