import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";

export async function getAllUsers(req: Request, res: Response) {
  // Appel la BDD
  // on veut éviter de récupérer le mot de passe des utilisateurs quand on fait un findMany 
  // pour éviter ça, on va rajouter un paramètre omit
  const users = await prisma.user.findMany({
    omit: { password: true }
  });

  // Réponse au client
  res.json(users);
}
