import { Router } from "express";
import * as authController from "../controllers/auth.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
// Middleware isAuthenticated pour vérifier si l'utilisateur est bien connecté
// Middleware checkRoles pour vérifier si l'utilisateur à le bon role
router.get('/auth/me', isAuthenticated, checkRoles(["admin", "member", "author"]), authController.getAuthenticatedUser);
router.post('/auth/refresh', authController.refreshAccessToken);