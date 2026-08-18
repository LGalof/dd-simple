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

test("deriveCharacterStats infers permanent speed bonuses from descriptive text", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description: "Your speed increases by 10 feet.",
        sourceIndex: "custom-speed",
        title: "Fleet Step",
      }),
    ],
    1,
  );

  assert.equal(stats.speedBonus, 10);
});

test("deriveCharacterStats applies Wood Elf lineage speed bonus", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description: "Your Speed increases by 5 feet, to 35 feet.",
        sourceIndex: "wood-elf-speed-increase",
        sourceType: "species_trait",
        title: "Wood Elf Speed",
      }),
    ],
    1,
  );

  assert.equal(stats.speedBonus, 5);
});

test("deriveCharacterStats applies active Goliath Large Form speed bonus", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description: "While Large Form is active, your Speed increases by 10 feet.",
        sourceIndex: "large-form-active",
        sourceType: "species_trait",
        title: "Large Form (Active)",
      }),
    ],
    5,
  );

  assert.equal(stats.speedBonus, 10);
});

test("deriveCharacterStats does not apply inactive Goliath Large Form speed bonus", () => {
  const largeForm = createSource({
    description:
      "This transformation lasts for 10 minutes. For that duration, your Speed increases by 10 feet.",
    sourceIndex: "large-form",
    sourceType: "species_trait",
    title: "Large Form",
  });
  const activeLargeForm = createSource({
    description: "While Large Form is active, your Speed increases by 10 feet.",
    sourceIndex: "large-form-active",
    sourceType: "species_trait",
    title: "Large Form (Active)",
  });

  assert.equal(deriveCharacterStats([largeForm], 5).speedBonus, 0);
  assert.equal(deriveCharacterStats([largeForm, activeLargeForm], 5).speedBonus, 10);
});

test("deriveCharacterStats does not make the Charger Dash bonus permanent", () => {
  const stats = deriveCharacterStats(
    [
      createSource({
        description:
          "When you take the Dash action, your Speed increases by 10 feet for that action.",
        sourceIndex: "charger",
        sourceType: "class_feature",
        title: "Charger",
      }),
    ],
    4,
  );

  assert.equal(stats.speedBonus, 0);
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

  assert.equal(barbarianStats.armorClassMode, "barbarian_unarmored");
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
