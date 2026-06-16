import type { Request, Response } from "express";
import { ConflictError, NotFoundError } from "../lib/errors.ts";
import { parseIntFromParams, parseTagBody, parseTagPatchBody } from "../lib/utils.ts";
import { prisma } from "../models/index.ts";

const TAG_INCLUDE = {
  quizzes: { select: { quiz: { select: { id: true, title: true } } } },
} as const;

export async function getAllTags(req: Request, res: Response) {
  const tags = await prisma.tag.findMany({ include: TAG_INCLUDE });
  res.json(tags);
}

export async function getOneTag(req: Request, res: Response) {
  const tagId = await parseIntFromParams(req.params.id);
  const tag = await prisma.tag.findUnique({ where: { id: tagId }, include: TAG_INCLUDE });
  if (!tag) throw new NotFoundError("Tag not found");
  res.json(tag);
}

export async function createTag(req: Request, res: Response) {
  const body = await parseTagBody(req.body);

  const existing = await prisma.tag.findFirst({ where: { name: body.name } });
  if (existing) throw new ConflictError(`Tag name already exists: ${body.name}`);

  if (body.parent_id) {
    const parent = await prisma.tag.findUnique({ where: { id: body.parent_id } });
    if (!parent) throw new NotFoundError("Parent tag not found");
  }

  const tag = await prisma.tag.create({ data: body });
  res.status(201).json(tag);
}

export async function updateTag(req: Request, res: Response) {
  const tagId = await parseIntFromParams(req.params.id);
  const body = await parseTagPatchBody(req.body);

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new NotFoundError("Tag not found");

  if (body.name) {
    const existing = await prisma.tag.findFirst({ where: { name: body.name, id: { not: tagId } } });
    if (existing) throw new ConflictError(`Tag name already exists: ${body.name}`);
  }

  const updated = await prisma.tag.update({
    where: { id: tagId },
    data: { ...body, updated_at: new Date() },
  });
  res.json(updated);
}

export async function deleteTag(req: Request, res: Response) {
  const tagId = await parseIntFromParams(req.params.id);
  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) throw new NotFoundError("Tag not found");
  await prisma.tag.delete({ where: { id: tagId } });
  res.status(204).end();
}
