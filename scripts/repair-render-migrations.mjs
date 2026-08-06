import { PrismaClient } from "@prisma/client";
import { spawnSync } from "node:child_process";
import path from "node:path";

const migrationName = "20260627120000_add_character_spellcasting_state";
const prisma = new PrismaClient();

async function main() {
  const [migrationRows, tableRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1
        FROM "_prisma_migrations"
        WHERE "migration_name" = ${migrationName}
          AND "finished_at" IS NULL
          AND "rolled_back_at" IS NULL
      ) AS "exists"
    `,
    prisma.$queryRaw`
      SELECT to_regclass('public.character_spellcasting_states') IS NOT NULL AS "exists"
    `,
  ]);

  const hasFailedMigration = migrationRows[0]?.exists === true;
  const hasSpellcastingTable = tableRows[0]?.exists === true;

  if (!hasFailedMigration || !hasSpellcastingTable) {
    console.log("No Render migration repair is needed.");
    return;
  }

  console.log(`Resolving already-created migration ${migrationName}...`);
  await prisma.$disconnect();

  const result = spawnSync(
    process.execPath,
    [
      path.join("node_modules", "prisma", "build", "index.js"),
      "migrate",
      "resolve",
      "--schema",
      path.join("apps", "api", "prisma", "schema.prisma"),
      "--applied",
      migrationName,
    ],
    { stdio: "inherit" },
  );

  process.exit(result.status ?? 1);
}

main()
  .catch((error) => {
    console.error("Render migration repair failed.", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
