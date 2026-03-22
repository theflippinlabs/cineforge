-- ============================================================
-- CineForge Database Schema
-- ============================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Subscription Tiers ──────────────────────────────────────────────────────
create table if not exists subscription_tiers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  display_name text not null,
  monthly_generation_limit integer not null default 5,
  max_duration_seconds integer not null default 60,
  max_resolution text not null default '720p',
  features jsonb not null default '[]',
  price_monthly numeric(10,2),
  created_at timestamptz not null default now()
);

-- ─── Profiles ────────────────────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  subscription_tier_id uuid references subscription_tiers(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Wallets ─────────────────────────────────────────────────────────────────
create table if not exists wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  address text not null,
  chain_id integer not null default 1,
  chain_name text not null default 'Ethereum Mainnet',
  is_primary boolean not null default false,
  linked_at timestamptz not null default now(),
  unique(user_id, address)
);

-- ─── NFT Access Rules ─────────────────────────────────────────────────────────
create table if not exists nft_access_rules (
  id uuid primary key default uuid_generate_v4(),
  contract_address text not null,
  chain_id integer not null default 1,
  collection_name text not null,
  tier_unlocked text not null default 'premium',
  min_token_count integer not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(contract_address, chain_id)
);

-- ─── Wallet NFT Status ────────────────────────────────────────────────────────
create table if not exists wallet_nft_status (
  id uuid primary key default uuid_generate_v4(),
  wallet_id uuid not null references wallets(id) on delete cascade,
  rule_id uuid not null references nft_access_rules(id) on delete cascade,
  is_eligible boolean not null default false,
  token_ids text[] not null default '{}',
  last_verified_at timestamptz not null default now(),
  unique(wallet_id, rule_id)
);

-- ─── Projects ────────────────────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  description text,
  audio_url text,
  audio_filename text,
  lyrics text,
  concept_prompt text not null default '',
  visual_style text not null default 'cinematic',
  mood text not null default 'epic',
  pacing text not null default 'dynamic',
  aspect_ratio text not null default '16:9',
  duration_seconds integer not null default 60,
  scene_density text not null default 'balanced',
  realism_level integer not null default 70,
  camera_language text not null default 'wide_epic',
  editing_intensity text not null default 'standard',
  negative_prompt text,
  has_brand_overlay boolean not null default false,
  has_subtitles boolean not null default false,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Project Assets ───────────────────────────────────────────────────────────
