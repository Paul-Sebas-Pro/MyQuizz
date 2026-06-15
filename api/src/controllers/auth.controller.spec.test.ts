import argon2 from "argon2";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import { describe, it } from "node:test";
import { config } from "../../config.ts";
import { requester } from "../../test/index.ts";
import { prisma } from "../models/index.ts";

// Mot de passe valide pour tous les tests (12 chars, maj, min, chiffre, spécial)
const VALID_PASSWORD = "TestPassword123!";

// Helper : crée un utilisateur avec un rôle précis et retourne son access token JWT
async function createUserAndGetToken(role: "member" | "author" | "admin") {
  const user = await prisma.user.create({
    data: {
      firstname: role,
      lastname: "User",
      email: `${role}@rbac-test.com`,
      password: await argon2.hash(VALID_PASSWORD),
      role,
    },
  });
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    config.jwtSecret,
    { expiresIn: "1h" },
  );
  return { user, accessToken };
}

// Helper : génère un JWT déjà expiré pour un utilisateur donné
function createExpiredToken(userId: number, role: string) {
  return jwt.sign(
    {
      userId,
      role,
      exp: Math.floor(Date.now() / 1000) - 3600, // expiré il y a 1 heure
    },
    config.jwtSecret,
  );
}

// =============================================================================
// SIGNUP TESTS
// =============================================================================

describe("[POST] /api/auth/signup", () => {
  it("should return 201 with user data (without password) on valid signup", async () => {
    // Arrange
    const body = {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "pablo.dupont@test.com",
      password: VALID_PASSWORD,
      confirm: VALID_PASSWORD,
    };
    // Act
    const { status, data } = await requester.post("/auth/signup", body);
    // Assert
    assert.strictEqual(status, 201);
    assert.ok(data.id);
    assert.strictEqual(data.firstname, "Pablo");
    assert.strictEqual(data.lastname, "Dupont");
    assert.strictEqual(data.email, "pablo.dupont@test.com");
    assert.strictEqual(data.password, undefined);
  });

  it("should return 409 when email already exists", async () => {
    // Arrange : utilisateur déjà en BDD
    await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "existing@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    // Act
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "existing@test.com",
      password: VALID_PASSWORD,
      confirm: VALID_PASSWORD,
    });
    // Assert
    assert.strictEqual(status, 409);
  });

  it("should return 400 when password is shorter than 12 characters", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "short@test.com",
      password: "Short1!",
      confirm: "Short1!",
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when password has no uppercase letter", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "nouppercase@test.com",
      password: "testpassword123!",
      confirm: "testpassword123!",
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when password has no lowercase letter", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "nolowercase@test.com",
      password: "TESTPASSWORD123!",
      confirm: "TESTPASSWORD123!",
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when password has no digit", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "nodigit@test.com",
      password: "TestPassword!!!",
      confirm: "TestPassword!!!",
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when password has no special character", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "nospecial@test.com",
      password: "TestPassword123",
      confirm: "TestPassword123",
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when passwords do not match", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "mismatch@test.com",
      password: VALID_PASSWORD,
      confirm: "DifferentPassword123!",
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when email format is invalid", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      lastname: "Dupont",
      email: "not-an-email",
      password: VALID_PASSWORD,
      confirm: VALID_PASSWORD,
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when firstname is missing", async () => {
    const { status } = await requester.post("/auth/signup", {
      lastname: "Dupont",
      email: "missing-firstname@test.com",
      password: VALID_PASSWORD,
      confirm: VALID_PASSWORD,
    });
    assert.strictEqual(status, 400);
  });

  it("should return 400 when lastname is missing", async () => {
    const { status } = await requester.post("/auth/signup", {
      firstname: "Pablo",
      email: "missing-lastname@test.com",
      password: VALID_PASSWORD,
      confirm: VALID_PASSWORD,
    });
    assert.strictEqual(status, 400);
  });
});

// =============================================================================
// LOGIN TESTS
// =============================================================================

