import type { Request, Response } from "express";
import { ForbiddenError, NotFoundError } from "../lib/errors.ts";
import { parseAttemptBody, parseIntFromParams, parseQuizBody, parseQuizPatchBody } from "../lib/utils.ts";
import { prisma } from "../models/index.ts";

const AUTHOR_SELECT = {
  select: { id: true, firstname: true, lastname: true, email: true, role: true },
} as const;

const QUIZ_INCLUDE = {
  author: AUTHOR_SELECT,
  tags: { select: { tag: { select: { id: true, name: true } } } },
} as const;

export async function getAllQuizzes(req: Request, res: Response) {
  const quizzes = await prisma.quiz.findMany({
    where: { published_at: { not: null } },
    include: QUIZ_INCLUDE,
    orderBy: { published_at: "desc" },
  });
  res.json(quizzes);
}

export async function getRecentQuizzes(req: Request, res: Response) {
  const quizzes = await prisma.quiz.findMany({
    where: { published_at: { not: null } },
    include: QUIZ_INCLUDE,
    orderBy: { published_at: "desc" },
    take: 6,
  });
  res.json(quizzes);
}

export async function getOneQuiz(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: QUIZ_INCLUDE });
  if (!quiz) throw new NotFoundError("Quiz not found");
  res.json(quiz);
}

export async function getQuizQuestions(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new NotFoundError("Quiz not found");

  const questions = await prisma.question.findMany({
    where: { quiz_id: quizId },
    include: { answers: true, level: true },
  });
  res.json(questions);
}

export async function createQuiz(req: Request, res: Response) {
  const body = await parseQuizBody(req.body);
  const authorId = req.userId;

  const quiz = await prisma.quiz.create({
    data: { ...body, author_id: authorId },
    include: QUIZ_INCLUDE,
  });
  res.status(201).json(quiz);
}

export async function updateQuiz(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const body = await parseQuizPatchBody(req.body);

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new NotFoundError("Quiz not found");

  if (quiz.author_id !== req.userId && req.userRole !== "admin") {
    throw new ForbiddenError("Not allowed to edit this quiz");
  }

  const updated = await prisma.quiz.update({
    where: { id: quizId },
    data: { ...body, updated_at: new Date() },
    include: QUIZ_INCLUDE,
  });
  res.json(updated);
}

export async function addTagToQuiz(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const tagId = await parseIntFromParams(req.params.tagId);

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new NotFoundError("Quiz not found");

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new NotFoundError("Tag not found");

  await prisma.quizTag.upsert({
    where: { quiz_id_tag_id: { quiz_id: quizId, tag_id: tagId } },
    create: { quiz_id: quizId, tag_id: tagId },
    update: {},
  });
  res.status(204).end();
}

export async function removeTagFromQuiz(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const tagId = await parseIntFromParams(req.params.tagId);

  const quizTag = await prisma.quizTag.findUnique({
    where: { quiz_id_tag_id: { quiz_id: quizId, tag_id: tagId } },
  });
  if (!quizTag) throw new NotFoundError("Tag not linked to this quiz");

  await prisma.quizTag.delete({
    where: { quiz_id_tag_id: { quiz_id: quizId, tag_id: tagId } },
  });
  res.status(204).end();
}

export async function createAttempt(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const submissions = await parseAttemptBody(req.body);

  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { answers: true } } },
  });
  if (!quiz) throw new NotFoundError("Quiz not found");

  const score_max = quiz.questions.length;
  let score = 0;

  const details = submissions
    .map(({ question_id, answer_id }) => {
      const question = quiz.questions.find((q) => q.id === question_id);
      if (!question) return null;

      const userAnswer = question.answers.find((a) => a.id === answer_id);
      const correctAnswer = question.answers.find((a) => a.is_valid);

      if (userAnswer?.is_valid) score++;

      return {
        question_id,
        answer_id,
        correct_answer_id: correctAnswer?.id ?? null,
        is_correct: userAnswer?.is_valid ?? false,
      };
    })
    .filter(Boolean);

  const attempt = await prisma.attempt.create({
    data: { user_id: req.userId, quiz_id: quizId, score, score_max },
  });
  res.status(201).json({ ...attempt, details });
}

export async function getQuizAttempts(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new NotFoundError("Quiz not found");

  const attempts = await prisma.attempt.findMany({
    where: { quiz_id: quizId },
    include: { user: { select: { id: true, firstname: true, lastname: true, email: true } } },
    orderBy: { created_at: "desc" },
  });
  res.json(attempts);
}
