import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveFeatureChoiceSources,
  getActiveSpeciesTraitIndexes,
} from "./sources.js";
import type { CharacterFeatureChoiceRecord } from "./types.js";

function createFeatureChoice(
  overrides: Partial<CharacterFeatureChoiceRecord>,
): CharacterFeatureChoiceRecord {
  return {
    classIndex: "wizard",
    choiceKey: null,
    choiceLabel: null,
    choicePath: "feature_specific.slot1",
    featureIndex: null,
    grantsRawJson: null,
    level: 1,
    selectedOptionIndex: null,
    selectedOptionName: null,
    selectedOptionType: "reference",
    selectedOptionUrl: null,
    sourceIndex: "test-choice",
    sourceType: "FEATURE",
    subclassIndex: null,
    ...overrides,
  };
}

test("getActiveFeatureChoiceSources reads derived sources from grantsRawJson", () => {
  const sources = getActiveFeatureChoiceSources(
    [
      createFeatureChoice({
        grantsRawJson: {
          derivedSources: [
            {
              description:
                "You learn or gain access to the spell Magic Missile through Spellbook Additions.",
              level: 2,
              sourceIndex: "magic-missile",
              sourceType: "class_feature",
              title: "Magic Missile",
            },
          ],
        },
        level: 2,
        selectedOptionIndex: "magic-missile",
        selectedOptionName: "Magic Missile",
        sourceIndex: "wizard-spellbook-2",
      }),
    ],
    2,
  );

  assert.deepEqual(sources, [
    {
      description:
        "You learn or gain access to the spell Magic Missile through Spellbook Additions.",
      level: 2,
      sourceIndex: "magic-missile",
      sourceType: "class_feature",
      title: "Magic Missile",
    },
  ]);
});

test("getActiveFeatureChoiceSources ignores ability score improvement bookkeeping entries", () => {
  const sources = getActiveFeatureChoiceSources(
    [
      createFeatureChoice({
        choiceKey: "asi-score-1",
        choiceLabel: "Ability Score 1",
        selectedOptionIndex: "strength",
        selectedOptionName: "Strength",
        sourceIndex: "wizard-ability-score-improvement-1",
      }),
      createFeatureChoice({
        choiceKey: "feat-ability-choice",
        choiceLabel: "Feat Ability Choice",
        selectedOptionIndex: "wisdom",
        selectedOptionName: "Wisdom",
        sourceIndex: "wizard-ability-score-improvement-1",
      }),
    ],
    4,
  );

  assert.deepEqual(sources, []);
});

test("getActiveFeatureChoiceSources ignores future-level choice grants", () => {
  const sources = getActiveFeatureChoiceSources(
    [
      createFeatureChoice({
        grantsRawJson: {
          derivedSources: [
            {
              description: "Future spell",
              level: 5,
              sourceIndex: "future-spell",
              sourceType: "class_feature",
              title: "Future Spell",
            },
          ],
        },
        level: 5,
        selectedOptionIndex: "future-spell",
        selectedOptionName: "Future Spell",
      }),
    ],
    4,
  );

  assert.deepEqual(sources, []);
});

test("getActiveFeatureChoiceSources falls back to selectedRawJson descriptions when grants are absent", () => {
  const sources = getActiveFeatureChoiceSources(
    [
      createFeatureChoice({
        choiceKey: "weapon-mastery",
        choiceLabel: "Weapon Mastery",
        selectedOptionIndex: "vex",
        selectedOptionName: "Vex",
        selectedRawJson: {
          description:
            "If you hit a creature with this weapon and deal damage to it, you have Advantage on your next attack roll against that creature before the end of your next turn.",
        },
        sourceIndex: "rogue-weapon-mastery",
      }),
    ],
    1,
  );

  assert.deepEqual(sources, [
    {
      description:
        "If you hit a creature with this weapon and deal damage to it, you have Advantage on your next attack roll against that creature before the end of your next turn.",
      level: 1,
      sourceIndex: "vex",
      sourceType: "class_feature",
      title: "Vex",
    },
  ]);
});

