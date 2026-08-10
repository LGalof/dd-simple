import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  findResourceStateForCharacter,
  upsertCharacterResourceState,
  type ResourceStateExecutor,
  type ResourceStateModel,
  type ResourceStateRow,
} from "./character-resource-state.service.js";
import {
  findSpellcastingStateForCharacter,
  upsertCharacterSpellcastingState,
  type SpellcastingStateExecutor,
  type SpellcastingStateModel,
  type SpellcastingStateRow,
} from "./character-spellcasting-state.service.js";

const migrationUrl = new URL(
  "../../prisma/migrations/20260810120000_add_character_resource_state_and_learned_spells/migration.sql",
  import.meta.url,
);
const resourceServiceUrl = new URL("./character-resource-state.service.ts", import.meta.url);
const spellcastingServiceUrl = new URL(
  "./character-spellcasting-state.service.ts",
  import.meta.url,
);

type SpellcastingUpsertArgs = {
  create: Omit<SpellcastingStateRow, "id">;
  update: Omit<SpellcastingStateRow, "id" | "characterId">;
  where: {
    characterId: string;
  };
};

type ResourceUpsertArgs = {
  create: Omit<ResourceStateRow, "id">;
  update: Omit<ResourceStateRow, "id" | "characterId">;
  where: {
    characterId: string;
  };
};

function createSpellcastingExecutor() {
  const rows = new Map<string, SpellcastingStateRow>();
  const executor = {
    characterSpellcastingState: {
      async findUnique(args: { where: { characterId: string } }) {
        return rows.get(args.where.characterId) ?? null;
      },
      async upsert(args: SpellcastingUpsertArgs) {
        const existing = rows.get(args.where.characterId);

        if (existing) {
          const updated = {
            ...existing,
            ...args.update,
          };

          rows.set(args.where.characterId, updated);
          return updated;
        }

        const created = {
          id: `spellcasting-state-${rows.size + 1}`,
          ...args.create,
        };

        rows.set(args.create.characterId, created);
        return created;
      },
    },
    async $executeRawUnsafe() {
      throw new Error("state services must not execute runtime DDL");
    },
    async $queryRawUnsafe() {
      throw new Error("state services must not use raw SQL queries");
    },
  };

  return {
    executor: executor as unknown as SpellcastingStateExecutor,
    rows,
  };
}

function createResourceExecutor() {
  const rows = new Map<string, ResourceStateRow>();
  const executor = {
    characterResourceState: {
      async findUnique(args: { where: { characterId: string } }) {
        return rows.get(args.where.characterId) ?? null;
      },
      async upsert(args: ResourceUpsertArgs) {
        const existing = rows.get(args.where.characterId);

        if (existing) {
          const updated = {
            ...existing,
            ...args.update,
          };

          rows.set(args.where.characterId, updated);
          return updated;
        }

        const created = {
          id: `resource-state-${rows.size + 1}`,
          ...args.create,
        };

        rows.set(args.create.characterId, created);
        return created;
      },
    },
    async $executeRawUnsafe() {
      throw new Error("state services must not execute runtime DDL");
    },
    async $queryRawUnsafe() {
      throw new Error("state services must not use raw SQL queries");
    },
  };

  return {
    executor: executor as unknown as ResourceStateExecutor,
    rows,
  };
}

test("spellcasting state saves, loads, and updates learned spells", async () => {
  const characterId = "11111111-1111-4111-8111-111111111111";
  const { executor } = createSpellcastingExecutor();
  const initialState: SpellcastingStateModel = {
    learnedSpellIds: ["mage-hand", "shield"],
    preparedSpellIds: ["shield"],
    slotUsageByLevel: {
      "1": 1,
    },
  };

  await upsertCharacterSpellcastingState(executor, characterId, initialState);

  assert.deepEqual(await findSpellcastingStateForCharacter(executor, characterId), {
    characterId,
    id: "spellcasting-state-1",
    learnedSpellIds: ["mage-hand", "shield"],
    preparedSpellIds: ["shield"],
    slotUsageByLevel: {
      "1": 1,
    },
  });

  await upsertCharacterSpellcastingState(executor, characterId, {
    learnedSpellIds: ["fireball"],
    preparedSpellIds: [],
    slotUsageByLevel: {
      "3": 2,
    },
  });

  assert.deepEqual(await findSpellcastingStateForCharacter(executor, characterId), {
    characterId,
    id: "spellcasting-state-1",
    learnedSpellIds: ["fireball"],
    preparedSpellIds: [],
    slotUsageByLevel: {
      "3": 2,
    },
  });
});

