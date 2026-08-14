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

test("deriveActionEntries exposes Rogue Cunning Strike attack riders", () => {
  const actions = deriveActionEntries([
    createSource({
      level: 5,
      sourceIndex: "rogue-cunning-strike",
      title: "Cunning Strike",
    }),
    createSource({
      level: 11,
      sourceIndex: "rogue-improved-cunning-strike",
      title: "Improved Cunning Strike",
    }),
    createSource({
      level: 14,
      sourceIndex: "rogue-devious-strikes",
      title: "Devious Strikes",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.damage, entry.combat?.hit]),
    [
      ["Cunning Strike", "attack", "Forgo 1d6 Sneak Attack", "Sneak Attack hit"],
      ["Improved Cunning Strike", "attack", "Forgo up to 2 Sneak Attack dice", "Sneak Attack hit"],
      ["Devious Strikes", "attack", "Forgo 2d6–6d6 Sneak Attack", "Sneak Attack hit"],
    ],
  );
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

test("deriveActionEntries keeps Divine Intervention as an action when its text mentions Reaction", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "As a Magic action, choose any Divine spell of level 5 or lower that doesn't require a Reaction to cast.",
      level: 10,
      sourceIndex: "divine-intervention",
      title: "Divine Intervention",
    }),
  ]);

  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.activationType, "action");
});

test("deriveActionEntries gives Charger a concise attack rider", () => {
  const actions = deriveActionEntries([
    createSource({
      description:
        "If you move at least 10 feet in a straight line immediately before hitting with a melee attack, choose +1d8 damage or push the target up to 10 feet.",
      sourceIndex: "charger",
      title: "Charger",
    }),
  ]);

  assert.deepEqual(actions[0]?.combat, {
    damage: "+1d8 or push",
    hit: "Melee hit after moving 10 ft.",
    notes: "Choose +1d8 damage or push the target up to 10 ft.; once per turn.",
    range: "Melee",
    subtitle: "General Feat",
  });
});

test("deriveActionEntries exposes epic boon and barbarian special actions", () => {
  const actions = deriveActionEntries([
    createSource({
      description: "When you miss with an attack roll, you can turn the miss into a hit.",
      level: 19,
      sourceIndex: "boon-of-combat-prowess",
      sourceType: "feat",
      title: "Boon of Combat Prowess",
    }),
    createSource({
      description: "When another creature within 60 feet makes a D20 Test, roll 2d4.",
      level: 19,
      sourceIndex: "boon-of-fate",
      sourceType: "feat",
      title: "Boon of Fate",
    }),
    createSource({
      description: "Your attacks ignore Resistance to Bludgeoning, Piercing, and Slashing damage.",
      level: 19,
      sourceIndex: "boon-of-irresistible-offense",
      sourceType: "feat",
      title: "Boon of Irresistible Offense",
    }),
    createSource({
      description: "While in Dim Light or Darkness, you can become Invisible as a Bonus Action.",
      level: 19,
      sourceIndex: "boon-of-the-night-spirit",
      sourceType: "feat",
      title: "Boon of the Night Spirit",
    }),
    createSource({
      description: "You can forgo Reckless Attack Advantage to use Brutal Strike.",
      level: 9,
      sourceIndex: "barbarian-brutal-strike",
      title: "Brutal Strike",
    }),
    createSource({
      description: "You can use two different Brutal Strike effects.",
      level: 17,
      sourceIndex: "barbarian-improved-brutal-strike-2",
      title: "Improved Brutal Strike",
    }),
    createSource({
      description: "While your Rage is active, you can make Ram attacks.",
      level: 3,
      sourceIndex: "power-of-the-wilds",
      sourceType: "subclass_feature",
      title: "Power of the Wilds",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat?.hit ?? null]),
    [
      ["Power of the Wilds", "attack", "Melee attack"],
      ["Brutal Strike", "attack", "Strength attack roll"],
      ["Improved Brutal Strike", "attack", "Strength attack roll"],
      ["Boon of Combat Prowess", "attack", "Miss becomes hit"],
      ["Boon of Irresistible Offense", "attack", "Natural 20"],
      ["Boon of the Night Spirit", "bonus_action", null],
      ["Boon of Fate", "other", "2d4 bonus or penalty"],
    ],
  );
});

test("deriveActionEntries infers generic activation and combat summaries", () => {
  const actions = deriveActionEntries([
    createSource({
      description: "You gain a quiet passive benefit that has no action timing.",
      sourceIndex: "passive-only",
      title: "Passive Only",
    }),
    createSource({
      description: "As a Bonus Action, you vanish until the end of your next turn.",
      sourceIndex: "vanish",
      title: "Vanish",
    }),
    createSource({
      description: "You can take a Reaction when a creature moves within 10 feet of you.",
      sourceIndex: "reactive-step",
      title: "Reactive Step",
    }),
    createSource({
      description:
        "Breath Weapon. When you take the Magic action, each creature in a 15-foot Cone or 30-foot Line must make a Dexterity saving throw (DC 8 plus your Charisma modifier and Proficiency Bonus), taking 1d10 fire damage on a failed save. This damage increases by 1d10 at character level 5.",
      sourceIndex: "dragon-breath",
      sourceType: "species_trait",
      title: "Dragon Breath",
    }),
    createSource({
      description:
        "As an action, each creature within 20 feet must make a Dexterity saving throw (DC 8 plus your Wisdom modifier and Proficiency Bonus), takes 2d6 psychic damage on a failed save and half as much damage on a successful save.",
      sourceIndex: "mind-pulse",
      title: "Mind Pulse",
    }),
    createSource({
      description:
        "Take the Magic action to force each creature in a 10-foot radius to make a Charisma saving throw. On a failed save, it takes 5 Radiant damage.",
      sourceIndex: "radiant-command",
      title: "Radiant Command",
    }),
    createSource({
      description:
        "Replace one of your attacks with a ranged attack roll that deals 1d8 force damage.",
      sourceIndex: "force-dart",
      title: "Force Dart",
    }),
    createSource({
      description: "Use an Object action to trigger the device.",
      sourceIndex: "device",
      title: "Device",
    }),
  ]);

  assert.deepEqual(
    actions.map((entry) => [entry.title, entry.activationType, entry.combat]),
    [
      [
        "Force Dart",
        "attack",
        {
          damage: "1d8 Force",
          hit: "Attack roll",
          notes: null,
          range: "Ranged",
        },
      ],
      ["Device", "action", null],
      [
        "Dragon Breath",
        "action",
        {
          damage: "1d10 at character level 5",
          hit: "DC 8 + CHA + Prof.",
          notes: "Save for half damage",
          range: "15 ft. cone / 30 ft. line",
          subtitle: "Species Trait",
        },
      ],
      [
        "Mind Pulse",
        "action",
        {
          damage: "2d6 Psychic",
          hit: "DC 8 + WIS + Prof.",
          notes: "Dexterity save • Save for half damage",
          range: "20 ft.",
        },
      ],
      [
        "Radiant Command",
        "action",
        {
          damage: "5 Radiant",
          hit: "Charisma save",
          notes: "Charisma save",
          range: "10 ft. radius",
        },
      ],
      ["Vanish", "bonus_action", null],
      ["Reactive Step", "reaction", null],
    ],
  );
});