test("getActiveFeatureChoiceSources marks the Magic Initiate level 1 spell for free-cast tracking", () => {
  const sources = getActiveFeatureChoiceSources(
    [
      createFeatureChoice({
        choiceKey: "magic-initiate-spell-1",
        choiceLabel: "Magic Initiate Level 1 Spell",
        choicePath: "magic-initiate.spell-1",
        selectedOptionIndex: "cure-wounds",
        selectedOptionName: "Cure Wounds",
        sourceIndex: "magic-initiate",
      }),
    ],
    1,
  );

  assert.equal(sources[0]?.sourceIndex, "magic-initiate-free-cast:cure-wounds");
});

test("getActiveSpeciesTraitIndexes keeps only selected lineage trait branches", () => {
  const activeTraitIndexes = getActiveSpeciesTraitIndexes(
    [
      "darkvision",
      "fiendish-legacy",
      "fiendish-legacy-abyssal",
      "fiendish-legacy-chthonic",
      "fiendish-spell-ray-of-sickness",
      "fiendish-spell-false-life",
      "fiendish-spell-ray-of-enfeeblement",
    ],
    {
      traits: [
        { index: "fiendish-legacy-chthonic" },
        { index: "fiendish-spell-false-life" },
        { index: "fiendish-spell-ray-of-enfeeblement" },
      ],
    },
    "tiefling",
  );

  assert.deepEqual(activeTraitIndexes.sort(), [
    "darkvision",
    "fiendish-legacy-chthonic",
    "fiendish-spell-false-life",
    "fiendish-spell-ray-of-enfeeblement",
  ].sort());
});

test("getActiveSpeciesTraitIndexes does not activate unselected elf and gnome lineages", () => {
  const activeTraitIndexes = getActiveSpeciesTraitIndexes(
    [
      "elven-lineage",
      "lineage-spell-dancing-lights",
      "lineage-spell-faerie-fire",
      "wood-elf-speed-increase",
    ],
    {
      traits: [
        { index: "wood-elf-speed-increase" },
        { index: "lineage-spell-druidcraft" },
        { index: "lineage-spell-longstrider" },
      ],
    },
    "elf",
  );

  assert.deepEqual(activeTraitIndexes.sort(), [
    "lineage-spell-druidcraft",
    "lineage-spell-longstrider",
    "wood-elf-speed-increase",
  ].sort());
});

test("getActiveSpeciesTraitIndexes keeps only the selected Dragonborn damage type", () => {
  const activeTraitIndexes = getActiveSpeciesTraitIndexes(
    [
      "darkvision-60",
      "draconic-flight",
      "draconic-breath-weapon-acid",
      "draconic-breath-weapon-cold",
      "draconic-breath-weapon-fire",
      "draconic-breath-weapon-lightning",
      "draconic-breath-weapon-poison",
    ],
    {
      traits: [
        { index: "draconic-breath-weapon-fire" },
        { index: "draconic-damage-resistance-fire" },
      ],
    },
    "dragonborn",
  );

  assert.deepEqual(activeTraitIndexes.sort(), [
    "darkvision-60",
    "draconic-breath-weapon-fire",
    "draconic-damage-resistance-fire",
    "draconic-flight",
  ].sort());
});

test("getActiveSpeciesTraitIndexes replaces generic Gnome and Goliath choice wrappers", () => {
  assert.deepEqual(
    getActiveSpeciesTraitIndexes(
      ["darkvision-60", "gnomish-cunning", "gnomish-lineage"],
      { traits: [{ index: "gnomish-lineage-forest-gnome" }] },
      "gnome",
    ).sort(),
    ["darkvision-60", "gnomish-cunning", "gnomish-lineage-forest-gnome"].sort(),
  );

  assert.deepEqual(
    getActiveSpeciesTraitIndexes(
      ["giant-ancestry", "large-form", "powerful-build"],
      { traits: [{ index: "giant-ancestry-stones-endurance" }] },
      "goliath",
    ).sort(),
    ["giant-ancestry-stones-endurance", "large-form", "powerful-build"].sort(),
  );
});

test("getActiveSpeciesTraitIndexes preserves base Darkvision for Dwarf and Orc", () => {
  assert.deepEqual(
    getActiveSpeciesTraitIndexes(
      ["darkvision-120", "dwarven-resilience"],
      null,
      "dwarf",
    ),
    ["darkvision-120", "dwarven-resilience"],
  );
  assert.deepEqual(
    getActiveSpeciesTraitIndexes(
      ["adrenaline-rush", "darkvision-120", "relentless-endurance"],
      null,
      "orc",
    ),
    ["adrenaline-rush", "darkvision-120", "relentless-endurance"],
  );
});
