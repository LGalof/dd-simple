import type { Prisma } from "@prisma/client";

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

type SpellcastingStateExecutor = Pick<
  Prisma.TransactionClient,
  "characterSpellcastingState"
>;

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

function toJsonInput(value: string[] | Record<string, number>) {
  return value as Prisma.InputJsonValue;
}

async function findSpellcastingStateForCharacter(
  executor: SpellcastingStateExecutor,
  characterId: string,
): Promise<SpellcastingStateModel | null> {
  const row = await executor.characterSpellcastingState.findUnique({
    where: {
      characterId,
    },
  });

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
  executor: SpellcastingStateExecutor,
  characterId: string,
  state: SpellcastingStateModel,
) {
  await executor.characterSpellcastingState.upsert({
    where: {
      characterId,
    },
    update: {
      learnedSpellIds: toJsonInput(state.learnedSpellIds),
      preparedSpellIds: toJsonInput(state.preparedSpellIds),
      slotUsageByLevel: toJsonInput(state.slotUsageByLevel),
    },
    create: {
      characterId,
      learnedSpellIds: toJsonInput(state.learnedSpellIds),
      preparedSpellIds: toJsonInput(state.preparedSpellIds),
      slotUsageByLevel: toJsonInput(state.slotUsageByLevel),
    },
  });
}

async function attachSpellcastingStateToCharacter<T extends { id: string }>(
  executor: SpellcastingStateExecutor,
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
  executor: SpellcastingStateExecutor,
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
export type {
  SpellcastingStateExecutor,
  SpellcastingStateInput,
  SpellcastingStateModel,
  SpellcastingStateRow,
};
