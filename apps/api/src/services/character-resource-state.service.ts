import { randomUUID } from "node:crypto";

type ResourceStateInput = {
  activeByResourceKey?: unknown;
  customMaxByResourceKey?: unknown;
  usageByResourceKey?: unknown;
};

type ResourceStateRow = {
  activeByResourceKey: unknown;
  characterId: string;
  customMaxByResourceKey: unknown;
  id: string;
  usageByResourceKey: unknown;
};

type ResourceStateModel = {
  activeByResourceKey: Record<string, boolean>;
  characterId?: string;
  customMaxByResourceKey: Record<string, number>;
  id?: string;
  usageByResourceKey: Record<string, number>;
};

type RawSqlExecutor = {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

function normalizeResourceStateInput({
  data,
  fallback,
}: {
  data?: ResourceStateInput;
  fallback?: {
    activeByResourceKey: unknown;
    customMaxByResourceKey: unknown;
    usageByResourceKey: unknown;
  } | null;
}) {
  return {
    activeByResourceKey: normalizeResourceFlagMap(
      data?.activeByResourceKey ?? fallback?.activeByResourceKey,
    ),
    customMaxByResourceKey: normalizeResourceNumberMap(
      data?.customMaxByResourceKey ?? fallback?.customMaxByResourceKey,
    ),
    usageByResourceKey: normalizeResourceNumberMap(
      data?.usageByResourceKey ?? fallback?.usageByResourceKey,
    ),
  };
}

function normalizeResourceNumberMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, number>;
  }

  const normalizedEntries = Object.entries(value).flatMap(([key, usage]) => {
    const normalizedKey = normalizeResourceKey(key);

    if (
      !normalizedKey ||
      typeof usage !== "number" ||
      !Number.isFinite(usage) ||
      usage < 0
    ) {
      return [];
    }

    return [[normalizedKey, Math.floor(usage)] as const];
  });

  return Object.fromEntries(normalizedEntries) as Record<string, number>;
}

function normalizeResourceFlagMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, boolean>;
  }

  const normalizedEntries = Object.entries(value).flatMap(([key, active]) => {
    const normalizedKey = normalizeResourceKey(key);

    if (!normalizedKey || typeof active !== "boolean") {
      return [];
    }

    return [[normalizedKey, active] as const];
  });

  return Object.fromEntries(normalizedEntries) as Record<string, boolean>;
}

function normalizeResourceKey(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

async function ensureCharacterResourceStateTable(executor: RawSqlExecutor) {
  await executor.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "character_resource_states" (
      "id" UUID NOT NULL,
      "characterId" UUID NOT NULL,
      "usageByResourceKey" JSONB,
      "customMaxByResourceKey" JSONB,
      "activeByResourceKey" JSONB,
      CONSTRAINT "character_resource_states_pkey" PRIMARY KEY ("id")
    );
  `);
  await executor.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "character_resource_states_characterId_key"
    ON "character_resource_states"("characterId");
  `);
  await executor.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'character_resource_states_characterId_fkey'
      ) THEN
        ALTER TABLE "character_resource_states"
        ADD CONSTRAINT "character_resource_states_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "characters"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
}

async function findResourceStateForCharacter(
  executor: RawSqlExecutor,
  characterId: string,
): Promise<ResourceStateModel | null> {
  await ensureCharacterResourceStateTable(executor);

  const rows = await executor.$queryRawUnsafe<ResourceStateRow[]>(
    `
      SELECT "id", "characterId", "usageByResourceKey", "customMaxByResourceKey", "activeByResourceKey"
      FROM "character_resource_states"
      WHERE "characterId" = $1::uuid
      LIMIT 1
    `,
    characterId,
  );
  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    activeByResourceKey: normalizeResourceFlagMap(row.activeByResourceKey),
    characterId: row.characterId,
    customMaxByResourceKey: normalizeResourceNumberMap(row.customMaxByResourceKey),
    id: row.id,
    usageByResourceKey: normalizeResourceNumberMap(row.usageByResourceKey),
  };
}

async function upsertCharacterResourceState(
  executor: RawSqlExecutor,
  characterId: string,
  state: ResourceStateModel,
) {
  await ensureCharacterResourceStateTable(executor);

  await executor.$executeRawUnsafe(
    `
      INSERT INTO "character_resource_states" (
        "id",
        "characterId",
        "usageByResourceKey",
        "customMaxByResourceKey",
        "activeByResourceKey"
      )
      VALUES ($1::uuid, $2::uuid, $3::jsonb, $4::jsonb, $5::jsonb)
      ON CONFLICT ("characterId")
      DO UPDATE SET
        "usageByResourceKey" = EXCLUDED."usageByResourceKey",
        "customMaxByResourceKey" = EXCLUDED."customMaxByResourceKey",
        "activeByResourceKey" = EXCLUDED."activeByResourceKey"
    `,
    randomUUID(),
    characterId,
    JSON.stringify(state.usageByResourceKey),
    JSON.stringify(state.customMaxByResourceKey),
    JSON.stringify(state.activeByResourceKey),
  );
}

async function attachResourceStateToCharacter<T extends { id: string }>(
  executor: RawSqlExecutor,
  character: T | null,
): Promise<(T & { resourceState: ResourceStateModel | null }) | null> {
  if (!character) {
    return null;
  }

  const resourceState = await findResourceStateForCharacter(executor, character.id);

  return {
    ...character,
    resourceState,
  };
}

async function attachResourceStateToCharacters<T extends { id: string }>(
  executor: RawSqlExecutor,
  characters: T[],
): Promise<Array<T & { resourceState: ResourceStateModel | null }>> {
  return Promise.all(
    characters.map(async (character) => ({
      ...character,
      resourceState: await findResourceStateForCharacter(executor, character.id),
    })),
  );
}

export {
  attachResourceStateToCharacter,
  attachResourceStateToCharacters,
  findResourceStateForCharacter,
  normalizeResourceFlagMap,
  normalizeResourceNumberMap,
  normalizeResourceStateInput,
  upsertCharacterResourceState,
};
export type { RawSqlExecutor, ResourceStateInput, ResourceStateModel, ResourceStateRow };
