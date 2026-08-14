import assert from "node:assert/strict";
import test from "node:test";
import { deriveResourceEntries } from "./resources.js";
import type { ResolvedFeatureSource } from "./types.js";

function createSource(
  overrides: Partial<ResolvedFeatureSource>,
): ResolvedFeatureSource {
  return {
    description: "",
    level: 1,
    sourceIndex: "test-source",
    sourceType: "class_feature",
    title: "Test Source",
    ...overrides,
  };
}

test("deriveResourceEntries tracks Rage uses from active feature sources", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "rage",
        title: "Rage",
      }),
    ],
    6,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Rage");
  assert.equal(resources[0]?.maxUsesValue, 4);
  assert.equal(resources[0]?.recharge, "Short Rest (1 use) / Long Rest (all uses)");
  assert.equal(resources[0]?.trackingMode, "uses");
});

test("deriveResourceEntries follows the 2024 Barbarian Rage progression", () => {
  const rageSource = [
    createSource({
      sourceIndex: "rage",
      title: "Rage",
    }),
  ];

  assert.equal(deriveResourceEntries(rageSource, 1)[0]?.maxUsesValue, 2);
  assert.equal(deriveResourceEntries(rageSource, 3)[0]?.maxUsesValue, 3);
  assert.equal(deriveResourceEntries(rageSource, 6)[0]?.maxUsesValue, 4);
  assert.equal(deriveResourceEntries(rageSource, 12)[0]?.maxUsesValue, 5);
  assert.equal(deriveResourceEntries(rageSource, 17)[0]?.maxUsesValue, 6);
});

test("deriveResourceEntries follows the 2024 Cleric Channel Divinity progression", () => {
  const channelDivinitySource = [
    createSource({
      sourceIndex: "channel-divinity",
      title: "Channel Divinity",
    }),
  ];

  assert.equal(deriveResourceEntries(channelDivinitySource, 2)[0]?.maxUsesValue, 2);
  assert.equal(deriveResourceEntries(channelDivinitySource, 6)[0]?.maxUsesValue, 3);
  assert.equal(deriveResourceEntries(channelDivinitySource, 18)[0]?.maxUsesValue, 4);
  assert.equal(
    deriveResourceEntries(channelDivinitySource, 2)[0]?.recharge,
    "Short Rest (1 use) / Long Rest (all uses)",
  );
});

test("deriveResourceEntries follows 2024 Bardic Inspiration uses, die size, and recovery", () => {
  const source = [
    createSource({
      level: 1,
      sourceIndex: "bardic-inspiration",
      title: "Bardic Inspiration",
    }),
  ];

  const levelOne = deriveResourceEntries(source, 1, {
    abilityScoresByIndex: { cha: 14 },
  })[0];
  const levelFive = deriveResourceEntries(source, 5, {
    abilityScoresByIndex: { cha: 20 },
  })[0];
  const levelEighteen = deriveResourceEntries(source, 18, {
    abilityScoresByIndex: { cha: 20 },
  })[0];

  assert.equal(levelOne?.name, "Bardic Inspiration");
  assert.equal(levelOne?.maxUsesValue, 2);
  assert.equal(levelOne?.recharge, "Long Rest");
  assert.match(levelOne?.automationNote ?? "", /d6/);

  assert.equal(levelFive?.maxUsesValue, 5);
  assert.equal(levelFive?.recharge, "Short or Long Rest / expend spell slot \(1 use\)");
  assert.match(levelFive?.automationNote ?? "", /d8/);

  assert.match(levelEighteen?.automationNote ?? "", /Initiative/);
  assert.match(levelEighteen?.automationNote ?? "", /d12/);
});

