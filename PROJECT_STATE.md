# MyQuizz — État du projet

> Dernière mise à jour : 2026-06-16 — Phase 1 Design complétée

## Vision

Application de quiz full-stack orientée portfolio. Objectif : codebase propre, moderne, testée, visuellement soignée — niveau production.

---

## Stack technique

| Couche                     | Technologie                          | Version |
| -------------------------- | ------------------------------------ | ------- |
| Frontend                   | Svelte 5 (Runes) + Vite + TypeScript | ^5.28   |
| API                        | Node.js + Express 5 + TypeScript     | ^5.1    |
| ORM                        | Prisma                               | ^6.11   |
| Base de données principale | PostgreSQL                           | 17      |
| Auth                       | JWT (access + refresh token)         | ^9.0    |
| Hachage                    | argon2                               | ^0.44   |
| Validation                 | Zod                                  | ^4.3    |
| HTTP client                | Axios                                | ^1.13   |
| Conteneurs                 | Docker Compose (dev + prod)          | -       |
| Logs service               | MongoDB                              | 7       |
| Files service              | PostgreSQL séparé                    | 17      |
| Tests API                  | Node test runner (tsx)               | -       |
| Lint                       | ESLint + typescript-eslint           | ^9.39   |

---

## Architecture microservices

```
MyQuizz/
├── api/            → API principale (Express + Prisma + PostgreSQL)
├── client/         → Frontend (Svelte 5 + Vite)
├── logs-service/   → Service de logs (MongoDB)
├── files-service/  → Service de fichiers (PostgreSQL)
├── docs/           → Conception (UML, Merise, user stories, endpoints)
├── docker-compose.dev.yml
└── docker-compose.yml
```

---

## État d'implémentation

### ✅ Backend — Implémenté

| Domaine | Endpoint              | Statut |
| ------- | --------------------- | ------ |
| Auth    | POST `/auth/register` | ✅      |
| Auth    | POST `/auth/login`    | ✅      |
| Auth    | POST `/auth/refresh`  | ✅      |
| Auth    | GET `/auth/me`        | ✅      |
| Auth    | POST `/auth/logout`   | ✅      |
| Users   | GET `/users`          | ✅      |
| Levels  | GET `/levels`         | ✅      |
| Levels  | GET `/levels/:id`     | ✅      |
| Levels  | POST `/levels`        | ✅      |
| Levels  | PATCH `/levels/:id`   | ✅      |
| Levels  | DELETE `/levels/:id`  | ✅      |
| Info    | GET `/api/info`       | ✅      |

### ❌ Backend — À implémenter

| Domaine   | Endpoints                              |
| --------- | -------------------------------------- |
| Quiz      | CRUD complet + tags                    |
| Questions | CRUD                                   |
| Answers   | CRUD                                   |
| Tags      | CRUD                                   |
| Attempts  | POST + GET (scores, historique)        |
| Users     | GET `/users/:id/profile` + `/attempts` |

### Schéma Prisma — État actuel

| Modèle         | Statut | Notes                     |
| -------------- | ------ | ------------------------- |
| `User`         | ✅      | Complet avec enum Role    |
| `Level`        | ✅      | Complet                   |
| `RefreshToken` | ✅      | Complet                   |
| `Quiz`         | ✅      | Complet                   |
| `Question`     | ✅      | Complet (link, anecdote)  |
| `Answer`       | ✅      | Complet (is_valid)        |
| `Tag`          | ✅      | Hiérarchie (parent_id)    |
| `QuizTag`      | ✅      | Jointure (@@unique)       |
| `Attempt`      | ✅      | score + score_max         |

### ✅ Frontend — Implémenté

- Auth store (Svelte writable) : `user`, `isAuthenticated`, `isLoading`
- Login component + form
- Signup component + form
- Axios instance avec interceptors (auto-refresh token 401)
- Guard `requireAuth()`

### ❌ Frontend — À implémenter

- Routeur (pas de SvelteKit — navigation via `window.location.href` pour l'instant)
- Pages : Home, Dashboard, Quiz list, Quiz play, Quiz create/edit, Profile, Admin
- Composants UI : NavBar, QuizCard, QuestionCard, ScoreBoard, etc.
- Charte graphique + design system
- Intégration logs-service et files-service côté client

---

## Conception disponible (docs/)

| Document                 | Emplacement                                          |
| ------------------------ | ---------------------------------------------------- |
| User stories             | `docs/conception/analyse-besoin/user-stories.md`     |
| Endpoints API            | `docs/conception/api/endpoints.md`                   |
| Dictionnaire des données | `docs/conception/merise/dictionnaire-des-données.md` |
| Recueil des données      | `docs/conception/merise/recueil-des-données.md`      |
| Diagrammes UML (.puml)   | `docs/conception/uml/`                               |
| MCD / MLD / MPD          | `docs/conception/merise/mcd/ mld/ mpd/`              |
| Maquettes design (done)  | `docs/conception/design/maquettes.pen` — Pencil MCP  |

---

## Roadmap portfolio

### Phase 1 — Design & charte graphique ✅

- [x] Définir palette couleurs, typographie, espacements
- [x] Maquettes desktop + mobile (Pencil MCP) — 8 écrans (Home, Login, Dashboard, Quiz Play × 2)
- [x] Design system : variables Pencil (couleurs, rayons, typographies)

### Phase 2 — Compléter le schéma BDD ✅

- [x] Ajouter Quiz, Question, Answer, Tag, QuizTag, Attempt dans Prisma
- [x] Seed complet : 3 users (argon2), 3 quiz, 7 questions, 6 tags, 6 tentatives
- [ ] Lancer migration Docker : `docker compose -f docker-compose.dev.yml exec api npm run db:migrate:dev`

### Phase 3 — Compléter l'API ✅

- [x] Tags CRUD (GET/POST/PATCH/DELETE `/tags`)
- [x] Quiz CRUD + tag operations + attempts (`/quizzes/*`)
- [x] Questions CRUD (`/quizzes/:id/questions`, `/questions/:id`)
- [x] Answers CRUD (`/questions/:id/answers`, `/answers/:id`)
- [x] Attempts (POST + GET `/quizzes/:id/attempts`)
- [x] Users profile + historique (`/users/:id/profile`, `/users/:id/attempts`)
- [x] Tests spec : tags, quizzes, questions, answers

### Phase 4 — Refondre le frontend ✅

- [x] Router pushState maison (`lib/router.svelte.ts`) — 0 dépendance
- [x] Auth store Svelte 5 Runes (`stores/auth.svelte.ts`)
- [x] Design system CSS — Violet Bloom (`app.css`)
- [x] API service complet avec DTOs TypeScript
- [x] NavBar + QuizCard (composants partagés)
- [x] Pages : Home, Login/Signup, Dashboard, Quiz list, Quiz play, Profil
- [x] App.svelte — routing dynamique + layout + splash screen

### Phase 5 — Polish & déploiement

- [ ] Mettre à jour toutes les dépendances vers les dernières versions
- [ ] CI/CD (GitHub Actions)
- [ ] README complet orienté portfolio
- [ ] Déploiement (VPS ou cloud)
