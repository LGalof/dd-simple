import assert from "node:assert/strict";
import test from "node:test";
import { deriveSpellEntries } from "./spells.js";
import type { ClassSourceJson, ResolvedFeatureSource } from "./types.js";

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

const wizardClassSource: ClassSourceJson = {
  spellcasting: {
    info: [
      {
        desc: [
          "You prepare and cast Wizard spells using Intelligence as your spellcasting ability.",
        ],
      },
    ],
  },
};

test("deriveSpellEntries includes spellbook additions selected through feature grants", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You learn or gain access to the spell Magic Missile through Spellbook Additions.",
      level: 2,
      sourceIndex: "magic-missile",
      title: "Magic Missile",
    }),
    createSource({
      description:
        "You learn or gain access to the spell Shield through Spellbook Additions.",
      level: 2,
      sourceIndex: "shield",
      title: "Shield",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);
  const magicMissile = spells.find((entry) => entry.title === "Magic Missile");
  const shield = spells.find((entry) => entry.title === "Shield");

  assert.ok(magicMissile, "Magic Missile should be derived from spellbook additions");
  assert.equal(magicMissile.kind, "spell_feature");
  assert.equal(magicMissile.preparationMode, "known");

  assert.ok(shield, "Shield should be derived from spellbook additions");
  assert.equal(shield.kind, "spell_feature");
  assert.equal(shield.preparationMode, "known");
});

test("deriveSpellEntries does not classify non-spell features as spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You can recover some expended spell power during a short rest, reflecting disciplined arcane study and efficient magical pacing.",
      level: 1,
      sourceIndex: "arcane-recovery",
      title: "Arcane Recovery",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);

  assert.equal(
    spells.some((entry) => entry.title === "Arcane Recovery"),
    false,
    "Arcane Recovery should stay a feature and not become a spell entry",
  );
});

test("deriveSpellEntries ignores generic Spell Mastery wrapper text", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You have achieved such mastery over certain spells that you can cast them at will. Choose a level 1 and a level 2 spell in your spellbook that have a casting time of an action. You always have those spells prepared, and you can cast them at their lowest level without expending a spell slot.",
      level: 18,
      sourceIndex: "spell-mastery",
      title: "Spell Mastery",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 18);

  assert.equal(spells.some((entry) => entry.title.toLowerCase() === "those"), false);
  assert.equal(spells.some((entry) => entry.title === "Spell Mastery"), false);
});

test("deriveSpellEntries infers cantrip and always-prepared spell modes", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description: "You learn the cantrip Light through Cantrips.",
      level: 1,
      sourceIndex: "light",
      title: "Light",
    }),
    createSource({
      description:
        "You always have Shield of Faith and Bless spells prepared, and they don't count against the number of spells you can prepare.",
      level: 1,
      sourceIndex: "test-always-prepared-spells",
      sourceType: "subclass_feature",
      title: "Life Domain Spells",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);
  const light = spells.find((entry) => entry.title === "Light");
  const shieldOfFaith = spells.find((entry) => entry.title === "Shield of Faith");
  const bless = spells.find((entry) => entry.title === "Bless");

  assert.ok(light);
  assert.equal(light.isCantrip, true);
  assert.equal(light.spellLevel, 0);
  assert.equal(light.preparationMode, "known");

  assert.ok(shieldOfFaith);
  assert.equal(shieldOfFaith.kind, "always_prepared");
  assert.equal(shieldOfFaith.preparationMode, "always_prepared");

  assert.ok(bless);
  assert.equal(bless.kind, "always_prepared");
  assert.equal(bless.preparationMode, "always_prepared");
});

test("deriveSpellEntries recognizes saved Magical Discoveries cantrips by spell name", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description: "You add Acid Splash to the spells prepared through Magical Discoveries.",
      level: 6,
      sourceIndex: "acid-splash",
      sourceType: "subclass_feature",
      title: "Acid Splash",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);
  const acidSplash = spells.find((entry) => entry.title === "Acid Splash");

  assert.ok(acidSplash);
  assert.equal(acidSplash.isCantrip, true);
  assert.equal(acidSplash.spellLevel, 0);
});

test("deriveSpellEntries recognizes Magic Initiate level 1 spell choices", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description: "You learn the level 1 spell Detect Magic through Ability Score Improvement.",
      level: 4,
      sourceIndex: "detect-magic",
      title: "Detect Magic",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);
  const detectMagic = spells.find((entry) => entry.title === "Detect Magic");

  assert.ok(detectMagic);
  assert.equal(detectMagic.isCantrip, false);
  assert.equal(detectMagic.spellLevel, 1);
  assert.equal(detectMagic.preparationMode, "known");
});