test("deriveResourceEntries tracks College of Glamour limited-use features", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 3,
        sourceIndex: "beguiling-magic",
        sourceType: "subclass_feature",
        title: "Beguiling Magic",
      }),
      createSource({
        level: 6,
        sourceIndex: "mantle-of-majesty",
        sourceType: "subclass_feature",
        title: "Mantle of Majesty",
      }),
      createSource({
        level: 14,
        sourceIndex: "unbreakable-majesty",
        sourceType: "subclass_feature",
        title: "Unbreakable Majesty",
      }),
    ],
    14,
  );

  const beguilingMagic = resources.find((resource) => resource.name === "Beguiling Magic");
  const mantleOfMajesty = resources.find((resource) => resource.name === "Mantle of Majesty");
  const unbreakableMajesty = resources.find(
    (resource) => resource.name === "Unbreakable Majesty",
  );

  assert.equal(beguilingMagic?.category, "resource");
  assert.equal(beguilingMagic?.maxUsesValue, 1);
  assert.equal(beguilingMagic?.recharge, "Long Rest / expend Bardic Inspiration");

  assert.equal(mantleOfMajesty?.category, "bonus action");
  assert.equal(mantleOfMajesty?.maxUsesValue, 1);
  assert.equal(mantleOfMajesty?.recharge, "Long Rest");

  assert.equal(unbreakableMajesty?.category, "bonus action");
  assert.equal(unbreakableMajesty?.maxUsesValue, 1);
  assert.equal(unbreakableMajesty?.recharge, "Short or Long Rest");
});

test("deriveResourceEntries tracks Lucky feat points from proficiency bonus", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "lucky",
        sourceType: "class_feature",
        title: "Lucky",
      }),
    ],
    13,
  );

  assert.equal(resources[0]?.name, "Luck Points");
  assert.equal(resources[0]?.maxUsesValue, 5);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Dragonborn Breath Weapon uses from proficiency bonus", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "breath-weapon-cold",
        sourceType: "species_trait",
        title: "Breath Weapon: Cold",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Breath Weapon: Cold");
  assert.equal(resources[0]?.maxUsesValue, 3);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Orc Adrenaline Rush on short or long rest", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "adrenaline-rush",
        sourceType: "species_trait",
        title: "Adrenaline Rush",
      }),
    ],
    9,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Adrenaline Rush");
  assert.equal(resources[0]?.maxUsesValue, 4);
  assert.equal(resources[0]?.recharge, "Short or Long Rest");
});

test("deriveResourceEntries tracks Orc Relentless Endurance", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "relentless-endurance",
        sourceType: "species_trait",
        title: "Relentless Endurance",
      }),
    ],
    9,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Relentless Endurance");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Forest Gnome Speak with Animals uses", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "gnomish-lineage-forest-gnome",
        sourceType: "species_trait",
        title: "Gnomish Lineage: Forest Gnome",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Speak with Animals");
  assert.equal(resources[0]?.maxUsesValue, 3);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Tiefling Fiendish Legacy slot-free spells", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "fiendish-spell-hellish-rebuke",
        sourceType: "species_trait",
        title: "Hellish Rebuke",
      }),
      createSource({
        sourceIndex: "fiendish-spell-darkness",
        sourceType: "species_trait",
        title: "Darkness",
      }),
    ],
    5,
  );

  assert.deepEqual(
    resources.map((resource) => [resource.name, resource.maxUsesValue, resource.recharge]),
    [
      ["Darkness", 1, "Long Rest"],
      ["Hellish Rebuke", 1, "Long Rest"],
    ],
  );
});

test("deriveResourceEntries tracks selected Goliath Giant Ancestry option", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "giant-ancestry-stones-endurance",
        sourceType: "species_trait",
        title: "Giant Ancestry: Stone's Endurance",
      }),
    ],
    13,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Giant Ancestry: Stone's Endurance");
  assert.equal(resources[0]?.category, "reaction");
  assert.equal(resources[0]?.maxUsesValue, 5);
});

test("deriveResourceEntries tracks one-use species transformations", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 5,
        sourceIndex: "draconic-flight",
        sourceType: "species_trait",
        title: "Draconic Flight",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Draconic Flight");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.category, "bonus action");
});

test("deriveResourceEntries tracks Goliath Large Form", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 5,
        sourceIndex: "large-form",
        sourceType: "species_trait",
        title: "Large Form",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Large Form");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.category, "bonus action");
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Intimidating Presence free use", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 14,
        sourceIndex: "intimidating-presence",
        sourceType: "subclass_feature",
        title: "Intimidating Presence",
      }),
    ],
    14,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Intimidating Presence");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.recharge, "Long Rest / expend Rage");
});

