-- Roles enum and table (avoids RLS recursion)
create type public.app_role as enum ('owner', 'visitor');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create policy "Users view own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

-- Paintings: private studio works owned by Naybz (the owner)
create table public.paintings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade not null,
  title text not null default 'Untitled',
  prompt text not null,
  style text,
  aspect_ratio text not null default '1:1',
  image_url text not null,
  is_published boolean not null default false,
  price_cents integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.paintings enable row level security;

-- Public can view published paintings (the shop)
create policy "Anyone can view published paintings" on public.paintings
  for select using (is_published = true);

-- Owner can view all their paintings
create policy "Owner views own paintings" on public.paintings
  for select to authenticated
  using (auth.uid() = owner_id and public.has_role(auth.uid(), 'owner'));

create policy "Owner inserts paintings" on public.paintings
  for insert to authenticated
  with check (auth.uid() = owner_id and public.has_role(auth.uid(), 'owner'));

create policy "Owner updates paintings" on public.paintings
  for update to authenticated
  using (auth.uid() = owner_id and public.has_role(auth.uid(), 'owner'));

create policy "Owner deletes paintings" on public.paintings
  for delete to authenticated
  using (auth.uid() = owner_id and public.has_role(auth.uid(), 'owner'));

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger paintings_updated_at before update on public.paintings
  for each row execute function public.set_updated_at();

-- Storage bucket for painting images (public read)
insert into storage.buckets (id, name, public) values ('paintings', 'paintings', true);

create policy "Public read paintings bucket" on storage.objects
  for select using (bucket_id = 'paintings');

create policy "Owner uploads to paintings bucket" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'paintings' and public.has_role(auth.uid(), 'owner'));

create policy "Owner updates own painting files" on storage.objects
  for update to authenticated
  using (bucket_id = 'paintings' and public.has_role(auth.uid(), 'owner'));

create policy "Owner deletes own painting files" on storage.objects
  for delete to authenticated
  using (bucket_id = 'paintings' and public.has_role(auth.uid(), 'owner'));