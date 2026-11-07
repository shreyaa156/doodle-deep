-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

-- 1. The table of creatures
create table if not exists public.creatures (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  type text not null check (type in ('fish','jellyfish','crab','octopus','turtle','whale','anything')),
  image_url text not null,
  created_at timestamptz not null default now()
);

-- 2. Who counts as an admin (filled in by you, see step 5)
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- 3. Access rules
-- Anyone can see creatures and add one. Only admins can delete.
alter table public.creatures enable row level security;
create policy "Anyone can view creatures" on public.creatures for select using (true);
create policy "Anyone can add a creature" on public.creatures for insert with check (true);
create policy "Admins can delete creatures" on public.creatures for delete using (public.is_admin());

-- Signed-in users can only check whether they themselves are an admin.
alter table public.admins enable row level security;
create policy "Users can see their own admin row" on public.admins for select using (user_id = auth.uid());

-- Push new and deleted creatures to everyone live
alter publication supabase_realtime add table public.creatures;

-- 4. Storage for the drawings (public bucket, images only, 300 KB max)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('creatures', 'creatures', true, 307200, array['image/webp','image/png'])
on conflict (id) do nothing;

create policy "Anyone can upload a drawing" on storage.objects
  for insert with check (bucket_id = 'creatures');
create policy "Admins can delete drawings" on storage.objects
  for delete using (bucket_id = 'creatures' and public.is_admin());

-- 5. Make yourself admin (run separately, after creating your login):
--    Authentication -> Users -> Add user -> enter your email and a password.
--    Then run, with your email:
--
--    insert into public.admins (user_id)
--    select id from auth.users where email = 'you@example.com';
