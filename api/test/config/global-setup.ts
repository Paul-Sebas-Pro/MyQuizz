import { execSync } from "node:child_process";
import type { Server } from "node:http";
import { after, before, beforeEach } from "node:test";
import { app } from "../../src/app.ts";
import { prisma } from "../../src/models/index.ts";

// ================================================================================
// Objectif de ce fichier : mettre en place l'environnement des tests d'intégration

// === AVANT le lancement des tests ===
// Création d'une BDD de test (myquizztest) via Docker
// Création des tables dans la BDD de test (run les migrations)
// Lancement du serveur Express

// === Entre chaque test ===
// On vide les tables (chaque test repart de zéro)

// === APRES les tests ===
// Déconnexion du client BDD Prisma
// Arrêt du serveur Express de test
// Suppression de la BDD de test (conteneur Docker)
// ================================================================================

let server: Server;

// Hook before : s'exécute une fois AVANT l'ensemble des tests
before(() => {
  // S'assurer que le conteneur n'existe pas déjà
  execSync(`docker rm -f myquizztest 2>/dev/null || true`);

  // Créer un conteneur PostgreSQL dédié aux tests
  execSync(`
    docker run \
    -d \
    --name myquizztest \
    -p ${process.env.POSTGRES_PORT}:5432 \
    -e POSTGRES_USER=${process.env.POSTGRES_USER} \
    -e POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD} \
    -e POSTGRES_DB=${process.env.POSTGRES_DB} \
    postgres:17
  `);

  // Attendre que PostgreSQL soit prêt
  execSync(`sleep 1`);

  // Lancer les migrations sur la BDD de test
  execSync(`npx prisma migrate deploy`);

  // Lancer le serveur Express de test
  server = app.listen(process.env.PORT);
});

// Hook beforeEach : s'exécute AVANT chaque test
// un Hook est une action qui va se déclencher dans une situation particulière, ici : avant chaque test, pour exécuter ce qui est écrit au sein de celle-ci - vous pouvez faire un parallèle avec les eventListener vues quand on étudiait le DOM
beforeEach(async () => {
  await truncateTables();
});

// Hook after : s'exécute une fois APRES l'ensemble des tests
after(async () => {
  server.close();
  await prisma.$disconnect();
  execSync(`docker rm -f myquizztest`);
});

// Fonction pour vider toutes les tables
async function truncateTables() {
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
}
