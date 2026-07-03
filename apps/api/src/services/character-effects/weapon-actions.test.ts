import assert from "node:assert/strict";
import test from "node:test";

import { createBaseDerivedStats } from "./shared.js";
import { deriveWeaponActionEntries } from "./weapon-actions.js";

const baseInventoryItem = {
  customName: null,
  equipmentIndex: "warhammer",
  notes: null,
  equipment: {
    description: null,
    index: "warhammer",
    itemType: "weapon",
    name: "Warhammer",
    sourceJson: null,
  },
};

const daggerInventoryItem = {
  customName: null,
  equipmentIndex: "dagger",
  notes: null,
  equipment: {
    description: null,
    index: "dagger",
    itemType: "weapon",
    name: "Dagger",
    sourceJson: null,
  },
};

test("deriveWeaponActionEntries adds active Rage damage to Strength melee attacks", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 16,
      },
      {
        abilityIndex: "dex",
        score: 10,
      },
    ],
    activeSources: [
      {
        description:
          "While Rage is active, you have resistance to bludgeoning, piercing, and slashing damage.",
        level: 1,
        sourceIndex: "rage-active",
        sourceType: "class_feature",
        title: "Rage (Active)",
      },
    ],
    characterLevel: 9,
    inventory: [baseInventoryItem],
    proficiencies: [
      {
        proficiency: {
          index: "simple-weapons",
          name: "Simple Weapons",
        },
      },
    ],
    stats: createBaseDerivedStats(9),
  });

  const warhammer = actions.find((action) => action.title === "Warhammer");

  assert.equal(warhammer?.combat?.damage, "1d6 + 6");
  assert.equal(warhammer?.combat?.notes, "Weapon attack • Rage +3 damage");
});

test("deriveWeaponActionEntries does not add Rage damage when Rage is inactive", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 16,
      },
    ],
    activeSources: [],
    characterLevel: 9,
    inventory: [baseInventoryItem],
    proficiencies: [
      {
        proficiency: {
          index: "simple-weapons",
          name: "Simple Weapons",
        },
      },
    ],
    stats: createBaseDerivedStats(9),
  });

  const warhammer = actions.find((action) => action.title === "Warhammer");

  assert.equal(warhammer?.combat?.damage, "1d6 + 3");
  assert.equal(warhammer?.combat?.notes, "Weapon attack");
});

test("deriveWeaponActionEntries adds Radiant Strikes damage to melee attacks", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 16,
      },
    ],
    activeSources: [
      {
        description:
          "Your weapon hits naturally carry radiant force, adding holy damage to your attacks.",
        level: 11,
        sourceIndex: "radiant-strikes",
        sourceType: "class_feature",
        title: "Radiant Strikes",
      },
    ],
    characterLevel: 11,
    inventory: [baseInventoryItem],
    proficiencies: [
      {
        proficiency: {
          index: "simple-weapons",
          name: "Simple Weapons",
        },
      },
    ],
    stats: createBaseDerivedStats(11),
  });

  const warhammer = actions.find((action) => action.title === "Warhammer");
  const unarmedStrike = actions.find((action) => action.title === "Unarmed Strike");

  assert.equal(warhammer?.combat?.damage, "1d6 + 3 + 1d8 radiant");
  assert.equal(warhammer?.combat?.notes, "Weapon attack • Radiant Strikes +1d8 radiant");
  assert.equal(unarmedStrike?.combat?.damage, "1 + 3 + 1d8 radiant");
});

test("deriveWeaponActionEntries applies Dazzling Footwork to unarmed strikes", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 10,
      },
      {
        abilityIndex: "dex",
        score: 16,
      },
    ],
    activeSources: [
      {
        description:
          "You can use Dexterity instead of Strength for the attack rolls of your Unarmed Strikes.",
        level: 3,
        sourceIndex: "dazzling-footwork",
        sourceType: "subclass_feature",
        title: "Dazzling Footwork",
      },
    ],
    characterLevel: 5,
    inventory: [],
    proficiencies: [],
    stats: createBaseDerivedStats(5),
  });

  const unarmedStrike = actions.find((action) => action.title === "Unarmed Strike");

  assert.equal(unarmedStrike?.combat?.hit, "+6");
  assert.equal(unarmedStrike?.combat?.damage, "1d8 + 3");
  assert.equal(
    unarmedStrike?.combat?.notes,
    "Melee • Dazzling Footwork uses Dexterity and Bardic Inspiration die",
  );
});

test("deriveWeaponActionEntries applies Tavern Brawler to unarmed strikes", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 14,
      },
    ],
    activeSources: [
      {
        description:
          "Enhanced Unarmed Strike. When you hit with your Unarmed Strike and deal damage, you can deal Bludgeoning damage equal to 1d4 plus your Strength modifier.",
        level: null,
        sourceIndex: "tavern-brawler",
        sourceType: "class_feature",
        title: "Tavern Brawler",
      },
    ],
    characterLevel: 4,
    inventory: [],
    proficiencies: [],
    stats: createBaseDerivedStats(4),
  });

  const enhancedStrike = actions.find((action) => action.title === "Enhanced Unarmed Strike");

  assert.equal(enhancedStrike?.combat?.hit, "+4");
  assert.equal(enhancedStrike?.combat?.damage, "1d4 + 2");
  assert.equal(enhancedStrike?.combat?.notes, "Melee • Tavern Brawler");
});

test("deriveWeaponActionEntries annotates Champion critical hit ranges", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 16,
      },
    ],
    activeSources: [
      {
        description: "Your weapon attacks score a critical hit on a roll of 18, 19, or 20 on the d20.",
        level: 15,
        sourceIndex: "superior-critical",
        sourceType: "subclass_feature",
        title: "Superior Critical",
      },
    ],
    characterLevel: 15,
    inventory: [baseInventoryItem],
    proficiencies: [
      {
        proficiency: {
          index: "simple-weapons",
          name: "Simple Weapons",
        },
      },
    ],
    stats: createBaseDerivedStats(15),
  });

  const warhammer = actions.find((action) => action.title === "Warhammer");
  const unarmedStrike = actions.find((action) => action.title === "Unarmed Strike");

  assert.equal(warhammer?.combat?.notes, "Weapon attack • Critical hit on 18-20");
  assert.equal(unarmedStrike?.combat?.notes, "Melee • Critical hit on 18-20");
});

test("deriveWeaponActionEntries adds Sneak Attack dice to eligible weapons", () => {
  const actions = deriveWeaponActionEntries({
    abilityScores: [
      {
        abilityIndex: "str",
        score: 10,
      },
      {
        abilityIndex: "dex",
        score: 16,
      },
    ],
    activeSources: [
      {
        description:
          "Once per turn, you can deal extra damage to one creature you hit with an attack if you have Advantage on the attack roll.",
        level: 1,
        sourceIndex: "sneak-attack",
        sourceType: "class_feature",
        title: "Sneak Attack",
      },
    ],
    characterLevel: 7,
    inventory: [daggerInventoryItem, baseInventoryItem],
    proficiencies: [
      {
        proficiency: {
          index: "simple-weapons",
          name: "Simple Weapons",
        },
      },
    ],
    stats: createBaseDerivedStats(7),
  });

  const dagger = actions.find((action) => action.title === "Dagger");
  const warhammer = actions.find((action) => action.title === "Warhammer");

  assert.equal(dagger?.combat?.damage, "1d4 + 3 + 4d6 Sneak Attack");
  assert.equal(dagger?.combat?.notes, "Finesse, light, thrown • 4d6 Sneak Attack once per turn");
  assert.equal(warhammer?.combat?.damage, "1d6 + 0");
});
