import argon2 from "argon2";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import { describe, it } from "node:test";
import { config } from "../../config.ts";
import { requester } from "../../test/index.ts";
import { prisma } from "../models/index.ts";

async function createAuthorToken() {
  const user = await prisma.user.create({
    data: {
      firstname: "Author",
      lastname: "Test",
      email: `author-${Date.now()}@answers-test.com`,
      password: await argon2.hash("TestPassword123!"),
      role: "author",
    },
  });
  return {
    user,
    token: jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: "1h" }),
  };
}

async function createQuestion() {
  const user = await prisma.user.create({
    data: { firstname: "A", lastname: "B", email: `q-${Date.now()}@test.com`, password: "x", role: "author" },
  });
  const level = await prisma.level.create({ data: { name: "Lvl" } });
  const quiz = await prisma.quiz.create({ data: { title: "Q Quiz", author_id: user.id } });
  return prisma.question.create({ data: { statement: "Q?", quiz_id: quiz.id, level_id: level.id } });
}

describe("[POST] /api/questions/:id/answers", () => {
  it("should create an answer", async () => {
    const { token } = await createAuthorToken();
    const question = await createQuestion();
    const { data, status } = await requester.post(
      `/questions/${question.id}/answers`,
      { description: "Yes", is_valid: true },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 201);
    assert.strictEqual(data.description, "Yes");
    assert.strictEqual(data.is_valid, true);
  });

  it("should return 404 when question does not exist", async () => {
    const { token } = await createAuthorToken();
    const { status } = await requester.post(
      "/questions/999999/answers",
      { description: "X", is_valid: false },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });

  it("should return 400 when is_valid is missing", async () => {
    const { token } = await createAuthorToken();
    const question = await createQuestion();
    const { status } = await requester.post(
      `/questions/${question.id}/answers`,
      { description: "No bool" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });

  it("should return 401 without token", async () => {
    const question = await createQuestion();
    const { status } = await requester.post(
      `/questions/${question.id}/answers`,
      { description: "X", is_valid: false },
    );
    assert.strictEqual(status, 401);
  });
});

describe("[PATCH] /api/answers/:id", () => {
  it("should update the answer", async () => {
    const { token } = await createAuthorToken();
    const question = await createQuestion();
    const answer = await prisma.answer.create({
      data: { description: "Old", is_valid: false, question_id: question.id },
    });
    const { data, status } = await requester.patch(
      `/answers/${answer.id}`,
      { description: "New", is_valid: true },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 200);
    assert.strictEqual(data.description, "New");
    assert.strictEqual(data.is_valid, true);
  });

  it("should return 404 when answer does not exist", async () => {
    const { token } = await createAuthorToken();
    const { status } = await requester.patch(
      "/answers/999999",
      { description: "X" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });

  it("should return 400 when body is empty", async () => {
    const { token } = await createAuthorToken();
    const question = await createQuestion();
    const answer = await prisma.answer.create({
      data: { description: "A", is_valid: false, question_id: question.id },
    });
    const { status } = await requester.patch(
      `/answers/${answer.id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

describe("[DELETE] /api/answers/:id", () => {
  it("should delete the answer", async () => {
    const { token } = await createAuthorToken();
    const question = await createQuestion();
    const answer = await prisma.answer.create({
      data: { description: "Del", is_valid: false, question_id: question.id },
    });
    const { status } = await requester.delete(
      `/answers/${answer.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 204);
    const count = await prisma.answer.count();
    assert.strictEqual(count, 0);
  });

  it("should return 404 when answer does not exist", async () => {
    const { token } = await createAuthorToken();
    const { status } = await requester.delete(
      "/answers/999999",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });
});
