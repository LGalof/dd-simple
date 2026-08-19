import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../lib/prisma.js";
import {
  abilityScoreRows,
  calculateMaxHp,
  canonicalAbilityScoreIndex,
  CharacterReferenceNotFoundError,
  collectChoiceOptionReferences,
  getAbilityModifier,
  getBackgroundAbilityBonuses,
  getClassChoiceFeatureProficiencyIndexes,
  getClassFeatureAbilityBonuses,
  getClassFeatureAbilityMaximums,
  getClassSavingThrowProficiencyIndexes,
  getFeatureChoiceGrantedProficiencyIndexes,
  getFixedSpeciesLanguageIndexes,
  getFeatureChoiceAbilityBonuses,
  getFeatureChoiceHitPointBonus,
  isAbilityScoreImprovementChoiceKey,
  isFeatFeatureChoiceSelection,
  getValueAtChoicePath,
  mergeAbilityBonuses,
  normalizeBackgroundAbilityChoices,
  normalizeClassSkillChoices,
  normalizeChoiceGrantedProficiencyIndex,
  normalizeFeatureChoiceFeatIndex,
  normalizeHitPointMode,
  normalizeHitPointRolls,
  normalizeHitPointStateInput,
  normalizeInteger,
  normalizeSpeciesHeritageChoices,
  normalizeSpeciesLanguageChoices,
  rawChoiceOptionMatchesSelection,
  findCharacterInventoryForUser,
  findCharacterInventoryStateForUser,
  replaceCharacterInventoryAndStateForUser,
  replaceCharacterInventoryForUser,
  saveCharacterInventoryStateForUser,
  validateBackgroundAbilityChoices,
  validateChoicePathSelection,
  validateFeatureChoiceSelections,
  type CharacterFeatureChoiceSelectionInput,
  type CharacterMutationData,
} from "./character.service.js";

function featureChoice(
  patch: Partial<CharacterFeatureChoiceSelectionInput>,
): CharacterFeatureChoiceSelectionInput {
  return {
    choicePath: "feature_options[0]",
    selectedOptionType: "reference",
    selectedRawJson: {},
    sourceIndex: "ability-score-improvement",
    sourceType: "FEATURE",
    ...patch,
  };
}

function characterData(
  patch: Partial<CharacterMutationData> = {},
): CharacterMutationData {
  return {
    abilityScores: {
      cha: 10,
      con: 16,
      dex: 14,
      int: 10,
      str: 18,
      wis: 12,
    },
    alignment: null,
    backgroundIndex: "soldier",
    classIndex: "fighter",
    featureChoices: [],
    name: "Mira",
    skillIndexes: [],
    speciesIndex: "human",
    ...patch,
  };
}

async function withPrismaStubs<T>(
  stubs: {
    character?: unknown;
    transaction?: (callback: (tx: unknown) => Promise<T>) => Promise<T>;
  },
  callback: () => Promise<T>,
) {
  const originalCharacter = prisma.character;
  const originalTransaction = prisma.$transaction;

  if (stubs.character) {
    (prisma as unknown as { character: unknown }).character = stubs.character;
  }

  if (stubs.transaction) {
    (prisma as unknown as { $transaction: unknown }).$transaction = stubs.transaction;
  }

  try {
    return await callback();
  } finally {
    (prisma as unknown as { character: unknown }).character = originalCharacter;
    (prisma as unknown as { $transaction: unknown }).$transaction = originalTransaction;
  }
}

