import cors from "cors";
import express from "express";
import { charactersRouter } from "./routes/characters.js";
import { healthRouter } from "./routes/health.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(charactersRouter);

export { app };
