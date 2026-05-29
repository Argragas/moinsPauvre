# MoinsPauvre Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PWA mobile permettant de stocker et afficher des codes de réduction / cartes cadeaux groupés par enseigne, avec mode famille et import cashback.

**Architecture:** Architecture centré-enseigne. Chaque enseigne regroupe ses codes, cartes cadeaux et taux cashback. Supabase gère l'auth, la DB et le RLS (chaque user voit uniquement ses données + les données familiales partagées). Les barcodes sont générés côté client par `bwip-js` et affichés en plein écran pour scan en magasin.

**Tech Stack:** React 18 + Vite + TypeScript, TailwindCSS, Supabase (PostgreSQL + Auth + Edge Functions + RLS), bwip-js, vite-plugin-pwa, Vitest + @testing-library/react

---

## Structure de fichiers

```
src/
  main.tsx                      -- entry point + router
  App.tsx                       -- auth gate + layout wrapper
  lib/
    supabase.ts                 -- supabase client singleton
    types.ts                    -- tous les types TypeScript partagés
  hooks/
    useAuth.ts                  -- état auth, login, logout, register
    useEnseignes.ts             -- CRUD enseignes + recherche live
    useCartes.ts                -- CRUD cartes cadeaux
    useCodes.ts                 -- CRUD codes promo
    useUtilisations.ts          -- historique + ajout utilisation
    useFamille.ts               -- create/join famille, membres
    useCashback.ts              -- lecture + mise à jour cashback
    useArchives.ts              -- liste archives, restauration
  pages/
    LoginPage.tsx               -- login + register
    AccueilPage.tsx             -- liste enseignes + recherche
    EnseignePage.tsx            -- fiche enseigne (cartes + codes + cashback)
    AjoutPage.tsx               -- formulaire ajout carte ou code
    BarcodePage.tsx             -- affichage barcode plein écran
    HistoriquePage.tsx          -- historique utilisations d'une carte
    FamillePage.tsx             -- gestion famille
    CashbackPage.tsx            -- sources cashback + taux
    ArchivesPage.tsx            -- codes/cartes archivés
  components/
    Layout.tsx                  -- wrapper avec BottomNav
    BottomNav.tsx               -- navigation bas d'écran (Accueil / Famille / Cashback / Archives)
    EnseigneCard.tsx            -- ligne enseigne dans la liste accueil
    CarteCard.tsx               -- carte cadeau avec solde restant
    CodeCard.tsx                -- code promo avec valeur
    BarcodeDisplay.tsx          -- rendu bwip-js dans canvas
    VisibilityBadge.tsx         -- badge 👨‍👩‍👧 si visibility='family'
    SearchBar.tsx               -- input de recherche live
    UtilisationForm.tsx         -- formulaire ajout utilisation
supabase/
  migrations/
    20260529000001_schema.sql   -- tables + contraintes
    20260529000002_rls.sql      -- politiques RLS
    20260529000003_trigger.sql  -- trigger montant_restant
  functions/
    import-cashback/
      index.ts                  -- Edge Function import iGraal/Widilo
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/lib/supabase.ts`, `src/lib/types.ts`, `.env.example`

- [ ] **Step 1: Créer le projet Vite**

```bash
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Installer les dépendances**

```bash
npm install
npm install @supabase/supabase-js react-router-dom bwip-js
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
npm install vite-plugin-pwa workbox-window
npm install tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: Configurer Vite avec TailwindCSS et PWA**

`vite.config.ts`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'MoinsPauvre',
        short_name: 'MoinsPauvre',
        theme_color: '#0f3460',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache', expiration: { maxAgeSeconds: 60 * 60 * 24 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 4: Fichier setup tests**

`src/test-setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Types partagés**

`src/lib/types.ts`:
```ts
export type BarcodeFormat = 'EAN13' | 'CODE128' | 'QR' | 'AZTEC'
export type Visibility = 'personal' | 'family'
export type FamilleRole = 'owner' | 'member'
export type CashbackSource = 'manual' | 'igraal' | 'widilo'
export type TypeValeur = 'pct' | 'eur'

export interface Enseigne {
  id: string
  user_id: string
  nom: string
  logo_url: string | null
  cashback_pct: number | null
  cashback_source: CashbackSource | null
  cashback_source_id: string | null
  created_at: string
}

export interface CarteCadeau {
  id: string
  enseigne_id: string
  user_id: string
  label: string | null
  code: string
  format_barcode: BarcodeFormat
  montant_initial: number
  montant_restant: number
  visibility: Visibility
  famille_id: string | null
  archived_at: string | null
  archived_by: string | null
  created_at: string
}

export interface Utilisation {
  id: string
  carte_id: string
  user_id: string
  montant: number
  note: string | null
  date: string
  created_at: string
}

export interface CodePromo {
  id: string
  enseigne_id: string
  user_id: string
  code: string
  format_barcode: BarcodeFormat
  valeur: number | null
  type_valeur: TypeValeur | null
  visibility: Visibility
  famille_id: string | null
  archived_at: string | null
  archived_by: string | null
  created_at: string
}

export interface Famille {
  id: string
  nom: string
  created_by: string
  invite_code: string
  created_at: string
}

export interface FamilleMembre {
  famille_id: string
  user_id: string
  role: FamilleRole
  joined_at: string
}
```

- [ ] **Step 6: Client Supabase**

`src/lib/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 7: Fichier .env.example**

`.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

- [ ] **Step 8: Vérifier que le projet compile**

```bash
npm run build
```
Expected: Build successful, no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold React/Vite/TailwindCSS/Supabase/PWA project"
```

---

## Task 2: Schéma DB, RLS et Trigger

**Files:**
- Create: `supabase/migrations/20260529000001_schema.sql`
- Create: `supabase/migrations/20260529000002_rls.sql`
- Create: `supabase/migrations/20260529000003_trigger.sql`

- [ ] **Step 1: Initialiser Supabase CLI et démarrer local**

```bash
npx supabase init
npx supabase start
```
Expected: Local Supabase running on http://localhost:54321. Note les valeurs `anon key` et `API URL` affichées — copie-les dans `.env.local`.

- [ ] **Step 2: Migration schéma**

`supabase/migrations/20260529000001_schema.sql`:
```sql
create extension if not exists "pgcrypto";

-- Familles
create table familles (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  created_by uuid references auth.users not null,
  invite_code text unique not null default upper(substring(gen_random_uuid()::text, 1, 4)),
  created_at timestamptz default now()
);

create table famille_membres (
  famille_id uuid references familles on delete cascade,
  user_id uuid references auth.users not null,
  role text not null check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (famille_id, user_id)
);

-- Enseignes
create table enseignes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  nom text not null,
  logo_url text,
  cashback_pct numeric,
  cashback_source text check (cashback_source in ('manual', 'igraal', 'widilo')),
  cashback_source_id text,
  created_at timestamptz default now()
);

-- Cartes cadeaux
create table cartes_cadeaux (
  id uuid primary key default gen_random_uuid(),
  enseigne_id uuid references enseignes on delete cascade not null,
  user_id uuid references auth.users not null,
  label text,
  code text not null,
  format_barcode text not null check (format_barcode in ('EAN13', 'CODE128', 'QR', 'AZTEC')),
  montant_initial numeric not null check (montant_initial >= 0),
  montant_restant numeric not null check (montant_restant >= 0),
  visibility text not null default 'personal' check (visibility in ('personal', 'family')),
  famille_id uuid references familles,
  archived_at timestamptz,
  archived_by uuid references auth.users,
  created_at timestamptz default now()
);

-- Utilisations
create table utilisations (
  id uuid primary key default gen_random_uuid(),
  carte_id uuid references cartes_cadeaux on delete cascade not null,
  user_id uuid references auth.users not null,
  montant numeric not null check (montant > 0),
  note text,
  date date not null,
  created_at timestamptz default now()
);

-- Codes promo
create table codes_promo (
  id uuid primary key default gen_random_uuid(),
  enseigne_id uuid references enseignes on delete cascade not null,
  user_id uuid references auth.users not null,
  code text not null,
  format_barcode text not null check (format_barcode in ('EAN13', 'CODE128', 'QR', 'AZTEC')),
  valeur numeric,
  type_valeur text check (type_valeur in ('pct', 'eur')),
  visibility text not null default 'personal' check (visibility in ('personal', 'family')),
  famille_id uuid references familles,
  archived_at timestamptz,
  archived_by uuid references auth.users,
  created_at timestamptz default now()
);
```

