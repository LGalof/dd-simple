import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "../lib/prisma.js";
import {
  buildCuratedClassFeatures,
  findAbilityScores,
  findAlignments,
  findBackgrounds,
  findClasses,
  findConditions,
  findEquipment,
  findProficiencies,
  findRuleDocumentByCategoryAndIndex,
  findRuleDocumentsByCategory,
  findSkills,
  findSpecies,
  getRuleDocumentClassIndex,
  isSupportedClassRuleDocument,
  primaryAbilityLabel,
  ruleDocumentDescriptions,
  stringArrayFromJson,
} from "./reference.service.js";

test.afterEach(() => {
  restorePrismaStubs();
});

const prismaStubs: Array<() => void> = [];

function stubPrismaMethod<T extends object>(
  target: T,
  methodName: keyof T,
  implementation: unknown,
) {
  const originalDescriptor = Object.getOwnPropertyDescriptor(target, methodName);

  Object.defineProperty(target, methodName, {
    configurable: true,
    value: implementation,
    writable: true,
  });
  prismaStubs.push(() => {
    if (originalDescriptor) {
      Object.defineProperty(target, methodName, originalDescriptor);
    } else {
      delete target[methodName];
    }
  });
}

function restorePrismaStubs() {
  while (prismaStubs.length > 0) {
    prismaStubs.pop()?.();
  }
}

test("reference helpers normalize json string arrays", () => {
  assert.deepEqual(stringArrayFromJson(["one", 2, "two", null]), ["one", "two"]);
  assert.deepEqual(stringArrayFromJson("one"), []);
});

test("reference helpers format primary ability labels", () => {
  assert.equal(
    primaryAbilityLabel([
      { abilityScore: { fullName: "Strength", name: "STR" } },
      { abilityScore: { fullName: "Dexterity", name: "DEX" } },
    ]),
    "Strength / Dexterity",
  );
  assert.equal(primaryAbilityLabel([]), null);
});

test("reference helpers extract rule document descriptions from known shapes", () => {
  assert.deepEqual(ruleDocumentDescriptions({ desc: ["First", 7, "Second"] }), [
    "First",
    "Second",
  ]);
  assert.deepEqual(ruleDocumentDescriptions({ description: "Plain text" }), [
    "Plain text",
  ]);
  assert.deepEqual(ruleDocumentDescriptions({ description: " " }), []);
});

test("reference helpers build curated class features from rule documents", () => {
  const features = buildCuratedClassFeatures(
    "wizard",
    [
      {
        category: "levels",
        index: "wizard-1",
        sourceJson: {
          class: { index: "wizard" },
          features: [
            { index: "spellcasting", name: "Spellcasting" },
            { index: "arcane-recovery" },
          ],
          level: 1,
        },
      },
      {
        category: "levels",
        index: "rogue-1",
        sourceJson: {
          class: { index: "rogue" },
          features: [{ index: "sneak-attack" }],
          level: 1,
        },
      },
    ],
    [
      {
        category: "features",
        index: "arcane-recovery",
        name: "Arcane Recovery",
        sourceJson: {
          desc: ["Recover expended slots.", "Once per day."],
          level: 1,
          name: "Arcane Recovery",
        },
      },
    ],
  );

  assert.deepEqual(features, [
    {
      description: null,
      details: [],
      id: "spellcasting",
      index: "spellcasting",
      level: 1,
      name: "Spellcasting",
      sourceJson: { index: "spellcasting", name: "Spellcasting" },
      summary: "No description available from reference data.",
      title: "Spellcasting",
    },
    {
      description: "Recover expended slots.",
      details: ["Once per day."],
      id: "arcane-recovery",
      index: "arcane-recovery",
      level: 1,
      name: "Arcane Recovery",
      sourceJson: {
        desc: ["Recover expended slots.", "Once per day."],
        level: 1,
        name: "Arcane Recovery",
      },
      summary: "Recover expended slots.",
      title: "Arcane Recovery",
    },
  ]);
  assert.equal(buildCuratedClassFeatures("bard", [], []), null);
});

test("reference helpers filter rule documents to supported classes", () => {
  assert.equal(
    isSupportedClassRuleDocument("classes", {
      category: "classes",
      index: "paladin",
      sourceJson: { index: "paladin" },
    }),
    false,
  );
  assert.equal(
    isSupportedClassRuleDocument("features", {
      category: "features",
      index: "rage",
      sourceJson: { class: { index: "barbarian" } },
    }),
    true,
  );
  assert.equal(
    isSupportedClassRuleDocument("backgrounds", {
      category: "backgrounds",
      index: "sage",
    }),
    true,
  );
  assert.equal(
    getRuleDocumentClassIndex({
      category: "features",
      index: "arcane-recovery",
      sourceJson: { class_index: "wizard" },
    }),
    "wizard",
  );
});