test("hit point helpers normalize modes, rolls, and max HP", () => {
  assert.equal(getAbilityModifier(8), -1);
  assert.equal(getAbilityModifier(16), 3);
  assert.equal(normalizeHitPointMode("rolled"), "rolled");
  assert.equal(normalizeHitPointMode("nonsense"), "fixed");
  assert.equal(normalizeInteger(4.9, 1), 4);
  assert.equal(normalizeInteger(Number.NaN, 7), 7);
  assert.deepEqual(normalizeHitPointRolls(4, 8, [8, 0, 9, 3.8]), [8, 1, 8, 3]);

  assert.equal(
    calculateMaxHp({
      bonusHp: 2,
      calculationMode: "fixed",
      constitutionScore: 16,
      hitDie: 10,
      level: 5,
      overrideMaxHp: null,
      rolledHitPoints: [],
    }),
    51,
  );
  assert.equal(
    calculateMaxHp({
      bonusHp: 0,
      calculationMode: "rolled",
      constitutionScore: 12,
      hitDie: 8,
      level: 3,
      overrideMaxHp: null,
      rolledHitPoints: [8, 5, 1],
    }),
    17,
  );
  assert.equal(
    calculateMaxHp({
      bonusHp: 0,
      calculationMode: "override",
      constitutionScore: 10,
      hitDie: 8,
      level: 1,
      overrideMaxHp: 0,
      rolledHitPoints: [],
    }),
    1,
  );

  assert.deepEqual(
    normalizeHitPointStateInput({
      constitutionScore: 14,
      data: {
        calculationMode: "rolled",
        rolledHitPoints: [6, 4, 99],
        tempHp: -3,
      },
      fallback: {
        bonusHp: 2,
        calculationMode: "fixed",
        overrideMaxHp: null,
        rolledHitPoints: [1],
        tempHp: 5,
      },
      featureBonusHp: 6,
      hitDie: 8,
      level: 3,
    }),
    {
      bonusHp: 2,
      calculationMode: "rolled",
      maxHp: 32,
      overrideMaxHp: null,
      rolledHitPoints: [6, 4, 8],
      tempHp: 0,
    },
  );
});

test("inventory service helpers load and replace character inventory records", async () => {
  const createdInventoryRows: unknown[] = [];
  const tx = {
    character: {
      findFirst: async () => ({ id: "character-1" }),
    },
    characterInventory: {
      createMany: async ({ data }: { data: unknown[] }) => {
        createdInventoryRows.push(...data);
        return { count: data.length };
      },
      deleteMany: async () => ({ count: 1 }),
      findMany: async () => [{ id: "inventory-1", equipmentIndex: "rope" }],
    },
    refEquipment: {
      findMany: async () => [{ index: "rope" }],
    },
  };

  await withPrismaStubs(
    {
      character: {
        findFirst: async () => ({
          inventory: [{ id: "inventory-1", equipmentIndex: "rope" }],
        }),
      },
      transaction: async (callback) => callback(tx),
    },
    async () => {
      assert.deepEqual(await findCharacterInventoryForUser("user-1", "character-1"), [
        { id: "inventory-1", equipmentIndex: "rope" },
      ]);

      const inventory = await replaceCharacterInventoryForUser("user-1", "character-1", [
        {
          customName: " Silk Rope ",
          equipped: false,
          equipmentIndex: "rope",
          gridX: 2,
          gridY: null,
          notes: " Climbing kit ",
          quantity: 1,
        },
      ]);

      assert.deepEqual(inventory, [{ id: "inventory-1", equipmentIndex: "rope" }]);
      assert.deepEqual(createdInventoryRows, [
        {
          characterId: "character-1",
          customName: "Silk Rope",
          equipped: false,
          equipmentIndex: "rope",
          gridX: 2,
          gridY: null,
          notes: "Climbing kit",
          quantity: 1,
        },
      ]);
    },
  );
});

