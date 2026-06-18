import { execSync } from "node:child_process";
import type { Server } from "node:http";
import { after, before, beforeEach } from "node:test";
import { app } from "../../src/app.ts";
import { prisma } from "../../src/models/index.ts";

// ================================================================================
// Objectif de ce fichier : mettre en place l'environnement des tests d'intégration

// === AVANT le lancement des tests ===
// Création d'une BDD de test via Docker (hôte) ou pg client (conteneur)
// Création des tables dans la BDD de test (run les migrations)
// Lancement du serveur Express

// === Entre chaque test ===
// On vide les tables (chaque test repart de zéro)

// === APRES les tests ===
// Déconnexion du client BDD Prisma
// Arrêt du serveur Express de test
// Suppression de la BDD de test (si mode Docker)
// ================================================================================

let server: Server;

// Hook before : s'exécute une fois AVANT l'ensemble des tests
before(async () => {
  if (process.env.USE_PG_CLIENT === "true") {
    // Mode conteneur : utilise le service postgres existant via client pg
    // (pas de Docker CLI disponible à l'intérieur d'un conteneur)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pgModule: any = await import("pg");
    // pg peut exporter via default ou comme namespace CommonJS
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const Client = pgModule.default?.Client ?? pgModule.Client;

    const adminUrl =
      process.env.POSTGRES_ADMIN_URL ??
      "postgres://postgres:postgres@localhost:5432/postgres";
    const dbName = process.env.POSTGRES_DB ?? "myquizztest_db";
    const dbUser = process.env.POSTGRES_USER ?? "myquizztest";
    const dbPass = process.env.POSTGRES_PASSWORD ?? "myquizztest";

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment
    const admin = new Client({ connectionString: adminUrl });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.connect();

    // Couper les connexions actives avant de dropper la BDD
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.query(
      `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()`,
      [dbName],
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.query(`DROP DATABASE IF EXISTS "${dbName}" WITH (FORCE)`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.query(`DROP USER IF EXISTS "${dbUser}"`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.query(`CREATE USER "${dbUser}" WITH PASSWORD '${dbPass}'`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.query(`CREATE DATABASE "${dbName}" OWNER "${dbUser}"`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await admin.end();
  } else {
    // Mode hôte : crée un conteneur PostgreSQL dédié aux tests
    execSync(`docker rm -f myquizztest 2>/dev/null || true`);
    execSync(`
      docker run -d --name myquizztest \
      -p ${process.env.POSTGRES_PORT}:5432 \
      -e POSTGRES_USER=${process.env.POSTGRES_USER} \
      -e POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD} \
      -e POSTGRES_DB=${process.env.POSTGRES_DB} \
      postgres:17
    `);
    execSync(`sleep 1`);
  }

  // Lancer les migrations sur la BDD de test
  execSync(`npx prisma migrate deploy`);

  // Lancer le serveur Express de test
  server = app.listen(process.env.PORT);
});

// Hook beforeEach : s'exécute AVANT chaque test
beforeEach(async () => {
  await truncateTables();
});

// Hook after : s'exécute une fois APRES l'ensemble des tests
after(async () => {
  server.close();
  await prisma.$disconnect();
  if (process.env.USE_PG_CLIENT !== "true") {
    execSync(`docker rm -f myquizztest`);
  }
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