test("deriveSpellEntries maps Elf lineage traits to concrete spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "Choose an elven lineage: Drow, High Elf, or Wood Elf.",
      level: 1,
      sourceIndex: "elven-lineage",
      sourceType: "species_trait",
      title: "Elven Lineage",
    }),
    createSource({
      description: "You know the Druidcraft cantrip through your Wood Elf lineage.",
      level: 1,
      sourceIndex: "lineage-spell-druidcraft",
      sourceType: "species_trait",
      title: "Druidcraft",
    }),
    createSource({
      description: "At character level 3, you learn the Longstrider spell through your Wood Elf lineage.",
      level: 3,
      sourceIndex: "lineage-spell-longstrider",
      sourceType: "species_trait",
      title: "Longstrider",
    }),
    createSource({
      description:
        "At character level 5, you learn the Pass without Trace spell through your Wood Elf lineage.",
      level: 5,
      sourceIndex: "lineage-spell-pass-without-trace",
      sourceType: "species_trait",
      title: "Pass without Trace",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 5);

  assert.equal(
    spells.some((entry) => entry.title === "Elven Lineage"),
    false,
    "The table-style lineage description should not become a spell entry.",
  );
  assert.equal(spells.find((entry) => entry.title === "Druidcraft")?.spellLevel, 0);
  assert.equal(spells.find((entry) => entry.title === "Longstrider")?.spellLevel, 1);
  assert.equal(spells.find((entry) => entry.title === "Pass without Trace")?.spellLevel, 2);
});

test("deriveSpellEntries maps Gnome lineage choices to concrete spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description: "Choose Forest Gnome or Rock Gnome.",
      level: 1,
      sourceIndex: "gnomish-lineage",
      sourceType: "species_trait",
      title: "Gnomish Lineage",
    }),
    createSource({
      description:
        "You know the Minor Illusion cantrip. You also always have the Speak with Animals spell prepared.",
      level: 1,
      sourceIndex: "gnomish-lineage-forest-gnome",
      sourceType: "species_trait",
      title: "Gnomish Lineage: Forest Gnome",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 1);

  assert.equal(
    spells.some((entry) => entry.title === "Gnomish Lineage"),
    false,
    "The table-style gnomish lineage description should not become a spell entry.",
  );
  assert.equal(spells.find((entry) => entry.title === "Minor Illusion")?.spellLevel, 0);
  assert.equal(
    spells.find((entry) => entry.title === "Speak with Animals")?.preparationMode,
    "always_prepared",
  );
});

test("deriveSpellEntries maps Tiefling Fiendish Legacy choices to concrete spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description: "Choose a legacy from the Fiendish Legacies table.",
      level: 1,
      sourceIndex: "fiendish-legacy",
      sourceType: "species_trait",
      title: "Fiendish Legacy",
    }),
    createSource({
      description: "You have Resistance to Fire damage. You also know the Fire Bolt cantrip.",
      level: 1,
      sourceIndex: "fiendish-legacy-infernal",
      sourceType: "species_trait",
      title: "Fiendish Legacy: Infernal",
    }),
    createSource({
      description: "At character level 3, you learn Hellish Rebuke through your Infernal legacy.",
      level: 3,
      sourceIndex: "fiendish-spell-hellish-rebuke",
      sourceType: "species_trait",
      title: "Hellish Rebuke",
    }),
    createSource({
      description: "At character level 5, you learn Darkness through your Infernal legacy.",
      level: 5,
      sourceIndex: "fiendish-spell-darkness",
      sourceType: "species_trait",
      title: "Darkness",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 5);

  assert.equal(
    spells.some((entry) => entry.title === "Fiendish Legacy"),
    false,
    "The table-style fiendish legacy description should not become a spell entry.",
  );
  assert.equal(spells.find((entry) => entry.title === "Fire Bolt")?.spellLevel, 0);
  assert.equal(
    spells.find((entry) => entry.title === "Hellish Rebuke")?.preparationMode,
    "always_prepared",
  );
  assert.equal(
    spells.find((entry) => entry.title === "Darkness")?.preparationMode,
    "always_prepared",
  );
});

test("deriveSpellEntries adds Arcane Trickster spellcasting and Mage Hand", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description: "You have learned to cast spells.",
      level: 3,
      sourceIndex: "arcane-trickster-spellcasting",
      sourceType: "subclass_feature",
      title: "Spellcasting",
    }),
    createSource({
      description:
        "When you cast Mage Hand, you can cast it as a Bonus Action and make the spectral hand invisible.",
      level: 3,
      sourceIndex: "arcane-trickster-mage-hand-legerdemain",
      sourceType: "subclass_feature",
      title: "Mage Hand Legerdemain",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 3);
  const spellcasting = spells.find((entry) => entry.title === "Arcane Trickster Spellcasting");
  const mageHand = spells.find((entry) => entry.title === "Mage Hand");

  assert.ok(spellcasting);
  assert.equal(spellcasting.kind, "spellcasting");
  assert.equal(spellcasting.preparationMode, "spellcasting");

  assert.ok(mageHand);
  assert.equal(mageHand.isCantrip, true);
  assert.equal(mageHand.spellLevel, 0);
  assert.equal(mageHand.preparationMode, "known");
});

