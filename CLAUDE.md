# MyQuizz — Instructions Claude Code

## Contexte projet

Application de quiz full-stack, projet portfolio. Priorité : qualité production, code propre, moderne.
Référence canonique : `PROJECT_STATE.md` pour l'état d'avancement et la roadmap.

---

## Architecture

```
MyQuizz/
├── api/            → Express 5 + Prisma 6 + PostgreSQL 17
├── client/         → Svelte 5 (Runes) + Vite + TypeScript
├── logs-service/   → MongoDB 7
├── files-service/  → PostgreSQL 17 séparé
└── docs/conception/→ Conception + maquettes design
```

## Commandes dev

```bash
# Démarrer l'environnement complet (Docker)
docker compose -f docker-compose.dev.yml up

# API seule (local)
npm run dev --prefix api

# Client seul (local)
npm run dev --prefix client

# Tests API
npm run test --prefix api
npm run test:unit --prefix api
npm run test:spec --prefix api

# BDD
npm run db:migrate:dev --prefix api   # nouvelle migration
npm run db:reset --prefix api         # reset + seed
npm run db:studio --prefix api        # Prisma Studio
```

## Règles de développement

### Général
- Ne jamais scanner `node_modules/` — utiliser `package.json` pour les dépendances
- Préférer `ls` ciblé plutôt que `ls -R` récursif
- Lire uniquement les fichiers demandés ou strictement nécessaires à la tâche

### Backend (api/)
- Validation entrée : **Zod** systématiquement aux routes
- Hachage mot de passe : **argon2** (pas bcrypt)
- Auth : JWT access token (courte durée) + refresh token en BDD (`RefreshToken`)
- Rôles : enum Prisma `member | author | admin` — vérifier via `role.middleware.ts`
- Erreurs : passer via `global-error-handler.ts`, ne pas envoyer de stack en prod
- Tests : chaque nouveau controller doit avoir un `.spec.test.ts`
- ORM : Prisma uniquement — pas de SQL raw sauf besoin explicite

### Frontend (client/)
- Svelte **5 Runes** (`$state`, `$derived`, `$effect`) — pas l'ancienne syntaxe
- Store auth : `src/stores/auth.ts` — source de vérité pour l'état utilisateur
- Appels API : toujours via `src/services/api.ts` (jamais `fetch` direct)
- Axios instance : `src/services/axios.ts` — interceptors auto-refresh déjà configurés
- Guard : `requireAuth()` depuis `src/lib/guards.ts`

### Docker
- Dev : `docker-compose.dev.yml` (volumes hot-reload)
- Prod : `docker-compose.yml` (images buildées, sans volumes source)

---

## Design — Charte graphique

> Maquettes : `docs/conception/design/` (fichiers `.pen` Pencil MCP)

**Cible** : UI moderne, sombre ou claire, épurée — niveau portfolio.

Principes à respecter :
- Responsive : desktop first, puis adaptation mobile
- Composants atomiques réutilisables
- Accessibilité WCAG AA minimum

---

## Fichiers clés à connaître

| Fichier                                  | Rôle                                               |
| ---------------------------------------- | -------------------------------------------------- |
| `api/prisma/schema.prisma`               | Schéma BDD — source de vérité du modèle de données |
| `api/src/app.ts`                         | Point d'entrée Express, montage des routers        |
| `api/src/routers/index.router.ts`        | Routeur principal                                  |
| `api/src/middlewares/auth.middleware.ts` | Vérification JWT                                   |
| `api/src/middlewares/role.middleware.ts` | Vérification des rôles                             |
| `client/src/stores/auth.ts`              | Store Svelte auth                                  |
| `client/src/services/axios.ts`           | Instance Axios + interceptors                      |
| `client/src/services/api.ts`             | Toutes les fonctions d'appel API                   |
| `docs/conception/api/endpoints.md`       | Référence complète des endpoints                   |
| `PROJECT_STATE.md`                       | État d'avancement + roadmap                        |

---

## Conventions de nommage

| Élément             | Convention          |
| ------------------- | ------------------- |
| Fichiers API        | `kebab-case.ts`     |
| Modèles Prisma      | `PascalCase`        |
| Tables BDD          | `snake_case`        |
| Composants Svelte   | `PascalCase.svelte` |
| Fonctions/variables | `camelCase`         |
| Variables d'env     | `UPPER_SNAKE_CASE`  |