test("inventory service helpers save full inventory state and reject missing references", async () => {
  const inventoryState = { characterId: "character-1", stateCode: "state-code" };
  const tx = {
    character: {
      findFirst: async () => ({ id: "character-1" }),
    },
    characterInventory: {
      createMany: async () => ({ count: 1 }),
      deleteMany: async () => ({ count: 1 }),
      findMany: async () => [{ id: "inventory-1", equipmentIndex: "potion" }],
    },
    characterInventoryState: {
      upsert: async ({ create }: { create: unknown }) => create,
    },
    refEquipment: {
      findMany: async ({ where }: { where: { index: { in: string[] } } }) =>
        where.index.in.includes("missing") ? [] : where.index.in.map((index) => ({ index })),
    },
  };

  await withPrismaStubs(
    {
      transaction: async (callback) => callback(tx),
    },
    async () => {
      assert.deepEqual(
        await replaceCharacterInventoryAndStateForUser(
          "user-1",
          "character-1",
          [
            {
              customName: null,
              equipped: true,
              equipmentIndex: "potion",
              gridX: null,
              gridY: null,
              notes: null,
              quantity: 2,
            },
          ],
          "state-code",
        ),
        {
          inventory: [{ id: "inventory-1", equipmentIndex: "potion" }],
          inventoryState,
        },
      );

      await assert.rejects(
        () =>
          replaceCharacterInventoryAndStateForUser(
            "user-1",
            "character-1",
            [
              {
                customName: null,
                equipped: false,
                equipmentIndex: "missing",
                gridX: null,
                gridY: null,
                notes: null,
                quantity: 1,
              },
            ],
            "state-code",
          ),
        CharacterReferenceNotFoundError,
      );
    },
  );
});

test("inventory state helpers handle missing characters and upserts", async () => {
  await withPrismaStubs(
    {
      character: {
        findFirst: async () => ({
          inventoryState: { characterId: "character-1", stateCode: "saved" },
        }),
      },
      transaction: async (callback) =>
        callback({
          character: {
            findFirst: async ({ where }: { where: { id: string } }) =>
              where.id === "missing" ? null : { id: where.id },
          },
          characterInventoryState: {
            upsert: async ({ update }: { update: { stateCode: string } }) => ({
              characterId: "character-1",
              stateCode: update.stateCode,
            }),
          },
        }),
    },
    async () => {
      assert.deepEqual(await findCharacterInventoryStateForUser("user-1", "character-1"), {
        characterId: "character-1",
        stateCode: "saved",
      });
      assert.deepEqual(await saveCharacterInventoryStateForUser("user-1", "character-1", "next"), {
        characterId: "character-1",
        stateCode: "next",
      });
      assert.equal(await saveCharacterInventoryStateForUser("user-1", "missing", "next"), null);
    },
  );
});

test("background choices normalize aliases and produce ability bonuses", () => {
  const choices = normalizeBackgroundAbilityChoices(
    [
      {
        choiceType: "background-ability-plan",
        selectedIndex: "increase-two-scores-2-1",
        selectedType: "ability-plan",
        sourceIndex: "old-background:plan",
        sourceType: "background",
      },
      {
        choiceType: "background-ability-score-choice",
        selectedIndex: "Strength",
        selectedType: "ability-score",
        sourceIndex: "old-background:score-a",
        sourceType: "background",
      },
      {
        choiceType: "background-ability-score-choice",
        selectedIndex: "ability-wisdom-score",
        selectedType: "ability-score",
        sourceIndex: "old-background:score-b",
        sourceType: "background",
      },
      {
        choiceType: "class-skill-choice",
        selectedIndex: "skill-stealth",
        selectedType: "skill",
        sourceIndex: "fighter",
        sourceType: "class",
      },
    ],
    "soldier",
  );

  assert.deepEqual(choices, [
    {
      choiceType: "background-ability-plan",
      selectedIndex: "increase-two-scores-2-1",
      selectedType: "ability-plan",
      sourceIndex: "soldier:plan",
      sourceType: "background",
    },
    {
      choiceType: "background-ability-score-choice",
      selectedIndex: "str",
      selectedType: "ability-score",
      sourceIndex: "soldier:score-a",
      sourceType: "background",
    },
    {
      choiceType: "background-ability-score-choice",
      selectedIndex: "wis",
      selectedType: "ability-score",
      sourceIndex: "soldier:score-b",
      sourceType: "background",
    },
  ]);
  assert.deepEqual(Object.fromEntries(getBackgroundAbilityBonuses(choices)), {
    str: 2,
    wis: 1,
  });

  const threeScoreChoices = normalizeBackgroundAbilityChoices(
    [
      {
        choiceType: "background-ability-plan",
        selectedIndex: "increase-all-three-by-1",
        selectedType: "ability-plan",
        sourceIndex: "soldier",
        sourceType: "background",
      },
    ],
    "soldier",
  );
  const threeScoreBonuses = getBackgroundAbilityBonuses(threeScoreChoices, ["str", "dex", "con"]);

  assert.deepEqual(Object.fromEntries(threeScoreBonuses), {
    con: 1,
    dex: 1,
    str: 1,
  });
  assert.deepEqual(
    Object.fromEntries(
      abilityScoreRows(
        characterData({
          abilityScores: {
            cha: 10,
            con: 10,
            dex: 10,
            int: 10,
            str: 10,
            wis: 10,
          },
        }),
        threeScoreBonuses,
      ).map((row) => [row.abilityIndex, row.score]),
    ),
    {
      cha: 10,
      con: 11,
      dex: 11,
      int: 10,
      str: 11,
      wis: 10,
    },
  );
  assert.equal(canonicalAbilityScoreIndex("Charisma"), "cha");
  assert.equal(canonicalAbilityScoreIndex(undefined), null);
});

