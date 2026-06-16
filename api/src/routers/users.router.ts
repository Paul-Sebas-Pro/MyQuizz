import { Router } from "express";
import * as usersController from "../controllers/users.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.get("/users", isAuthenticated, checkRoles(["admin"]), usersController.getAllUsers);
router.get("/users/:id/profile", isAuthenticated, usersController.getUserProfile);
router.get("/users/:id/attempts", isAuthenticated, usersController.getUserAttempts);
