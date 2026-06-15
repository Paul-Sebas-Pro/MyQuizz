import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../@types/express.js";
import { ForbiddenError } from "../lib/errors.ts";
import type { Role } from "../models/index.ts";

export function checkRoles(roles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const role = req.userRole;

    if (!roles.includes(role)) {
      throw new ForbiddenError("Authentification invalide");
    }

    next();
  };
}