test("resource state saves, loads, and updates through the service path", async () => {
  const characterId = "22222222-2222-4222-8222-222222222222";
  const { executor } = createResourceExecutor();
  const initialState: ResourceStateModel = {
    activeByResourceKey: {
      rage: true,
    },
    customMaxByResourceKey: {
      rage: 3,
    },
    usageByResourceKey: {
      rage: 1,
    },
  };

  await upsertCharacterResourceState(executor, characterId, initialState);

  assert.deepEqual(await findResourceStateForCharacter(executor, characterId), {
    activeByResourceKey: {
      rage: true,
    },
    characterId,
    customMaxByResourceKey: {
      rage: 3,
    },
    id: "resource-state-1",
    usageByResourceKey: {
      rage: 1,
    },
  });

  await upsertCharacterResourceState(executor, characterId, {
    activeByResourceKey: {
      rage: false,
    },
    customMaxByResourceKey: {
      rage: 4,
    },
    usageByResourceKey: {
      rage: 2,
    },
  });

  assert.deepEqual(await findResourceStateForCharacter(executor, characterId), {
    activeByResourceKey: {
      rage: false,
    },
    characterId,
    customMaxByResourceKey: {
      rage: 4,
    },
    id: "resource-state-1",
    usageByResourceKey: {
      rage: 2,
    },
  });
});

test("state services normalize nullable and legacy JSON values on load", async () => {
  const spellcastingCharacterId = "33333333-3333-4333-8333-333333333333";
  const resourceCharacterId = "44444444-4444-4444-8444-444444444444";
  const spellcasting = createSpellcastingExecutor();
  const resource = createResourceExecutor();

  spellcasting.rows.set(spellcastingCharacterId, {
    characterId: spellcastingCharacterId,
    id: "legacy-spellcasting-state",
    learnedSpellIds: [" shield ", "", "shield", 42],
    preparedSpellIds: null,
    slotUsageByLevel: {
      "1": 1.8,
      "-1": 2,
      cantrip: 1,
    },
  });
  resource.rows.set(resourceCharacterId, {
    activeByResourceKey: {
      " rage ": true,
      secondWind: "yes",
    },
    characterId: resourceCharacterId,
    customMaxByResourceKey: null,
    id: "legacy-resource-state",
    usageByResourceKey: {
      " rage ": 1.8,
      bad: -1,
    },
  });

  assert.deepEqual(
    await findSpellcastingStateForCharacter(spellcasting.executor, spellcastingCharacterId),
    {
      characterId: spellcastingCharacterId,
      id: "legacy-spellcasting-state",
      learnedSpellIds: ["shield"],
      preparedSpellIds: [],
      slotUsageByLevel: {
        "1": 1,
      },
    },
  );
  assert.deepEqual(await findResourceStateForCharacter(resource.executor, resourceCharacterId), {
    activeByResourceKey: {
      rage: true,
    },
    characterId: resourceCharacterId,
    customMaxByResourceKey: {},
    id: "legacy-resource-state",
    usageByResourceKey: {
      rage: 1,
    },
  });
});

test("migration declares learned spell and resource state structures", async () => {
  const sql = await readFile(migrationUrl, "utf8");

  assert.match(sql, /ADD COLUMN IF NOT EXISTS "learnedSpellIds" JSONB/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS "character_resource_states"/);
  assert.match(sql, /"id" UUID NOT NULL/);
  assert.match(sql, /"characterId" UUID NOT NULL/);
  assert.match(sql, /"usageByResourceKey" JSONB/);
  assert.match(sql, /"customMaxByResourceKey" JSONB/);
  assert.match(sql, /"activeByResourceKey" JSONB/);
  assert.match(sql, /PRIMARY KEY \("id"\)/);
  assert.match(
    sql,
    /CREATE UNIQUE INDEX IF NOT EXISTS "character_resource_states_characterId_key"/,
  );
  assert.match(
    sql,
    /FOREIGN KEY \("characterId"\) REFERENCES "characters"\("id"\)\s+ON DELETE CASCADE ON UPDATE CASCADE/,
  );
});

test("state services no longer contain runtime schema bootstrapping SQL", async () => {
  const source = [
    await readFile(resourceServiceUrl, "utf8"),
    await readFile(spellcastingServiceUrl, "utf8"),
  ].join("\n");

  assert.doesNotMatch(source, /\bCREATE TABLE\b/);
  assert.doesNotMatch(source, /\bALTER TABLE\b/);
  assert.doesNotMatch(source, /\$executeRawUnsafe/);
  assert.doesNotMatch(source, /\$queryRawUnsafe/);
});
