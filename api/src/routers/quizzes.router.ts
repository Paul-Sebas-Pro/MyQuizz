import { Router } from "express";
import * as quizzesController from "../controllers/quizzes.controller.ts";
import * as questionsController from "../controllers/questions.controller.ts";
import { isAuthenticated } from "../middlewares/auth.middleware.ts";
import { checkRoles } from "../middlewares/role.middleware.ts";

export const router = Router();

router.get("/quizzes", quizzesController.getAllQuizzes);
router.get("/quizzes/recent", quizzesController.getRecentQuizzes);
router.get("/quizzes/:id", quizzesController.getOneQuiz);
router.get("/quizzes/:id/questions", quizzesController.getQuizQuestions);
router.post("/quizzes", isAuthenticated, checkRoles(["admin", "author"]), quizzesController.createQuiz);
router.patch("/quizzes/:id", isAuthenticated, checkRoles(["admin", "author"]), quizzesController.updateQuiz);
router.put("/quizzes/:id/tags/:tagId", isAuthenticated, checkRoles(["admin", "author"]), quizzesController.addTagToQuiz);
router.delete("/quizzes/:id/tags/:tagId", isAuthenticated, checkRoles(["admin", "author"]), quizzesController.removeTagFromQuiz);
router.post("/quizzes/:id/questions", isAuthenticated, checkRoles(["admin", "author"]), questionsController.createQuestion);
router.post("/quizzes/:id/attempts", isAuthenticated, quizzesController.createAttempt);
router.get("/quizzes/:id/attempts", isAuthenticated, checkRoles(["admin"]), quizzesController.getQuizAttempts);
