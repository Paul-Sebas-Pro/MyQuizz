import type { Request, Response } from "express";
import { NotFoundError } from "../lib/errors.ts";
import { parseIntFromParams, parseQuestionBody, parseQuestionPatchBody } from "../lib/utils.ts";
import { prisma } from "../models/index.ts";

const QUESTION_INCLUDE = { answers: true, level: true } as const;

export async function createQuestion(req: Request, res: Response) {
  const quizId = await parseIntFromParams(req.params.id);
  const body = await parseQuestionBody(req.body);

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) throw new NotFoundError("Quiz not found");

  const level = await prisma.level.findUnique({ where: { id: body.level_id } });
  if (!level) throw new NotFoundError("Level not found");

  const question = await prisma.question.create({
    data: { ...body, quiz_id: quizId },
    include: QUESTION_INCLUDE,
  });
  res.status(201).json(question);
}

export async function updateQuestion(req: Request, res: Response) {
  const questionId = await parseIntFromParams(req.params.id);
  const body = await parseQuestionPatchBody(req.body);

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new NotFoundError("Question not found");

  if (body.level_id) {
    const level = await prisma.level.findUnique({ where: { id: body.level_id } });
    if (!level) throw new NotFoundError("Level not found");
  }

  const updated = await prisma.question.update({
    where: { id: questionId },
    data: { ...body, updated_at: new Date() },
    include: QUESTION_INCLUDE,
  });
  res.json(updated);
}

export async function deleteQuestion(req: Request, res: Response) {
  const questionId = await parseIntFromParams(req.params.id);
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new NotFoundError("Question not found");
  await prisma.question.delete({ where: { id: questionId } });
  res.status(204).end();
}
