import assert from "node:assert";
import { describe, it } from "node:test";
import { requester } from "../../test/index.ts";
import { prisma } from "../models/index.ts";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { config } from "../../config.ts";

async function createAdminToken() {
  const user = await prisma.user.create({
    data: {
      firstname: "Admin",
      lastname: "Test",
      email: "admin@tags-test.com",
      password: await argon2.hash("TestPassword123!"),
      role: "admin",
    },
  });
  return jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: "1h" });
}

describe("[GET] /api/tags", () => {
  it("should return an empty array when no tags exist", async () => {
    const { data, status } = await requester.get("/tags");
    assert.strictEqual(status, 200);
    assert.deepStrictEqual(data, []);
  });

  it("should return all tags", async () => {
    await prisma.tag.create({ data: { name: "JavaScript" } });
    const { data } = await requester.get("/tags");
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].name, "JavaScript");
  });
});

describe("[GET] /api/tags/:id", () => {
  it("should return the tag", async () => {
    const tag = await prisma.tag.create({ data: { name: "CSS" } });
    const { data, status } = await requester.get(`/tags/${tag.id}`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.name, "CSS");
  });

  it("should return 404 when tag does not exist", async () => {
    const { status } = await requester.get("/tags/999999");
    assert.strictEqual(status, 404);
  });
});

describe("[POST] /api/tags", () => {
  it("should create a tag", async () => {
    const token = await createAdminToken();
    const { data, status } = await requester.post(
      "/tags",
      { name: "Python" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 201);
    assert.strictEqual(data.name, "Python");
  });

  it("should return 409 when name already exists", async () => {
    const token = await createAdminToken();
    await prisma.tag.create({ data: { name: "Duplicate" } });
    const { status } = await requester.post(
      "/tags",
      { name: "Duplicate" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 409);
  });

  it("should return 401 without token", async () => {
    const { status } = await requester.post("/tags", { name: "NoAuth" });
    assert.strictEqual(status, 401);
  });

  it("should return 400 when name is missing", async () => {
    const token = await createAdminToken();
    const { status } = await requester.post(
      "/tags",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

describe("[PATCH] /api/tags/:id", () => {
  it("should update the tag name", async () => {
    const token = await createAdminToken();
    const tag = await prisma.tag.create({ data: { name: "OldName" } });
    const { data, status } = await requester.patch(
      `/tags/${tag.id}`,
      { name: "NewName" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 200);
    assert.strictEqual(data.name, "NewName");
  });

  it("should return 404 when tag does not exist", async () => {
    const token = await createAdminToken();
    const { status } = await requester.patch(
      "/tags/999999",
      { name: "X" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });
});

describe("[DELETE] /api/tags/:id", () => {
  it("should delete the tag", async () => {
    const token = await createAdminToken();
    const tag = await prisma.tag.create({ data: { name: "ToDelete" } });
    const { status } = await requester.delete(
      `/tags/${tag.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 204);
    const count = await prisma.tag.count();
    assert.strictEqual(count, 0);
  });

  it("should return 404 when tag does not exist", async () => {
    const token = await createAdminToken();
    const { status } = await requester.delete(
      "/tags/999999",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });
});
