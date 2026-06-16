import type { Request, Response } from "express";
import { NotFoundError } from "../lib/errors.ts";
import { parseIntFromParams } from "../lib/utils.ts";
import { prisma } from "../models/index.ts";

export async function getAllUsers(req: Request, res: Response) {
  const users = await prisma.user.findMany({ omit: { password: true } });
  res.json(users);
}

export async function getUserProfile(req: Request, res: Response) {
  const userId = await parseIntFromParams(req.params.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
    include: { _count: { select: { attempts: true } } },
  });
  if (!user) throw new NotFoundError("User not found");

  const { _count, ...rest } = user;
  res.json({ ...rest, nb_quiz_played: _count.attempts });
}

export async function getUserAttempts(req: Request, res: Response) {
  const userId = await parseIntFromParams(req.params.id);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found");

  const attempts = await prisma.attempt.findMany({
    where: { user_id: userId },
    include: { quiz: { select: { id: true, title: true } } },
    orderBy: { created_at: "desc" },
  });
  res.json(attempts);
}