test("deriveResourceEntries tracks Rage of the Gods separately from Rage", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 14,
        sourceIndex: "rage-of-the-gods",
        sourceType: "subclass_feature",
        title: "Rage of the Gods",
      }),
    ],
    14,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Rage of the Gods");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.category, "bonus action");
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Arcane Ward HP and creation separately", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 3,
        sourceIndex: "arcane-ward",
        sourceType: "subclass_feature",
        title: "Arcane Ward",
      }),
      createSource({
        level: 20,
        sourceIndex: "haste",
        sourceType: "class_feature",
        title: "Haste",
        description: "You learn or gain access to the spell Haste through Signature Spells.",
      }),
      createSource({
        level: 20,
        sourceIndex: "fireball",
        sourceType: "class_feature",
        title: "Fireball",
        description: "You learn or gain access to the spell Fireball through Signature Spells.",
      }),
    ],
    20,
    {
      abilityScoresByIndex: {
        int: 18,
      },
    },
  );

  const arcaneWardHitPoints = resources.find((resource) => resource.name === "Arcane Ward Hit Points");
  const arcaneWardCreation = resources.find((resource) => resource.name === "Arcane Ward");
  const haste = resources.find((resource) => resource.name === "Signature Spell: Haste");
  const fireball = resources.find((resource) => resource.name === "Signature Spell: Fireball");

  assert.ok(arcaneWardHitPoints);
  assert.equal(arcaneWardHitPoints.maxUsesValue, 44);
  assert.equal(arcaneWardHitPoints.trackingMode, "pool");
  assert.equal(arcaneWardHitPoints.longRestBehavior, "empty");
  assert.equal(arcaneWardHitPoints.recharge, "Regain 2 × spell slot level");

  assert.ok(arcaneWardCreation);
  assert.equal(arcaneWardCreation.maxUsesValue, 1);
  assert.equal(arcaneWardCreation.recharge, "Long Rest");

  assert.ok(haste);
  assert.equal(haste.maxUsesValue, 1);
  assert.equal(haste.recharge, "Short or Long Rest");

  assert.ok(fireball);
  assert.equal(fireball.maxUsesValue, 1);
  assert.equal(fireball.recharge, "Short or Long Rest");
});

test("deriveResourceEntries tracks Illusionist feature resources", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 6,
        sourceIndex: "phantasmal-creatures",
        sourceType: "subclass_feature",
        title: "Phantasmal Creatures",
      }),
      createSource({
        level: 10,
        sourceIndex: "the-third-eye",
        sourceType: "subclass_feature",
        title: "The Third Eye",
      }),
      createSource({
        level: 10,
        sourceIndex: "illusory-self",
        sourceType: "subclass_feature",
        title: "Illusory Self",
      }),
    ],
    10,
  );

  const summonBeast = resources.find(
    (resource) => resource.name === "Summon Beast (Phantasmal Creatures)",
  );
  const summonFey = resources.find(
    (resource) => resource.name === "Summon Fey (Phantasmal Creatures)",
  );
  const thirdEye = resources.find((resource) => resource.name === "The Third Eye");
  const illusorySelf = resources.find((resource) => resource.name === "Illusory Self");

  assert.ok(summonBeast);
  assert.equal(summonBeast.maxUsesValue, 1);
  assert.equal(summonBeast.recharge, "Long Rest");

  assert.ok(summonFey);
  assert.equal(summonFey.maxUsesValue, 1);
  assert.equal(summonFey.recharge, "Long Rest");

  assert.ok(thirdEye);
  assert.equal(thirdEye.category, "bonus action");
  assert.equal(thirdEye.maxUsesValue, 1);
  assert.equal(thirdEye.recharge, "Short or Long Rest");

  assert.ok(illusorySelf);
  assert.equal(illusorySelf.category, "reaction");
  assert.equal(illusorySelf.maxUsesValue, 1);
});

