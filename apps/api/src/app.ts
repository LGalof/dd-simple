import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import cors from "cors";
import express from "express";
import { authRouter } from "./routes/auth.js";
import { charactersRouter } from "./routes/characters.js";
import { referencesRouter } from "./routes/references.js";
import { roomsRouter } from "./routes/rooms.js";
import { healthRouter } from "./routes/health.js";

const app = express();
const frontendDistCandidates = [
  path.resolve(process.cwd(), "../web/dist"),
  path.resolve(process.cwd(), "apps/web/dist"),
  path.resolve(process.cwd(), "../../apps/web/dist"),
  path.resolve(process.cwd(), "web/dist"),
  path.resolve(process.cwd(), "../../web/dist"),
];
const frontendDistPath = frontendDistCandidates.find((candidate) => existsSync(candidate));

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(authRouter);
app.use(referencesRouter);
app.use(charactersRouter);
app.use(roomsRouter);

if (frontendDistPath) {
  app.use(express.static(frontendDistPath, { index: false }));
}

app.get("*", async (req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/health")) {
    next();
    return;
  }

  if (!frontendDistPath) {
    next();
    return;
  }

  const indexPath = path.join(frontendDistPath, "index.html");

  try {
    const html = await readFile(indexPath, "utf8");
    res.type("html").send(html);
  } catch {
    next();
  }
});

export { app };
