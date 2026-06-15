import type { NextFunction, Request, Response } from "express";
import { UnAuthorizedError } from "../lib/errors.ts";
import jwt, { type JwtPayload } from "jsonwebtoken";
import { config } from "../../config.ts";

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization;

  if (typeof token === 'undefined') {
    throw new UnAuthorizedError("Token non fourni");
  }

  const accessToken = token.split(" ")[1];

  try {
    const payload = jwt.verify(accessToken, config.jwtSecret) as JwtPayload;

    req.userId = payload.userId;
    req.userRole = payload.role;

    next();
  } catch (error) {
    console.error(error);
    throw new UnAuthorizedError("Token invalide ou expiré");
  }
}