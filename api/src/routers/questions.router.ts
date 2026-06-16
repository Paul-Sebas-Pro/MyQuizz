import { Router } from "express";
import * as questionsController from "../controllers/questions.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.patch("/questions/:id", isAuthenticated, checkRoles(["admin", "author"]), questionsController.updateQuestion);
router.delete("/questions/:id", isAuthenticated, checkRoles(["admin", "author"]), questionsController.deleteQuestion);
