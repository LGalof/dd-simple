import assert from "node:assert/strict";
import test from "node:test";
import { getActiveFeatureChoiceSources } from "./sources.js";
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
        choiceKey: "fighting-style",
        choiceLabel: "Fighting Style",
        selectedOptionIndex: "protection",
        selectedOptionName: "Protection",
        selectedRawJson: {
          description:
            "When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to impose Disadvantage on the attack roll. You must be holding a Shield to use this Reaction.",
        },
        sourceIndex: "fighter-fighting-style",
      }),
    ],
    1,
  );

  assert.deepEqual(sources, [
    {
      description:
        "When a creature you can see attacks a target other than you that is within 5 feet of you, you can take a Reaction to impose Disadvantage on the attack roll. You must be holding a Shield to use this Reaction.",
      level: 1,
      sourceIndex: "protection",
      sourceType: "class_feature",
      title: "Protection",
    },
  ]);
});