create table if not exists project_assets (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  asset_type text not null, -- 'audio', 'reference_image', 'brand_logo'
  file_url text not null,
  file_name text,
  file_size_bytes bigint,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ─── Generation Jobs ──────────────────────────────────────────────────────────
create table if not exists generation_jobs (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  version integer not null default 1,
  status text not null default 'queued',
  progress integer not null default 0,
  current_step text,
  config_snapshot jsonb not null default '{}',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ─── Generation Steps ─────────────────────────────────────────────────────────
create table if not exists generation_steps (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  step_name text not null,
  status text not null default 'pending',
  progress integer not null default 0,
  metadata jsonb default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ─── Generation Outputs ───────────────────────────────────────────────────────
create table if not exists generation_outputs (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid not null references generation_jobs(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  output_type text not null default 'preview', -- 'preview', 'final', 'thumbnail'
  file_url text not null,
  file_size_bytes bigint not null default 0,
  duration_seconds integer not null default 0,
  resolution text not null default '1080p',
  format text not null default 'mp4',
  created_at timestamptz not null default now()
);

-- ─── Prompt Presets ───────────────────────────────────────────────────────────
create table if not exists prompt_presets (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  category text,
  concept_prompt text not null,
  visual_style text not null,
  mood text not null,
  pacing text not null,
  camera_language text not null,
  editing_intensity text not null,
  realism_level integer not null default 70,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  preview_image_url text,
  created_at timestamptz not null default now()
);

-- ─── Usage Events ─────────────────────────────────────────────────────────────
create table if not exists usage_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_type text not null,
  job_id uuid references generation_jobs(id),
  project_id uuid references projects(id),
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

-- ─── Render Profiles ──────────────────────────────────────────────────────────
create table if not exists render_profiles (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  resolution text not null,
  fps integer not null default 24,
  bitrate_kbps integer not null default 8000,
  format text not null default 'mp4',
  codec text not null default 'h264',
  tier_required text not null default 'free',
  created_at timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table wallets enable row level security;
alter table wallet_nft_status enable row level security;
alter table projects enable row level security;
alter table project_assets enable row level security;
alter table generation_jobs enable row level security;
alter table generation_steps enable row level security;
alter table generation_outputs enable row level security;
alter table usage_events enable row level security;

-- Profiles: users can read/update their own
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- Wallets: user owns
create policy "wallets_all_own" on wallets for all using (auth.uid() = user_id);

-- Wallet NFT status: via wallet
create policy "wallet_nft_status_select" on wallet_nft_status for select
  using (wallet_id in (select id from wallets where user_id = auth.uid()));

-- NFT access rules: public read
alter table nft_access_rules enable row level security;
create policy "nft_rules_public_read" on nft_access_rules for select using (true);

-- Subscription tiers: public read
alter table subscription_tiers enable row level security;
create policy "tiers_public_read" on subscription_tiers for select using (true);

-- Projects: user owns
create policy "projects_all_own" on projects for all using (auth.uid() = user_id);

-- Project assets: via project
create policy "project_assets_select" on project_assets for select
  using (project_id in (select id from projects where user_id = auth.uid()));
create policy "project_assets_insert" on project_assets for insert
  with check (project_id in (select id from projects where user_id = auth.uid()));
create policy "project_assets_delete" on project_assets for delete
  using (project_id in (select id from projects where user_id = auth.uid()));

-- Generation jobs: user owns
create policy "jobs_all_own" on generation_jobs for all using (auth.uid() = user_id);

-- Generation steps: via job
create policy "steps_select" on generation_steps for select
  using (job_id in (select id from generation_jobs where user_id = auth.uid()));

-- Generation outputs: via job
create policy "outputs_select" on generation_outputs for select
  using (job_id in (select id from generation_jobs where user_id = auth.uid()));

-- Usage events: user owns
create policy "usage_events_own" on usage_events for all using (auth.uid() = user_id);

-- Prompt presets: public read
alter table prompt_presets enable row level security;
create policy "prompt_presets_public_read" on prompt_presets for select using (true);

-- Render profiles: public read
alter table render_profiles enable row level security;
create policy "render_profiles_public_read" on render_profiles for select using (true);

-- ============================================================
-- Triggers
-- ============================================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at before update on projects
  for each row execute procedure update_updated_at();

create trigger generation_jobs_updated_at before update on generation_jobs
  for each row execute procedure update_updated_at();

-- ============================================================
-- Seed Data
-- ============================================================

-- Subscription tiers
insert into subscription_tiers (name, display_name, monthly_generation_limit, max_duration_seconds, max_resolution, features, price_monthly)
values
  ('free', 'Free', 5, 60, '720p', '["preview_generation", "basic_styles"]', null),
  ('pro', 'Pro', 100, 300, '1080p', '["hd_export", "all_styles", "versioning"]', 49.00),
  ('premium', 'Premium', 500, 600, '4k', '["4k_export", "all_styles", "priority_queue", "brand_overlay", "versioning"]', 149.00),
  ('enterprise', 'Enterprise', -1, 3600, '4k', '["4k_export", "all_styles", "priority_queue", "brand_overlay", "versioning", "api_access", "dedicated_support"]', 499.00)
on conflict (name) do nothing;

-- NFT access rules
insert into nft_access_rules (contract_address, chain_id, collection_name, tier_unlocked, min_token_count, is_active)
values
  ('0x1234567890abcdef1234567890abcdef12345678', 1, 'CineForge Genesis Pass', 'premium', 1, true),
  ('0x2345678901bcdef12345678901bcdef123456789', 137, 'Creative Collective', 'pro', 1, true),
  ('0x3456789012cdef123456789012cdef1234567890', 1, 'Founder Series', 'premium', 1, true)
on conflict (contract_address, chain_id) do nothing;

-- Render profiles
insert into render_profiles (name, description, resolution, fps, bitrate_kbps, format, codec, tier_required)
values
  ('Preview 480p', 'Low-quality preview for generation review', '480p', 24, 2000, 'mp4', 'h264', 'free'),
  ('Standard 720p', 'Standard HD export', '720p', 24, 5000, 'mp4', 'h264', 'free'),
  ('HD 1080p', 'Full HD export', '1080p', 24, 10000, 'mp4', 'h264', 'pro'),
  ('HD 1080p 60fps', 'Smooth high-frame-rate export', '1080p', 60, 15000, 'mp4', 'h264', 'pro'),
  ('4K UHD', 'Ultra high-definition export', '2160p', 24, 40000, 'mp4', 'h265', 'premium'),
  ('Vertical 1080p', 'Portrait format for social media', '1080x1920', 30, 10000, 'mp4', 'h264', 'pro')
on conflict (name) do nothing;

-- Prompt presets
insert into prompt_presets (name, description, category, concept_prompt, visual_style, mood, pacing, camera_language, editing_intensity, realism_level, tags, is_featured)
values
  (
    'Noir Ballad', 'Rain-soaked streets with emotional close-ups', 'emotional',
    'Rain-soaked streets, neon reflections, a lone figure walking through fog, emotional depth, cinematic close-ups, shadow and light interplay',
    'noir', 'melancholic', 'slow_contemplative', 'fluid_handheld', 'subtle', 70,
    ARRAY['noir', 'rain', 'emotional', 'urban'], true
  ),
  (
    'Hyper Cinematic', 'Epic wide shots with dramatic lighting', 'epic',
    'Vast landscapes, golden hour light, dramatic skies, sweeping camera movements, cinematic depth of field, epic scale',
    'cinematic', 'epic', 'dynamic', 'wide_epic', 'standard', 85,
    ARRAY['epic', 'cinematic', 'landscape', 'dramatic'], true
  ),
  (
    'Neon Cyberpunk', 'Futuristic city with glowing neon and high energy', 'futuristic',
    'Neon-lit cyberpunk city, holographic displays, rain and reflections, chrome surfaces, futuristic fashion, electric atmosphere',
    'neon_cyberpunk', 'dark_intense', 'rapid_cut', 'mixed', 'aggressive', 40,
    ARRAY['cyberpunk', 'neon', 'futuristic', 'city'], true
  ),
  (
    'Dream State', 'Soft focus floating visuals and surreal transitions', 'abstract',
    'Dreamy soft focus, ethereal light, floating petals, slow morphing shapes, pastel hues blending into darkness, weightless motion',
    'abstract', 'dreamy', 'slow_contemplative', 'macro_intimate', 'subtle', 20,
    ARRAY['dream', 'abstract', 'ethereal', 'surreal'], false
  ),
  (
    'Vintage Analog', 'Film grain with warm tones and Super 8 aesthetic', 'retro',
    'Super 8 film aesthetic, warm grain, light leaks, nostalgic summer memories, faded colors, analog imperfections, genuine moments',
    'vintage_film', 'melancholic', 'moderate', 'fluid_handheld', 'standard', 60,
    ARRAY['vintage', 'film', 'nostalgic', 'analog'], false
  ),
  (
    'Minimal Control', 'Clean geometric forms with stark contrast', 'minimal',
    'Stark white and black geometric compositions, architectural lines, minimal movement, high contrast shadows, pure form and space',
    'minimal_clean', 'introspective', 'moderate', 'static_composed', 'subtle', 50,
    ARRAY['minimal', 'geometric', 'clean', 'architectural'], false
  )
on conflict do nothing;