test("deriveSpellEntries splits always-prepared spell lists into concrete spell entries", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You always have Shield of Faith and Bless spells prepared, and they don't count against the number of spells you can prepare.",
      level: 1,
      sourceIndex: "test-always-prepared-spells",
      sourceType: "subclass_feature",
      title: "Life Domain Spells",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);

  assert.ok(spells.some((entry) => entry.title === "Shield of Faith"));
  assert.ok(spells.some((entry) => entry.title === "Bless"));
});

test("deriveSpellEntries adds Life Domain spells at the required Cleric levels", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "Your connection to this divine domain ensures you always have certain spells ready.",
      level: 3,
      sourceIndex: "life-domain-spells",
      sourceType: "subclass_feature",
      title: "Life Domain Spells",
    }),
  ];

  const level3Spells = deriveSpellEntries(activeSources, wizardClassSource, 3);
  const level5Spells = deriveSpellEntries(activeSources, wizardClassSource, 5);

  assert.ok(level3Spells.some((entry) => entry.title === "Bless" && entry.spellLevel === 1));
  assert.ok(level3Spells.some((entry) => entry.title === "Aid" && entry.spellLevel === 2));
  assert.equal(
    level3Spells.some((entry) => entry.title === "Mass Healing Word"),
    false,
    "level 5 domain spells should not appear before Cleric level 5",
  );

  assert.ok(
    level5Spells.some((entry) => entry.title === "Mass Healing Word" && entry.spellLevel === 3),
  );
  assert.ok(level5Spells.some((entry) => entry.title === "Revivify" && entry.spellLevel === 3));
});

test("deriveSpellEntries adds Light Domain spells at the required Cleric levels", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "Your connection to this divine domain ensures you always have certain spells ready.",
      level: 3,
      sourceIndex: "light-domain-spells",
      sourceType: "subclass_feature",
      title: "Light Domain Spells",
    }),
  ];

  const level3Spells = deriveSpellEntries(activeSources, wizardClassSource, 3);
  const level7Spells = deriveSpellEntries(activeSources, wizardClassSource, 7);

  assert.ok(level3Spells.some((entry) => entry.title === "Burning Hands" && entry.spellLevel === 1));
  assert.ok(level3Spells.some((entry) => entry.title === "See Invisibility" && entry.spellLevel === 2));
  assert.equal(
    level3Spells.some((entry) => entry.title === "Wall of Fire"),
    false,
    "level 7 domain spells should not appear before Cleric level 7",
  );

  assert.ok(level7Spells.some((entry) => entry.title === "Arcane Eye" && entry.spellLevel === 4));
  assert.ok(level7Spells.some((entry) => entry.title === "Wall of Fire" && entry.spellLevel === 4));
});

test("deriveSpellEntries adds Trickery Domain spells at the required Cleric levels", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "Your connection to this divine domain ensures you always have certain spells ready.",
      level: 3,
      sourceIndex: "trickery-domain-spells",
      sourceType: "subclass_feature",
      title: "Trickery Domain Spells",
    }),
  ];

  const level3Spells = deriveSpellEntries(activeSources, wizardClassSource, 3);
  const level9Spells = deriveSpellEntries(activeSources, wizardClassSource, 9);

  assert.ok(level3Spells.some((entry) => entry.title === "Charm Person" && entry.spellLevel === 1));
  assert.ok(level3Spells.some((entry) => entry.title === "Pass without Trace" && entry.spellLevel === 2));
  assert.equal(
    level3Spells.some((entry) => entry.title === "Dominate Person"),
    false,
    "level 9 domain spells should not appear before Cleric level 9",
  );

  assert.ok(level9Spells.some((entry) => entry.title === "Dominate Person" && entry.spellLevel === 5));
  assert.ok(level9Spells.some((entry) => entry.title === "Modify Memory" && entry.spellLevel === 5));
});

test("deriveSpellEntries adds Abjurer Spell Breaker spells as 3rd-level always prepared spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You always have the Counterspell and Dispel Magic spells prepared. In addition, you can cast Dispel Magic as a Bonus Action.",
      level: 10,
      sourceIndex: "improved-abjuration",
      sourceType: "subclass_feature",
      title: "Spell Breaker",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 10);
  const counterspell = spells.find((entry) => entry.title === "Counterspell");
  const dispelMagic = spells.find((entry) => entry.title === "Dispel Magic");

  assert.ok(counterspell);
  assert.equal(counterspell.kind, "always_prepared");
  assert.equal(counterspell.spellLevel, 3);

  assert.ok(dispelMagic);
  assert.equal(dispelMagic.kind, "always_prepared");
  assert.equal(dispelMagic.spellLevel, 3);
});