test("reference service finders query ordered reference collections", async () => {
  stubPrismaMethod(prisma.refAbilityScore, "findMany", async (args: unknown) => {
    assert.deepEqual(args, { orderBy: { index: "asc" } });
    return [{ index: "str" }];
  });
  stubPrismaMethod(prisma.refSkill, "findMany", async (args: unknown) => {
    assert.deepEqual(args, {
      include: { ability: true },
      orderBy: { name: "asc" },
    });
    return [{ index: "athletics" }];
  });
  stubPrismaMethod(prisma.refSpecies, "findMany", async (args: unknown) => {
    assert.deepEqual(args, {
      include: {
        sizeOptions: { orderBy: { size: "asc" } },
        subspecies: { orderBy: { name: "asc" } },
        traits: { orderBy: { name: "asc" } },
      },
      orderBy: { name: "asc" },
    });
    return [{ index: "elf" }];
  });
  stubPrismaMethod(prisma.refAlignment, "findMany", async () => [{ index: "neutral" }]);
  stubPrismaMethod(prisma.refCondition, "findMany", async () => [{ index: "poisoned" }]);
  stubPrismaMethod(prisma.refBackground, "findMany", async () => [{ index: "sage" }]);
  stubPrismaMethod(prisma.refProficiency, "findMany", async () => [{ index: "skill-stealth" }]);
  stubPrismaMethod(prisma.refEquipment, "findMany", async () => [{ index: "longsword" }]);

  assert.deepEqual(await findAbilityScores(), [{ index: "str" }]);
  assert.deepEqual(await findSkills(), [{ index: "athletics" }]);
  assert.deepEqual(await findSpecies(), [{ index: "elf" }]);
  assert.deepEqual(await findAlignments(), [{ index: "neutral" }]);
  assert.deepEqual(await findConditions(), [{ index: "poisoned" }]);
  assert.deepEqual(await findBackgrounds(), [{ index: "sage" }]);
  assert.deepEqual(await findProficiencies(), [{ index: "skill-stealth" }]);
  assert.deepEqual(await findEquipment(), [{ index: "longsword" }]);
});

test("findClasses combines curated rule documents with reference class rows", async () => {
  stubPrismaMethod(prisma.refClass, "findMany", async () => [
    {
      features: [
        {
          description: "Fallback feature.",
          details: ["fallback detail"],
          index: "fallback",
          level: 1,
          name: "Fallback",
          sourceJson: { name: "Fallback" },
        },
      ],
      index: "wizard",
      levels: [{ level: 1 }],
      name: "Wizard",
      primaryAbilities: [
        { abilityScore: { fullName: "Intelligence", name: "INT" } },
      ],
      sourceJson: {},
    },
  ]);
  stubPrismaMethod(prisma.refRuleDocument, "findMany", async () => [
    {
      category: "levels",
      index: "wizard-1",
      sourceJson: {
        class: { index: "wizard" },
        features: [{ index: "spellcasting", name: "Spellcasting" }],
        level: 1,
      },
    },
    {
      category: "features",
      index: "spellcasting",
      name: "Spellcasting",
      sourceJson: {
        desc: ["Cast Wizard spells."],
        level: 1,
        name: "Spellcasting",
      },
    },
  ]);

  const classes = await findClasses();

  assert.equal(classes[0]?.primaryAbility, "Intelligence");
  assert.deepEqual(classes[0]?.features, [
    {
      description: "Cast Wizard spells.",
      details: [],
      id: "spellcasting",
      index: "spellcasting",
      level: 1,
      name: "Spellcasting",
      sourceJson: {
        desc: ["Cast Wizard spells."],
        level: 1,
        name: "Spellcasting",
      },
      summary: "Cast Wizard spells.",
      title: "Spellcasting",
    },
  ]);
});

test("rule document finders filter unsupported class documents", async () => {
  stubPrismaMethod(prisma.refRuleDocument, "findMany", async () => [
    { category: "classes", index: "wizard", sourceJson: { index: "wizard" } },
    { category: "classes", index: "paladin", sourceJson: { index: "paladin" } },
  ]);
  stubPrismaMethod(prisma.refRuleDocument, "findUnique", async ({ where }: {
    where: { category_index: { index: string } };
  }) => {
    if (where.category_index.index === "paladin") {
      return { category: "classes", index: "paladin", sourceJson: { index: "paladin" } };
    }

    return { category: "classes", index: "wizard", sourceJson: { index: "wizard" } };
  });

  assert.deepEqual(await findRuleDocumentsByCategory("classes"), [
    { category: "classes", index: "wizard", sourceJson: { index: "wizard" } },
  ]);
  assert.deepEqual(await findRuleDocumentByCategoryAndIndex("classes", "wizard"), {
    category: "classes",
    index: "wizard",
    sourceJson: { index: "wizard" },
  });
  assert.equal(await findRuleDocumentByCategoryAndIndex("classes", "paladin"), null);
});
