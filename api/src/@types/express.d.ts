import type { Request } from "express";
import type { Role } from "../models/index.ts";

// Approche 1
// Avantage : on continue d'importer Request d'express dans les controllers / middleware
// Inconvénients : charges mental pour le dév -> on peut accéder à req.userId dans tous les controlleurs
declare global {
    namespace Express {
        interface Request {
            userId: number,
            userRole: Role
        }
    }
}

// Approche 2
// Avantage : plus explicite (moins de charge mental)
// Inconvénient (mineur) : On doit importer dans les controlleurs plutôt que Request
export interface AuthenticatedRequest extends Request {
    userId: number,
    userRole: Role
}