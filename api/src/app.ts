import express from "express";
import { router as apiRouter } from "./routers/index.router.ts";
import { infoMiddleware } from "./middlewares/info.middleware.ts";
import cors from "cors";
import { globalErrorHandler } from "./middlewares/global-error-handler.ts";

// Créer une app Express
export const app = express();

// Body parser pour récupérer les body "application/json" dans req.body
app.use(express.json());

// utilisation de CORS 
// ici on crée une autorisation large, afin que nos différents services docker puissent accéder à l'API
app.use(cors());

// Brancher le routeur de l'API
app.use("/api", apiRouter);

// Info route
app.get("/info", infoMiddleware);

app.use(globalErrorHandler);