- [ ] **Step 3: Migration RLS**

`supabase/migrations/20260529000002_rls.sql`:
```sql
-- Helper: retourne la famille_id de l'utilisateur courant
create or replace function get_user_famille_id()
returns uuid language sql security definer stable as $$
  select famille_id from famille_membres where user_id = auth.uid() limit 1;
$$;

-- Enseignes
alter table enseignes enable row level security;
create policy "owner" on enseignes for all using (user_id = auth.uid());

-- Familles
alter table familles enable row level security;
create policy "member_read" on familles for select
  using (id in (select famille_id from famille_membres where user_id = auth.uid()));
create policy "owner_all" on familles for all using (created_by = auth.uid());

-- Famille membres
alter table famille_membres enable row level security;
create policy "member_read" on famille_membres for select
  using (famille_id in (select famille_id from famille_membres where user_id = auth.uid()));
create policy "owner_manage" on famille_membres for all
  using (famille_id in (select id from familles where created_by = auth.uid()));
create policy "self_insert" on famille_membres for insert with check (user_id = auth.uid());

-- Cartes cadeaux
alter table cartes_cadeaux enable row level security;
create policy "personal_owner" on cartes_cadeaux for all
  using (visibility = 'personal' and user_id = auth.uid());
create policy "family_member" on cartes_cadeaux for all
  using (
    visibility = 'family'
    and famille_id = get_user_famille_id()
  );

-- Utilisations
alter table utilisations enable row level security;
create policy "carte_owner" on utilisations for all
  using (
    carte_id in (
      select id from cartes_cadeaux
      where user_id = auth.uid()
         or (visibility = 'family' and famille_id = get_user_famille_id())
    )
  );

-- Codes promo
alter table codes_promo enable row level security;
create policy "personal_owner" on codes_promo for all
  using (visibility = 'personal' and user_id = auth.uid());
create policy "family_member" on codes_promo for all
  using (
    visibility = 'family'
    and famille_id = get_user_famille_id()
  );
```

- [ ] **Step 4: Migration trigger montant_restant**

`supabase/migrations/20260529000003_trigger.sql`:
```sql
create or replace function update_montant_restant()
returns trigger language plpgsql as $$
begin
  update cartes_cadeaux
  set montant_restant = montant_restant - NEW.montant
  where id = NEW.carte_id;
  return NEW;
end;
$$;

create trigger trg_update_montant_restant
after insert on utilisations
for each row execute function update_montant_restant();
```

- [ ] **Step 5: Appliquer les migrations**

```bash
npx supabase db push
```
Expected: `Applying migration 20260529000001_schema.sql... done` (x3)

- [ ] **Step 6: Vérifier le trigger manuellement**

```bash
npx supabase db reset
npx supabase db push
```
Ouvre le Supabase Studio local (http://localhost:54323), insère une carte_cadeau avec montant_initial=100, montant_restant=100, puis une utilisation de 20. Vérifie que montant_restant passe à 80.

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add DB schema, RLS policies, and montant_restant trigger"
```

---

## Task 3: Auth — Login / Register

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/pages/LoginPage.tsx`
- Create: `src/App.tsx`
- Create: `src/main.tsx`
- Test: `src/hooks/useAuth.test.ts`

- [ ] **Step 1: Écrire le test du hook useAuth**

`src/hooks/useAuth.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

describe('useAuth', () => {
  it('initialise avec session null', async () => {
    const { result } = renderHook(() => useAuth())
    expect(result.current.session).toBeNull()
  })

  it('appelle signInWithPassword avec les bons params', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValueOnce({ data: { session: null, user: null }, error: null })
    const { result } = renderHook(() => useAuth())
    await act(async () => {
      await result.current.login('test@test.com', 'password')
    })
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password' })
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npx vitest run src/hooks/useAuth.test.ts
```
Expected: FAIL — `useAuth` not found

- [ ] **Step 3: Implémenter useAuth**

`src/hooks/useAuth.ts`:
```ts
import { useEffect, useState } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const login = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password })

  const register = (email: string, password: string) =>
    supabase.auth.signUp({ email, password })

  const logout = () => supabase.auth.signOut()

  return { session, loading, login, register, logout }
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
npx vitest run src/hooks/useAuth.test.ts
```
Expected: PASS

- [ ] **Step 5: Page Login**

`src/pages/LoginPage.tsx`:
```tsx
import { useState, FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'

export function LoginPage() {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const fn = mode === 'login' ? login : register
    const { error } = await fn(email, password)
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-8 text-center">MoinsPauvre</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-slate-800 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-violet-500"
            required
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg py-3 transition-colors">
            {mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </button>
        </form>
        <button
          onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
          className="w-full mt-4 text-slate-400 text-sm hover:text-white transition-colors"
        >
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : 'Déjà un compte ? Se connecter'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: App.tsx avec auth gate**

`src/App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { AccueilPage } from './pages/AccueilPage'
import { EnseignePage } from './pages/EnseignePage'
import { AjoutPage } from './pages/AjoutPage'
import { BarcodePage } from './pages/BarcodePage'
import { HistoriquePage } from './pages/HistoriquePage'
import { FamillePage } from './pages/FamillePage'
import { CashbackPage } from './pages/CashbackPage'
import { ArchivesPage } from './pages/ArchivesPage'
import { Layout } from './components/Layout'

function ProtectedRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<AccueilPage />} />
        <Route path="/enseigne/:id" element={<EnseignePage />} />
        <Route path="/ajout" element={<AjoutPage />} />
        <Route path="/barcode/:type/:id" element={<BarcodePage />} />
        <Route path="/historique/:carteId" element={<HistoriquePage />} />
        <Route path="/famille" element={<FamillePage />} />
        <Route path="/cashback" element={<CashbackPage />} />
        <Route path="/archives" element={<ArchivesPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  )
}

export function App() {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-slate-900" />
  return (
    <BrowserRouter>
      {session ? <ProtectedRoutes /> : <LoginPage />}
    </BrowserRouter>
  )
}
```

- [ ] **Step 7: main.tsx**

`src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 8: Créer des placeholders pour les pages non encore implémentées**

Crée ces fichiers avec un contenu minimal pour que `App.tsx` compile :

`src/pages/AccueilPage.tsx`:
```tsx
export function AccueilPage() { return <div className="p-4 text-white">Accueil</div> }
```

Répète pour : `EnseignePage.tsx`, `AjoutPage.tsx`, `BarcodePage.tsx`, `HistoriquePage.tsx`, `FamillePage.tsx`, `CashbackPage.tsx`, `ArchivesPage.tsx`.

`src/components/Layout.tsx`:
```tsx
import { ReactNode } from 'react'
export function Layout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-slate-900">{children}</div>
}
```

- [ ] **Step 9: Vérifier que l'app compile et que la page login s'affiche**