test("feature choices provide feat HP and ability score bonuses", () => {
  const tough = featureChoice({
    choiceKey: "asi-feat",
    selectedOptionIndex: "tough",
    selectedOptionName: "Tough",
    selectedOptionUrl: "/api/2014/feats/tough",
  });
  const asiDex = featureChoice({
    choiceKey: "asi-score-1",
    selectedOptionIndex: "dexterity",
  });
  const asiCon = featureChoice({
    choicePath: "choices.ability_scores.slot2",
    selectedOptionName: "Constitution",
  });

  assert.equal(isFeatFeatureChoiceSelection(tough), true);
  assert.equal(normalizeFeatureChoiceFeatIndex({ ...tough, selectedOptionIndex: null }), "tough");
  assert.equal(getFeatureChoiceHitPointBonus([tough], 7), 14);
  assert.equal(isAbilityScoreImprovementChoiceKey("asi-score", "ignored"), true);
  assert.deepEqual(Object.fromEntries(getFeatureChoiceAbilityBonuses([asiDex, asiCon])), {
    con: 1,
    dex: 1,
  });
});

test("ability score rows merge background, feature, and class bonuses with caps", () => {
  const data = characterData({
    classIndex: "barbarian",
    featureChoices: [
      featureChoice({
        choiceKey: "asi-score-1",
        selectedOptionIndex: "strength",
      }),
    ],
    level: 20,
  });
  const rows = abilityScoreRows(data, new Map([["str", 2], ["wis", 1]]));

  assert.deepEqual(rows.find((row) => row.abilityIndex === "str"), {
    abilityIndex: "str",
    baseScore: 18,
    score: 25,
  });
  assert.deepEqual(rows.find((row) => row.abilityIndex === "con"), {
    abilityIndex: "con",
    baseScore: 16,
    score: 20,
  });
  assert.deepEqual(Object.fromEntries(getClassFeatureAbilityBonuses("barbarian", 20)), {
    con: 4,
    str: 4,
  });
  assert.deepEqual(Object.fromEntries(getClassFeatureAbilityMaximums("barbarian", 20)), {
    con: 25,
    str: 25,
  });
  assert.deepEqual(Object.fromEntries(mergeAbilityBonuses(new Map([["str", 1]]), new Map([["str", 2], ["dex", 1]]))), {
    dex: 1,
    str: 3,
  });
});

