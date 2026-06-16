import { Router } from "express";
import * as answersController from "../controllers/answers.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.post("/questions/:id/answers", isAuthenticated, checkRoles(["admin", "author"]), answersController.createAnswer);
router.patch("/answers/:id", isAuthenticated, checkRoles(["admin", "author"]), answersController.updateAnswer);
router.delete("/answers/:id", isAuthenticated, checkRoles(["admin", "author"]), answersController.deleteAnswer);
