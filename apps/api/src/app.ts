import cors from "cors";
import express from "express";
import { healthRouter } from "./routes/health.js";
import { characterRouter } from "./modules/character/character.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use("/characters", characterRouter);

export { app };

