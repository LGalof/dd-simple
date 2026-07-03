import { randomUUID } from "node:crypto";

type SpellcastingStateInput = {
  learnedSpellIds?: unknown;
  preparedSpellIds?: unknown;
  slotUsageByLevel?: unknown;
};

type SpellcastingStateRow = {
  id: string;
  characterId: string;
  learnedSpellIds: unknown;
  preparedSpellIds: unknown;
  slotUsageByLevel: unknown;
};

type SpellcastingStateModel = {
  characterId?: string;
  id?: string;
  learnedSpellIds: string[];
  preparedSpellIds: string[];
  slotUsageByLevel: Record<string, number>;
};

type RawSqlExecutor = {
  $executeRawUnsafe(query: string, ...values: unknown[]): Promise<unknown>;
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
};

function normalizeSpellcastingStateInput({
  data,
  fallback,
}: {
  data?: SpellcastingStateInput;
  fallback?: {
    learnedSpellIds: unknown;
    preparedSpellIds: unknown;
    slotUsageByLevel: unknown;
  } | null;
}) {
  const learnedSpellIds = normalizePreparedSpellIds(
    data?.learnedSpellIds ?? fallback?.learnedSpellIds,
  );
  const preparedSpellIds = normalizePreparedSpellIds(
    data?.preparedSpellIds ?? fallback?.preparedSpellIds,
  );
  const slotUsageByLevel = normalizeSpellSlotUsageMap(
    data?.slotUsageByLevel ?? fallback?.slotUsageByLevel,
  );

  return {
    learnedSpellIds,
    preparedSpellIds,
    slotUsageByLevel,
  };
}

function normalizePreparedSpellIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ];
}

function normalizeSpellSlotUsageMap(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, number>;
  }

  const normalizedEntries = Object.entries(value).flatMap(([level, usage]) => {
    if (
      !/^\d+$/.test(level) ||
      typeof usage !== "number" ||
      !Number.isFinite(usage) ||
      usage < 0
    ) {
      return [];
    }

    return [[level, Math.floor(usage)] as const];
  });

  return Object.fromEntries(normalizedEntries) as Record<string, number>;
}

async function ensureCharacterSpellcastingStateTable(executor: RawSqlExecutor) {
  await executor.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "character_spellcasting_states" (
      "id" UUID NOT NULL,
      "characterId" UUID NOT NULL,
      "learnedSpellIds" JSONB,
      "preparedSpellIds" JSONB,
      "slotUsageByLevel" JSONB,
      CONSTRAINT "character_spellcasting_states_pkey" PRIMARY KEY ("id")
    );
  `);
  await executor.$executeRawUnsafe(`
    ALTER TABLE "character_spellcasting_states"
    ADD COLUMN IF NOT EXISTS "learnedSpellIds" JSONB;
  `);
  await executor.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "character_spellcasting_states_characterId_key"
    ON "character_spellcasting_states"("characterId");
  `);
  await executor.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'character_spellcasting_states_characterId_fkey'
      ) THEN
        ALTER TABLE "character_spellcasting_states"
        ADD CONSTRAINT "character_spellcasting_states_characterId_fkey"
        FOREIGN KEY ("characterId") REFERENCES "characters"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
}

async function findSpellcastingStateForCharacter(
  executor: RawSqlExecutor,
  characterId: string,
): Promise<SpellcastingStateModel | null> {
  await ensureCharacterSpellcastingStateTable(executor);

  const rows = await executor.$queryRawUnsafe<SpellcastingStateRow[]>(
    `
      SELECT "id", "characterId", "learnedSpellIds", "preparedSpellIds", "slotUsageByLevel"
      FROM "character_spellcasting_states"
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
    id: row.id,
    characterId: row.characterId,
    learnedSpellIds: normalizePreparedSpellIds(row.learnedSpellIds),
    preparedSpellIds: normalizePreparedSpellIds(row.preparedSpellIds),
    slotUsageByLevel: normalizeSpellSlotUsageMap(row.slotUsageByLevel),
  };
}

async function upsertCharacterSpellcastingState(
  executor: RawSqlExecutor,
  characterId: string,
  state: SpellcastingStateModel,
) {
  await ensureCharacterSpellcastingStateTable(executor);

  await executor.$executeRawUnsafe(
    `
      INSERT INTO "character_spellcasting_states" (
        "id",
        "characterId",
        "learnedSpellIds",
        "preparedSpellIds",
        "slotUsageByLevel"
      )
      VALUES ($1::uuid, $2::uuid, $3::jsonb, $4::jsonb, $5::jsonb)
      ON CONFLICT ("characterId")
      DO UPDATE SET
        "learnedSpellIds" = EXCLUDED."learnedSpellIds",
        "preparedSpellIds" = EXCLUDED."preparedSpellIds",
        "slotUsageByLevel" = EXCLUDED."slotUsageByLevel"
    `,
    randomUUID(),
    characterId,
    JSON.stringify(state.learnedSpellIds),
    JSON.stringify(state.preparedSpellIds),
    JSON.stringify(state.slotUsageByLevel),
  );
}

async function attachSpellcastingStateToCharacter<T extends { id: string }>(
  executor: RawSqlExecutor,
  character: T | null,
): Promise<(T & { spellcastingState: SpellcastingStateModel | null }) | null> {
  if (!character) {
    return null;
  }

  const spellcastingState = await findSpellcastingStateForCharacter(executor, character.id);

  return {
    ...character,
    spellcastingState,
  };
}

async function attachSpellcastingStateToCharacters<T extends { id: string }>(
  executor: RawSqlExecutor,
  characters: T[],
): Promise<Array<T & { spellcastingState: SpellcastingStateModel | null }>> {
  return Promise.all(
    characters.map(async (character) => ({
      ...character,
      spellcastingState: await findSpellcastingStateForCharacter(executor, character.id),
    })),
  );
}

export {
  attachSpellcastingStateToCharacter,
  attachSpellcastingStateToCharacters,
  findSpellcastingStateForCharacter,
  normalizePreparedSpellIds,
  normalizeSpellcastingStateInput,
  normalizeSpellSlotUsageMap,
  upsertCharacterSpellcastingState,
};
export type { RawSqlExecutor, SpellcastingStateInput, SpellcastingStateModel, SpellcastingStateRow };
