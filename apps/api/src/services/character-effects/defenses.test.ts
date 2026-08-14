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

test("deriveDefenseEntries includes class and subclass feature defenses", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description: "Rage is active.",
      sourceIndex: "rage-active",
      title: "Rage (Active)",
    }),
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
      ["condition_immunity", "Charmed while your Rage is active"],
      ["condition_immunity", "Frightened while your Rage is active"],
    ],
  );
});

test("deriveDefenseEntries supports 'immune to' and 'resistant to' phrasing", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "You are immune to fire damage and resistant to cold damage while this blessing lasts.",
      sourceIndex: "fire-shielding",
      sourceType: "species_trait",
      title: "Fire Shielding",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Cold while this blessing lasts"],
      ["immunity", "Fire while this blessing lasts"],
    ],
  );
});

test("deriveDefenseEntries supports aura-style condition and spell damage defenses", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "Your courage radiates outward. While in your aura, you and allies can't be Frightened.",
      sourceIndex: "aura-of-courage",
      sourceType: "species_trait",
      title: "Aura of Courage",
    }),
    createSource({
      description:
        "While in your aura, you and allies have resistance to all damage from spells.",
      sourceIndex: "ancients-aura-of-warding",
      sourceType: "item",
      title: "Aura of Warding",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Spell Damage while in your aura"],
      ["condition_immunity", "Frightened while in your aura"],
    ],
  );
});

test("deriveDefenseEntries shows active Rage defenses with their condition", () => {
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
      ["resistance", "Bludgeoning while Rage is active"],
      ["resistance", "Piercing while Rage is active"],
      ["resistance", "Slashing while Rage is active"],
    ],
  );
});

test("deriveDefenseEntries keeps equipped item damage reduction", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "Damage Reduction. When you're hit by an attack while you're wearing Heavy armor, any Bludgeoning, Piercing, and Slashing damage dealt to you by that attack is reduced by an amount equal to your Proficiency Bonus.",
      sourceIndex: "heavy-armor-master",
      sourceType: "item",
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

test("deriveDefenseEntries shows subclass feature resistances while Rage is active", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description: "Rage is active.",
      sourceIndex: "rage-active",
      title: "Rage (Active)",
    }),
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
    defenses.map((entry) => [entry.kind, entry.target]),
    [["resistance", "All except Force, Necrotic, Psychic, Radiant while raging"]],
  );
});

test("deriveDefenseEntries recognizes Spell Resistance", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "Starting at 14th level, you have advantage on saving throws against spells. Furthermore, you have resistance against the damage of spells.",
      level: 14,
      sourceIndex: "spell-resistance",
      sourceType: "subclass_feature",
      title: "Spell Resistance",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Spell Damage"],
      ["saving_throw_advantage", "Against Spells"],
    ],
  );
});

test("deriveDefenseEntries recognizes saving throw advantage against conditions", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "You have Resistance to Poison damage. You also have Advantage on saving throws you make to avoid or end the Poisoned condition.",
      sourceIndex: "dwarven-resilience",
      sourceType: "species_trait",
      title: "Dwarven Resilience",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Poison"],
      ["saving_throw_advantage", "To Avoid or End Poisoned"],
    ],
  );
});

test("deriveDefenseEntries supports contextual and selected damage resistances", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description:
        "While holding this Shield, you have Resistance to damage from attacks made with Ranged weapons.",
      sourceIndex: "shield-arrow-attraction",
      sourceType: "item",
      title: "Shield of Missile Attraction",
    }),
    createSource({
      description:
        "You have Resistance to a damage type associated with your current land choice in the Circle Spells feature.",
      sourceIndex: "natures-ward",
      sourceType: "subclass_feature",
      title: "Nature's Ward",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [
      ["resistance", "Current Land Choice Damage Type"],
      ["resistance", "Damage from attacks made with Ranged weapons while holding this Shield"],
    ],
  );
});

test("deriveDefenseEntries hides Rage damage resistance until Rage is active", () => {
  const source = createSource({
    description:
      "While active, your Rage follows the rules below. Damage Resistance. You have Resistance to Bludgeoning, Piercing, and Slashing damage.",
    sourceIndex: "rage",
    title: "Rage",
  });

  assert.deepEqual(deriveDefenseEntries([source]), []);
});

test("deriveDefenseEntries exposes Durable advantage on Death Saving Throws", () => {
  const defenses = deriveDefenseEntries([
    createSource({
      description: "Defy Death. You have Advantage on Death Saving Throws.",
      sourceIndex: "durable",
      title: "Durable",
    }),
  ]);

  assert.deepEqual(
    defenses.map((entry) => [entry.kind, entry.target]),
    [["saving_throw_advantage", "Death Saving Throws"]],
  );
});