test("deriveSpellEntries adds Illusionist feature spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You also know the Minor Illusion cantrip. If you already know it, you learn a different Wizard cantrip of your choice.",
      level: 3,
      sourceIndex: "improved-illusions",
      sourceType: "subclass_feature",
      title: "Improved Illusions",
    }),
    createSource({
      description:
        "You always have the Summon Beast and Summon Fey spells prepared. You can cast the Illusion version of each spell without expending a spell slot once per Long Rest.",
      level: 6,
      sourceIndex: "phantasmal-creatures",
      sourceType: "subclass_feature",
      title: "Phantasmal Creatures",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 6);
  const minorIllusion = spells.find((entry) => entry.title === "Minor Illusion");
  const summonBeast = spells.find((entry) => entry.title === "Summon Beast");
  const summonFey = spells.find((entry) => entry.title === "Summon Fey");

  assert.ok(minorIllusion);
  assert.equal(minorIllusion.kind, "spell_feature");
  assert.equal(minorIllusion.spellLevel, 0);
  assert.equal(minorIllusion.preparationMode, "known");

  assert.ok(summonBeast);
  assert.equal(summonBeast.kind, "always_prepared");
  assert.equal(summonBeast.spellLevel, 2);
  assert.match(summonBeast.description, /Bestial Spirit/);
  assert.match(summonBeast.description, /Casting Time: 1 action/);

  assert.ok(summonFey);
  assert.equal(summonFey.kind, "always_prepared");
  assert.equal(summonFey.spellLevel, 3);
  assert.match(summonFey.description, /Fey Spirit/);
});

test("deriveSpellEntries adds College of Glamour always-prepared spells", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You always have the Charm Person and Mirror Image spells prepared.",
      level: 3,
      sourceIndex: "beguiling-magic",
      sourceType: "subclass_feature",
      title: "Beguiling Magic",
    }),
    createSource({
      description:
        "You always have the Command spell prepared. As a Bonus Action, you cast Command without expending a spell slot.",
      level: 6,
      sourceIndex: "mantle-of-majesty",
      sourceType: "subclass_feature",
      title: "Mantle of Majesty",
    }),
    createSource({
      description:
        "You always have the Power Word Heal and Power Word Kill spells prepared.",
      level: 20,
      sourceIndex: "words-of-creation",
      sourceType: "class_feature",
      title: "Words of Creation",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource, 20);
  const charmPerson = spells.find((entry) => entry.title === "Charm Person");
  const mirrorImage = spells.find((entry) => entry.title === "Mirror Image");
  const command = spells.find((entry) => entry.title === "Command");
  const powerWordHeal = spells.find((entry) => entry.title === "Power Word Heal");
  const powerWordKill = spells.find((entry) => entry.title === "Power Word Kill");

  assert.equal(charmPerson?.kind, "always_prepared");
  assert.equal(charmPerson?.spellLevel, 1);

  assert.equal(mirrorImage?.kind, "always_prepared");
  assert.equal(mirrorImage?.spellLevel, 2);
  assert.match(mirrorImage?.description ?? "", /Three illusory duplicates/);

  assert.equal(command?.kind, "always_prepared");
  assert.equal(command?.spellLevel, 1);
  assert.match(command?.description ?? "", /one-word command/);

  assert.equal(powerWordHeal?.kind, "always_prepared");
  assert.equal(powerWordHeal?.spellLevel, 9);
  assert.equal(powerWordKill?.kind, "always_prepared");
  assert.equal(powerWordKill?.spellLevel, 9);
});

test("deriveSpellEntries adds War Domain spells at the required Cleric levels", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "Your connection to this divine domain ensures you always have certain spells ready.",
      level: 3,
      sourceIndex: "war-domain-spells",
      sourceType: "subclass_feature",
      title: "War Domain Spells",
    }),
  ];

  const level3Spells = deriveSpellEntries(activeSources, wizardClassSource, 3);
  const level9Spells = deriveSpellEntries(activeSources, wizardClassSource, 9);

  assert.ok(level3Spells.some((entry) => entry.title === "Guiding Bolt" && entry.spellLevel === 1));
  assert.ok(level3Spells.some((entry) => entry.title === "Spiritual Weapon" && entry.spellLevel === 2));
  assert.equal(
    level3Spells.some((entry) => entry.title === "Steel Wind Strike"),
    false,
    "level 9 domain spells should not appear before Cleric level 9",
  );

  assert.ok(level9Spells.some((entry) => entry.title === "Hold Monster" && entry.spellLevel === 5));
  assert.ok(level9Spells.some((entry) => entry.title === "Steel Wind Strike" && entry.spellLevel === 5));
});
