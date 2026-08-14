import { describe, expect, it } from "vitest";
import type {
  ReferenceBackground,
  ReferenceClass,
  ReferenceRuleDocument,
  ReferenceSpecies,
} from "../../../types/reference";
import type { BackgroundOption, ClassOption, SpeciesOption } from "../types/characterBuilder";
import {
  mapBackgroundReferences,
  mapClassReferences,
  mapSpeciesReferences,
} from "./mapBuilderReferenceOptions";

describe("mapBuilderReferenceOptions", () => {
  it("returns fallback options when reference lists are empty", () => {
    const speciesFallback = [{ index: "human", name: "Human" }] as SpeciesOption[];
    const backgroundFallback = [{ index: "soldier", name: "Soldier" }] as BackgroundOption[];
    const classFallback = [{ index: "fighter", name: "Fighter" }] as ClassOption[];

    expect(mapSpeciesReferences([], [], speciesFallback)).toBe(speciesFallback);
    expect(mapBackgroundReferences([], [], backgroundFallback)).toBe(backgroundFallback);
    expect(mapClassReferences([], classFallback)).toBe(classFallback);
  });

  it("maps species traits, language choices, size options, and direct heritage records", () => {
    const species = {
      baseSpeed: 30,
      description: null,
      index: "dragonborn",
      name: "Dragonborn",
      size: null,
      sizeOptions: [{ id: "medium", size: "Medium", speciesIndex: "dragonborn" }],
      sourceJson: {
        language_options: {
          from: {
            options: [
              {
                item: {
                  index: "giant",
                  name: "Giant",
                  url: "/api/languages/giant",
                },
              },
            ],
          },
        },
        type: "Humanoid",
      },
      subspecies: [
        {
          index: "black-dragonborn",
          name: "Black Dragonborn",
          speciesIndex: "dragonborn",
          sourceJson: {
            damage_type: { name: "Acid" },
            traits: [
              { index: "breath-weapon-acid", name: "Acid Breath Weapon" },
              { index: "damage-resistance-acid", name: "Acid Resistance" },
            ],
          },
        },
      ],
      traits: [
        {
          id: "trait-1",
          name: "Draconic Ancestry",
          speciesIndex: "dragonborn",
          traitIndex: "draconic-ancestry",
          description: "Choose your dragon ancestor.   It shapes your breath weapon.",
        },
      ],
    } satisfies ReferenceSpecies;
    const traitDocuments: ReferenceRuleDocument[] = [
      {
        category: "traits",
        index: "breath-weapon-acid",
        name: "Acid Breath Weapon",
        sourceJson: { description: "Breathe acid in a line." },
      },
    ];

    const [mapped] = mapSpeciesReferences([species], [], [], traitDocuments);

    expect(mapped).toMatchObject({
      creatureType: "Humanoid",
      heritageOptions: [
        {
          breathWeaponTraitIndex: "breath-weapon-acid",
          damageType: "Acid",
          index: "black-dragonborn",
          resistanceTraitIndex: "damage-resistance-acid",
        },
      ],
      languages: ["Common", "Draconic"],
      size: "Medium",
      speed: 30,
      traits: ["Draconic Ancestry"],
    });
    expect(mapped.previewSections.find((section) => section.id === "dragonborn-heritage-choice")?.choiceFields?.[0]).toMatchObject({
      id: "heritage",
      label: "Dragon Heritage",
      options: [{ label: "Black Dragonborn", value: "black-dragonborn" }],
    });
    expect(mapped.previewSections.find((section) => section.id === "dragonborn-languages")?.choiceFields?.[0]).toMatchObject({
      id: "language",
      options: [{ label: "Giant", selectedOptionIndex: "giant" }],
    });
  });

  it("maps background grants, ability choices, proficiency choices, and magic initiate spell fields", () => {
    const background = {
      description: null,
      feature: "Magic Initiate",
      index: "acolyte",
      name: "Acolyte",
      proficiencies: [],
      skillProficiencies: [],
      sourceJson: {
        proficiency_choices: [
          {
            choose: 1,
            desc: "Choose one tool.",
            from: {
              options: [
                {
                  item: {
                    index: "calligrapher-supplies",
                    name: "Tool: Calligrapher's Supplies",
                    url: "/api/proficiencies/calligrapher-supplies",
                  },
                },
              ],
            },
          },
        ],
      },
      toolProficiencies: [],
      abilityOptions: [
        {
          abilityScore: { fullName: "Wisdom", index: "wis", name: "WIS" },
          abilityScoreIndex: "wis",
          backgroundIndex: "acolyte",
          id: "wis",
        },
        {
          abilityScore: { fullName: "Charisma", index: "cha", name: "CHA" },
          abilityScoreIndex: "cha",
          backgroundIndex: "acolyte",
          id: "cha",
        },
      ],
      featGrants: [
        {
          backgroundIndex: "acolyte",
          featIndex: "magic-initiate",
          id: "feat",
          sourceLabel: "Magic Initiate: Cleric",
        },
      ],
      proficiencyGrants: [
        {
          backgroundIndex: "acolyte",
          grantType: "SKILL",
          id: "skill",
          proficiencyIndex: "skill-insight",
          sourceLabel: "Skill: Insight",
        },
        {
          backgroundIndex: "acolyte",
          grantType: "TOOL",
          id: "tool",
          proficiencyIndex: "tool-calligrapher-supplies",
          sourceLabel: "Tool: Calligrapher's Supplies",
        },
      ],
    } satisfies ReferenceBackground;
    const featDocuments: ReferenceRuleDocument[] = [
      {
        category: "feats",
        index: "magic-initiate",
        name: "Magic Initiate",
        sourceJson: {
          description: "You learn two cantrips and one level 1 spell.",
          repeatable: "You can take this feat more than once.",
        },
      },
    ];

    const [mapped] = mapBackgroundReferences([background], featDocuments, []);

    expect(mapped).toMatchObject({
      feature: "Magic Initiate",
      proficiencies: ["Insight", "Calligrapher's Supplies"],
      skillProficiencies: ["Insight"],
      toolProficiencies: ["Calligrapher's Supplies", "Choose one tool."],
    });
    expect(mapped.previewSections.find((section) => section.id === "acolyte-origin-feat")?.choiceFields?.length).toBeGreaterThan(0);
    expect(mapped.previewSections.find((section) => section.id === "acolyte-ability-scores")?.choiceFields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "score-plan" }),
        expect.objectContaining({ id: "score-a" }),
        expect.objectContaining({ id: "score-b" }),
      ]),
    );
    expect(mapped.previewSections.find((section) => section.id === "acolyte-origin-proficiencies")?.choiceFields?.[0]).toMatchObject({
      label: "Tool proficiency",
      options: [{ label: "Calligrapher's Supplies", selectedOptionIndex: "calligrapher-supplies" }],
      sourceType: "BACKGROUND",
    });
  });

  it("maps class grants, skill choices, spellcasting summaries, features, and subclasses", () => {
    const fighter = {
      description: null,
      features: [
        {
          classIndex: "fighter",
          description: "You can push beyond your normal limits.",
          index: "action-surge",
          level: 2,
          name: "Action Surge",
        },
      ],
      hitDie: 10,
      index: "fighter",
      levels: [
        {
          classIndex: "fighter",
          id: "fighter-1",
          level: 1,
          sourceJson: {
            class_specific: { action_surges: 1 },
            spellcasting: { cantrips_known: 0 },
          },
        },
      ],
      name: "Fighter",
      primaryAbility: "Strength or Dexterity",
      proficiencyGrants: [
        {
          classIndex: "fighter",
          grantType: "ARMOR",
          id: "armor",
          proficiencyIndex: "heavy-armor",
          sourceLabel: "Armor: Heavy Armor",
        },
        {
          classIndex: "fighter",
          grantType: "SAVING_THROW",
          id: "save",
          proficiencyIndex: "saving-throw-str",
          sourceLabel: "Saving Throw: Strength",
        },
      ],
      skillChoices: [
        {
          chooseCount: 2,
          classIndex: "fighter",
          description: "Choose two skills.",
          id: "skills",
          options: [
            {
              choiceId: "skills",
              id: "athletics",
              proficiencyIndex: "skill-athletics",
              proficiency: { index: "skill-athletics", name: "Skill: Athletics", type: "SKILL" },
            },
          ],
        },
      ],
      sourceJson: {
        subclasses: [{ index: "champion", name: "Champion" }],
        spellcasting: {
          info: [{ desc: ["Use Intelligence for spellcasting."], name: "Spellcasting Ability" }],
          spellcasting_ability: { index: "int", name: "Intelligence" },
        },
      },
    } satisfies ReferenceClass;
    const subclassDocuments: ReferenceRuleDocument[] = [
      {
        category: "subclasses",
        index: "champion",
        name: "Champion",
        sourceJson: {
          class: { index: "fighter" },
          desc: ["A peerless athlete and warrior."],
          features: [{ level: 3, name: "Improved Critical" }],
        },
      },
    ];
    const featureDocuments: ReferenceRuleDocument[] = [
      {
        category: "features",
        index: "improved-critical",
        name: "Improved Critical",
        sourceJson: {
          class: { index: "fighter" },
          desc: ["Your attacks score critical hits more often."],
          level: 3,
          subclass: { index: "champion" },
        },
      },
    ];

    const [mapped] = mapClassReferences([fighter], [], [], featureDocuments, subclassDocuments);

    expect(mapped).toMatchObject({
      hitDie: 10,
      primaryAbility: "Unknown",
      proficiencies: { armor: ["Armor: Heavy Armor"] },
      savingThrows: ["Strength"],
      skillChoices: { choose: 2, options: ["Athletics"] },
    });
    expect(mapped.spellcasting).toMatchObject({
      abilityIndex: "int",
      abilityName: "Intelligence",
      source: "reference",
    });
    expect(mapped.features).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "action-surge", level: 2, title: "Action Surge" }),
      ]),
    );
    expect(mapped.subclasses?.[0]).toMatchObject({
      index: "champion",
      name: "Champion",
      features: [expect.objectContaining({ level: 3, name: "Improved Critical" })],
    });
  });
});