```bash
npm run dev
```
Ouvre http://localhost:5173 — la page login doit s'afficher.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add auth with Supabase, login/register page, protected routes"
```

---

## Task 4: Layout + BottomNav

**Files:**
- Modify: `src/components/Layout.tsx`
- Create: `src/components/BottomNav.tsx`

- [ ] **Step 1: BottomNav**

`src/components/BottomNav.tsx`:
```tsx
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil', icon: '🏪' },
  { to: '/famille', label: 'Famille', icon: '👨‍👩‍👧' },
  { to: '/cashback', label: 'Cashback', icon: '💰' },
  { to: '/archives', label: 'Archives', icon: '📦' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 flex">
      {links.map(({ to, label, icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs transition-colors ${isActive ? 'text-violet-400' : 'text-slate-400'}`
          }
        >
          <span className="text-lg mb-0.5">{icon}</span>
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Layout avec BottomNav**

`src/components/Layout.tsx`:
```tsx
import { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
```

- [ ] **Step 3: Vérifier visuellement**

```bash
npm run dev
```
Connecte-toi. La barre de navigation doit apparaître en bas avec 4 onglets.

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "feat: add bottom navigation bar"
```

---

## Task 5: Enseignes CRUD + Page Accueil

**Files:**
- Create: `src/hooks/useEnseignes.ts`
- Modify: `src/pages/AccueilPage.tsx`
- Create: `src/components/EnseigneCard.tsx`
- Create: `src/components/SearchBar.tsx`
- Test: `src/hooks/useEnseignes.test.ts`

- [ ] **Step 1: Écrire le test du hook**

`src/hooks/useEnseignes.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mockEnseignes = [
  { id: '1', nom: 'Fnac', logo_url: null, cashback_pct: 5, cashback_source: 'igraal', user_id: 'u1', created_at: '' },
]

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      ilike: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockEnseignes[0], error: null }),
      order: vi.fn().mockResolvedValue({ data: mockEnseignes, error: null }),
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  },
}))

import { useEnseignes } from './useEnseignes'

describe('useEnseignes', () => {
  it('charge les enseignes au montage', async () => {
    const { result } = renderHook(() => useEnseignes())
    await waitFor(() => expect(result.current.enseignes).toHaveLength(1))
    expect(result.current.enseignes[0].nom).toBe('Fnac')
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npx vitest run src/hooks/useEnseignes.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implémenter useEnseignes**

`src/hooks/useEnseignes.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Enseigne } from '../lib/types'

export function useEnseignes(search = '') {
  const [enseignes, setEnseignes] = useState<Enseigne[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    let query = supabase.from('enseignes').select('*').order('nom')
    if (search) query = query.ilike('nom', `%${search}%`)
    const { data } = await query
    setEnseignes(data ?? [])
    setLoading(false)
  }, [search])

  useEffect(() => { load() }, [load])

  const addEnseigne = async (nom: string) => {
    const logo_url = `https://logo.clearbit.com/${nom.toLowerCase().replace(/\s/g, '')}.com`
    const { data, error } = await supabase
      .from('enseignes')
      .insert({ nom, logo_url })
      .select()
      .single()
    if (!error && data) setEnseignes(prev => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)))
    return { data, error }
  }

  return { enseignes, loading, addEnseigne, reload: load }
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
npx vitest run src/hooks/useEnseignes.test.ts
```
Expected: PASS

- [ ] **Step 5: SearchBar component**

`src/components/SearchBar.tsx`:
```tsx
interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = 'Rechercher...' }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-800 text-white rounded-lg pl-9 pr-4 py-3 outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-500"
      />
    </div>
  )
}
```

- [ ] **Step 6: EnseigneCard component**

`src/components/EnseigneCard.tsx`:
```tsx
import { Enseigne } from '../lib/types'

interface Props {
  enseigne: Enseigne
  nbCartes: number
  nbCodes: number
  onClick: () => void
}

