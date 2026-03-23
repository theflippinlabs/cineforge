-- ─── Align nft_access_rules with TypeScript NFTAccessRule interface ───────────

alter table nft_access_rules
  add column if not exists name text not null default '',
  add column if not exists chain text not null default 'Ethereum',
  add column if not exists token_standard text not null default 'ERC-721',
  add column if not exists required_balance integer not null default 1,
  add column if not exists description text;

-- Sync required_balance from min_token_count for existing rows
update nft_access_rules
set required_balance = min_token_count
where required_balance = 1 and min_token_count > 1;

-- Backfill name from collection_name for existing rows
update nft_access_rules
set name = collection_name
where name = '';

-- ─── Align wallet_nft_status with application upsert payload ─────────────────

alter table wallet_nft_status
  add column if not exists verified_balance integer not null default 0,
  add column if not exists last_checked_at timestamptz not null default now();

-- ─── Cronos chain support + real NFT access rule ─────────────────────────────

insert into nft_access_rules (
  contract_address,
  chain_id,
  chain,
  collection_name,
  name,
  token_standard,
  tier_unlocked,
  min_token_count,
  required_balance,
  is_active,
  description
) values (
  '0xE5c2F750491fc5043d8D011C34A3adB0Ef900cF3',
  25,
  'Cronos',
  'The Sovereign',
  'The Sovereign',
  'ERC-721',
  'nft_verified',
  1,
  1,
  true,
  'Hold The Sovereign NFT on Cronos to unlock full platform access.'
)
on conflict (contract_address, chain_id) do update set
  collection_name = 'The Sovereign',
  name = 'The Sovereign',
  is_active = true,
  tier_unlocked = 'nft_verified',
  chain = 'Cronos',
  token_standard = 'ERC-721',
  required_balance = 1,
  description = 'Hold The Sovereign NFT on Cronos to unlock full platform access.';
