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
      email: `author-${Date.now()}@questions-test.com`,
      password: await argon2.hash("TestPassword123!"),
      role: "author",
    },
  });
  return {
    user,
    token: jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: "1h" }),
  };
}

async function createQuizAndLevel() {
  const { user } = await createAuthorToken();
  const level = await prisma.level.create({ data: { name: "Débutant" } });
  const quiz = await prisma.quiz.create({ data: { title: "Test Quiz", author_id: user.id } });
  return { quiz, level };
}

describe("[POST] /api/quizzes/:id/questions", () => {
  it("should create a question", async () => {
    const { token } = await createAuthorToken();
    const { quiz, level } = await createQuizAndLevel();
    const { data, status } = await requester.post(
      `/quizzes/${quiz.id}/questions`,
      { statement: "What is 2+2?", level_id: level.id },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 201);
    assert.strictEqual(data.statement, "What is 2+2?");
    assert.ok(Array.isArray(data.answers));
  });

  it("should return 404 when quiz does not exist", async () => {
    const { token } = await createAuthorToken();
    const level = await prisma.level.create({ data: { name: "Lvl" } });
    const { status } = await requester.post(
      "/quizzes/999999/questions",
      { statement: "Q?", level_id: level.id },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });

  it("should return 400 when statement is missing", async () => {
    const { token } = await createAuthorToken();
    const { quiz, level } = await createQuizAndLevel();
    const { status } = await requester.post(
      `/quizzes/${quiz.id}/questions`,
      { level_id: level.id },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

describe("[PATCH] /api/questions/:id", () => {
  it("should update the question statement", async () => {
    const { token } = await createAuthorToken();
    const { quiz, level } = await createQuizAndLevel();
    const question = await prisma.question.create({
      data: { statement: "Original?", quiz_id: quiz.id, level_id: level.id },
    });
    const { data, status } = await requester.patch(
      `/questions/${question.id}`,
      { statement: "Updated?" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 200);
    assert.strictEqual(data.statement, "Updated?");
  });

  it("should return 404 when question does not exist", async () => {
    const { token } = await createAuthorToken();
    const { status } = await requester.patch(
      "/questions/999999",
      { statement: "X?" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });

  it("should return 400 when body is empty", async () => {
    const { token } = await createAuthorToken();
    const { quiz, level } = await createQuizAndLevel();
    const question = await prisma.question.create({
      data: { statement: "Q?", quiz_id: quiz.id, level_id: level.id },
    });
    const { status } = await requester.patch(
      `/questions/${question.id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

describe("[DELETE] /api/questions/:id", () => {
  it("should delete the question", async () => {
    const { token } = await createAuthorToken();
    const { quiz, level } = await createQuizAndLevel();
    const question = await prisma.question.create({
      data: { statement: "ToDelete?", quiz_id: quiz.id, level_id: level.id },
    });
    const { status } = await requester.delete(
      `/questions/${question.id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 204);
    const count = await prisma.question.count();
    assert.strictEqual(count, 0);
  });

  it("should return 404 when question does not exist", async () => {
    const { token } = await createAuthorToken();
    const { status } = await requester.delete(
      "/questions/999999",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });
});
