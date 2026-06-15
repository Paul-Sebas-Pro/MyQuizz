import { Router } from "express";
import * as usersController from "../controllers/users.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";

export const router = Router();

router.get("/users", isAuthenticated, usersController.getAllUsers);

