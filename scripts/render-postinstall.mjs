import { spawnSync } from "node:child_process";

const isRender = process.env.RENDER === "true";

if (!isRender) {
  console.log("Skipping Render-only Prisma migrations.");
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required to run Prisma migrations on Render.");
  process.exit(1);
}

console.log("Running Prisma migrations for Render deployment...");

const migrationResult = spawnSync(
  "npm",
  ["--workspace", "@dd-simple/api", "run", "prisma:migrate:deploy"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

if (migrationResult.status !== 0) {
  process.exit(migrationResult.status ?? 1);
}

console.log("Seeding D&D reference data for Render deployment...");

const seedResult = spawnSync(
  "npm",
  ["--workspace", "@dd-simple/api", "run", "prisma:seed"],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
  },
);

process.exit(seedResult.status ?? 1);