describe("[POST] /api/auth/login", () => {
  it("should return 200 with access_token and refresh_token on valid credentials", async () => {
    // Arrange
    await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "login@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    // Act
    const { status, data } = await requester.post("/auth/login", {
      email: "login@test.com",
      password: VALID_PASSWORD,
    });
    // Assert
    assert.strictEqual(status, 200);
    assert.ok(data.access_token);
    assert.ok(data.refresh_token);
  });

  it("should return 401 when email does not exist", async () => {
    const { status } = await requester.post("/auth/login", {
      email: "nonexistent@test.com",
      password: VALID_PASSWORD,
    });
    assert.strictEqual(status, 401);
  });

  it("should return 401 when password is incorrect", async () => {
    // Arrange
    await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "wrongpassword@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    // Act
    const { status } = await requester.post("/auth/login", {
      email: "wrongpassword@test.com",
      password: "WrongPassword123!",
    });
    assert.strictEqual(status, 401);
  });

  it("should return 400 when email format is invalid", async () => {
    const { status } = await requester.post("/auth/login", {
      email: "not-an-email",
      password: VALID_PASSWORD,
    });
    assert.strictEqual(status, 400);
  });

  it("should return 401 on GET /auth/me with an expired access token", async () => {
    // Arrange : créer un utilisateur et générer un token expiré
    const user = await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "expired-login@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    const expiredToken = createExpiredToken(user.id, user.role);
    // Act
    const { status } = await requester.get("/auth/me", {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.strictEqual(status, 401);
  });
});

// =============================================================================
// GET /AUTH/ME TESTS
// =============================================================================

describe("[GET] /api/auth/me", () => {
  it("should return 401 when no token is provided", async () => {
    const { status } = await requester.get("/auth/me");
    assert.strictEqual(status, 401);
  });

  it("should return 200 with user data (without password) when token is valid", async () => {
    // Arrange
    const user = await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "me@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    const accessToken = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwtSecret,
      { expiresIn: "1h" },
    );
    // Act
    const { status, data } = await requester.get("/auth/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    // Assert
    assert.strictEqual(status, 200);
    assert.strictEqual(data.id, user.id);
    assert.strictEqual(data.email, user.email);
    assert.strictEqual(data.password, undefined);
  });

  it("should return 401 when access token is expired", async () => {
    // Arrange
    const user = await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "expired-me@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    const expiredToken = createExpiredToken(user.id, user.role);
    // Act
    const { status } = await requester.get("/auth/me", {
      headers: { Authorization: `Bearer ${expiredToken}` },
    });
    assert.strictEqual(status, 401);
  });

  it("should return 401 when JWT token is invalid", async () => {
    const { status } = await requester.get("/auth/me", {
      headers: { Authorization: "Bearer invalid.jwt.token" },
    });
    assert.strictEqual(status, 401);
  });
});

// =============================================================================
// REFRESH TOKEN TESTS
// =============================================================================

describe("[POST] /api/auth/refresh", () => {
  it("should return 200 with new accessToken and refreshToken on valid refresh token", async () => {
    // Arrange : créer un utilisateur et se connecter pour obtenir un refresh token
    await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "refresh@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    const { data: loginData } = await requester.post("/auth/login", {
      email: "refresh@test.com",
      password: VALID_PASSWORD,
    });
    // Act
    const { status, data } = await requester.post("/auth/refresh", {
      refreshToken: loginData.refresh_token,
    });
    // Assert
    assert.strictEqual(status, 200);
    assert.ok(data.accessToken);
    assert.ok(data.refreshToken);
  });

  it("should return 401 when refresh token is invalid", async () => {
    const { status } = await requester.post("/auth/refresh", {
      refreshToken: "token-qui-nexiste-pas",
    });
    assert.strictEqual(status, 401);
  });

  it("should return 401 when refresh token is expired", async () => {
    // Arrange : créer un refresh token expiré directement en BDD
    const user = await prisma.user.create({
      data: {
        firstname: "Pablo",
        lastname: "Dupont",
        email: "expired-refresh@test.com",
        password: await argon2.hash(VALID_PASSWORD),
      },
    });
    await prisma.refreshToken.create({
      data: {
        token: "expired-refresh-token-value",
        user_id: user.id,
        expires_at: new Date(Date.now() - 1000), // expiré il y a 1 seconde
      },
    });
    // Act
    const { status } = await requester.post("/auth/refresh", {
      refreshToken: "expired-refresh-token-value",
    });
    assert.strictEqual(status, 401);
  });

  it("should return 401 when no refresh token is provided", async () => {
    const { status } = await requester.post("/auth/refresh", {});
    assert.strictEqual(status, 401);
  });
});

// =============================================================================
// RBAC TESTS
// =============================================================================

describe("RBAC - /api/levels", () => {
  it("should return 403 when a member tries to POST /levels", async () => {
    // Arrange
    const { accessToken } = await createUserAndGetToken("member");
    // Act
    const { status } = await requester.post(
      "/levels",
      { name: "level member" },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    assert.strictEqual(status, 403);
  });

  it("should return 201 when an author POSTs /levels", async () => {
    // Arrange
    const { accessToken } = await createUserAndGetToken("author");
    // Act
    const { status } = await requester.post(
      "/levels",
      { name: "level author" },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    assert.strictEqual(status, 201);
  });

  it("should return 200 when an admin PATCHes /levels/:id", async () => {
    // Arrange : créer un level à modifier
    const level = await prisma.level.create({ data: { name: "to update" } });
    const { accessToken } = await createUserAndGetToken("admin");
    // Act
    const { status } = await requester.patch(
      `/levels/${level.id}`,
      { name: "updated by admin" },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    assert.strictEqual(status, 200);
  });

  it("should return 403 when a member tries to DELETE /levels/:id", async () => {
    // Arrange
    const level = await prisma.level.create({ data: { name: "to delete" } });
    const { accessToken } = await createUserAndGetToken("member");
    // Act
    const { status } = await requester.delete(`/levels/${level.id}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(status, 403);
  });

  it("should return 401 when an unauthenticated user tries to POST /levels", async () => {
    const { status } = await requester.post("/levels", { name: "no auth" });
    assert.strictEqual(status, 401);
  });
});
