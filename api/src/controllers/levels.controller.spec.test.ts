import assert from "node:assert";
import { describe, it } from "node:test";
import { requester } from "../../test/index.ts";
import { prisma } from "../models/index.ts";

describe("[POST] /api/levels", () => {
  it("should create a level in the database", async () => {
    // Arrange
    const body = { name: "mon nouveau level" };
    // Act
    await requester.post("/levels", body);
    // Assert : vérifier que le level est bien en BDD
    const createdLevel = await prisma.level.findFirst({
      where: { name: "mon nouveau level" },
    });
    assert.ok(createdLevel);
  });

  it("should return the created level with the right properties", async () => {
    // Arrange
    const body = { name: "mon nouveau level" };
    // A
    const { data: createdLevel } = await requester.post("/levels", body);
    // Assert
    assert.ok(createdLevel.id);
    assert.ok(createdLevel.created_at);
    assert.ok(createdLevel.updated_at);
    assert.strictEqual(createdLevel.name, "mon nouveau level");
  });

  it("should return 409 when the name is already taken", async () => {
    // On crée un level qui va représenter le nom qui existe déjà
    await prisma.level.create({ data: { name: "alreadyexisting" } });
    // On essaye d'en créer un nouveau via requester :
    const httpResponse = await requester.post("/levels", {
      name: "alreadyexisting",
    });

    // Assert
    // on a bien une 409 en ereur
    assert.strictEqual(httpResponse.status, 409);
  });

  // Champs inconnus --> doit retourner 400 (.strict())
  it("should return 400 when body contains unknown fields", async () => {
    const { status } = await requester.post("/levels", {
      name: "valid",
      unknown: "field",
    });
    assert.strictEqual(status, 400);
  });

  // Nom trop long --> doit retourner 400 (.max(100))
  it("should return 400 when name exceeds 100 characters", async () => {
    const longName = "a".repeat(101);
    const { status } = await requester.post("/levels", { name: longName });
    assert.strictEqual(status, 400);
  });

  // Body sans name -->  doit retourner 400
  it("should return 400 when name is missing", async () => {
    const { status } = await requester.post("/levels", {});
    assert.strictEqual(status, 400);
  });
});

describe("GET /api/levels/:id", () => {
  // doit retourner le niveau de la BDD
  it("should return the level with the right properties", async () => {
    // Arrange
    // préparer les valeurs dans le niveau

    const LEVEL = { name: "level 3" };
    const databaseLevel = await prisma.level.create({ data: LEVEL });
    // Act
    const { data: level } = await requester.get(`/levels/${databaseLevel.id}`);
    // Assert
    // est ce que le name qu'on a préparé dans notre test, est le même que celui qu'on récupère lorsqu'on fait un get /levels/id ?
    assert.strictEqual(level.name, LEVEL.name);
  });

  // doit retourner une 404 si le niveau n'est pas trouvé
  it("Should return 404 if the level doesnt exist", async () => {
    // Arrange
    // On prépare un id qui n'existe pas
    const unexistingID = 222222;
    // Act
    // on lance notre requete pour chercher le level
    const { status } = await requester.get(`/levels/${unexistingID}`);
    // Assert
    // on vérifie qu'on a bien reçu une 404
    assert.strictEqual(status, 404);
  });
});

// PATCH
describe("PATCH /levels/:id", () => {
  // doit mettre à jour le nom du niveau concerné
  it("Should update the name of the concerned level", async () => {
    // Arrange
    const LEVEL = { name: "nameDeBase" };
    const levelToUpdate = await prisma.level.create({ data: LEVEL });
    // Act
    // on a créé un level, maitenant on le modifie à travers une requete de type PATCH
    const httpReply = await requester.patch(`/levels/${levelToUpdate.id}`, {
      name: LEVEL.name,
    });
    // Assert
    // Est ce qu'on a bien le bon status ? (200)
    assert.strictEqual(httpReply.status, 200);
    // Est ce qu'on a bien le bon name ?
    assert.strictEqual(httpReply.data.name, LEVEL.name);
  });

  // doit retourner une 404 si le niveau n'est pas trouvé
  it("Should return a 404 when the level doesnt exist", async () => {
    const unexistingID = 222222;
    const { status } = await requester.patch(`/levels/${unexistingID}`, {
      name: "test",
    });
    assert.strictEqual(status, 404);
  });

  // Body vide --> doit retourner 400 (au moins un champs est requis)
  it("Should return 400 when body is empty", async () => {
    //Arrange
    const level = await prisma.level.create({ data: { name: "patchEmpty" } });
    //Act
    const { status } = await requester.patch(`/levels/${level.id}`, {});
    // Assert
    assert.strictEqual(status, 400);
  });

  // Champs inconnus --> doit retourner 400 (.strict())
  it("Should return 400 when body contains unknown fields", async () => {
    const level = await prisma.level.create({ data: { name: "patchUnknown" } });
    const { status } = await requester.patch(`/levels/${level.id}`, {
      name: "valid",
      foo: "bar",
    });
    assert.strictEqual(status, 400);
  });

  // Nom trop long --> doit retourner 400 (.max(100))
  it("Should return 400 when name exceeds 100 characters", async () => {
    const level = await prisma.level.create({ data: { name: "patchMaxLen" } });
    const longName = "a".repeat(101);
    const { status } = await requester.patch(`/levels/${level.id}`, {
      name: longName,
    });
    assert.strictEqual(status, 400);
  });
});

// DELETE
describe("DELETE /levels/:id", () => {
  // doit supprimer le niveau concerné
  it("should delete the concerned level", async () => {
    // On crée notre niveau qu'on supprimera via la requete juste après (ARRANGE)
    const level = await prisma.level.create({ data: { name: "test" } });
    // On fait une requete pour supprimer ce niveau (ACT)
    const { status } = await requester.delete(`/levels/${level.id}`);
    // On vérifie quon a bien supprimé le niveau (ASSERT)
    assert.strictEqual(status, 204);
    // on peut compter le nombre de niveau dans notre BDD, pour voir si le niveau a bien été supprimé
    // vu que nos tests sont isolés, chaque test commence avec une BDD vide, donc si on crée un level, puis on le supprime, on doit s'attendre à ce que la BDD contienne 0 levels
    const countExistingLevels = await prisma.level.count();
    assert.strictEqual(countExistingLevels, 0);
  });
  // doit retourner une 404 si le niveau qu'on veut supprimer n'existe pas
  it("should return 404 when the level doesnt exist", async () => {
    const unexistingID = 222222;
    const { status } = await requester.delete(`/levels/${unexistingID}`);
    assert.strictEqual(status, 404);
  });
});
