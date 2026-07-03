import assert from "node:assert/strict";
import test from "node:test";
import { deriveActionEntries } from "./actions.js";
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

test("deriveActionEntries classifies Protection as a reaction", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to impose Disadvantage on the attack roll. You must be holding a Shield to use this Reaction.",
      sourceIndex: "protection",
      title: "Protection",
    }),
  ]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.activationType, "reaction");
  assert.equal(actions[0]?.title, "Protection");
});

test("deriveActionEntries infers combat summary for save-based feature actions", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "When you take the Magic action, each creature in a 15-foot Cone must make a Dexterity saving throw (DC 8 plus your Constitution modifier and Proficiency Bonus). On a failed save, a creature takes 1d10 fire damage. On a successful save, a creature takes half as much damage.",
      sourceIndex: "custom-fire-burst",
      sourceType: "species_trait",
      title: "Fire Burst",
    }),
  ]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.activationType, "action");
  assert.deepEqual(actions[0]?.combat, {
    damage: "1d10 Fire",
    hit: "DC 8 + CON + Prof.",
    notes: "Dexterity save • Save for half damage",
    range: "15 ft. cone",
  });
});

test("deriveActionEntries classifies Durable Speedy Recovery as a bonus action", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "Speedy Recovery. As a Bonus Action, you can expend one of your Hit Point Dice, roll the die, and regain a number of Hit Points equal to the roll.",
      sourceIndex: "durable",
      title: "Durable",
    }),
  ]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.activationType, "bonus_action");
  assert.equal(actions[0]?.title, "Durable");
});

test("deriveActionEntries exposes Berserker Frenzy as a Strength attack rider", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "If you use Reckless Attack while your Rage is active, you deal extra damage to the first target you hit on your turn with a Strength-based attack.",
      level: 3,
      sourceIndex: "frenzy",
      sourceType: "subclass_feature",
      title: "Frenzy",
    }),
  ]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.activationType, "attack");
  assert.equal(actions[0]?.combat?.damage, "Rage Damage bonus d6s");
  assert.equal(actions[0]?.combat?.hit, "Strength attack roll");
});

test("deriveActionEntries exposes World Tree tactical features", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "Whenever a creature you can see starts its turn within 30 feet of you while your Rage is active, you can take a Reaction to summon spectral branches of the World Tree around it.",
      level: 6,
      sourceIndex: "branches-of-the-tree",
      sourceType: "subclass_feature",
      title: "Branches of the Tree",
    }),
    createSource({
      description:
        "During your turn, your reach is 10 feet greater with any Melee weapon that has the Heavy or Versatile property.",
      level: 10,
      sourceIndex: "battering-roots",
      sourceType: "subclass_feature",
      title: "Battering Roots",
    }),
    createSource({
      description:
        "When you activate your Rage and as a Bonus Action while your Rage is active, you can teleport up to 60 feet.",
      level: 14,
      sourceIndex: "travel-along-the-tree",
      sourceType: "subclass_feature",
      title: "Travel Along the Tree",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.range ?? null]),
    [
      ["Battering Roots", "attack", "+10 ft. reach"],
      ["Travel Along the Tree", "bonus_action", null],
      ["Branches of the Tree", "reaction", "30 ft."],
    ],
  );
});
