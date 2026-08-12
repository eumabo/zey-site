-- ============================================================
-- ZEY / euzey.site — setup do banco sem Firebase
-- ============================================================
-- ANTES DE RODAR:
-- Troque mabobeatz@gmail.com pelo MESMO e-mail que você criar em
-- Authentication > Users no painel do Supabase.
-- Exemplo: lower('gui@email.com')
-- ============================================================

create table if not exists public.gallery_settings (
  id text primary key,
  photo_order jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.gallery_settings (id, photo_order)
values ('main', '[]'::jsonb)
on conflict (id) do nothing;

alter table public.gallery_settings enable row level security;

drop policy if exists "gallery_public_read" on public.gallery_settings;
create policy "gallery_public_read"
on public.gallery_settings
for select
using (true);

drop policy if exists "gallery_admin_update" on public.gallery_settings;
create policy "gallery_admin_update"
on public.gallery_settings
for update
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', '')) = lower('mabobeatz@gmail.com')
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', '')) = lower('mabobeatz@gmail.com')
);

-- Contador de visualizações (substitui o Firebase atual)
create table if not exists public.site_stats (
  id text primary key,
  views bigint not null default 4971
);

insert into public.site_stats (id, views)
values ('main', 4971)
on conflict (id) do nothing;

alter table public.site_stats enable row level security;

drop policy if exists "site_stats_public_read" on public.site_stats;
create policy "site_stats_public_read"
on public.site_stats
for select
using (true);

create or replace function public.increment_site_views()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_total bigint;
begin
  update public.site_stats
  set views = views + 1
  where id = 'main'
  returning views into new_total;

  return new_total;
end;
$$;

revoke all on function public.increment_site_views() from public;
grant execute on function public.increment_site_views() to anon, authenticated;
