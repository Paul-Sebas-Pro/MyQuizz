// Échantillonnage (seeding)

import { prisma } from "./index.ts";

// Users
await prisma.user.createMany({
  data: [
    {
      firstname: "Alice",
      lastname: "Dupont",
      email: "alice@dupont.fr",
      password: "Passw0rd!",
    },
    {
      firstname: "Bob",
      lastname: "Léponge",
      email: "bob@leponge.fr",
      password: "Passw0rd!",
    },
  ],
});

// Levels
await prisma.level.createMany({
  data: [{ name: "Ouane" }, { name: "Tou" }],
});

console.log(`📊 Échantillonnage effectué avec succès.`);
