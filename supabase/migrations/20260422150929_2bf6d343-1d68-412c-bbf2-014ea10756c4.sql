-- Fix function search path
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin new.updated_at = now(); return new; end; $$;

-- Replace broad public read with owner-only listing; direct file URLs still work because bucket is public
drop policy if exists "Public read paintings bucket" on storage.objects;

create policy "Owner lists paintings bucket" on storage.objects
  for select to authenticated
  using (bucket_id = 'paintings' and public.has_role(auth.uid(), 'owner'));