# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Mettre à jour les réductions (scraper cashback)

Routine locale qui récupère, par enseigne, le cashback (%) et les remises sur cartes cadeaux
depuis iGraal, Joko et Unéo, puis les enregistre dans Supabase. Les sites n'ont pas d'API et sont
anti-bot : un navigateur réel est piloté via le serveur MCP `chrome-devtools` (cf. `.mcp.json`).
Le plan détaillé est dans [`docs/cashback-scraper-plan.md`](docs/cashback-scraper-plan.md).

### Configuration
Renseigner dans `.env.local` (jamais committé) — voir `.env.example` :

```
SUPABASE_SERVICE_ROLE_KEY=...   # clé service_role, scripts locaux uniquement
SCRAPE_USER_ID=...              # UUID du compte pour lequel on scrape
IGRAAL_EMAIL= / JOKO_EMAIL= / UNEO_EMAIL=  + mots de passe selon login requis
```

### Utilisation
1. Appliquer la migration : `supabase db push` (table `offres`, sources étendues).
2. `npm run cashback:list` — exporte les enseignes cibles dans `scripts/cashback/enseignes.json`.
3. Dans Claude Code : lancer le skill **`/scrape-cashback`** — Claude ouvre le navigateur, se
   connecte si besoin, lit les réductions et écrit `scripts/cashback/results.json`.
4. `npm run cashback:ingest` — matche les noms et écrit en base : table `offres` (nouvelle ligne
   **seulement si le taux change**), `enseignes.cashback_pct` (cashback), `codes_promo` (codes).

Les fichiers `enseignes.json` / `results.json` sont des artefacts runtime (gitignorés).

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
