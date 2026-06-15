import type { Request, Response } from "express";
import { ConflictError, NotFoundError } from "../lib/errors.ts";
import {
  parseIntFromParams,
  parseLevelBody,
  parseLevelPatchBody,
} from "../lib/utils.ts";
import { prisma } from "../models/index.ts";

export async function getAllLevels(req: Request, res: Response) {
  const levels = await prisma.level.findMany();
  res.json(levels);
}

// Get /levels/id
export async function getOneLevel(req: Request, res: Response) {
  // On récupère l'id reçu dans la requête (ex: GET /levels/42)
  const levelId = await parseIntFromParams(req.params.id);

  // On consulte prisma pour récupérer via prisma les données
  const level = await prisma.level.findUnique({ where: { id: levelId } });
  // Si on a pas récupéré de level, on envoie une erreur
  if (!level) {
    throw new NotFoundError("Level not found");
  }
  // On envoie notre réponse
  res.json(level);
}

export async function createLevel(req: Request, res: Response) {
  const body = await parseLevelBody(req.body);
  const { name } = body;

  // Avant de créer un level, on va regarder si un level avec le même nom existe déjà :
  // on fait une requete ou on va faire un where : name, et on va regarder la réponse
  const potentialExistingLevel = await prisma.level.findFirst({
    where: { name: body.name },
  });
  // si on a bien trouvé un level qui existe, dans ce cas, on ne doit pas en créer un avec le même nom
  if (potentialExistingLevel) {
    throw new ConflictError(`Name already exists ${body.name}`);
  }

  const createdLevel = await prisma.level.create({ data: { name } });
  res.status(201).json(createdLevel);
}

export async function updateLevel(req: Request, res: Response) {
  const levelId = await parseIntFromParams(req.params.id);
  const body = await parseLevelPatchBody(req.body);

  const level = await prisma.level.findUnique({ where: { id: levelId } });
  if (!level) {
    throw new NotFoundError("Level not found");
  }
  // on modifie level, en fonction de ce qui est demandé
  // L'utilisation de ...body est importante :
  // comme les champs sont optionnels avec .partial(),
  // seuls les champs effectivement envoyés seront passés à Prisma. Cela rend le PATCH vraiment partiel.
  const updateLevel = await prisma.level.update({
    // on récupère le levelID et on le fait passer par notre fonction utils, pour vérifier que l'id est valide
    where: { id: levelId },
    data: { ...body, updated_at: new Date() },
  });
  // on a maintenant modifié notre level, on va pouvoir envoyer une réponse à notre client
  res.json(updateLevel);
}

export async function deleteLevel(req: Request, res: Response) {
  const levelId = await parseIntFromParams(req.params.id);
  const level = await prisma.level.findUnique({ where: { id: levelId } });
  if (!level) {
    throw new NotFoundError("Level not found");
  }
  // on supprime notre level
  await prisma.level.delete({ where: { id: levelId } });
  res.status(204).end();
}
