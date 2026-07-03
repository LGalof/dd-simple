import assert from "node:assert/strict";
import test from "node:test";
import { deriveDefenseEntries } from "./defenses.js";
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

test("deriveDefenseEntries extracts condition immunities from feature text", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "You have Immunity to the Charmed and Frightened conditions while your Rage is active, and those conditions end on you when you enter your Rage.",
      level: 6,
      sourceIndex: "mindless-rage",
      sourceType: "subclass_feature",
      title: "Mindless Rage",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["condition_immunity", "Charmed"],
      ["condition_immunity", "Frightened"],
    ],
  );
});

test("deriveDefenseEntries supports 'immune to' and 'resistant to' phrasing", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "You are immune to fire damage and resistant to cold damage while this blessing lasts.",
      sourceIndex: "fire-shielding",
      title: "Fire Shielding",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Cold"],
      ["immunity", "Fire"],
    ],
  );
});

test("deriveDefenseEntries supports aura-style condition and spell damage defenses", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "Your courage radiates outward. While in your aura, you and allies can't be Frightened.",
      sourceIndex: "aura-of-courage",
      title: "Aura of Courage",
    }),
    createSource({
      description:
        "While in your aura, you and allies have resistance to all damage from spells.",
      sourceIndex: "ancients-aura-of-warding",
      sourceType: "subclass_feature",
      title: "Aura of Warding",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "All Damage"],
      ["condition_immunity", "Frightened"],
    ],
  );
});

test("deriveDefenseEntries turns active Rage into physical damage resistances", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "While Rage is active, you have resistance to bludgeoning, piercing, and slashing damage.",
      sourceIndex: "rage-active",
      title: "Rage (Active)",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Bludgeoning"],
      ["resistance", "Piercing"],
      ["resistance", "Slashing"],
    ],
  );
});

test("deriveDefenseEntries exposes Heavy Armor Master damage reduction", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "Damage Reduction. When you're hit by an attack while you're wearing Heavy armor, any Bludgeoning, Piercing, and Slashing damage dealt to you by that attack is reduced by an amount equal to your Proficiency Bonus.",
      sourceIndex: "heavy-armor-master",
      title: "Heavy Armor Master",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      [
        "damage_reduction",
        "Bludgeoning, Piercing, Slashing by PB while wearing Heavy Armor",
      ],
    ],
  );
});

test("deriveDefenseEntries exposes Wild Heart Bear rage resistances", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "Bear. While your Rage is active, you have Resistance to every damage type except Force, Necrotic, Psychic, and Radiant.",
      level: 3,
      sourceIndex: "rage-of-the-wilds",
      sourceType: "subclass_feature",
      title: "Rage of the Wilds",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target, entry.title]),
    [
      [
        "resistance",
        "All except Force, Necrotic, Psychic, Radiant while raging",
        "Rage of the Wilds: Bear",
      ],
    ],
  );
});
