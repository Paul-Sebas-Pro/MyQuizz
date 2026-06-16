import { Router } from "express";
import * as tagsController from "../controllers/tags.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.get("/tags", tagsController.getAllTags);
router.get("/tags/:id", tagsController.getOneTag);
router.post("/tags", isAuthenticated, checkRoles(["admin"]), tagsController.createTag);
router.patch("/tags/:id", isAuthenticated, checkRoles(["admin"]), tagsController.updateTag);
router.delete("/tags/:id", isAuthenticated, checkRoles(["admin"]), tagsController.deleteTag);
