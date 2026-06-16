import argon2 from "argon2";
import jwt from "jsonwebtoken";
import assert from "node:assert";
import { describe, it } from "node:test";
import { config } from "../../config.ts";
import { requester } from "../../test/index.ts";
import { prisma } from "../models/index.ts";

async function createUserToken(role: "member" | "author" | "admin") {
  const user = await prisma.user.create({
    data: {
      firstname: role,
      lastname: "Test",
      email: `${role}-${Date.now()}@quizzes-test.com`,
      password: await argon2.hash("TestPassword123!"),
      role,
    },
  });
  const token = jwt.sign({ userId: user.id, role: user.role }, config.jwtSecret, { expiresIn: "1h" });
  return { user, token };
}

async function createLevel() {
  return prisma.level.create({ data: { name: "Débutant" } });
}

describe("[GET] /api/quizzes", () => {
  it("should return only published quizzes", async () => {
    const { user } = await createUserToken("author");
    await prisma.quiz.create({ data: { title: "Published", published_at: new Date(), author_id: user.id } });
    await prisma.quiz.create({ data: { title: "Draft", author_id: user.id } });

    const { data, status } = await requester.get("/quizzes");
    assert.strictEqual(status, 200);
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].title, "Published");
  });
});

describe("[GET] /api/quizzes/recent", () => {
  it("should return at most 6 quizzes ordered by date desc", async () => {
    const { user } = await createUserToken("author");
    for (let i = 1; i <= 8; i++) {
      await prisma.quiz.create({ data: { title: `Quiz ${i}`, published_at: new Date(), author_id: user.id } });
    }
    const { data, status } = await requester.get("/quizzes/recent");
    assert.strictEqual(status, 200);
    assert.ok(data.length <= 6);
  });
});

describe("[GET] /api/quizzes/:id", () => {
  it("should return the quiz with author and tags", async () => {
    const { user } = await createUserToken("author");
    const quiz = await prisma.quiz.create({
      data: { title: "My Quiz", published_at: new Date(), author_id: user.id },
    });
    const { data, status } = await requester.get(`/quizzes/${quiz.id}`);
    assert.strictEqual(status, 200);
    assert.strictEqual(data.title, "My Quiz");
    assert.ok(data.author);
    assert.ok(Array.isArray(data.tags));
  });

  it("should return 404 when quiz does not exist", async () => {
    const { status } = await requester.get("/quizzes/999999");
    assert.strictEqual(status, 404);
  });
});

describe("[POST] /api/quizzes", () => {
  it("should create a quiz and return it", async () => {
    const { token } = await createUserToken("author");
    const { data, status } = await requester.post(
      "/quizzes",
      { title: "New Quiz", description: "A great quiz" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 201);
    assert.strictEqual(data.title, "New Quiz");
    assert.ok(data.author);
  });

  it("should return 401 without token", async () => {
    const { status } = await requester.post("/quizzes", { title: "No Auth" });
    assert.strictEqual(status, 401);
  });

  it("should return 403 for member role", async () => {
    const { token } = await createUserToken("member");
    const { status } = await requester.post(
      "/quizzes",
      { title: "Member Quiz" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 403);
  });

  it("should return 400 when title is missing", async () => {
    const { token } = await createUserToken("author");
    const { status } = await requester.post(
      "/quizzes",
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 400);
  });
});

describe("[PATCH] /api/quizzes/:id", () => {
  it("should allow author to update their own quiz", async () => {
    const { user, token } = await createUserToken("author");
    const quiz = await prisma.quiz.create({ data: { title: "Original", author_id: user.id } });
    const { data, status } = await requester.patch(
      `/quizzes/${quiz.id}`,
      { title: "Updated" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 200);
    assert.strictEqual(data.title, "Updated");
  });

  it("should return 403 when author tries to edit another author's quiz", async () => {
    const { user: owner } = await createUserToken("author");
    const { token: otherToken } = await createUserToken("author");
    const quiz = await prisma.quiz.create({ data: { title: "Owner Quiz", author_id: owner.id } });
    const { status } = await requester.patch(
      `/quizzes/${quiz.id}`,
      { title: "Stolen" },
      { headers: { Authorization: `Bearer ${otherToken}` } },
    );
    assert.strictEqual(status, 403);
  });

  it("should return 404 when quiz does not exist", async () => {
    const { token } = await createUserToken("admin");
    const { status } = await requester.patch(
      "/quizzes/999999",
      { title: "X" },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 404);
  });
});

describe("[PUT] /api/quizzes/:id/tags/:tagId", () => {
  it("should add a tag to a quiz", async () => {
    const { user, token } = await createUserToken("author");
    const quiz = await prisma.quiz.create({ data: { title: "Tagged Quiz", author_id: user.id } });
    const tag = await prisma.tag.create({ data: { name: "JS" } });
    const { status } = await requester.put(
      `/quizzes/${quiz.id}/tags/${tag.id}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 204);
    const quizTag = await prisma.quizTag.findUnique({
      where: { quiz_id_tag_id: { quiz_id: quiz.id, tag_id: tag.id } },
    });
    assert.ok(quizTag);
  });
});

describe("[POST] /api/quizzes/:id/attempts", () => {
  it("should create an attempt and return score + details", async () => {
    const { user: author } = await createUserToken("author");
    const { user: member, token } = await createUserToken("member");
    const level = await createLevel();

    const quiz = await prisma.quiz.create({
      data: {
        title: "Play Quiz",
        published_at: new Date(),
        author_id: author.id,
        questions: {
          create: [{
            statement: "2 + 2 = ?",
            level_id: level.id,
            answers: {
              create: [
                { description: "3", is_valid: false },
                { description: "4", is_valid: true },
              ],
            },
          }],
        },
      },
      include: { questions: { include: { answers: true } } },
    });

    const question = quiz.questions[0];
    const correctAnswer = question.answers.find((a) => a.is_valid)!;

    const { data, status } = await requester.post(
      `/quizzes/${quiz.id}/attempts`,
      [{ question_id: question.id, answer_id: correctAnswer.id }],
      { headers: { Authorization: `Bearer ${token}` } },
    );
    assert.strictEqual(status, 201);
    assert.strictEqual(data.score, 1);
    assert.strictEqual(data.score_max, 1);
    assert.ok(Array.isArray(data.details));
    assert.strictEqual(data.details[0].is_correct, true);

    const saved = await prisma.attempt.findFirst({ where: { user_id: member.id } });
    assert.ok(saved);
  });
});
