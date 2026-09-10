create table if not exists public.ytintel_creator_scenes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_id uuid not null references public.ytintel_creator_assets(id) on delete cascade,
  scene_index integer not null check (scene_index >= 0),
  start_seconds numeric not null default 0 check (start_seconds >= 0),
  end_seconds numeric not null default 0 check (end_seconds >= 0),
  representative_seconds numeric not null default 0 check (representative_seconds >= 0),
  thumbnail_bucket text not null default 'ytintel-creator-assets',
  thumbnail_path text not null default '',
  change_score numeric,
  brightness numeric,
  motion_hint text not null default '',
  production_mode text not null default '',
  composition text not null default '',
  narrative_role text not null default '',
  visible_text text[] not null default '{}'::text[],
  attention_devices text[] not null default '{}'::text[],
  tags text[] not null default '{}'::text[],
  search_text text not null default '',
  ai_confidence numeric,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'ready' check (status in ('ready','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, asset_id, scene_index),
  check (end_seconds >= start_seconds)
);

alter table public.ytintel_creator_scenes enable row level security;

create policy "ytintel_creator_scenes_select_own" on public.ytintel_creator_scenes for select to authenticated using (auth.uid() = user_id);
create policy "ytintel_creator_scenes_insert_own" on public.ytintel_creator_scenes for insert to authenticated with check (auth.uid() = user_id);
create policy "ytintel_creator_scenes_update_own" on public.ytintel_creator_scenes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ytintel_creator_scenes_delete_own" on public.ytintel_creator_scenes for delete to authenticated using (auth.uid() = user_id);

create index if not exists ytintel_creator_scenes_user_asset_idx on public.ytintel_creator_scenes(user_id, asset_id, scene_index);
create index if not exists ytintel_creator_scenes_tags_gin on public.ytintel_creator_scenes using gin(tags);
create index if not exists ytintel_creator_scenes_search_fts on public.ytintel_creator_scenes using gin(to_tsvector('english', search_text));
