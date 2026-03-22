# 🔧 PROMPT DE RECONSTRUCTION — Pulse Engine Admin Dashboard

> Ce prompt permet de recréer exactement l'application **Pulse Engine** (dashboard d'administration pour un bot Discord de gamification) dans un autre outil de génération de code (Bolt, Cursor, etc.).

---

## 📋 DESCRIPTION DU PROJET

**Pulse Engine** est un tableau de bord d'administration web pour un système de gamification Discord appelé "Pulse Engine" par "The Flippin' Labs".

L'application est un **dashboard admin dark-only** avec un thème **cyberpunk/futuriste** (cyan, violet, or) qui permet de :
- Gérer les membres Discord (points, rangs, streaks)
- Créer et gérer des missions (quotidiennes, hebdomadaires, flash)
- Gérer une boutique virtuelle avec une monnaie interne appelée "PULSE" (Pulse Token)
- Suivre les transactions PULSE
- Gérer les commandes / fulfillment
- Configurer 5 mini-jeux (Crash, Duel, Quiz Blitz, Treasure Drop, Typing Race)
- Consulter les logs d'audit
- Configurer le système (barème points, économie, anti-spam, decay, Pulse Hour, Flash Missions)

---

## 🛠️ STACK TECHNIQUE

- **Frontend** : React 18, TypeScript, Vite
- **UI** : Tailwind CSS 4, shadcn/ui (composants Radix UI)
- **State/Data** : TanStack React Query v5
- **Routing** : React Router DOM v7
- **Backend** : Supabase (Auth + PostgreSQL + RLS)
- **Icons** : Lucide React
- **Notifications** : Sonner (toasts)
- **Fonts** : Space Grotesk (display) + JetBrains Mono (monospace)

---

## 🎨 DESIGN SYSTEM — THÈME DARK-ONLY CYBERPUNK

### Variables CSS (HSL, dans `:root`)

```css
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --background: 225 25% 6%;
  --foreground: 210 20% 92%;
  --card: 225 22% 9%;
  --card-foreground: 210 20% 92%;
  --popover: 225 22% 11%;
  --popover-foreground: 210 20% 92%;
  --primary: 190 85% 58%;          /* Cyan */
  --primary-foreground: 225 25% 6%;
  --secondary: 225 18% 15%;
  --secondary-foreground: 210 15% 75%;
  --muted: 225 18% 13%;
  --muted-foreground: 220 12% 48%;
  --accent: 280 55% 62%;            /* Violet */
  --accent-foreground: 210 20% 95%;
  --destructive: 0 72% 55%;
  --destructive-foreground: 210 20% 95%;
  --success: 150 60% 45%;
  --success-foreground: 225 25% 6%;
  --warning: 36 92% 55%;            /* Or */
  --warning-foreground: 225 25% 6%;
  --border: 225 18% 16%;
  --input: 225 18% 14%;
  --ring: 190 85% 58%;
  --radius: 0.75rem;

  /* Sidebar */
  --sidebar-background: 225 25% 8%;
  --sidebar-foreground: 210 15% 65%;
  --sidebar-primary: 190 85% 58%;
  --sidebar-primary-foreground: 225 25% 6%;
  --sidebar-accent: 225 18% 13%;
  --sidebar-accent-foreground: 210 20% 92%;
  --sidebar-border: 225 18% 14%;
}
```

### Classes utilitaires custom

- `.glass` → `bg-card/60 backdrop-blur-xl border border-border/50`
- `.gradient-primary` → `linear-gradient(135deg, hsl(190 85% 58%), hsl(200 80% 48%))`
- `.gradient-accent` → `linear-gradient(135deg, hsl(280 55% 62%), hsl(310 50% 55%))`
- `.gradient-energy` → `linear-gradient(135deg, hsl(36 92% 55%), hsl(25 90% 50%))`
- `.gradient-success` → `linear-gradient(135deg, hsl(150 60% 45%), hsl(170 55% 40%))`
- `.gradient-logo` → `linear-gradient(135deg, cyan, violet, or)` — gradient signature utilisé sur le titre "Pulse Engine" et le bouton de login
- `.text-gradient-logo` → même gradient en text fill
- `.glow-primary` → `box-shadow: 0 0 20px hsl(190 85% 58% / 0.3)`
- `.glow-accent` → `box-shadow: 0 0 20px hsl(280 55% 62% / 0.3)`
- `.animate-slide-up` → slide up 0.4s (opacité 0→1, translateY 12px→0)
- `.animate-fade-in` → fade in 0.3s

