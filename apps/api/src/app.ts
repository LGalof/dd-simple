import { readFile } from "node:fs/promises";
import path from "node:path";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { charactersRouter } from "./routes/characters.js";
import { healthRouter } from "./routes/health.js";
import { referencesRouter } from "./routes/references.js";
import { roomsRouter } from "./routes/rooms.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);
app.use(referencesRouter);
app.use(charactersRouter);
app.use(roomsRouter);

app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    next();
    return;
  }

  const indexPath = path.resolve(process.cwd(), "../web/dist/index.html");

  try {
    const html = await readFile(indexPath, "utf8");
    res.type("html").send(html);
  } catch {
    next();
  }
});

export { app };