export function EnseigneCard({ enseigne, nbCartes, nbCodes, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full bg-slate-800 rounded-xl p-4 flex items-center gap-3 hover:bg-slate-700 transition-colors text-left"
    >
      {enseigne.logo_url ? (
        <img
          src={enseigne.logo_url}
          alt={enseigne.nom}
          className="w-10 h-10 rounded-lg object-contain bg-white p-1"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-slate-600 flex items-center justify-center text-lg">🛍</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{enseigne.nom}</p>
        <p className="text-sm text-slate-400">
          {[
            nbCartes > 0 && `${nbCartes} carte${nbCartes > 1 ? 's' : ''}`,
            nbCodes > 0 && `${nbCodes} code${nbCodes > 1 ? 's' : ''}`,
          ].filter(Boolean).join(' · ') || 'Aucun code'}
        </p>
      </div>
      {enseigne.cashback_pct && (
        <span className="text-green-400 text-sm font-semibold shrink-0">{enseigne.cashback_pct}%</span>
      )}
      <span className="text-slate-500">›</span>
    </button>
  )
}
```

- [ ] **Step 7: Page Accueil**

`src/pages/AccueilPage.tsx`:
```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEnseignes } from '../hooks/useEnseignes'
import { SearchBar } from '../components/SearchBar'
import { EnseigneCard } from '../components/EnseigneCard'

export function AccueilPage() {
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newNom, setNewNom] = useState('')
  const { enseignes, loading, addEnseigne } = useEnseignes(search)
  const navigate = useNavigate()

  const handleAdd = async () => {
    if (!newNom.trim()) return
    await addEnseigne(newNom.trim())
    setNewNom('')
    setShowAdd(false)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold">Mes enseignes</h1>
        <button onClick={() => setShowAdd(true)} className="bg-violet-600 rounded-full w-8 h-8 flex items-center justify-center text-lg">+</button>
      </div>
      <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une enseigne..." />
      {showAdd && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={newNom}
            onChange={e => setNewNom(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nom de l'enseigne"
            className="flex-1 bg-slate-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-violet-500"
          />
          <button onClick={handleAdd} className="bg-violet-600 rounded-lg px-3 py-2 text-sm">Ajouter</button>
          <button onClick={() => setShowAdd(false)} className="text-slate-400 px-2">✕</button>
        </div>
      )}
      {loading ? (
        <div className="text-slate-400 text-center py-8">Chargement...</div>
      ) : enseignes.length === 0 ? (
        <div className="text-slate-400 text-center py-8">
          {search ? 'Aucune enseigne trouvée' : 'Ajoute ta première enseigne'}
        </div>
      ) : (
        <div className="space-y-2">
          {enseignes.map(e => (
            <EnseigneCard
              key={e.id}
              enseigne={e}
              nbCartes={0}
              nbCodes={0}
              onClick={() => navigate(`/enseigne/${e.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
```

Note : `nbCartes` et `nbCodes` sont à 0 pour l'instant — mis à jour en Task 7 une fois les hooks cartes/codes créés.

- [ ] **Step 8: Vérifier visuellement**

```bash
npm run dev
```
Connecte-toi, ajoute "Fnac" — doit apparaître dans la liste avec logo Clearbit.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useEnseignes.ts src/hooks/useEnseignes.test.ts src/pages/AccueilPage.tsx src/components/EnseigneCard.tsx src/components/SearchBar.tsx
git commit -m "feat: add enseignes CRUD, home page with live search"
```

---

## Task 6: BarcodeDisplay component

**Files:**
- Create: `src/components/BarcodeDisplay.tsx`
- Create: `src/components/VisibilityBadge.tsx`
- Test: `src/components/BarcodeDisplay.test.tsx`

- [ ] **Step 1: Écrire le test**

`src/components/BarcodeDisplay.test.tsx`:
```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('bwip-js', () => ({
  default: { toCanvas: vi.fn() },
}))

import { BarcodeDisplay } from './BarcodeDisplay'

describe('BarcodeDisplay', () => {
  it('affiche un canvas', () => {
    render(<BarcodeDisplay code="123456789012" format="EAN13" />)
    expect(screen.getByRole('img', { hidden: true })).toBeDefined()
  })

  it('affiche le code en texte', () => {
    render(<BarcodeDisplay code="123456789012" format="EAN13" />)
    expect(screen.getByText('123456789012')).toBeDefined()
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npx vitest run src/components/BarcodeDisplay.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Implémenter BarcodeDisplay**

`src/components/BarcodeDisplay.tsx`:
```tsx
import { useEffect, useRef } from 'react'
import bwipjs from 'bwip-js'
import { BarcodeFormat } from '../lib/types'

const FORMAT_MAP: Record<BarcodeFormat, string> = {
  EAN13: 'ean13',
  CODE128: 'code128',
  QR: 'qrcode',
  AZTEC: 'azteccode',
}

interface Props {
  code: string
  format: BarcodeFormat
  className?: string
}

export function BarcodeDisplay({ code, format, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return
    try {
      bwipjs.toCanvas(canvasRef.current, {
        bcid: FORMAT_MAP[format],
        text: code,
        scale: 3,
        height: 15,
        includetext: false,
      })
    } catch {
      // code invalide pour le format — canvas reste vide
    }
  }, [code, format])

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <canvas ref={canvasRef} aria-hidden="true" className="max-w-full" />
      <p className="font-mono text-sm text-slate-600">{code}</p>
    </div>
  )
}
```

- [ ] **Step 4: VisibilityBadge**

`src/components/VisibilityBadge.tsx`:
```tsx
export function VisibilityBadge() {
  return (
    <span className="text-xs bg-violet-900 text-violet-300 rounded-full px-2 py-0.5">
      👨‍👩‍👧 Famille
    </span>
  )
}
```

- [ ] **Step 5: Vérifier que le test passe**

```bash
npx vitest run src/components/BarcodeDisplay.test.tsx
```
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/BarcodeDisplay.tsx src/components/BarcodeDisplay.test.tsx src/components/VisibilityBadge.tsx
git commit -m "feat: add BarcodeDisplay component with bwip-js"
```

---

## Task 7: Codes promo + Cartes cadeaux CRUD — hooks et composants

**Files:**
- Create: `src/hooks/useCartes.ts`
- Create: `src/hooks/useCodes.ts`
- Create: `src/components/CarteCard.tsx`
- Create: `src/components/CodeCard.tsx`
- Test: `src/hooks/useCartes.test.ts`

- [ ] **Step 1: Écrire le test useCartes**

`src/hooks/useCartes.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'

const mockCartes = [
  { id: '1', enseigne_id: 'e1', user_id: 'u1', label: 'Ma carte', code: '123', format_barcode: 'EAN13', montant_initial: 50, montant_restant: 45, visibility: 'personal', famille_id: null, archived_at: null, archived_by: null, created_at: '' },
]

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockCartes[0], error: null }),
      order: vi.fn().mockResolvedValue({ data: mockCartes, error: null }),
    }),
  },
}))

import { useCartes } from './useCartes'

describe('useCartes', () => {
  it('charge les cartes non archivées pour une enseigne', async () => {
    const { result } = renderHook(() => useCartes('e1'))
    await waitFor(() => expect(result.current.cartes).toHaveLength(1))
    expect(result.current.cartes[0].montant_restant).toBe(45)
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npx vitest run src/hooks/useCartes.test.ts
```
Expected: FAIL

- [ ] **Step 3: Implémenter useCartes**

`src/hooks/useCartes.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CarteCadeau, BarcodeFormat, Visibility } from '../lib/types'

export function useCartes(enseigneId: string) {
  const [cartes, setCartes] = useState<CarteCadeau[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('cartes_cadeaux')
      .select('*')
      .eq('enseigne_id', enseigneId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    setCartes(data ?? [])
    setLoading(false)
  }, [enseigneId])

  useEffect(() => { load() }, [load])

  const addCarte = async (params: {
    label: string
    code: string
    format_barcode: BarcodeFormat
    montant_initial: number
    visibility: Visibility
    famille_id?: string | null
  }) => {
    const { data, error } = await supabase
      .from('cartes_cadeaux')
      .insert({ ...params, enseigne_id: enseigneId, montant_restant: params.montant_initial })
      .select()
      .single()
    if (!error && data) setCartes(prev => [data, ...prev])
    return { data, error }
  }

  const archiver = async (id: string, userId: string) => {
    const { error } = await supabase
      .from('cartes_cadeaux')
      .update({ archived_at: new Date().toISOString(), archived_by: userId })
      .eq('id', id)
    if (!error) setCartes(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { cartes, loading, addCarte, archiver, reload: load }
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
npx vitest run src/hooks/useCartes.test.ts
```
Expected: PASS

- [ ] **Step 5: Implémenter useCodes**

`src/hooks/useCodes.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CodePromo, BarcodeFormat, Visibility, TypeValeur } from '../lib/types'

export function useCodes(enseigneId: string) {
  const [codes, setCodes] = useState<CodePromo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('codes_promo')
      .select('*')
      .eq('enseigne_id', enseigneId)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
    setCodes(data ?? [])
    setLoading(false)
  }, [enseigneId])

  useEffect(() => { load() }, [load])

  const addCode = async (params: {
    code: string
    format_barcode: BarcodeFormat
    valeur?: number | null
    type_valeur?: TypeValeur | null
    visibility: Visibility
    famille_id?: string | null
  }) => {
    const { data, error } = await supabase
      .from('codes_promo')
      .insert({ ...params, enseigne_id: enseigneId })
      .select()
      .single()
    if (!error && data) setCodes(prev => [data, ...prev])
    return { data, error }
  }

  const archiver = async (id: string, userId: string) => {
    const { error } = await supabase
      .from('codes_promo')
      .update({ archived_at: new Date().toISOString(), archived_by: userId })
      .eq('id', id)
    if (!error) setCodes(prev => prev.filter(c => c.id !== id))
    return { error }
  }

  return { codes, loading, addCode, archiver, reload: load }
}
```

- [ ] **Step 6: CarteCard component**

`src/components/CarteCard.tsx`:
```tsx
import { CarteCadeau } from '../lib/types'
import { VisibilityBadge } from './VisibilityBadge'

interface Props {
  carte: CarteCadeau
  onClick: () => void
  onHistorique: () => void
  onArchiver: () => void
}

export function CarteCard({ carte, onClick, onHistorique, onArchiver }: Props) {
  const pct = carte.montant_initial > 0 ? (carte.montant_restant / carte.montant_initial) * 100 : 0
  return (
    <div className="bg-slate-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">{carte.label || 'Carte cadeau'}</p>
          <p className="text-2xl font-bold text-green-400">{carte.montant_restant.toFixed(2)} €</p>
          <p className="text-xs text-slate-400">Initial : {carte.montant_initial.toFixed(2)} €</p>
        </div>
        {carte.visibility === 'family' && <VisibilityBadge />}
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex gap-2">
        <button onClick={onClick} className="flex-1 bg-violet-600 rounded-lg py-2 text-sm font-semibold">Afficher</button>
        <button onClick={onHistorique} className="flex-1 bg-slate-700 rounded-lg py-2 text-sm">Historique</button>
        <button onClick={onArchiver} className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">📦</button>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: CodeCard component**

`src/components/CodeCard.tsx`:
```tsx
import { CodePromo } from '../lib/types'
import { VisibilityBadge } from './VisibilityBadge'

interface Props {
  code: CodePromo
  onClick: () => void
  onArchiver: () => void
}

export function CodeCard({ code, onClick, onArchiver }: Props) {
  const valeurLabel = code.valeur
    ? code.type_valeur === 'pct' ? `-${code.valeur}%` : `-${code.valeur}€`
    : null

  return (
    <div className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-mono font-semibold tracking-wider truncate">{code.code}</p>
        {valeurLabel && <p className="text-yellow-400 text-sm font-semibold">{valeurLabel}</p>}
        {code.visibility === 'family' && <VisibilityBadge />}
      </div>
      <button onClick={onClick} className="bg-violet-600 rounded-lg px-3 py-2 text-sm font-semibold">Afficher</button>
      <button onClick={onArchiver} className="text-slate-400 px-2 text-sm">📦</button>
    </div>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add src/hooks/ src/components/CarteCard.tsx src/components/CodeCard.tsx
git commit -m "feat: add cartes/codes CRUD hooks and card components"
```

---

## Task 8: Page Fiche Enseigne

**Files:**
- Modify: `src/pages/EnseignePage.tsx`
- Modify: `src/pages/AccueilPage.tsx` (mise à jour nbCartes/nbCodes)

- [ ] **Step 1: Implémenter EnseignePage**

`src/pages/EnseignePage.tsx`:
```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useCartes } from '../hooks/useCartes'
import { useCodes } from '../hooks/useCodes'
import { useAuth } from '../hooks/useAuth'
import { Enseigne } from '../lib/types'
import { CarteCard } from '../components/CarteCard'
import { CodeCard } from '../components/CodeCard'

export function EnseignePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [enseigne, setEnseigne] = useState<Enseigne | null>(null)
  const { cartes, archiver: archiverCarte } = useCartes(id!)
  const { codes, archiver: archiverCode } = useCodes(id!)

  useEffect(() => {
    supabase.from('enseignes').select('*').eq('id', id).single().then(({ data }) => setEnseigne(data))
  }, [id])

  if (!enseigne) return <div className="p-4 text-slate-400">Chargement...</div>

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-slate-400">←</button>
        {enseigne.logo_url && (
          <img src={enseigne.logo_url} alt={enseigne.nom} className="w-10 h-10 rounded-lg object-contain bg-white p-1"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        )}
        <h1 className="text-xl font-bold">{enseigne.nom}</h1>
      </div>

      {enseigne.cashback_pct && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-green-300">Cashback disponible</span>
          <span className="text-green-400 font-bold text-lg">{enseigne.cashback_pct}%</span>
        </div>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-300">Cartes cadeaux</h2>
          <button onClick={() => navigate(`/ajout?enseigneId=${id}&type=carte`)} className="text-violet-400 text-sm">+ Ajouter</button>
        </div>
        {cartes.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune carte</p>
        ) : (
          cartes.map(c => (
            <CarteCard
              key={c.id}
              carte={c}
              onClick={() => navigate(`/barcode/carte/${c.id}`)}
              onHistorique={() => navigate(`/historique/${c.id}`)}
              onArchiver={() => archiverCarte(c.id, session!.user.id)}
            />
          ))
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-300">Codes promo</h2>
          <button onClick={() => navigate(`/ajout?enseigneId=${id}&type=code`)} className="text-violet-400 text-sm">+ Ajouter</button>
        </div>
        {codes.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun code</p>
        ) : (
          codes.map(c => (
            <CodeCard
              key={c.id}
              code={c}
              onClick={() => navigate(`/barcode/code/${c.id}`)}
              onArchiver={() => archiverCode(c.id, session!.user.id)}
            />
          ))
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Mettre à jour AccueilPage pour afficher nbCartes/nbCodes**

Ajoute un hook `useEnseignesStats` ou requête directe. Modifie `useEnseignes` pour retourner aussi des stats :

`src/hooks/useEnseignes.ts` — ajoute ce type et cette fonction dans le hook :
```ts
// Ajouter dans useEnseignes, après la définition de enseignes :
const [stats, setStats] = useState<Record<string, { nbCartes: number; nbCodes: number }>>({})

// Dans load(), après setEnseignes :
if (data && data.length > 0) {
  const ids = data.map(e => e.id)
  const [{ data: cartes }, { data: codes }] = await Promise.all([
    supabase.from('cartes_cadeaux').select('enseigne_id').in('enseigne_id', ids).is('archived_at', null),
    supabase.from('codes_promo').select('enseigne_id').in('enseigne_id', ids).is('archived_at', null),
  ])
  const s: Record<string, { nbCartes: number; nbCodes: number }> = {}
  ids.forEach(id => {
    s[id] = {
      nbCartes: (cartes ?? []).filter(c => c.enseigne_id === id).length,
      nbCodes: (codes ?? []).filter(c => c.enseigne_id === id).length,
    }
  })
  setStats(s)
}

// Retourner aussi stats dans le return
return { enseignes, stats, loading, addEnseigne, reload: load }
```

Dans `AccueilPage.tsx`, remplace `nbCartes={0} nbCodes={0}` par :
```tsx
nbCartes={stats[e.id]?.nbCartes ?? 0}
nbCodes={stats[e.id]?.nbCodes ?? 0}
```

- [ ] **Step 3: Vérifier visuellement**

```bash
npm run dev
```
Navigue vers une enseigne — les sections cartes et codes doivent s'afficher avec les boutons d'ajout.

- [ ] **Step 4: Commit**

```bash
git add src/pages/EnseignePage.tsx src/pages/AccueilPage.tsx src/hooks/useEnseignes.ts
git commit -m "feat: add store detail page with cartes and codes sections"
```

---

## Task 9: Page Ajout (formulaire carte / code)

**Files:**
- Modify: `src/pages/AjoutPage.tsx`

- [ ] **Step 1: Implémenter AjoutPage**

`src/pages/AjoutPage.tsx`:
```tsx
import { useState, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCartes } from '../hooks/useCartes'
import { useCodes } from '../hooks/useCodes'
import { useFamille } from '../hooks/useFamille'
import { BarcodeFormat, TypeValeur, Visibility } from '../lib/types'

const FORMATS: BarcodeFormat[] = ['EAN13', 'CODE128', 'QR', 'AZTEC']

export function AjoutPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const enseigneId = params.get('enseigneId') ?? ''
  const [type, setType] = useState<'carte' | 'code'>(params.get('type') === 'code' ? 'code' : 'carte')
  const [code, setCode] = useState('')
  const [label, setLabel] = useState('')
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [montant, setMontant] = useState('')
  const [valeur, setValeur] = useState('')
  const [typeValeur, setTypeValeur] = useState<TypeValeur>('pct')
  const [visibility, setVisibility] = useState<Visibility>('personal')
  const [saving, setSaving] = useState(false)
  const { addCarte } = useCartes(enseigneId)
  const { addCode } = useCodes(enseigneId)
  const { famille } = useFamille()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const famille_id = visibility === 'family' ? famille?.id ?? null : null
    if (type === 'carte') {
      await addCarte({ label, code, format_barcode: format, montant_initial: parseFloat(montant), visibility, famille_id })
    } else {
      await addCode({ code, format_barcode: format, valeur: valeur ? parseFloat(valeur) : null, type_valeur: valeur ? typeValeur : null, visibility, famille_id })
    }
    navigate(`/enseigne/${enseigneId}`)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-slate-400">←</button>
        <h1 className="text-xl font-bold">Ajouter</h1>
      </div>

      <div className="flex gap-2">
        {(['carte', 'code'] as const).map(t => (
          <button key={t} onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${type === t ? 'bg-violet-600' : 'bg-slate-800 text-slate-400'}`}>
            {t === 'carte' ? '🎁 Carte cadeau' : '🏷 Code promo'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {type === 'carte' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Label</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="ex: Carte anniversaire"
              className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        )}

        <div>
          <label className="block text-xs text-slate-400 mb-1">Code / Numéro *</label>
          <input value={code} onChange={e => setCode(e.target.value)} required placeholder="ex: 5010123456789"
            className="w-full bg-slate-800 rounded-lg px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-violet-500" />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Format barcode</label>
          <select value={format} onChange={e => setFormat(e.target.value as BarcodeFormat)}
            className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none">
            {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        {type === 'carte' && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Montant initial (€) *</label>
            <input type="number" step="0.01" min="0" value={montant} onChange={e => setMontant(e.target.value)} required
              className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
          </div>
        )}

        {type === 'code' && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-slate-400 mb-1">Valeur</label>
              <input type="number" step="0.01" min="0" value={valeur} onChange={e => setValeur(e.target.value)}
                className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Type</label>
              <select value={typeValeur} onChange={e => setTypeValeur(e.target.value as TypeValeur)}
                className="bg-slate-800 rounded-lg px-3 py-2 outline-none">
                <option value="pct">%</option>
                <option value="eur">€</option>
              </select>
            </div>
          </div>
        )}

        {famille && (
          <div>
            <label className="block text-xs text-slate-400 mb-1">Visibilité</label>
            <div className="flex gap-2">
              {(['personal', 'family'] as Visibility[]).map(v => (
                <button key={v} type="button" onClick={() => setVisibility(v)}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${visibility === v ? 'bg-violet-600' : 'bg-slate-800 text-slate-400'}`}>
                  {v === 'personal' ? '🔒 Personnel' : '👨‍👩‍👧 Famille'}
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-violet-600 hover:bg-violet-700 rounded-xl py-3 font-semibold transition-colors disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Stub pour useFamille (sera implémenté Task 11)**

`src/hooks/useFamille.ts` (stub temporaire) :
```ts
export function useFamille() {
  return { famille: null, membres: [], loading: false, creer: async () => {}, rejoindre: async () => {} }
}
```

- [ ] **Step 3: Vérifier visuellement**

```bash
npm run dev
```
Dans une fiche enseigne, clique "+ Ajouter" — le formulaire doit s'afficher avec les deux types.

- [ ] **Step 4: Commit**

```bash
git add src/pages/AjoutPage.tsx src/hooks/useFamille.ts
git commit -m "feat: add ajout page for cartes and codes"
```

---

## Task 10: Page Barcode (plein écran)

**Files:**
- Modify: `src/pages/BarcodePage.tsx`

- [ ] **Step 1: Implémenter BarcodePage**

`src/pages/BarcodePage.tsx`:
```tsx
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BarcodeDisplay } from '../components/BarcodeDisplay'
import { CarteCadeau, CodePromo, BarcodeFormat } from '../lib/types'

type ItemType = 'carte' | 'code'

export function BarcodePage() {
  const { type, id } = useParams<{ type: ItemType; id: string }>()
  const navigate = useNavigate()
  const [code, setCode] = useState<string | null>(null)
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [label, setLabel] = useState('')

  useEffect(() => {
    const table = type === 'carte' ? 'cartes_cadeaux' : 'codes_promo'
    supabase.from(table).select('*').eq('id', id).single().then(({ data }) => {
      if (!data) return
      if (type === 'carte') {
        const c = data as CarteCadeau
        setCode(c.code)
        setFormat(c.format_barcode)
        setLabel(c.label ?? 'Carte cadeau')
      } else {
        const c = data as CodePromo
        setCode(c.code)
        setFormat(c.format_barcode)
        setLabel(c.code)
      }
    })
    // Maximiser la luminosité si l'API est disponible
    if ('screen' in window && 'brightness' in (window.screen as unknown as Record<string, unknown>)) {
      ;(window.screen as unknown as { brightness: number }).brightness = 1
    }
  }, [type, id])

  if (!code) return <div className="min-h-screen bg-white flex items-center justify-center text-slate-400">Chargement...</div>

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 gap-6">
      <p className="text-slate-600 font-semibold text-lg">{label}</p>
      <BarcodeDisplay code={code} format={format} className="w-full max-w-xs" />
      {type === 'carte' && (
        <button
          onClick={() => navigate(`/historique/${id}`)}
          className="bg-green-500 text-white rounded-xl px-6 py-3 font-semibold"
        >
          Marquer une utilisation
        </button>
      )}
      <button onClick={() => navigate(-1)} className="text-slate-400 text-sm">← Retour</button>
    </div>
  )
}
```

- [ ] **Step 2: Vérifier visuellement**

```bash
npm run dev
```
Ajoute une carte avec un code, clique "Afficher" — fond blanc, barcode généré, bouton "Marquer une utilisation".

- [ ] **Step 3: Commit**

```bash
git add src/pages/BarcodePage.tsx
git commit -m "feat: add fullscreen barcode display page"
```

---

## Task 11: Historique utilisations

**Files:**
- Create: `src/hooks/useUtilisations.ts`
- Create: `src/components/UtilisationForm.tsx`
- Modify: `src/pages/HistoriquePage.tsx`

- [ ] **Step 1: Implémenter useUtilisations**

`src/hooks/useUtilisations.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Utilisation } from '../lib/types'

export function useUtilisations(carteId: string) {
  const [utilisations, setUtilisations] = useState<Utilisation[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('utilisations')
      .select('*')
      .eq('carte_id', carteId)
      .order('date', { ascending: false })
    setUtilisations(data ?? [])
    setLoading(false)
  }, [carteId])

  useEffect(() => { load() }, [load])

  const addUtilisation = async (montant: number, note: string, date: string) => {
    const { data, error } = await supabase
      .from('utilisations')
      .insert({ carte_id: carteId, montant, note: note || null, date })
      .select()
      .single()
    if (!error && data) setUtilisations(prev => [data, ...prev])
    return { data, error }
  }

  return { utilisations, loading, addUtilisation }
}
```

- [ ] **Step 2: UtilisationForm component**

`src/components/UtilisationForm.tsx`:
```tsx
import { useState, FormEvent } from 'react'

interface Props {
  onSubmit: (montant: number, note: string, date: string) => Promise<void>
  onCancel: () => void
}

export function UtilisationForm({ onSubmit, onCancel }: Props) {
  const [montant, setMontant] = useState('')
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!montant || parseFloat(montant) <= 0) return
    setSaving(true)
    await onSubmit(parseFloat(montant), note, date)
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-4 space-y-3">
      <h3 className="font-semibold">Nouvelle utilisation</h3>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Montant dépensé (€) *</label>
        <input type="number" step="0.01" min="0.01" value={montant} onChange={e => setMontant(e.target.value)} required
          className="w-full bg-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Date *</label>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} required
          className="w-full bg-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
      <div>
        <label className="block text-xs text-slate-400 mb-1">Note</label>
        <input value={note} onChange={e => setNote(e.target.value)} placeholder="ex: Achat livre"
          className="w-full bg-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="flex-1 bg-violet-600 rounded-lg py-2 font-semibold disabled:opacity-50">
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </button>
        <button type="button" onClick={onCancel} className="bg-slate-700 rounded-lg px-4 py-2 text-slate-400">Annuler</button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: HistoriquePage**

`src/pages/HistoriquePage.tsx`:
```tsx
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useUtilisations } from '../hooks/useUtilisations'
import { CarteCadeau } from '../lib/types'
import { UtilisationForm } from '../components/UtilisationForm'

export function HistoriquePage() {
  const { carteId } = useParams<{ carteId: string }>()
  const navigate = useNavigate()
  const [carte, setCarte] = useState<CarteCadeau | null>(null)
  const [showForm, setShowForm] = useState(false)
  const { utilisations, loading, addUtilisation } = useUtilisations(carteId!)

  useEffect(() => {
    supabase.from('cartes_cadeaux').select('*').eq('id', carteId).single().then(({ data }) => setCarte(data))
  }, [carteId])

  const handleAdd = async (montant: number, note: string, date: string) => {
    await addUtilisation(montant, note, date)
    // Recharger la carte pour avoir le montant_restant mis à jour par le trigger
    const { data } = await supabase.from('cartes_cadeaux').select('*').eq('id', carteId).single()
    if (data) setCarte(data)
    setShowForm(false)
  }

  if (!carte) return <div className="p-4 text-slate-400">Chargement...</div>

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3 pt-2">
        <button onClick={() => navigate(-1)} className="text-slate-400">←</button>
        <h1 className="text-xl font-bold">{carte.label ?? 'Carte cadeau'}</h1>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-slate-400">Initial</p>
          <p className="font-semibold">{carte.montant_initial.toFixed(2)} €</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Restant</p>
          <p className="text-2xl font-bold text-green-400">{carte.montant_restant.toFixed(2)} €</p>
        </div>
      </div>

      {showForm ? (
        <UtilisationForm onSubmit={handleAdd} onCancel={() => setShowForm(false)} />
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full bg-violet-600 rounded-xl py-3 font-semibold">
          + Ajouter une utilisation
        </button>
      )}

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-300">Historique</h2>
        {loading ? (
          <p className="text-slate-400 text-sm">Chargement...</p>
        ) : utilisations.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucune utilisation enregistrée</p>
        ) : (
          utilisations.map(u => (
            <div key={u.id} className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-semibold">{u.note ?? 'Utilisation'}</p>
                <p className="text-xs text-slate-400">{new Date(u.date).toLocaleDateString('fr-FR')}</p>
              </div>
              <p className="text-red-400 font-semibold">-{u.montant.toFixed(2)} €</p>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Vérifier que le trigger fonctionne**

Ajoute une carte à 50€, puis une utilisation de 10€. Le solde restant doit passer à 40€ automatiquement.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useUtilisations.ts src/components/UtilisationForm.tsx src/pages/HistoriquePage.tsx
git commit -m "feat: add utilisations history with auto balance update via trigger"
```

---

## Task 12: Mode Famille

**Files:**
- Modify: `src/hooks/useFamille.ts`
- Modify: `src/pages/FamillePage.tsx`
- Test: `src/hooks/useFamille.test.ts`

- [ ] **Step 1: Écrire le test useFamille**

`src/hooks/useFamille.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

const mockFamille = { id: 'f1', nom: 'Famille Dupont', created_by: 'u1', invite_code: 'X7K2', created_at: '' }

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockFamille, error: null }),
    }),
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'u1' } } }) },
  },
}))

import { useFamille } from './useFamille'

describe('useFamille', () => {
  it('expose une fonction creer', () => {
    const { result } = renderHook(() => useFamille())
    expect(typeof result.current.creer).toBe('function')
  })
})
```

- [ ] **Step 2: Vérifier que le test échoue**

```bash
npx vitest run src/hooks/useFamille.test.ts
```
Expected: FAIL (stub renvoie des fonctions mais pas le bon type)

- [ ] **Step 3: Implémenter useFamille**

`src/hooks/useFamille.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Famille, FamilleMembre } from '../lib/types'

export function useFamille() {
  const [famille, setFamille] = useState<Famille | null>(null)
  const [membres, setMembres] = useState<(FamilleMembre & { email?: string })[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: membre } = await supabase
      .from('famille_membres')
      .select('famille_id')
      .limit(1)
      .single()

    if (!membre) { setLoading(false); return }

    const [{ data: f }, { data: m }] = await Promise.all([
      supabase.from('familles').select('*').eq('id', membre.famille_id).single(),
      supabase.from('famille_membres').select('*').eq('famille_id', membre.famille_id),
    ])
    setFamille(f ?? null)
    setMembres(m ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const creer = async (nom: string) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return { error: new Error('Non connecté') }

    const { data: f, error } = await supabase
      .from('familles')
      .insert({ nom, created_by: user.user.id })
      .select()
      .single()
    if (error || !f) return { error }

    await supabase.from('famille_membres').insert({ famille_id: f.id, user_id: user.user.id, role: 'owner' })
    setFamille(f)
    return { error: null }
  }

  const rejoindre = async (inviteCode: string) => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return { error: new Error('Non connecté') }

    const { data: f, error: fErr } = await supabase
      .from('familles')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase())
      .single()
    if (fErr || !f) return { error: new Error('Code invalide') }

    const { error } = await supabase
      .from('famille_membres')
      .insert({ famille_id: f.id, user_id: user.user.id, role: 'member' })
    if (!error) { setFamille(f); await load() }
    return { error }
  }

  return { famille, membres, loading, creer, rejoindre }
}
```

- [ ] **Step 4: Vérifier que le test passe**

```bash
npx vitest run src/hooks/useFamille.test.ts
```
Expected: PASS

- [ ] **Step 5: FamillePage**

`src/pages/FamillePage.tsx`:
```tsx
import { useState } from 'react'
import { useFamille } from '../hooks/useFamille'