---

## 🗄️ SCHÉMA DE BASE DE DONNÉES (Supabase PostgreSQL)

### Enums

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.game_session_status AS ENUM ('waiting', 'active', 'completed', 'cancelled');
CREATE TYPE public.order_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FULFILLED');
CREATE TYPE public.pulse_tx_type AS ENUM ('EARN_MISSION', 'EARN_VOICE', 'EARN_EVENT', 'ADMIN_GRANT', 'ADMIN_REVOKE', 'SPEND_SHOP', 'REFUND');
CREATE TYPE public.shop_item_category AS ENUM ('role', 'perk', 'ticket', 'cosmetic', 'irl');
```

### Tables

#### `discord_users`
```sql
CREATE TABLE public.discord_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT UNIQUE NOT NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  points_total INT DEFAULT 0,
  points_week INT DEFAULT 0,
  points_month INT DEFAULT 0,
  streak INT DEFAULT 0,
  rank_name TEXT,
  balance_pulse INT DEFAULT 0,
  lifetime_earned_pulse INT DEFAULT 0,
  lifetime_spent_pulse INT DEFAULT 0,
  joined_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `activity_events`
```sql
CREATE TABLE public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT REFERENCES discord_users(discord_id) NOT NULL,
  type TEXT NOT NULL,
  points_awarded INT DEFAULT 0,
  channel_id TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `missions`
```sql
CREATE TABLE public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT DEFAULT 'daily',        -- daily | weekly | flash
  reward_points INT DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  start_at TIMESTAMPTZ DEFAULT now(),
  end_at TIMESTAMPTZ NOT NULL,
  rules_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `mission_completions`
```sql
CREATE TABLE public.mission_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES missions(id) NOT NULL,
  discord_id TEXT REFERENCES discord_users(discord_id) NOT NULL,
  status TEXT DEFAULT 'pending',    -- pending | completed
  proof_json JSONB,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `shop_items`
```sql
CREATE TABLE public.shop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category shop_item_category DEFAULT 'perk',
  price_pulse INT DEFAULT 50,
  stock_total INT,                  -- NULL = illimité
  stock_remaining INT,
  max_per_user INT,
  cooldown_hours INT,
  is_active BOOLEAN DEFAULT true,
  is_limited_drop BOOLEAN DEFAULT false,
  available_from TIMESTAMPTZ,
  available_until TIMESTAMPTZ,
  auto_apply BOOLEAN DEFAULT true,
  image_url TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `orders`
```sql
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  item_id UUID REFERENCES shop_items(id) NOT NULL,
  pulse_spent INT DEFAULT 0,
  status order_status DEFAULT 'PENDING',
  notes TEXT,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `pulse_transactions`
```sql
CREATE TABLE public.pulse_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  type pulse_tx_type NOT NULL,
  amount INT NOT NULL,
  balance_after INT DEFAULT 0,
  reason TEXT,
  ref_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `games_config`
```sql
CREATE TABLE public.games_config (
  game_key TEXT PRIMARY KEY,        -- crash, duel, quiz, treasure_drop, typing_race
  config_json JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### `game_sessions`
```sql
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_key TEXT REFERENCES games_config(game_key) NOT NULL,
  channel_id TEXT,
  status game_session_status DEFAULT 'waiting',
  state_json JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `game_players`
```sql
CREATE TABLE public.game_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) NOT NULL,
  discord_id TEXT NOT NULL,
  bet_amount INT DEFAULT 0,
  payout INT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT now()
);
```

#### `game_results`
```sql
CREATE TABLE public.game_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES game_sessions(id) NOT NULL,
  outcome_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `quiz_questions`
```sql
CREATE TABLE public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  choices_json JSONB DEFAULT '[]',   -- tableau de 4 strings
  correct_index INT DEFAULT 0,
  difficulty TEXT DEFAULT 'medium',  -- easy | medium | hard
  category TEXT DEFAULT 'general',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `roles_config`
```sql
CREATE TABLE public.roles_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rank_name TEXT NOT NULL,
  threshold INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  discord_role_id TEXT,
  color TEXT
);
```

