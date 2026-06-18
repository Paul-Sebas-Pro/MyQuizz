import argon2 from "argon2";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import { describe, it } from "node:test";
import { config } from "../../config.ts";
import { requester } from "../../test/index.ts";
import { prisma } from "../models/index.ts";

// POST /levels → author ou admin
// PATCH /levels/:id → admin seulement
// DELETE /levels/:id → admin seulement

async function createToken(role: "author" | "admin") {
  const user = await prisma.user.create({
    data: {
      firstname: role,
      lastname: "Test",
      email: `${role}-${Date.now()}@levels-test.com`,
      password: await argon2.hash("TestPassword123!"),
      role,
    },
  });
  return jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: "1h" });
}

describe("[POST] /api/levels", () => {
  it("should create a level in the database", async () => {
    // Arrange
    const token = await createToken("author");
    const body = { name: "mon nouveau level" };
    // Act
    await requester.post("/levels", body, { headers: { Authorization: `Bearer ${token}` } });
    // Assert : vérifier que le level est bien en BDD
    const createdLevel = await prisma.level.findFirst({
      where: { name: "mon nouveau level" },
    });
    assert.ok(createdLevel);
  });

  it("should return the created level with the right properties", async () => {
    // Arrange
    const token = await createToken("author");
    const body = { name: "mon nouveau level" };
    // Act
    const { data: createdLevel } = await requester.post("/levels", body, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // Assert
    assert.ok(createdLevel.id);
    assert.ok(createdLevel.created_at);
    assert.ok(createdLevel.updated_at);
    assert.strictEqual(createdLevel.name, "mon nouveau level");
  });

  it("should return 409 when the name is already taken", async () => {
    const token = await createToken("author");
    await prisma.level.create({ data: { name: "alreadyexisting" } });
    const httpResponse = await requester.post(
      "/levels",
      { name: "alreadyexisting" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(httpResponse.status, 409);
  });

  // Champs inconnus --> doit retourner 400 (.strict())
  it("should return 400 when body contains unknown fields", async () => {
    const token = await createToken("author");
    const { status } = await requester.post(
      "/levels",
      { name: "valid", unknown: "field" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });

  // Nom trop long --> doit retourner 400 (.max(100))
  it("should return 400 when name exceeds 100 characters", async () => {
    const token = await createToken("author");
    const longName = "a".repeat(101);
    const { status } = await requester.post(
      "/levels",
      { name: longName },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });

  // Body sans name --> doit retourner 400
  it("should return 400 when name is missing", async () => {
    const token = await createToken("author");
    const { status } = await requester.post(
      "/levels",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

describe("GET /api/levels/:id", () => {
  // doit retourner le niveau de la BDD
  it("should return the level with the right properties", async () => {
    const LEVEL = { name: "level 3" };
    const databaseLevel = await prisma.level.create({ data: LEVEL });
    const { data: level } = await requester.get(`/levels/${databaseLevel.id}`);
    assert.strictEqual(level.name, LEVEL.name);
  });

  // doit retourner une 404 si le niveau n'est pas trouvé
  it("Should return 404 if the level doesnt exist", async () => {
    const { status } = await requester.get("/levels/222222");
    assert.strictEqual(status, 404);
  });
});

// PATCH
describe("PATCH /levels/:id", () => {
  // doit mettre à jour le nom du niveau concerné
  it("Should update the name of the concerned level", async () => {
    const token = await createToken("admin");
    const LEVEL = { name: "nameDeBase" };
    const levelToUpdate = await prisma.level.create({ data: LEVEL });
    const httpReply = await requester.patch(
      `/levels/${levelToUpdate.id}`,
      { name: LEVEL.name },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(httpReply.status, 200);
    assert.strictEqual(httpReply.data.name, LEVEL.name);
  });

  // doit retourner une 404 si le niveau n'est pas trouvé
  it("Should return a 404 when the level doesnt exist", async () => {
    const token = await createToken("admin");
    const { status } = await requester.patch(
      "/levels/222222",
      { name: "test" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });

  // Body vide --> doit retourner 400 (au moins un champ est requis)
  it("Should return 400 when body is empty", async () => {
    const token = await createToken("admin");
    const level = await prisma.level.create({ data: { name: "patchEmpty" } });
    const { status } = await requester.patch(
      `/levels/${level.id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });

  // Champs inconnus --> doit retourner 400 (.strict())
  it("Should return 400 when body contains unknown fields", async () => {
    const token = await createToken("admin");
    const level = await prisma.level.create({ data: { name: "patchUnknown" } });
    const { status } = await requester.patch(
      `/levels/${level.id}`,
      { name: "valid", foo: "bar" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });

  // Nom trop long --> doit retourner 400 (.max(100))
  it("Should return 400 when name exceeds 100 characters", async () => {
    const token = await createToken("admin");
    const level = await prisma.level.create({ data: { name: "patchMaxLen" } });
    const { status } = await requester.patch(
      `/levels/${level.id}`,
      { name: "a".repeat(101) },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

// DELETE
describe("DELETE /levels/:id", () => {
  // doit supprimer le niveau concerné
  it("should delete the concerned level", async () => {
    const token = await createToken("admin");
    const level = await prisma.level.create({ data: { name: "test" } });
    const { status } = await requester.delete(
      `/levels/${level.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 204);
    // Un seul level créé + supprimé → admin user créé par createToken n'a pas de level
    // La BDD doit contenir 0 levels
    const countExistingLevels = await prisma.level.count();
    assert.strictEqual(countExistingLevels, 0);
  });

  // doit retourner une 404 si le niveau qu'on veut supprimer n'existe pas
  it("should return 404 when the level doesnt exist", async () => {
    const token = await createToken("admin");
    const { status } = await requester.delete(
      "/levels/222222",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });
});
