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
      sourceIndex: "life-domain-spells",
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

test("deriveSpellEntries splits always-prepared spell lists into concrete spell entries", () => {
  const activeSources: ResolvedFeatureSource[] = [
    createSource({
      description:
        "You always have Shield of Faith and Bless spells prepared, and they don't count against the number of spells you can prepare.",
      level: 1,
      sourceIndex: "life-domain-spells",
      sourceType: "subclass_feature",
      title: "Life Domain Spells",
    }),
  ];

  const spells = deriveSpellEntries(activeSources, wizardClassSource);

  assert.ok(spells.some((entry) => entry.title === "Shield of Faith"));
  assert.ok(spells.some((entry) => entry.title === "Bless"));
});