test("deriveResourceEntries does not create a tracker for Travel Along the Tree", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 14,
        sourceIndex: "travel-along-the-tree",
        sourceType: "subclass_feature",
        title: "Travel Along the Tree",
      }),
    ],
    14,
  );

  assert.equal(resources.length, 0);
});

test("deriveResourceEntries tracks Zealot and Persistent Rage resources", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 3,
        sourceIndex: "warrior-of-the-gods",
        sourceType: "subclass_feature",
        title: "Warrior of the Gods",
      }),
      createSource({
        level: 15,
        sourceIndex: "persistent-rage",
        sourceType: "class_feature",
        title: "Persistent Rage",
      }),
    ],
    17,
    { abilityScoresByIndex: { wis: 18 } },
  );

  const warriorOfTheGods = resources.find((resource) => resource.name === "Warrior of the Gods");
  const persistentRage = resources.find((resource) => resource.name === "Persistent Rage");

  assert.ok(warriorOfTheGods);
  assert.equal(warriorOfTheGods.maxUsesValue, 7);
  assert.equal(warriorOfTheGods.category, "bonus action");

  assert.ok(persistentRage);
  assert.equal(persistentRage.maxUsesValue, 1);
  assert.equal(persistentRage.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Light Domain limited-use features", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 3,
        sourceIndex: "warding-flare",
        sourceType: "subclass_feature",
        title: "Warding Flare",
      }),
      createSource({
        level: 6,
        sourceIndex: "improved-warding-flare",
        sourceType: "subclass_feature",
        title: "Improved Warding Flare",
      }),
      createSource({
        level: 17,
        sourceIndex: "corona-of-light",
        sourceType: "subclass_feature",
        title: "Corona of Light",
      }),
    ],
    17,
    { abilityScoresByIndex: { wis: 18 } },
  );

  const wardingFlare = resources.find((resource) => resource.name === "Warding Flare");
  const corona = resources.find((resource) => resource.name === "Corona of Light");

  assert.equal(wardingFlare?.category, "reaction");
  assert.equal(wardingFlare?.maxUses, "Uses equal Wisdom modifier (minimum 1)");
  assert.equal(wardingFlare?.maxUsesValue, 4);
  assert.equal(wardingFlare?.recharge, "Short or Long Rest");
  assert.equal(corona?.category, "action");
  assert.equal(corona?.maxUsesValue, 4);
  assert.equal(corona?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks War Priest uses", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 3,
        sourceIndex: "war-priest",
        sourceType: "subclass_feature",
        title: "War Priest",
      }),
    ],
    3,
    { abilityScoresByIndex: { wis: 16 } },
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "War Priest");
  assert.equal(resources[0]?.category, "bonus action");
  assert.equal(resources[0]?.maxUses, "Uses equal Wisdom modifier (minimum 1)");
  assert.equal(resources[0]?.maxUsesValue, 3);
  assert.equal(resources[0]?.recharge, "Short or Long Rest");
});

test("deriveResourceEntries tracks Soulknife psionic resources", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 3,
        sourceIndex: "psionic-power",
        sourceType: "subclass_feature",
        title: "Psionic Power",
      }),
      createSource({
        level: 13,
        sourceIndex: "psychic-veil",
        sourceType: "subclass_feature",
        title: "Psychic Veil",
      }),
      createSource({
        level: 17,
        sourceIndex: "rend-mind",
        sourceType: "subclass_feature",
        title: "Rend Mind",
      }),
    ],
    17,
  );

  const psionicDice = resources.find((resource) => resource.name === "Psionic Energy Dice (d12)");
  const psychicVeil = resources.find((resource) => resource.name === "Psychic Veil");
  const rendMind = resources.find((resource) => resource.name === "Rend Mind");

  assert.equal(psionicDice?.maxUsesValue, 12);
  assert.equal(psionicDice?.recharge, "Short Rest (1 die) / Long Rest (all dice)");
  assert.equal(psychicVeil?.recharge, "Long Rest / expend Psionic Energy Die");
  assert.equal(rendMind?.recharge, "Long Rest / expend 3 Psionic Energy Dice");
});

