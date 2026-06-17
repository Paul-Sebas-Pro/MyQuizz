# MyQuizz

Application de quiz full-stack construite comme projet portfolio. Objectif : codebase propre, moderne et testée — niveau production.

![Svelte](https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## Fonctionnalités

- **Auth complète** — register / login / refresh token / logout (JWT + argon2)
- **Quiz** — création, édition, tagging, publication
- **Jeu** — navigation pas à pas, score instantané, détail des réponses + anecdotes
- **Tentatives** — historique par utilisateur avec statistiques
- **Tags hiérarchiques** — arborescence parent/enfant
- **Dashboard** — récapitulatif personnel (quiz joués, scores)
- **Profil** — historique de tentatives par utilisateur
- **Rôles** — `member` · `author` · `admin`

---

## Stack technique

| Couche          | Technologie                             |
| --------------- | --------------------------------------- |
| Frontend        | Svelte 5 (Runes) + Vite + TypeScript 6  |
| Router          | pushState maison — 0 dépendance externe |
| Design          | Violet Bloom · Soft Bento · CSS custom  |
| API             | Node.js + Express 5 + TypeScript 6      |
| Validation      | Zod 4                                   |
| ORM             | Prisma 7 + driver adapter pg            |
| Base de données | PostgreSQL 17                           |
| Auth            | JWT (access + refresh token en BDD)     |
| Hachage         | argon2                                  |
| Tests           | Node test runner — intégration réelle   |
| Conteneurs      | Docker Compose (dev + prod)             |

---

## Démarrage rapide (Docker)

```bash
# 1. Cloner le dépôt
git clone git@github.com:Paul-Sebas-Pro/MyQuizz.git
cd MyQuizz

# 2. Créer les variables d'environnement
cp .env.example .env
# Éditer .env si nécessaire (JWT_SECRET, ports…)

# 3. Lancer l'environnement complet
docker compose -f docker-compose.dev.yml up api client postgres adminer --build

# 4. Dans un second terminal — migration + seed
docker compose -f docker-compose.dev.yml exec api npm run db:migrate:dev -- --name init
docker compose -f docker-compose.dev.yml exec api npm run db:seed
```

| Service | URL                   |
| ------- | --------------------- |
| Client  | http://localhost:5173 |
| API     | http://localhost:3001 |
| Adminer | http://localhost:8080 |

**Comptes de test** (mot de passe : `Passw0rd!`) :

| Email             | Rôle   |
| ----------------- | ------ |
| charlie@martin.fr | admin  |
| alice@dupont.fr   | author |
| bob@leponge.fr    | author |

---

## Structure du projet

```
MyQuizz/
├── api/                     → API REST (Express 5 + Prisma 7)
│   ├── prisma/
│   │   ├── schema.prisma    → Schéma de données
│   │   ├── migrations/      → Historique des migrations
│   │   └── generated/       → Client Prisma généré
│   ├── src/
│   │   ├── controllers/     → Logique métier par domaine
│   │   ├── middlewares/     → Auth, rôles, erreurs
│   │   ├── models/          → PrismaClient + seed
│   │   └── routers/         → Montage des routes
│   └── test/                → Tests d'intégration
│
├── client/                  → SPA (Svelte 5 Runes + Vite)
│   └── src/
│       ├── components/      → NavBar, QuizCard…
│       ├── lib/             → Router pushState
│       ├── pages/           → Home, Login, Dashboard, QuizPlay, Profil…
│       ├── services/        → Client API typé + DTOs
│       └── stores/          → Auth store (Runes)
│
├── docs/conception/         → User stories, endpoints, Merise, UML, maquettes
├── docker-compose.dev.yml   → Dev (volumes hot-reload)
└── docker-compose.yml       → Prod
```

---

## API — Endpoints principaux

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/logout

GET    /api/quizzes              → quiz publiés
GET    /api/quizzes/recent       → 6 derniers
GET    /api/quizzes/:id
POST   /api/quizzes              → auth (author/admin)
POST   /api/quizzes/:id/attempts → soumettre les réponses
GET    /api/quizzes/:id/attempts → historique (admin)

GET    /api/tags
POST   /api/tags                 → admin
PATCH  /api/tags/:id             → admin

GET    /api/levels
GET    /api/users/:id/profile
GET    /api/users/:id/attempts
```

---

## Tests

```bash
# Tous les tests (unit + intégration sur DB réelle)
docker compose -f docker-compose.dev.yml exec api npm test

# Unitaires uniquement
docker compose -f docker-compose.dev.yml exec api npm run test:unit

# Intégration uniquement
docker compose -f docker-compose.dev.yml exec api npm run test:spec
```

---

## Commandes utiles

```bash
# Prisma Studio (GUI base de données)
docker compose -f docker-compose.dev.yml exec api npm run db:studio

# Reset + reseed
docker compose -f docker-compose.dev.yml exec api npm run db:reset

# Lint
docker compose -f docker-compose.dev.yml exec api npm run lint
```

---

## Conception

Documents dans [`docs/conception/`](docs/conception/) :
user stories · dictionnaire des données · MCD/MLD/MPD · diagrammes UML · maquettes UI · référence endpoints

---

## Licence

MIT
