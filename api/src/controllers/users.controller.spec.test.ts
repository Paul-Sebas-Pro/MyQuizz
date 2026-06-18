import argon2 from "argon2";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import { describe, it } from "node:test";
import { config } from "../../config.ts";
import { prisma } from "../models/index.ts";
import { requester } from "../../test/index.ts";

// GET /users → admin seulement

async function createAdminToken() {
  const user = await prisma.user.create({
    data: {
      firstname: "Admin",
      lastname: "Test",
      email: `admin-${Date.now()}@users-test.com`,
      password: await argon2.hash("TestPassword123!"),
      role: "admin",
    },
  });
  return {
    user,
    token: jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: "1h" }),
  };
}

describe("GET /api/users", () => {
  it("should return an array containing the users from the database", async () => {
    // Arrange : 1 admin (pour le token) + 2 users créés
    const { user: adminUser } = await createAdminToken();
    const databaseUsers = await prisma.user.createManyAndReturn({
      data: [
        { firstname: "Toto", lastname: "toto", email: "toto@toto.fr", password: "motdepasse" },
        { firstname: "Tata", lastname: "tata", email: "tata@tata.com", password: "motdepasse3000" },
      ],
    });

    // Act
    const { token } = await createAdminToken();
    const { data: responseUsers } = await requester.get("/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Assert : admin + databaseUsers[0] + databaseUsers[1] + 2e admin = 4 users
    // On vérifie que les users créés sont bien dans la réponse
    const toto = responseUsers.find((u: { id: number }) => u.id === databaseUsers[0].id);
    const tata = responseUsers.find((u: { id: number }) => u.id === databaseUsers[1].id);
    assert.ok(toto, "Toto doit être présent");
    assert.ok(tata, "Tata doit être présent");
    assert.strictEqual(toto.email, databaseUsers[0].email);

    // Le mot de passe ne doit pas être exposé
    assert.strictEqual(toto.password, undefined);

    // L'admin créé doit aussi être présent
    const admin = responseUsers.find((u: { id: number }) => u.id === adminUser.id);
    assert.ok(admin, "L'utilisateur admin doit être présent");
  });

  it("should return user properties without password", async () => {
    const { token } = await createAdminToken();
    const newUser = await prisma.user.create({
      data: {
        firstname: "michel",
        lastname: "michel",
        email: "michel@michel.michel",
        password: "motdepasse",
      },
    });

    const { data: responseUsers } = await requester.get("/users", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const found = responseUsers.find((u: { id: number }) => u.id === newUser.id);
    assert.ok(found, "L'utilisateur créé doit être présent");
    assert.strictEqual(found.id, newUser.id);
    assert.strictEqual(found.firstname, newUser.firstname);
    assert.strictEqual(found.lastname, newUser.lastname);
    assert.strictEqual(found.email, newUser.email);
    assert.strictEqual(found.password, undefined);
  });

  it("should return 401 without authentication token", async () => {
    const { status } = await requester.get("/users");
    assert.strictEqual(status, 401);
  });

  it("should return 403 when authenticated as member", async () => {
    const member = await prisma.user.create({
      data: {
        firstname: "Member",
        lastname: "Test",
        email: "member@users-test.com",
        password: await argon2.hash("TestPassword123!"),
        role: "member",
      },
    });
    const memberToken = jwt.sign(
      { userId: member.id, role: member.role },
      config.jwtSecret,
      { expiresIn: "1h" },
    );
    const { status } = await requester.get("/users", {
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    assert.strictEqual(status, 403);
  });
});
