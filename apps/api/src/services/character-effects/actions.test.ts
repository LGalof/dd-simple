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

test("deriveActionEntries exposes Cleric Channel Divinity options separately", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "Divine Spark. As a Magic action, you point your Holy Symbol at another creature you can see within 30 feet of yourself. Turn Undead. As a Magic action, you present your Holy Symbol and censure Undead creatures.",
      level: 2,
      sourceIndex: "channel-divinity",
      title: "Channel Divinity",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.range]),
    [
      ["Divine Spark", "action", "30 ft."],
      ["Turn Undead", "action", "30 ft."],
    ],
  );
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

test("deriveActionEntries exposes Light Domain magic actions", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "As a Magic action, you present your Holy Symbol and expend a use of your Channel Divinity to emit a flash of light in a 30-foot Emanation originating from yourself. Each creature must make a Constitution saving throw, taking Radiant damage equal to 2d10 plus your Cleric level on a failed save or half as much damage on a successful one.",
      level: 3,
      sourceIndex: "radiance-of-the-dawn",
      sourceType: "subclass_feature",
      title: "Radiance of the Dawn",
    }),
    createSource({
      description:
        "As a Magic action, you cause yourself to emit an aura of sunlight that lasts for 1 minute.",
      level: 17,
      sourceIndex: "corona-of-light",
      sourceType: "subclass_feature",
      title: "Corona of Light",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.range ?? null]),
    [
      ["Radiance of the Dawn", "action", "30 ft. emanation"],
      ["Corona of Light", "action", "60 ft. bright / 90 ft. total"],
    ],
  );
});

test("deriveActionEntries exposes Trickery Domain actions", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "As a Magic action, you can choose yourself or a willing creature within 30 feet of yourself to have Advantage on Dexterity (Stealth) checks.",
      level: 3,
      sourceIndex: "blessing-of-the-trickster",
      sourceType: "subclass_feature",
      title: "Blessing of the Trickster",
    }),
    createSource({
      description:
        "As a Bonus Action, you can expend one use of your Channel Divinity to create a perfect visual illusion of yourself.",
      level: 3,
      sourceIndex: "invoke-duplicity",
      sourceType: "subclass_feature",
      title: "Invoke Duplicity",
    }),
    createSource({
      description:
        "Whenever you take the Bonus Action to create or move the illusion of your Invoke Duplicity, you can teleport, swapping places with the illusion.",
      level: 6,
      sourceIndex: "tricksters-transposition",
      sourceType: "subclass_feature",
      title: "Trickster's Transposition",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.range ?? null]),
    [
      ["Blessing of the Trickster", "action", "30 ft."],
      ["Invoke Duplicity", "bonus_action", "30 ft. create / 120 ft. move"],
      ["Trickster's Transposition", "bonus_action", null],
    ],
  );
});

test("deriveActionEntries exposes War Domain actions", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "When you or a creature within 30 feet of you misses with an attack roll, you can expend one use of your Channel Divinity and give that roll a +10 bonus.",
      level: 3,
      sourceIndex: "guided-strike",
      sourceType: "subclass_feature",
      title: "Guided Strike",
    }),
    createSource({
      description:
        "As a Bonus Action, you can make one attack with a weapon or an Unarmed Strike.",
      level: 3,
      sourceIndex: "war-priest",
      sourceType: "subclass_feature",
      title: "War Priest",
    }),
    createSource({
      description:
        "You can expend a use of your Channel Divinity to cast Shield of Faith or Spiritual Weapon rather than expending a spell slot.",
      level: 6,
      sourceIndex: "war-gods-blessing",
      sourceType: "subclass_feature",
      title: "War God's Blessing",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.range ?? null]),
    [
      ["War God's Blessing", "action", null],
      ["War Priest", "bonus_action", null],
      ["Guided Strike", "reaction", "30 ft."],
    ],
  );
});

test("deriveActionEntries exposes Thief Fast Hands as a bonus action", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "As a Bonus Action, you can do one of the following. Sleight of Hand. Make a Dexterity (Sleight of Hand) check to pick a lock or disarm a trap with Thieves' Tools or to pick a pocket. Use an Object. Take the Utilize action, or take the Magic action to use a magic item that requires that action.",
      level: 3,
      sourceIndex: "fast-hands",
      sourceType: "subclass_feature",
      title: "Fast Hands",
    }),
  ]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.activationType, "bonus_action");
  assert.equal(actions[0]?.title, "Fast Hands");
});

test("deriveActionEntries exposes Abjurer ward actions", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "Alternatively, as a Bonus Action, you can expend a spell slot, and the ward regains a number of Hit Points equal to twice the level of the spell slot expended.",
      level: 3,
      sourceIndex: "arcane-ward",
      sourceType: "subclass_feature",
      title: "Arcane Ward",
    }),
    createSource({
      description:
        "When a creature that you can see within 30 feet of yourself takes damage, you can take a Reaction to cause your Arcane Ward to absorb that damage.",
      level: 6,
      sourceIndex: "projected-ward",
      sourceType: "subclass_feature",
      title: "Projected Ward",
    }),
    createSource({
      description:
        "You always have the Counterspell and Dispel Magic spells prepared. In addition, you can cast Dispel Magic as a Bonus Action.",
      level: 10,
      sourceIndex: "improved-abjuration",
      sourceType: "subclass_feature",
      title: "Spell Breaker",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.range ?? null]),
    [
      ["Arcane Ward: Restore Ward", "bonus_action", null],
      ["Spell Breaker: Dispel Magic", "bonus_action", null],
      ["Projected Ward", "reaction", "30 ft."],
    ],
  );
});
