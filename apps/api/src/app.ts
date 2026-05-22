import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { charactersRouter } from "./routes/characters.js";
import { healthRouter } from "./routes/health.js";
import { referencesRouter } from "./routes/references.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);
app.use(charactersRouter);
app.use(referencesRouter);

export { app };
