import type { Request, Response } from "express";
import { NotFoundError } from "../lib/errors.ts";
import { parseIntFromParams, parseAnswerBody, parseAnswerPatchBody } from "../lib/utils.ts";
import { prisma } from "../models/index.ts";

export async function createAnswer(req: Request, res: Response) {
  const questionId = await parseIntFromParams(req.params.id);
  const body = await parseAnswerBody(req.body);

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) throw new NotFoundError("Question not found");

  const answer = await prisma.answer.create({ data: { ...body, question_id: questionId } });
  res.status(201).json(answer);
}

export async function updateAnswer(req: Request, res: Response) {
  const answerId = await parseIntFromParams(req.params.id);
  const body = await parseAnswerPatchBody(req.body);

  const answer = await prisma.answer.findUnique({ where: { id: answerId } });
  if (!answer) throw new NotFoundError("Answer not found");

  const updated = await prisma.answer.update({
    where: { id: answerId },
    data: { ...body, updated_at: new Date() },
  });
  res.json(updated);
}

export async function deleteAnswer(req: Request, res: Response) {
  const answerId = await parseIntFromParams(req.params.id);
  const answer = await prisma.answer.findUnique({ where: { id: answerId } });
  if (!answer) throw new NotFoundError("Answer not found");
  await prisma.answer.delete({ where: { id: answerId } });
  res.status(204).end();
}
