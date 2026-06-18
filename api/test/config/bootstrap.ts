// Ce module doit être importé AVANT global-setup.ts.
// Contexte : dans un container Docker, les vars d'env sont déjà définies par docker-compose.
// Node --env-file ne surcharge pas les vars existantes.
// Ce fichier force les bonnes valeurs avant que les modules (PrismaClient, Express) soient importés.

if (process.env.USE_PG_CLIENT === "true") {
  // Forcer PORT sur le port de test (7357) pour ne pas entrer en conflit
  // avec le serveur dev déjà en cours d'exécution sur le port par défaut (3000)
  process.env.PORT = "7357";

  // Forcer DATABASE_URL vers la DB de test si elle pointe encore vers la DB de dev
  const currentUrl = process.env.DATABASE_URL ?? "";
  const testUser = process.env.POSTGRES_USER ?? "myquizztest";

  if (!currentUrl.includes(testUser)) {
    const pass = process.env.POSTGRES_PASSWORD ?? "myquizztest";
    const dbName = process.env.POSTGRES_DB ?? "myquizztest_db";
    const host = process.env.POSTGRES_HOST ?? "postgres";
    const port = process.env.POSTGRES_PORT ?? "5432";
    process.env.DATABASE_URL = `postgres://${testUser}:${pass}@${host}:${port}/${dbName}`;
  }
}