#### `settings`
```sql
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value_json JSONB DEFAULT '{}'
);
-- Clés attendues : points_config, economy, anti_spam, decay, pulse_hour, flash_missions
```

#### `audit_logs`
```sql
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  admin_user_id TEXT,
  admin_discord_id TEXT,
  target_discord_id TEXT,
  payload_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `profiles` (pour les admins Supabase Auth)
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,     -- référence auth.users(id)
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_roles` (RBAC)
```sql
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,            -- référence auth.users(id)
  role app_role DEFAULT 'user',
  UNIQUE(user_id, role)
);
```

#### `user_purchases`
```sql
CREATE TABLE public.user_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  item_id UUID REFERENCES shop_items(id) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  purchased_at TIMESTAMPTZ DEFAULT now()
);
```

#### `user_game_limits`
```sql
CREATE TABLE public.user_game_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL,
  limit_key TEXT NOT NULL,
  count INT DEFAULT 0,
  reset_at TIMESTAMPTZ DEFAULT now()
);
```

### Fonction SQL RBAC

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

---

## 🔐 AUTHENTIFICATION

- **Supabase Auth** avec email/password uniquement (pas de signup public, pas d'auto-confirm)
- Page `/login` avec formulaire email + mot de passe + toggle show/hide password
- `AuthGuard` component qui protège toutes les routes sauf `/login`
- Déconnexion via `supabase.auth.signOut()` dans la sidebar

---

## 🌐 SYSTÈME i18n (FR/EN)

### Architecture
- `LanguageContext.tsx` : Context React avec `locale`, `setLocale`, `t(obj)` helper
- `translations.ts` : Fichier centralisé avec toutes les traductions structurées par section
- Persistance locale via `localStorage` clé `"pulse-lang"`
- `LanguageSwitcher` component : bouton Globe dropdown avec 🇫🇷 Français / 🇬🇧 English

### Utilisation dans les composants
```tsx
const { t, locale } = useLanguage();
const L = translations.overview;
// Puis : t(L.title) → renvoie la string dans la locale courante
```

### Toutes les traductions sont déjà définies pour :
- Navigation (sidebar)
- Login
- Overview
- Configuration (6 sections)
- Missions
- Boutique (avec catégories)
- Transactions (avec types)
- Commandes (avec statuts)
- Utilisateurs
- Logs
- Mini-Jeux
- Noms des jours

---

## 📐 ARCHITECTURE DES PAGES

### Layout commun : `DashboardLayout`
- Sidebar fixe à gauche (260px) sur desktop, drawer mobile avec overlay
- Header avec titre + sous-titre + `LanguageSwitcher` à droite
- Zone de contenu avec padding et animation `animate-fade-in`

### Sidebar (`DashboardSidebar`)
- Logo Pulse Engine (image) + titre gradient + "by The Flippin' Labs"
- 9 liens de navigation avec icônes Lucide
- Bouton déconnexion en footer
- Mobile : burger menu en haut, overlay sombre, transition slide

### Pages (9 pages + Login + NotFound) :

#### 1. `/` — Overview
- 6 StatCards en grille (Membres, Missions actives, Items boutique, Commandes en attente, Messages aujourd'hui [—], Vocal aujourd'hui [—])
- Bloc "Top membres" (top 5 par points, badges gradient pour top 3)
- Bloc "Pulse Hour" (affiche le schedule si activé)
- Bloc "Activité récente" (derniers 5 events)

#### 2. `/configuration` — Configuration
- 6 blocs JSON éditables (points_config, economy, anti_spam, decay, pulse_hour, flash_missions)
- Chaque bloc a un bouton Modifier/Sauver qui passe en mode textarea JSON
- Tableau des rôles dynamiques (`roles_config`) en lecture seule

#### 3. `/missions` — Missions
- Compteur de missions + bouton "Nouvelle mission"
- Formulaire : titre, type (daily/weekly/flash), description, reward_points, date de fin
- Liste des missions avec badge type coloré, points, compteur de complétion, statut actif/inactif
- Suppression par icône poubelle

#### 4. `/boutique` — Boutique
- Filtres par catégorie (Tous, Rôle, Perk, Ticket, Cosmétique, IRL)
- Bouton "Nouvel item" → formulaire complet (nom, catégorie, prix PULSE, description, stock, max/user, cooldown, checkboxes actif/auto-apply/limited-drop, dates limited drop, metadata JSON)
- Grille de cards avec badge catégorie, prix PULSE, stock, statut, badge "⚡ Limited Drop"
- Édition inline et suppression

#### 5. `/transactions` — Transactions
- Barre de recherche + filtre par type (dropdown) + bouton Export CSV
- Tableau : Date, Discord ID, Type (coloré), Montant (vert ↑ / rouge ↓), Solde après, Raison

#### 6. `/commandes` — Commandes
- Filtres par statut (Toutes, En attente, Approuvée, Refusée, Livrée)
- Cards avec badge statut, nom item, discord_id, PULSE dépensé, notes
- Actions contextuelles : Approuver/Refuser (si PENDING), Marquer livré (si APPROVED)

#### 7. `/mini-jeux` — Mini-Jeux
- 4 StatCards (Jeux actifs, Sessions totales, En cours, Terminées)
- 3 onglets (Tabs shadcn) :
  - **Configuration** : Cards par jeu (crash, duel, quiz, treasure_drop, typing_race) avec icône, toggle on/off, config JSON éditable par champ
  - **Quiz Manager** : Formulaire ajout/édition question (4 choix, correct index, difficulté, catégorie) + liste questions avec badges
  - **Sessions récentes** : Tableau des 50 dernières sessions

#### 8. `/utilisateurs` — Utilisateurs
- Recherche + Export CSV
- Tableau clickable (username, discord_id, rang, points, PULSE, streak)
- Panel détail à droite : avatar, stats grid (total/week/month/streak), wallet PULSE (solde/gagné/dépensé), rang, activité récente

#### 9. `/logs` — Logs
- 2 onglets : Audit / Erreurs
- Audit : tableau (date, action badge, admin, cible, détails JSON)
- Erreurs : placeholder "Les erreurs du bot apparaîtront ici"

---

## 🧩 COMPOSANTS RÉUTILISABLES

### `StatCard`
Props : `title`, `value`, `subtitle?`, `icon`, `trend?`, `variant` (default/primary/accent/success/warning)
- Container `.glass` avec border variant et glow
- Icône dans un carré gradient coloré selon variant

### `LanguageSwitcher`
- Bouton Globe + flag + code langue
- Dropdown custom avec les 2 langues, fermeture on click outside

### `AuthGuard`
- Écoute `onAuthStateChange` + `getSession`
- Spinner de chargement centré
- Redirect vers `/login` si pas de session

---

## 📦 DONNÉES DE SEED ATTENDUES

Les tables `settings` doivent contenir ces clés pré-remplies :
- `points_config` : barème des points par action
- `economy` : caps, gains et multiplicateurs PULSE
- `anti_spam` : protection farming
- `decay` : perte d'inactivité
- `pulse_hour` : événement multiplicateur récurrent (schedule avec day + hour)
- `flash_missions` : config missions surprises auto

La table `games_config` doit contenir 5 entrées :
- `crash` : min_bet, max_bet, crash_min, crash_max, fee_percent, cooldown_seconds
- `duel` : min_bet, max_bet, modes, fee_percent, timeout_seconds
- `quiz` : questions_per_round, time_per_question_seconds, rewards (array top 3)
- `treasure_drop` : min_reward, max_reward, drops_per_day_min/max, channels_whitelist
- `typing_race` : fixed_reward, max_players, join_timeout_seconds

---

## ⚡ INSTRUCTIONS DE GÉNÉRATION

1. Créer le projet React + Vite + TypeScript + Tailwind
2. Installer shadcn/ui et configurer les composants nécessaires (Badge, Button, Switch, Tabs, Toaster)
3. Mettre en place le thème dark-only cyberpunk avec toutes les variables CSS ci-dessus
4. Créer la base de données Supabase avec toutes les tables, enums et RLS
5. Implémenter le système i18n complet (LanguageContext + translations + LanguageSwitcher)
6. Créer l'AuthGuard et la page Login
7. Créer le DashboardLayout + DashboardSidebar
8. Implémenter les 9 pages une par une avec les composants StatCard réutilisables
9. Toutes les requêtes data doivent utiliser TanStack Query + Supabase client
10. Toutes les mutations doivent invalider les queries concernées et afficher des toasts Sonner
11. L'app doit être 100% responsive (grilles adaptatives, sidebar drawer mobile)

---

*Généré depuis le projet FlippinPulse — Pulse Engine Admin Dashboard*