test("class helper functions normalize choices and saving throws", () => {
  assert.deepEqual(
    normalizeClassSkillChoices(
      [
        {
          choiceType: "class-skill-choice",
          selectedIndex: "skill-athletics",
          selectedType: "skill",
          sourceIndex: "legacy:fighter:skills",
          sourceType: "class",
        },
        {
          choiceType: "class-skill-choice",
          selectedIndex: "athletics",
          selectedType: "skill",
          sourceIndex: "fighter",
          sourceType: "class",
        },
      ],
      "fighter",
    ),
    [
      {
        choiceType: "class-skill-choice",
        selectedIndex: "skill-athletics",
        selectedType: "skill",
        sourceIndex: "fighter:fighter:skills",
        sourceType: "class",
      },
    ],
  );
  assert.deepEqual(
    getClassSavingThrowProficiencyIndexes({
      saving_throws: [{ index: "str" }, { index: "con" }],
    }),
    ["saving-throw-str", "saving-throw-con"],
  );
  assert.deepEqual(getClassSavingThrowProficiencyIndexes(null), []);
});

test("class and species choice helpers normalize proficiencies, languages, and heritage", () => {
  const featureChoices = [
    featureChoice({
      choicePath: "feature_options[0]",
      selectedOptionIndex: "Stealth",
      selectedOptionName: "Skill: Stealth",
      sourceIndex: "rogue",
      sourceType: "CLASS",
    }),
    featureChoice({
      choicePath: "starting_equipment.options[0]",
      selectedOptionIndex: "longsword",
      selectedOptionName: "Longsword",
      sourceIndex: "rogue",
      sourceType: "CLASS",
    }),
    featureChoice({
      choicePath: "feature_options[1]",
      selectedOptionIndex: "ignored",
      grantsRawJson: {
        savingThrowProficiencyIndexes: ["saving-throw-dex"],
        skillProficiencyIndexes: ["perception", " skill-insight "],
      },
      sourceIndex: "rogue",
      sourceType: "FEATURE",
    }),
    featureChoice({
      choicePath: "feature_options[2]",
      selectedOptionName: "Tool: Thieves' Tools",
      selectedOptionUrl: "/api/2014/proficiencies/thieves-tools",
      sourceIndex: "rogue",
      sourceType: "CLASS",
    }),
  ];

  assert.deepEqual(getFeatureChoiceGrantedProficiencyIndexes(featureChoices), [
    "skill-perception",
    "skill-insight",
    "saving-throw-dex",
  ]);
  assert.deepEqual(getClassChoiceFeatureProficiencyIndexes(featureChoices, "rogue"), [
    "skill-stealth",
    "thieves-tools",
    "skill-perception",
    "skill-insight",
    "saving-throw-dex",
  ]);
  assert.equal(normalizeChoiceGrantedProficiencyIndex("athletics"), "skill-athletics");
  assert.equal(normalizeChoiceGrantedProficiencyIndex("saving-throw-wis"), "saving-throw-wis");

  const choices = [
    {
      choiceType: "species-language-choice",
      selectedIndex: "elvish",
      selectedType: "language",
      sourceIndex: "old-species:lineage:language",
      sourceType: "species",
    },
    {
      choiceType: "species-heritage-choice",
      selectedIndex: "woodland",
      selectedType: "subspecies",
      sourceIndex: "old-species:lineage:heritage",
      sourceType: "species",
    },
    {
      choiceType: "species-language-choice",
      selectedIndex: "",
      selectedType: "language",
      sourceIndex: "human:bad",
      sourceType: "species",
    },
  ];

  assert.deepEqual(normalizeSpeciesLanguageChoices(choices, "human"), [
    {
      choiceType: "species-language-choice",
      selectedIndex: "elvish",
      selectedType: "language",
      sourceIndex: "human:lineage:language",
      sourceType: "species",
    },
  ]);
  assert.deepEqual(normalizeSpeciesHeritageChoices(choices, "human"), [
    {
      choiceType: "species-heritage-choice",
      selectedIndex: "woodland",
      selectedType: "subspecies",
      sourceIndex: "human:lineage:heritage",
      sourceType: "species",
    },
  ]);
  assert.deepEqual(
    getFixedSpeciesLanguageIndexes("human", {
      languages: [{ index: "common" }, { index: "common" }, { name: "Ignored" }],
    }),
    ["common"],
  );
  assert.deepEqual(getFixedSpeciesLanguageIndexes("elf", null), ["common", "elvish"]);
});

