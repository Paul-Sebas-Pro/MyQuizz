import { Router } from "express";
import * as levelsController from "../controllers/levels.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.get("/levels", levelsController.getAllLevels);
router.get("/levels/:id", levelsController.getOneLevel);
router.post("/levels", isAuthenticated, checkRoles(["admin", "author"]), levelsController.createLevel);
router.patch("/levels/:id", isAuthenticated, checkRoles(["admin"]), levelsController.updateLevel);
router.delete("/levels/:id", isAuthenticated, checkRoles(["admin"]), levelsController.deleteLevel);