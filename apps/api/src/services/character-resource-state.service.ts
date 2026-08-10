import type { Prisma } from "@prisma/client";

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

type ResourceStateExecutor = Pick<Prisma.TransactionClient, "characterResourceState">;

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

function toJsonInput(value: Record<string, boolean> | Record<string, number>) {
  return value as Prisma.InputJsonValue;
}

async function findResourceStateForCharacter(
  executor: ResourceStateExecutor,
  characterId: string,
): Promise<ResourceStateModel | null> {
  const row = await executor.characterResourceState.findUnique({
    where: {
      characterId,
    },
  });

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
  executor: ResourceStateExecutor,
  characterId: string,
  state: ResourceStateModel,
) {
  await executor.characterResourceState.upsert({
    where: {
      characterId,
    },
    update: {
      usageByResourceKey: toJsonInput(state.usageByResourceKey),
      customMaxByResourceKey: toJsonInput(state.customMaxByResourceKey),
      activeByResourceKey: toJsonInput(state.activeByResourceKey),
    },
    create: {
      characterId,
      usageByResourceKey: toJsonInput(state.usageByResourceKey),
      customMaxByResourceKey: toJsonInput(state.customMaxByResourceKey),
      activeByResourceKey: toJsonInput(state.activeByResourceKey),
    },
  });
}

async function attachResourceStateToCharacter<T extends { id: string }>(
  executor: ResourceStateExecutor,
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
  executor: ResourceStateExecutor,
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
export type {
  ResourceStateExecutor,
  ResourceStateInput,
  ResourceStateModel,
  ResourceStateRow,
};