test("deriveResourceEntries tracks selected Elven Lineage free casts", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "lineage-spell-misty-step",
        sourceType: "species_trait",
        title: "Misty Step",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Misty Step (Elven Lineage)");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks the selected Magic Initiate level 1 spell", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "magic-initiate-free-cast:cure-wounds",
        title: "Cure Wounds",
      }),
    ],
    1,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Cure Wounds (Magic Initiate)");
  assert.equal(resources[0]?.maxUses, "1 free cast");
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks miscellaneous limited-use feature resources", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "healing-hands",
        sourceType: "species_trait",
        title: "Healing Hands",
      }),
      createSource({
        sourceIndex: "celestial-revelation",
        sourceType: "species_trait",
        title: "Celestial Revelation",
      }),
      createSource({
        sourceIndex: "channel-divinity",
        title: "Channel Divinity",
      }),
      createSource({
        sourceIndex: "cunning-action",
        title: "Cunning Action",
      }),
      createSource({
        sourceIndex: "improved-cunning-strike",
        title: "Improved Cunning Strike",
      }),
      createSource({
        sourceIndex: "arcane-recovery",
        title: "Arcane Recovery",
      }),
      createSource({
        sourceIndex: "spell-thief",
        sourceType: "subclass_feature",
        title: "Spell Thief",
      }),
      createSource({
        sourceIndex: "divine-intervention",
        title: "Divine Intervention",
      }),
      createSource({
        sourceIndex: "stroke-of-luck",
        title: "Stroke of Luck",
      }),
      createSource({
        sourceIndex: "arcane-shot",
        sourceType: "subclass_feature",
        title: "Arcane Shot",
      }),
      createSource({
        sourceIndex: "giant-ancestry-cloud-jaunt",
        sourceType: "species_trait",
        title: "Giant Ancestry: Cloud's Jaunt",
      }),
      createSource({
        sourceIndex: "giant-ancestry-fire-burn",
        sourceType: "species_trait",
        title: "Giant Ancestry: Fire's Burn",
      }),
      createSource({
        sourceIndex: "giant-ancestry-frost-chill",
        sourceType: "species_trait",
        title: "Giant Ancestry: Frost's Chill",
      }),
      createSource({
        sourceIndex: "giant-ancestry-hill-tumble",
        sourceType: "species_trait",
        title: "Giant Ancestry: Hill's Tumble",
      }),
      createSource({
        sourceIndex: "giant-ancestry-storm-thunder",
        sourceType: "species_trait",
        title: "Giant Ancestry: Storm's Thunder",
      }),
    ],
    18,
  );

  const byName = new Map(resources.map((resource) => [resource.name, resource]));

  assert.equal(byName.get("Healing Hands")?.category, "action");
  assert.equal(byName.get("Celestial Revelation")?.category, "bonus action");
  assert.equal(byName.get("Channel Divinity")?.maxUsesValue, 4);
  assert.equal(byName.get("Cunning Action")?.trackingMode, "none");
  assert.equal(byName.get("Improved Cunning Strike")?.category, "passive");
  assert.equal(byName.get("Arcane Recovery")?.recharge, "Long Rest");
  assert.equal(byName.get("Spell Thief")?.category, "reaction");
  assert.equal(byName.get("Divine Intervention")?.maxUsesValue, 1);
  assert.equal(byName.get("Stroke of Luck")?.recharge, "Short or Long Rest");
  assert.equal(byName.get("Arcane Shot")?.maxUsesValue, 2);
  assert.equal(byName.get("Giant Ancestry: Cloud's Jaunt")?.category, "bonus action");
  assert.equal(byName.get("Giant Ancestry: Fire's Burn")?.category, "resource");
  assert.equal(byName.get("Giant Ancestry: Frost's Chill")?.category, "resource");
  assert.equal(byName.get("Giant Ancestry: Hill's Tumble")?.category, "resource");
  assert.equal(byName.get("Giant Ancestry: Storm's Thunder")?.category, "reaction");
});
