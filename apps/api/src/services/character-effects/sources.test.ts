import assert from "node:assert/strict";
import test from "node:test";
import {
  getActiveFeatureChoiceSources,
  getActiveClassFeatureIndexes,
  getActiveSpeciesTraitIndexes,
  getSelectedFeatIndexes,
  isSubclassDocumentForClass,
  isSubspeciesDocumentForSpecies,
  mergeFeatureChoiceRecords,
  resolveClassFeatureSources,
  resolveFeatSources,
  resolveSelectedSubclassIndex,
  resolveSelectedSubspeciesIndex,
  resolveSpeciesTraitSources,
} from "./sources.js";
import type {
  CharacterChoiceRecord,
  CharacterFeatureChoiceRecord,
  RuleDocumentRecord,
} from "./types.js";

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

function document(
  index: string,
  sourceJson: unknown,
  name: string | null = null,
): RuleDocumentRecord {
  return {
    index,
    name,
    sourceJson,
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

test("resolveClassFeatureSources filters generic subclass choices and adds subclass fallbacks", () => {
  const sources = resolveClassFeatureSources(
    [
      "spellcasting",
      "wizard-subclass-feature-3",
      "arcane-ward",
      "foreign-feature",
      "subclass-choice",
    ],
    [
      document("spellcasting", {
        class: { index: "wizard" },
        desc: ["You can cast prepared Wizard spells."],
        level: 1,
        name: "Spellcasting",
      }),
      document("wizard-subclass-feature-3", {
        class: { index: "wizard" },
        desc: ["Choose your Wizard subclass."],
        feature_specific: { type: "subclass" },
        level: 3,
        name: "Wizard Subclass",
      }),
      document("arcane-ward", {
        class: { index: "wizard" },
        desc: ["You can magically ward yourself."],
        level: 3,
        name: "Arcane Ward",
        subclass: { index: "abjurer" },
      }),
      document("foreign-feature", {
        class: { index: "rogue" },
        desc: ["Not for this class."],
        level: 1,
        name: "Sneak Attack",
      }),
    ],
    "wizard",
    6,
    document("abjurer", {
      class: { index: "wizard" },
      features: [
        {
          description: "You learn the abjurer tradition.",
          level: 3,
          name: "Arcane Ward",
        },
        {
          description: "Future feature.",
          level: 10,
          name: "Improved Abjuration",
        },
        {
          description: "Fallback feature description.",
          level: 6,
          name: "Projected Ward",
        },
      ],
      name: "Abjurer",
    }),
  );

  assert.deepEqual(
    sources.map((source) => [source.sourceIndex, source.sourceType, source.title]),
    [
      ["spellcasting", "class_feature", "Spellcasting"],
      ["arcane-ward", "subclass_feature", "Arcane Ward"],
      ["abjurer:projected-ward:6", "subclass_feature", "Projected Ward"],
    ],
  );
});

test("resolveSpeciesTraitSources infers trait levels and filters future traits", () => {
  const sources = resolveSpeciesTraitSources(
    [
      document("darkvision", {
        desc: ["You have Darkvision within 60 feet."],
        name: "Darkvision",
      }),
      document("flight", {
        description: "When you reach character level 5, you gain a Fly Speed.",
        name: "Flight",
      }),
      document("future-flight", {
        description: "When you reach character level 9, you gain a Fly Speed.",
        name: "Future Flight",
      }),
    ],
    5,
  );

  assert.deepEqual(
    sources.map((source) => [source.sourceIndex, source.level]),
    [
      ["flight", 5],
      ["darkvision", null],
    ],
  );
});

test("resolveFeatSources includes selected feat documents and passive fallback feats", () => {
  const sources = resolveFeatSources(
    ["alert", "tough", "missing"],
    [
      document("alert", {
        desc: ["You gain a bonus to Initiative."],
        name: "Alert",
      }),
    ],
    new Set(["tough"]),
  );

  assert.deepEqual(
    sources.map((source) => [source.sourceIndex, source.title, source.description]),
    [
      ["alert", "Alert", "You gain a bonus to Initiative."],
      ["tough", "Tough", ""],
    ],
  );
});

test("class, feat, subclass, and subspecies selection helpers normalize active indexes", () => {
  const levelDocuments = [
    document("wizard-1", {
      class: { index: "wizard" },
      features: [{ index: "spellcasting" }, { index: "arcane-recovery" }],
      level: 1,
    }),
    document("wizard-2", {
      class: { index: "wizard" },
      features: [{ index: "arcane-recovery" }, { index: "scholar" }],
      level: 2,
    }),
    document("rogue-1", {
      class: { index: "rogue" },
      features: [{ index: "sneak-attack" }],
      level: 1,
    }),
  ];
  const choices: CharacterChoiceRecord[] = [
    {
      choiceType: "class-feature-choice",
      selectedIndex: "abjurer",
      selectedType: "reference",
      sourceIndex: "wizard-subclass",
      sourceType: "class-feature",
    },
    {
      choiceType: "class-feature-choice",
      selectedIndex: "alert",
      selectedType: "reference",
      sourceIndex: "wizard-feat",
      sourceType: "class-feature",
    },
    {
      choiceType: "species-heritage-choice",
      selectedIndex: "high-elf",
      selectedType: "subspecies",
      sourceIndex: "elf:lineage",
      sourceType: "species",
    },
  ];
  const persistedChoice = createFeatureChoice({
    choicePath: "feat-choice",
    selectedOptionIndex: "tough",
    selectedOptionType: "reference",
    selectedOptionUrl: "/api/2014/feats/tough",
  });
  const previewChoice = createFeatureChoice({
    choicePath: "feat-choice",
    selectedOptionName: "Keen Mind",
    selectedOptionType: "reference",
    selectedOptionUrl: "/api/2014/feats/keen-mind",
  });

  assert.deepEqual(getActiveClassFeatureIndexes(levelDocuments, "wizard", 2), [
    "spellcasting",
    "arcane-recovery",
    "scholar",
  ]);
  assert.deepEqual(
    getSelectedFeatIndexes(
      choices,
      mergeFeatureChoiceRecords([persistedChoice], [previewChoice]),
      new Set(["abjurer"]),
      ["lucky"],
      ["skilled"],
    ).sort(),
    ["alert", "keen-mind", "lucky", "skilled"].sort(),
  );
  assert.equal(resolveSelectedSubclassIndex(new Set(["abjurer"]), choices, undefined), "abjurer");
  assert.equal(resolveSelectedSubclassIndex(new Set(["abjurer"]), choices, "champion"), "abjurer");
  assert.equal(resolveSelectedSubclassIndex(new Set(["abjurer"]), choices, "abjurer"), "abjurer");
  assert.equal(resolveSelectedSubspeciesIndex("elf", choices, undefined), "high-elf");
  assert.equal(resolveSelectedSubspeciesIndex("elf", choices, "wood-elf"), "wood-elf");
});

test("subclass and subspecies document guards validate parent indexes", () => {
  assert.equal(
    isSubclassDocumentForClass(
      document("abjurer", { class: { index: "wizard" } }),
      "wizard",
    ),
    true,
  );
  assert.equal(
    isSubclassDocumentForClass(
      document("thief", { class: { index: "rogue" } }),
      "wizard",
    ),
    false,
  );
  assert.equal(
    isSubspeciesDocumentForSpecies(
      document("high-elf", { species: { index: "elf" } }),
      "elf",
    ),
    true,
  );
  assert.equal(isSubspeciesDocumentForSpecies(null, "elf"), false);
});