test("background ability choice validation accepts supported plans and rejects duplicates", async () => {
  const tx = {
    refBackgroundAbilityOption: {
      findMany: async () => [
        { abilityScoreIndex: "str" },
        { abilityScoreIndex: "dex" },
        { abilityScoreIndex: "con" },
      ],
    },
  } as never;
  const choices = normalizeBackgroundAbilityChoices(
    [
      {
        choiceType: "background-ability-plan",
        selectedIndex: "increase-two-scores-2-1",
        selectedType: "ability-plan",
        sourceIndex: "soldier:plan",
        sourceType: "background",
      },
      {
        choiceType: "background-ability-score-choice",
        selectedIndex: "Strength",
        selectedType: "ability-score",
        sourceIndex: "soldier:score-a",
        sourceType: "background",
      },
      {
        choiceType: "background-ability-score-choice",
        selectedIndex: "Dexterity",
        selectedType: "ability-score",
        sourceIndex: "soldier:score-b",
        sourceType: "background",
      },
    ],
    "soldier",
  );

  assert.deepEqual(await validateBackgroundAbilityChoices(tx, "soldier", choices), [
    "str",
    "dex",
    "con",
  ]);
  await assert.rejects(
    () =>
      validateBackgroundAbilityChoices(
        tx,
        "soldier",
        normalizeBackgroundAbilityChoices(
          [
            {
              choiceType: "background-ability-plan",
              selectedIndex: "bad-plan",
              selectedType: "ability-plan",
              sourceIndex: "soldier:plan",
              sourceType: "background",
            },
          ],
          "soldier",
        ),
      ),
    CharacterReferenceNotFoundError,
  );
  await assert.rejects(
    () =>
      validateBackgroundAbilityChoices(
        tx,
        "soldier",
        normalizeBackgroundAbilityChoices(
          [
            {
              choiceType: "background-ability-score-choice",
              selectedIndex: "Wisdom",
              selectedType: "ability-score",
              sourceIndex: "soldier:score-a",
              sourceType: "background",
            },
          ],
          "soldier",
        ),
      ),
    CharacterReferenceNotFoundError,
  );
  await assert.rejects(
    () =>
      validateBackgroundAbilityChoices(
        tx,
        "soldier",
        normalizeBackgroundAbilityChoices(
          [
            {
              choiceType: "background-ability-score-choice",
              selectedIndex: "Strength",
              selectedType: "ability-score",
              sourceIndex: "soldier:score-a",
              sourceType: "background",
            },
            {
              choiceType: "background-ability-score-choice",
              selectedIndex: "Strength",
              selectedType: "ability-score",
              sourceIndex: "soldier:score-b",
              sourceType: "background",
            },
          ],
          "soldier",
        ),
      ),
    CharacterReferenceNotFoundError,
  );
});

