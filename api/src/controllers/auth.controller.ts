import argon2 from "argon2";
import type { Request, Response } from "express";
import z from "zod";
import { config } from "../../config.ts";
import {
  BadRequestError,
  ConflictError,
  UnAuthorizedError,
} from "../lib/errors.ts";
import { generateTokens } from "../lib/tokens.ts";
import { prisma, type User } from "../models/index.ts";

export async function signup(req: Request, res: Response) {
  // Définition des validations
  const signupBodySchema = z.object({
    firstname: z.string(),
    lastname: z.string(),
    email: z.email(),
    password: z
      .string()
      .min(12, "Doit avoir minimum 12 caractères")
      .regex(/[a-z]/, "Doit contenir une minuscule")
      .regex(/[A-Z]/, "Doit contenir une majuscule")
      .regex(/[0-9]/, "Doit contenir un chiffre")
      .regex(/[^a-zA-Z0-9\s]/, "Doit contenir un caractère spécial"),
    confirm: z.string(),
  });

  // Récupération du body pour la validation
  const { firstname, lastname, email, password, confirm } =
    await signupBodySchema.parseAsync(req.body);

  // Vérification entre le mot de passe et la confirmation du mot de passe
  if (confirm != password) {
    throw new BadRequestError("Les mots de passe ne sont pas identique");
  }

  // Vérification si l'utilisateur existe déjà avec l'email
  const alreadyExtistingUser = await prisma.user.findFirst({
    where: { email },
  });
  if (alreadyExtistingUser) {
    throw new ConflictError("Email ou mot de passe incorrecte");
  }

  // Hash du mot de passe
  const hashedPassword = await argon2.hash(password);

  // La création de l'utilisation dans la BDD
  const user = await prisma.user.create({
    data: {
      firstname,
      lastname,
      email,
      password: hashedPassword,
    },
  });

  // Réponse avec les données utilisateur
  return res.status(201).json({
    id: user.id,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
  });
}

export async function login(req: Request, res: Response) {
  // Définition des validations
  const loginBodySchema = z.object({
    email: z.email(),
    password: z.string(),
  });

  // Récupération du body pour la validation
  const { email, password } = await loginBodySchema.parseAsync(req.body);

  // Vérification si l'utilisateur existe
  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    throw new UnAuthorizedError("Email ou mot de passe incorrecte");
  }

  // Comparaison entre le mot de passe de la requête et le mot de passe de la BDD
  const passwordIsMatching = await argon2.verify(user.password, password);
  if (!passwordIsMatching) {
    throw new UnAuthorizedError("Email ou mot de passe incorrecte");
  }

  // Génération des tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Function de remplacement des refreshToken (supprime et insert)
  replaceRefreshTokenInDatabase(refreshToken, user);

  // Réponse avec le token
  return res.status(200).json({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}

export async function getAuthenticatedUser(req: Request, res: Response) {
  const userId = req.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: { password: true },
  });

  if (!user) throw new UnAuthorizedError("L'utilisateur n'existe plus");

  return res.json(user);
}

export async function refreshAccessToken(req: Request, res: Response) {
  // Récupération du refreshToken dans le body
  const rawToken = req.body.refreshToken;

  // Erreur si le refreshToken n'est pas fourni dans la requête
  if (!rawToken)
    throw new UnAuthorizedError("Token de raffraichissement non fourni");

  // Récupération du refreshToken
  const existingRefreshToken = await prisma.refreshToken.findFirst({
    where: { token: rawToken },
    include: { user: true },
  });

  // Si le refreshToken n'est pas en BDD alors erreur 401
  if (!existingRefreshToken)
    throw new UnAuthorizedError("Token de raffraichissement invalide");

  // On vérifie l'expiration du token
  if (existingRefreshToken.expires_at < new Date()) {
    await prisma.refreshToken.delete({
      where: { id: existingRefreshToken.id },
    }); // On supprime le token expiré de la BDD
    throw new UnAuthorizedError("Token de raffraichissement expiré");
  }

  // Génération des tokens
  const { accessToken, refreshToken } = generateTokens(
    existingRefreshToken.user,
  );

  // Function de remplacement des refreshToken (supprime et insert)
  replaceRefreshTokenInDatabase(refreshToken, existingRefreshToken.user);

  return res.json({ accessToken, refreshToken });
}

// Function de remplacement des refreshToken (supprime et insert)
async function replaceRefreshTokenInDatabase(refreshToken: string, user: User) {
  await prisma.refreshToken.deleteMany({ where: { user_id: user.id } });
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      user_id: user.id,
      expires_at: new Date(new Date().valueOf() + config.refreshTokenExpire),
    },
  });
}
