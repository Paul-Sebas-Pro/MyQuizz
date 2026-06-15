import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../../config.ts";
import type { User } from "../models/index.ts";

// Fonction permettant la création des tokens, accessToken et refreshToken
export function generateTokens(user: User) {
  // Création du payload
  const payload = {
    userId: user.id,
    role: user.role,
  };

  // Création du token avec JWT (jsonwebtoken)
  // Ne pas oublier de créer un SECRET pour signer et vérifier le token
  const accessToken = jwt.sign(
    payload,
    config.jwtSecret,
    { expiresIn: "1h" }, // Expiration de l'accessToken à 1 heure
  );

  // Création du refresh token avec crypto de nodejs
  const refreshToken = crypto.randomBytes(128).toString("base64");

  return { accessToken, refreshToken };
}
