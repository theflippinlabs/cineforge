# Synema

**AI-powered music video creation platform.**

Generate premium cinematic video clips from audio, prompts, and creative direction — with speed, control, and style.

---

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Supabase (Auth, Postgres, Storage, RLS)
- **Wallet**: Ethereum-compatible wallet connection (MetaMask / WalletConnect)
- **NFT Gating**: On-chain ownership verification for premium access
- **Job Queue**: Supabase-powered generation job table with polling architecture

---

## Getting Started

### 1. Clone and install

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env.local
```

Fill in your Supabase URL and anon key.

### 3. Set up Supabase database

Run the migration in `supabase/migrations/20260322000001_cineforge_schema.sql` against your Supabase project.

This creates all tables, RLS policies, triggers, and seed data.

### 4. Run locally

```bash
npm run dev
```

---

## Feature Overview

| Feature | Description |
|---|---|
| Auth | Email/password sign up + login via Supabase Auth |
| Wallet Connect | MetaMask / EIP-1193 wallet connection |
| NFT Gating | Verify NFT ownership for premium tier unlock |
| Create Clip | Full creative parameter control + one-click generation |
| Generation Jobs | Background job queue with status polling |
| Projects | Versioned project history + duplicate / delete |
| Settings | Profile management + password change |

---

## Routes

| Route | Page |
|---|---|
| `/` | Landing page |
| `/auth/login` | Sign in |
| `/auth/signup` | Create account |
| `/auth/forgot-password` | Password reset |
| `/dashboard` | Overview |
| `/dashboard/create` | Create new clip |
| `/dashboard/projects` | Project list |
| `/dashboard/projects/:id` | Project detail |
| `/dashboard/jobs` | Generation jobs |
| `/dashboard/wallet` | Wallet & NFT access |
| `/dashboard/settings` | Account settings |

---

## Database Schema

See `supabase/migrations/20260322000001_cineforge_schema.sql` for the full schema.

Key tables:
- `profiles` — user profiles (auto-created on signup)
- `wallets` — linked Ethereum wallets
- `nft_access_rules` — configurable NFT gating rules
- `wallet_nft_status` — verified NFT ownership per wallet
- `projects` — user projects with all creative parameters
- `generation_jobs` — background job queue with status tracking
- `generation_outputs` — rendered video outputs
- `prompt_presets` — curated preset library
- `render_profiles` — output quality profiles by tier
- `usage_events` — usage metering and analytics

---

## Production Architecture Notes

### AI/Media Pipeline

The generation pipeline is designed as a modular adapter architecture. The job queue triggers a worker that orchestrates:

1. **AudioAnalysisService** — BPM detection, structure analysis, beat grid
2. **ScenePlannerService** — Track segmentation, scene count calculation
3. **PromptExpansionService** — Convert concept prompt → per-scene visual prompts
4. **VideoGenerationProvider** — Pluggable adapter (Runway, Pika, Kling, etc.)
5. **RenderAssemblerService** — FFmpeg-based clip stitching + transitions
6. **ExportService** — Format conversion, compression, delivery

Provider API keys are loaded from environment variables and can be swapped without changing core logic.

### NFT Verification

The `NFTAccessService` in `src/lib/wallet.ts` provides a mock-safe architecture. Replace the `verifyNFTOwnership` function body with real on-chain calls via:
- **Alchemy NFT API** (`/getNFTs`)
- **Moralis NFT API**
- **Direct RPC** (ethers.js / viem `ownerOf` calls)