test("choice path helpers resolve nested options and match references", () => {
  const sourceJson = {
    feature_options: [
      {
        from: {
          options: [
            {
              item: {
                index: "defense",
                name: "Defense",
                url: "/api/options/defense",
              },
            },
            {
              items: [
                {
                  of: {
                    index: "dueling",
                    name: "Dueling",
                    url: "/api/options/dueling",
                  },
                },
              ],
            },
          ],
        },
      },
    ],
  };

  const node = getValueAtChoicePath(sourceJson, "feature_options[0]");
  assert.equal(typeof node, "object");
  assert.equal(getValueAtChoicePath(sourceJson, "feature_options[9]"), undefined);

  const references = collectChoiceOptionReferences({
    items: [{ of: { index: "dueling", name: "Dueling", url: "/api/options/dueling" } }],
  });
  assert.deepEqual([...references.indexes], ["dueling"]);
  assert.equal(
    rawChoiceOptionMatchesSelection(
      { item: { index: "defense", name: "Defense", url: "/api/options/defense" } },
      featureChoice({
        choicePath: "feature_options[0].slot1",
        selectedOptionIndex: "defense",
        selectedRawJson: {},
      }),
    ),
    true,
  );
  assert.doesNotThrow(() =>
    validateChoicePathSelection(
      sourceJson,
      featureChoice({
        choicePath: "feature_options[0].slot1",
        selectedOptionName: "Dueling",
        selectedRawJson: {},
      }),
      "Choice not found",
    ),
  );
  assert.throws(
    () =>
      validateChoicePathSelection(
        sourceJson,
        featureChoice({
          choicePath: "feature_options[0]",
          selectedOptionIndex: "archery",
          selectedRawJson: {},
        }),
        "Choice not found",
      ),
    CharacterReferenceNotFoundError,
  );
  assert.doesNotThrow(() =>
    validateChoicePathSelection(
      {},
      featureChoice({
        choiceKey: "feat-ability-str",
        choicePath: "missing.path",
        selectedOptionIndex: "Strength",
      }),
      "Choice not found",
    ),
  );
});

test("feature choice validation covers class, feature, background, and species sources", async () => {
  const tx = {
    refRuleDocument: {
      findFirst: async () => ({
        sourceJson: {
          class: { index: "wizard" },
          feature_options: [
            {
              from: {
                options: [{ item: { index: "defense", name: "Defense" } }],
              },
            },
          ],
          level: 2,
          name: "Feature Choice",
        },
      }),
    },
  } as never;
  const sourceJson = {
    options: [
      {
        from: {
          options: [{ item: { index: "defense", name: "Defense" } }],
        },
      },
    ],
  };
  const baseData = {
    backgroundIndex: "sage",
    classIndex: "wizard",
    speciesIndex: "elf",
  };
  const options = {
    backgroundSourceJson: sourceJson,
    characterLevel: 3,
    classSourceJson: sourceJson,
    speciesSourceJson: sourceJson,
    subclassIndex: null,
  };

  await assert.doesNotReject(() =>
    validateFeatureChoiceSelections(
      tx,
      {
        ...baseData,
        featureChoices: [
          featureChoice({
            choicePath: "options[0]",
            selectedOptionIndex: "defense",
            sourceIndex: "wizard",
            sourceType: "CLASS",
          }),
          featureChoice({
            choicePath: "feature_options[0]",
            selectedOptionIndex: "defense",
            sourceIndex: "feature-choice",
            sourceType: "FEATURE",
          }),
          featureChoice({
            choicePath: "options[0]",
            selectedOptionIndex: "defense",
            sourceIndex: "sage",
            sourceType: "BACKGROUND",
          }),
          featureChoice({
            choicePath: "options[0]",
            selectedOptionIndex: "defense",
            sourceIndex: "elf",
            sourceType: "SPECIES",
          }),
        ],
      },
      options,
    ),
  );
  await assert.rejects(
    () =>
      validateFeatureChoiceSelections(
        tx,
        {
          ...baseData,
          featureChoices: [
            featureChoice({
              level: 4,
              sourceIndex: "wizard",
              sourceType: "CLASS",
            }),
          ],
        },
        options,
      ),
    CharacterReferenceNotFoundError,
  );
  await assert.rejects(
    () =>
      validateFeatureChoiceSelections(
        tx,
        {
          ...baseData,
          featureChoices: [
            featureChoice({
              sourceIndex: "unknown",
              sourceType: "UNKNOWN",
            }),
          ],
        },
        options,
      ),
    CharacterReferenceNotFoundError,
  );
});