export function FamillePage() {
  const { famille, membres, loading, creer, rejoindre } = useFamille()
  const [nom, setNom] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<'idle' | 'creer' | 'rejoindre'>('idle')

  const handleCreer = async () => {
    if (!nom.trim()) return
    const { error } = await creer(nom.trim())
    if (error) setError(error.message)
  }

  const handleRejoindre = async () => {
    if (!inviteCode.trim()) return
    const { error } = await rejoindre(inviteCode.trim())
    if (error) setError(error.message)
  }

  if (loading) return <div className="p-4 text-slate-400">Chargement...</div>

  if (!famille) {
    return (
      <div className="p-4 space-y-6">
        <h1 className="text-xl font-bold pt-2">Ma Famille</h1>
        <p className="text-slate-400">Tu n'appartiens à aucune famille pour l'instant.</p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {mode === 'idle' && (
          <div className="space-y-3">
            <button onClick={() => setMode('creer')} className="w-full bg-violet-600 rounded-xl py-3 font-semibold">Créer une famille</button>
            <button onClick={() => setMode('rejoindre')} className="w-full bg-slate-800 rounded-xl py-3 font-semibold">Rejoindre avec un code</button>
          </div>
        )}
        {mode === 'creer' && (
          <div className="space-y-3">
            <input value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de la famille"
              className="w-full bg-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500" />
            <button onClick={handleCreer} className="w-full bg-violet-600 rounded-xl py-3 font-semibold">Créer</button>
            <button onClick={() => setMode('idle')} className="w-full text-slate-400 text-sm">Annuler</button>
          </div>
        )}
        {mode === 'rejoindre' && (
          <div className="space-y-3">
            <input value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="Code d'invitation (ex: X7K2)"
              className="w-full bg-slate-800 rounded-lg px-3 py-2 font-mono text-lg tracking-widest outline-none focus:ring-2 focus:ring-violet-500" maxLength={4} />
            <button onClick={handleRejoindre} className="w-full bg-violet-600 rounded-xl py-3 font-semibold">Rejoindre</button>
            <button onClick={() => setMode('idle')} className="w-full text-slate-400 text-sm">Annuler</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold pt-2">👨‍👩‍👧 {famille.nom}</h1>
      <div className="bg-slate-800 rounded-xl p-4 text-center space-y-1">
        <p className="text-slate-400 text-sm">Code d'invitation</p>
        <p className="text-4xl font-mono font-bold tracking-widest text-violet-400">{famille.invite_code}</p>
        <p className="text-slate-500 text-xs">Partage ce code pour inviter des membres</p>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold text-slate-300">Membres ({membres.length})</h2>
        {membres.map(m => (
          <div key={m.user_id} className="bg-slate-800 rounded-xl p-3 flex justify-between items-center">
            <span className="text-sm font-mono text-slate-300">{m.user_id.slice(0, 8)}…</span>
            <span className="text-xs text-slate-500">{m.role}</span>
          </div>
        ))}
      </section>
    </div>
  )
}
```

- [ ] **Step 6: Vérifier visuellement**

```bash
npm run dev
```
Navigue vers "Famille", crée une famille → code d'invitation affiché. Connecte un second compte et rejoins avec le code.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useFamille.ts src/hooks/useFamille.test.ts src/pages/FamillePage.tsx
git commit -m "feat: add family mode with invite code, create and join flow"
```

---

## Task 13: Cashback — saisie manuelle + Edge Function

**Files:**
- Create: `src/hooks/useCashback.ts`
- Modify: `src/pages/CashbackPage.tsx`
- Create: `supabase/functions/import-cashback/index.ts`

- [ ] **Step 1: useCashback hook**

`src/hooks/useCashback.ts`:
```ts
import { supabase } from '../lib/supabase'
import { CashbackSource } from '../lib/types'

export function useCashback() {
  const updateManuel = async (enseigneId: string, pct: number) => {
    const { error } = await supabase
      .from('enseignes')
      .update({ cashback_pct: pct, cashback_source: 'manual' as CashbackSource, cashback_source_id: null })
      .eq('id', enseigneId)
    return { error }
  }

  const importerSource = async (source: 'igraal' | 'widilo') => {
    const { error } = await supabase.functions.invoke('import-cashback', { body: { source } })
    return { error }
  }

  return { updateManuel, importerSource }
}
```

- [ ] **Step 2: Edge Function import-cashback**

`supabase/functions/import-cashback/index.ts`:
```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const { source } = await req.json() as { source: 'igraal' | 'widilo' }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // NOTE: Les API iGraal et Widilo ne sont pas documentées publiquement.
  // Cette Edge Function est un template à compléter avec les vrais endpoints
  // une fois les APIs identifiées (ex: reverse engineering de l'extension Chrome).
  // Pour l'instant, elle retourne une erreur explicative.
  const rates: { nom: string; pct: number; source_id: string }[] = []

  if (source === 'igraal') {
    // TODO: appeler https://fr.igraal.com/api/... avec les vrais endpoints
    // rates = await fetchIGraalRates()
    console.log('iGraal import: API endpoint à implémenter')
  } else if (source === 'widilo') {
    // TODO: appeler https://www.widilo.fr/api/... avec les vrais endpoints
    console.log('Widilo import: API endpoint à implémenter')
  }

  // Si des taux sont disponibles, les upserter dans enseignes
  for (const rate of rates) {
    await supabase.from('enseignes')
      .update({ cashback_pct: rate.pct, cashback_source: source, cashback_source_id: rate.source_id })
      .ilike('nom', `%${rate.nom}%`)
  }

  return new Response(
    JSON.stringify({ imported: rates.length, source }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 3: CashbackPage**

`src/pages/CashbackPage.tsx`:
```tsx
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useCashback } from '../hooks/useCashback'
import { Enseigne } from '../lib/types'

export function CashbackPage() {
  const { importerSource } = useCashback()
  const [enseignes, setEnseignes] = useState<Enseigne[]>([])
  const [importing, setImporting] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editPct, setEditPct] = useState('')
  const { updateManuel } = useCashback()

  useEffect(() => {
    supabase.from('enseignes').select('*').order('nom').then(({ data }) => setEnseignes(data ?? []))
  }, [])

  const handleImport = async (source: 'igraal' | 'widilo') => {
    setImporting(source)
    await importerSource(source)
    setImporting(null)
  }

  const handleSaveManuel = async (id: string) => {
    if (!editPct) return
    await updateManuel(id, parseFloat(editPct))
    setEnseignes(prev => prev.map(e => e.id === id ? { ...e, cashback_pct: parseFloat(editPct), cashback_source: 'manual' } : e))
    setEditId(null)
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold pt-2">Cashback</h1>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-300">Sources</h2>
        {(['igraal', 'widilo'] as const).map(source => (
          <div key={source} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between">
            <span className="capitalize font-semibold">{source}</span>
            <button
              onClick={() => handleImport(source)}
              disabled={importing === source}
              className="bg-green-700 hover:bg-green-600 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-50"
            >
              {importing === source ? 'Import...' : 'Importer'}
            </button>
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold text-slate-300">Taux par enseigne</h2>
        {enseignes.map(e => (
          <div key={e.id} className="bg-slate-800 rounded-xl p-3">
            {editId === e.id ? (
              <div className="flex gap-2 items-center">
                <span className="flex-1 text-sm">{e.nom}</span>
                <input type="number" step="0.1" min="0" value={editPct} onChange={ev => setEditPct(ev.target.value)}
                  placeholder="%" className="w-20 bg-slate-700 rounded px-2 py-1 text-sm outline-none" />
                <button onClick={() => handleSaveManuel(e.id)} className="bg-violet-600 rounded px-2 py-1 text-sm">✓</button>
                <button onClick={() => setEditId(null)} className="text-slate-400 px-1 text-sm">✕</button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm">{e.nom}</span>
                <div className="flex items-center gap-2">
                  {e.cashback_pct ? (
                    <span className="text-green-400 font-semibold">{e.cashback_pct}%</span>
                  ) : (
                    <span className="text-slate-500 text-sm">—</span>
                  )}
                  <button onClick={() => { setEditId(e.id); setEditPct(e.cashback_pct?.toString() ?? '') }}
                    className="text-slate-400 text-sm hover:text-white">✏️</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Déployer l'Edge Function en local**

```bash
npx supabase functions serve import-cashback --env-file .env.local
```
Expected: Edge Function running at http://localhost:54321/functions/v1/import-cashback

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useCashback.ts src/pages/CashbackPage.tsx supabase/functions/
git commit -m "feat: add cashback manual entry and Edge Function template for import"
```

---

## Task 14: Archives

**Files:**
- Create: `src/hooks/useArchives.ts`
- Modify: `src/pages/ArchivesPage.tsx`

- [ ] **Step 1: useArchives hook**

`src/hooks/useArchives.ts`:
```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { CarteCadeau, CodePromo } from '../lib/types'

export function useArchives() {
  const [cartesArchivees, setCartesArchivees] = useState<CarteCadeau[]>([])
  const [codesArchives, setCodesArchives] = useState<CodePromo[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: cartes }, { data: codes }] = await Promise.all([
      supabase.from('cartes_cadeaux').select('*').not('archived_at', 'is', null).order('archived_at', { ascending: false }),
      supabase.from('codes_promo').select('*').not('archived_at', 'is', null).order('archived_at', { ascending: false }),
    ])
    setCartesArchivees(cartes ?? [])
    setCodesArchives(codes ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const restaurerCarte = async (id: string) => {
    await supabase.from('cartes_cadeaux').update({ archived_at: null, archived_by: null }).eq('id', id)
    setCartesArchivees(prev => prev.filter(c => c.id !== id))
  }

  const restaurerCode = async (id: string) => {
    await supabase.from('codes_promo').update({ archived_at: null, archived_by: null }).eq('id', id)
    setCodesArchives(prev => prev.filter(c => c.id !== id))
  }

  return { cartesArchivees, codesArchives, loading, restaurerCarte, restaurerCode }
}
```

- [ ] **Step 2: ArchivesPage**

`src/pages/ArchivesPage.tsx`:
```tsx
import { useArchives } from '../hooks/useArchives'

export function ArchivesPage() {
  const { cartesArchivees, codesArchives, loading, restaurerCarte, restaurerCode } = useArchives()

  if (loading) return <div className="p-4 text-slate-400">Chargement...</div>

  const total = cartesArchivees.length + codesArchives.length

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold pt-2">Archives ({total})</h1>

      {total === 0 && <p className="text-slate-400">Aucun élément archivé.</p>}

      {cartesArchivees.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-300">Cartes cadeaux</h2>
          {cartesArchivees.map(c => (
            <div key={c.id} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between opacity-60">
              <div>
                <p className="text-sm font-semibold">{c.label ?? 'Carte cadeau'}</p>
                <p className="text-xs text-slate-400">{c.montant_restant.toFixed(2)} € restant</p>
              </div>
              <button onClick={() => restaurerCarte(c.id)} className="bg-slate-700 rounded-lg px-3 py-1.5 text-sm hover:bg-violet-700 transition-colors">
                Restaurer
              </button>
            </div>
          ))}
        </section>
      )}

      {codesArchives.length > 0 && (
        <section className="space-y-2">
          <h2 className="font-semibold text-slate-300">Codes promo</h2>
          {codesArchives.map(c => (
            <div key={c.id} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between opacity-60">
              <div>
                <p className="text-sm font-mono font-semibold">{c.code}</p>
                {c.valeur && <p className="text-xs text-yellow-400">{c.type_valeur === 'pct' ? `-${c.valeur}%` : `-${c.valeur}€`}</p>}
              </div>
              <button onClick={() => restaurerCode(c.id)} className="bg-slate-700 rounded-lg px-3 py-1.5 text-sm hover:bg-violet-700 transition-colors">
                Restaurer
              </button>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Vérifier visuellement**

```bash
npm run dev
```
Archive une carte ou un code depuis la fiche enseigne. Navigue vers Archives — l'élément doit apparaître. Clique "Restaurer" — l'élément doit revenir dans sa fiche enseigne.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useArchives.ts src/pages/ArchivesPage.tsx
git commit -m "feat: add archives page with restore functionality"
```

---

## Task 15: PWA Offline + Icônes + Build final

**Files:**
- Create: `public/icon-192.png`, `public/icon-512.png`
- Modify: `index.html`

- [ ] **Step 1: Générer les icônes PWA**

Crée deux icônes PNG (192×192 et 512×512) et place-les dans `public/` :
```bash
# Si tu as ImageMagick :
convert -size 192x192 xc:'#0f3460' -fill white -pointsize 60 -gravity center -annotate 0 "MP" public/icon-192.png
convert -size 512x512 xc:'#0f3460' -fill white -pointsize 160 -gravity center -annotate 0 "MP" public/icon-512.png
# Sinon : crée des PNG manuellement avec Figma, Canva, ou Paint
```

- [ ] **Step 2: Mettre à jour index.html**

`index.html` — ajoute dans `<head>` :
```html
<meta name="theme-color" content="#0f3460">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="apple-touch-icon" href="/icon-192.png">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

- [ ] **Step 3: Build et vérification PWA**

```bash
npm run build
npm run preview
```
Ouvre http://localhost:4173 dans Chrome. Ouvre DevTools → Application → Service Workers → vérifie que le SW est enregistré. Manifest → vérifie nom, icônes, display=standalone.

- [ ] **Step 4: Test suite complète**

```bash
npx vitest run
```
Expected: Tous les tests PASS.

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat: PWA icons, meta tags, offline cache — v1 complete"
```

---

## Checklist finale avant déploiement

- [ ] Supabase project créé sur app.supabase.com
- [ ] Variables d'env `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` configurées sur Vercel/Netlify
- [ ] Migrations appliquées sur le projet Supabase production (`npx supabase db push --linked`)
- [ ] Edge Function déployée (`npx supabase functions deploy import-cashback`)
- [ ] Build PWA déployé et testé sur mobile (Chrome Android / Safari iOS)
