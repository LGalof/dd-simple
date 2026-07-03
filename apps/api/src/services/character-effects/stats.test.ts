import assert from "node:assert/strict";
import test from "node:test";
import { deriveCharacterStats } from "./stats.js";
import type { ResolvedFeatureSource } from "./types.js";

function createSource(
  overrides: Partial<ResolvedFeatureSource>,
): ResolvedFeatureSource {
  return {
    description: "",
    level: null,
    sourceIndex: "test-source",
    sourceType: "class_feature",
    title: "Test Source",
    ...overrides,
  };
}

test("deriveCharacterStats reads initiative proficiency from feature descriptions", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "When you roll Initiative, you can add your Proficiency Bonus to the roll.",
        sourceIndex: "custom-alert",
        title: "Alert",
      }),
    ],
    5,
  );

  assert.equal(stats.proficiencyBonus, 3);
  assert.equal(stats.initiativeBonus, 3);
});

test("deriveCharacterStats applies Defense style only while armor is equipped", () => {
  const source = createSource({
    description:
      "While you're wearing Light, Medium, or Heavy armor, you gain a +1 bonus to Armor Class.",
    sourceIndex: "defense",
    title: "Defense",
  });

  const noArmorStats = deriveCharacterStats([source], 1, {
    hasArmorEquipped: false,
  });
  const armoredStats = deriveCharacterStats([source], 1, {
    hasArmorEquipped: true,
  });

  assert.equal(noArmorStats.armorClassBonus, 0);
  assert.equal(armoredStats.armorClassBonus, 1);
});

test("deriveCharacterStats infers speed bonuses from descriptive passive text", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description: "Your speed increases by 10 feet while this feature is active.",
        sourceIndex: "custom-speed",
        title: "Fleet Step",
      }),
    ],
    1,
  );

  assert.equal(stats.speedBonus, 10);
});

test("deriveCharacterStats suppresses Barbarian Fast Movement while wearing Heavy armor", () => {
  const source = createSource({
    description: "Your speed increases by 10 feet while you aren't wearing Heavy armor.",
    sourceIndex: "fast-movement",
    title: "Fast Movement",
  });

  assert.equal(deriveCharacterStats([source], 5).speedBonus, 10);
  assert.equal(
    deriveCharacterStats([source], 5, {
      hasHeavyArmorEquipped: true,
    }).speedBonus,
    0,
  );
});

test("deriveCharacterStats scales Monk Unarmored Movement by character level", () => {
  const sources = [
    {
      description: "Your speed increases by 10 feet while you aren't wearing armor or wielding a shield.",
      level: 2,
      sourceIndex: "monk-unarmored-movement",
      sourceType: "class_feature" as const,
      title: "Unarmored Movement",
    },
  ];

  assert.equal(deriveCharacterStats(sources, 5).speedBonus, 10);
  assert.equal(deriveCharacterStats(sources, 6).speedBonus, 15);
  assert.equal(deriveCharacterStats(sources, 10).speedBonus, 20);
  assert.equal(deriveCharacterStats(sources, 14).speedBonus, 25);
  assert.equal(deriveCharacterStats(sources, 18).speedBonus, 30);
});

test("deriveCharacterStats infers unarmored defense modes from feature descriptions", () => {
  const barbarianStats = deriveCharacterStats(
    [
      createSource({
        description:
          "While you are not wearing armor, your Armor Class equals 10 plus your Dexterity modifier and Constitution modifier. You can still benefit from a shield.",
        sourceIndex: "custom-barbarian-unarmored",
        title: "Unarmored Defense",
      }),
    ],
    1,
  );
  const monkStats = deriveCharacterStats(
    [
      createSource({
        description:
          "While you aren't wearing armor or wielding a shield, your Armor Class equals 10 plus your Dexterity modifier and Wisdom modifier.",
        sourceIndex: "custom-monk-unarmored",
        title: "Unarmored Defense",
      }),
    ],
    1,
  );

  assert.equal(barbarianStats.armorClassMode, "barbarian_unarmored");
  assert.equal(monkStats.armorClassMode, "monk_unarmored");
});

test("deriveCharacterStats infers College of Dance armor class mode", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "Your base Armor Class equals 10 plus your Dexterity and Charisma modifiers.",
        sourceIndex: "dazzling-footwork",
        title: "Dazzling Footwork",
      }),
    ],
    3,
  );

  assert.equal(stats.armorClassMode, "bard_dance_unarmored");
});

test("deriveCharacterStats applies half proficiency to initiative from Jack of All Trades", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "You can add half your Proficiency Bonus to initiative checks you make.",
        sourceIndex: "jack-of-all-trades",
        title: "Jack of All Trades",
      }),
    ],
    9,
  );

  assert.equal(stats.proficiencyBonus, 4);
  assert.equal(stats.initiativeBonus, 2);
});

test("deriveCharacterStats exposes Jack of All Trades for unproficient skill checks", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "You can add half your Proficiency Bonus to any ability check you make that uses a skill proficiency you lack.",
        sourceIndex: "jack-of-all-trades",
        title: "Jack of All Trades",
      }),
    ],
    9,
  );

  assert.equal(stats.skillCheckHalfProficiencyBonusMultiplier, 0.5);
});

test("deriveCharacterStats applies Aura of Protection saving throw bonus from Charisma", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "You and your allies gain a bonus to saving throws equal to your Charisma modifier.",
        sourceIndex: "aura-of-protection",
        title: "Aura of Protection",
      }),
    ],
    6,
    {
      abilityScoresByIndex: {
        cha: 18,
      },
    },
  );

  assert.equal(stats.savingThrowBonus, 4);
});

test("deriveCharacterStats supports armor class base features like Draconic Resilience", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "Your base AC is 13 + your Dexterity modifier while you aren't wearing armor.",
        sourceIndex: "draconic-resilience",
        title: "Draconic Resilience",
      }),
    ],
    3,
  );

  assert.equal(stats.armorClassBonus, 3);
});
