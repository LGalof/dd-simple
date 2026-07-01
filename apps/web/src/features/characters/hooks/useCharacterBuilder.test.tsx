import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AbilityScoreKey } from "@dd-simple/shared";
import type { Character, CharacterFeatureChoiceSelection } from "../../../types/character";
import type { ReferenceBackground, ReferenceClass, ReferenceSpecies } from "../../../types/reference";
import type { BackgroundOption, ClassOption } from "../types/characterBuilder";
import { buildCharacterSavePayload } from "../../../pages/CharacterDashboardPage";
import { useCharacterBuilder } from "./useCharacterBuilder";

const referenceMocks = vi.hoisted(() => ({
  fetchBackgrounds: vi.fn(),
  fetchClasses: vi.fn(),
  fetchRuleDocuments: vi.fn(),
  fetchSpecies: vi.fn(),
}));

vi.mock("../../references/api/fetchReferences", () => ({
  fetchBackgrounds: referenceMocks.fetchBackgrounds,
  fetchClasses: referenceMocks.fetchClasses,
  fetchRuleDocuments: referenceMocks.fetchRuleDocuments,
  fetchSpecies: referenceMocks.fetchSpecies,
}));

function BuilderHarness({ character }: { character: Character }) {
  const builder = useCharacterBuilder(character);

  return (
    <div>
      <span data-testid="current-hp">{builder.builderState?.currentHp ?? ""}</span>
      <span data-testid="class-index">{builder.builderState?.classIndex ?? ""}</span>
      <span data-testid="background-index">{builder.builderState?.backgroundIndex ?? ""}</span>
      <span data-testid="species-choices">{JSON.stringify(builder.speciesChoices)}</span>
      <span data-testid="background-choices">{JSON.stringify(builder.backgroundChoices)}</span>
      <span data-testid="feature-choices">{JSON.stringify(builder.featureChoices)}</span>
      <button
        type="button"
        onClick={() => builder.applyCurrentHpAdjustment("damage", 3)}
      >
        Damage
      </button>
    </div>
  );
}

function createCharacter(overrides: Partial<Character> = {}): Character {
  return {
    abilityScores: createAbilityScores({
      cha: 10,
      con: 10,
      dex: 10,
      int: 10,
      str: 10,
      wis: 10,
    }),
    alignment: null,
    armorClass: 10,
    background: {
      name: "Acolyte",
    },
    backgroundIndex: "acolyte",
    choices: [],
    class: {
      name: "Fighter",
    },
    classIndex: "fighter",
    conditions: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    currentHp: 10,
    diceRolls: [],
    experiencePoints: 0,
    featureChoices: [],
    hitPointState: {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: [10],
      tempHp: 0,
    },
    id: "character-1",
    inventory: [],
    languages: [],
    level: 1,
    maxHp: 10,
    name: "Refresh Guard",
    proficiencies: [],
    skills: [],
    species: {
      name: "Human",
    },
    speciesIndex: "human",
    speed: 30,
    subclassIndex: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    userId: "user-1",
    ...overrides,
  };
}

function createAbilityScores(scores: Record<AbilityScoreKey, number>) {
  return Object.entries(scores).map(([abilityIndex, score]) => ({
    ability: {
      index: abilityIndex,
      fullName: abilityIndex.toUpperCase(),
      name: abilityIndex.toUpperCase(),
    },
    abilityIndex,
    baseScore: score,
    score,
  }));
}

describe("useCharacterBuilder", () => {
  beforeEach(() => {
    referenceMocks.fetchBackgrounds.mockResolvedValue([]);
    referenceMocks.fetchClasses.mockResolvedValue([]);
    referenceMocks.fetchRuleDocuments.mockResolvedValue([]);
    referenceMocks.fetchSpecies.mockResolvedValue([]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("keeps unsaved local builder edits when the same character refreshes from stale server data", () => {
    const { rerender } = render(<BuilderHarness character={createCharacter()} />);

    expect(screen.getByTestId("current-hp").textContent).toBe("10");

    act(() => {
      screen.getByRole("button", { name: "Damage" }).click();
    });

    expect(screen.getByTestId("current-hp").textContent).toBe("7");

    rerender(
      <BuilderHarness
        character={createCharacter({
          currentHp: 10,
          updatedAt: "2026-01-01T00:00:01.000Z",
        })}
      />,
    );

    expect(screen.getByTestId("current-hp").textContent).toBe("7");
  });

  it("rehydrates saved species heritage and background choices after reference data loads", async () => {
    referenceMocks.fetchSpecies.mockResolvedValue([createElfReference()]);
    referenceMocks.fetchBackgrounds.mockResolvedValue([createSageReference()]);

    render(
      <BuilderHarness
        character={createCharacter({
          background: {
            name: "Sage",
          },
          backgroundIndex: "sage",
          choices: [
            {
              choiceType: "species-heritage-choice",
              sourceType: "species",
              sourceIndex: "elf:elf-heritage-choice:heritage",
              selectedType: "subspecies",
              selectedIndex: "drow",
            },
            {
              choiceType: "background-ability-plan",
              sourceType: "background",
              sourceIndex: "sage:sage-ability-scores:score-plan",
              selectedType: "ability-plan",
              selectedIndex: "increase-two-scores-2-1",
            },
            {
              choiceType: "background-ability-score-choice",
              sourceType: "background",
              sourceIndex: "sage:sage-ability-scores:score-a",
              selectedType: "ability-score",
              selectedIndex: "con",
            },
            {
              choiceType: "background-ability-score-choice",
              sourceType: "background",
              sourceIndex: "sage:sage-ability-scores:score-b",
              selectedType: "ability-score",
              selectedIndex: "int",
            },
          ],
          species: {
            name: "Elf",
          },
          speciesIndex: "elf",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("species-choices").textContent).toContain(
        "\"elf:elf-heritage-choice:heritage\":\"drow\"",
      );
      expect(screen.getByTestId("background-index").textContent).toBe("sage");
      expect(screen.getByTestId("background-choices").textContent).toContain(
        "\"sage:sage-ability-scores:score-plan\":\"increase-two-scores-2-1\"",
      );
      expect(screen.getByTestId("background-choices").textContent).toContain(
        "\"sage:sage-ability-scores:score-a\":\"constitution-score\"",
      );
      expect(screen.getByTestId("background-choices").textContent).toContain(
        "\"sage:sage-ability-scores:score-b\":\"intelligence-score\"",
      );
    });
  });

  it("rehydrates saved Soldier origin proficiency choices after reference data loads", async () => {
    referenceMocks.fetchBackgrounds.mockResolvedValue([createSoldierReference()]);

    render(
      <BuilderHarness
        character={createCharacter({
          background: {
            name: "Soldier",
          },
          backgroundIndex: "soldier",
          featureChoices: [
            createBackgroundFeatureSelection({
              choiceKey: "soldier-gaming-set",
              choicePath: "proficiency_choices[0]",
              selectedOptionIndex: "tool-dice",
              selectedOptionName: "Tool: Dice",
              sourceIndex: "soldier",
            }),
          ],
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("background-index").textContent).toBe("soldier");
      expect(screen.getByTestId("background-choices").textContent).toContain(
        "\"soldier:soldier-origin-proficiencies:soldier-gaming-set\":\"tool-dice\"",
      );
    });
  });

  it("keeps saved background subchoices in the next payload after an unrelated HP edit", () => {
    const soldierChoice = createBackgroundFeatureSelection({
      choiceKey: "soldier-gaming-set",
      choicePath: "proficiency_choices[0]",
      selectedOptionIndex: "tool-dice",
      selectedOptionName: "Tool: Dice",
      sourceIndex: "soldier",
    });
    const character = createCharacter({
      background: {
        name: "Soldier",
      },
      backgroundIndex: "soldier",
      featureChoices: [soldierChoice],
    });
    const payload = buildCharacterSavePayload(
      character,
      {
        abilityAssignments: character.abilityScores.map((abilityScore, index) => ({
          abilityIndex: abilityScore.abilityIndex,
          dice: [],
          id: `slot-${index + 1}`,
          score: abilityScore.baseScore ?? abilityScore.score,
        })),
        backgroundChoices: {},
        backgroundIndex: "soldier",
        classIndex: "fighter",
        currentHp: 7,
        hitPointSettings: {
          bonusHp: 0,
          calculationMode: "fixed",
          overrideMaxHp: null,
          rolledHitPoints: [10],
        },
        level: 1,
        speciesChoices: {},
        speciesIndex: "human",
        subclassIndex: null,
        tempHp: 0,
      },
      createClassOption("fighter"),
      createSoldierBackgroundOption(),
      [],
      [],
      {},
      {},
      {},
    );

    expect(payload.currentHp).toBe(7);
    expect(payload.featureChoices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          choiceKey: "soldier-gaming-set",
          selectedOptionIndex: "tool-dice",
          sourceIndex: "soldier",
          sourceType: "BACKGROUND",
        }),
      ]),
    );
  });

  it("keeps saved Sage ability choices in the next payload after an unrelated HP edit", () => {
    const character = createCharacter({
      background: {
        name: "Sage",
      },
      backgroundIndex: "sage",
      choices: [
        {
          choiceType: "background-ability-plan",
          sourceType: "background",
          sourceIndex: "sage:sage-ability-scores:score-plan",
          selectedType: "ability-plan",
          selectedIndex: "increase-two-scores-2-1",
        },
        {
          choiceType: "background-ability-score-choice",
          sourceType: "background",
          sourceIndex: "sage:sage-ability-scores:score-a",
          selectedType: "ability-score",
          selectedIndex: "con",
        },
        {
          choiceType: "background-ability-score-choice",
          sourceType: "background",
          sourceIndex: "sage:sage-ability-scores:score-b",
          selectedType: "ability-score",
          selectedIndex: "int",
        },
      ],
    });
    const payload = buildCharacterSavePayload(
      character,
      {
        abilityAssignments: character.abilityScores.map((abilityScore, index) => ({
          abilityIndex: abilityScore.abilityIndex,
          dice: [],
          id: `slot-${index + 1}`,
          score: abilityScore.baseScore ?? abilityScore.score,
        })),
        backgroundChoices: {},
        backgroundIndex: "sage",
        classIndex: "fighter",
        currentHp: 6,
        hitPointSettings: {
          bonusHp: 0,
          calculationMode: "fixed",
          overrideMaxHp: null,
          rolledHitPoints: [10],
        },
        level: 1,
        speciesChoices: {},
        speciesIndex: "human",
        subclassIndex: null,
        tempHp: 0,
      },
      createClassOption("fighter"),
      createSageBackgroundOption(),
      [],
      [],
      {},
      {},
      {},
    );

    expect(payload.currentHp).toBe(6);
    expect(payload.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          choiceType: "background-ability-plan",
          selectedIndex: "increase-two-scores-2-1",
          sourceIndex: "sage:sage-ability-scores:score-plan",
        }),
        expect.objectContaining({
          choiceType: "background-ability-score-choice",
          selectedIndex: "con",
          sourceIndex: "sage:sage-ability-scores:score-a",
        }),
        expect.objectContaining({
          choiceType: "background-ability-score-choice",
          selectedIndex: "int",
          sourceIndex: "sage:sage-ability-scores:score-b",
        }),
      ]),
    );
  });

  it("rehydrates a saved class that is not present in the built-in fallback options", async () => {
    referenceMocks.fetchClasses.mockResolvedValue([createSorcererReference()]);

    render(
      <BuilderHarness
        character={createCharacter({
          class: {
            name: "Sorcerer",
          },
          classIndex: "sorcerer",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("class-index").textContent).toBe("sorcerer");
    });
  });
});

function createElfReference(): ReferenceSpecies {
  return {
    baseSpeed: 30,
    description: "Elf",
    index: "elf",
    name: "Elf",
    size: "Medium",
    sourceJson: {
      index: "elf",
      name: "Elf",
    },
    subspecies: [
      {
        index: "drow",
        name: "Drow",
        speciesIndex: "elf",
        sourceJson: {
          index: "drow",
          name: "Drow",
          species: {
            index: "elf",
          },
        },
      },
    ],
  };
}

function createSageReference(): ReferenceBackground {
  return {
    abilityOptions: [
      createBackgroundAbilityOption("int", "Intelligence"),
      createBackgroundAbilityOption("con", "Constitution"),
      createBackgroundAbilityOption("wis", "Wisdom"),
    ],
    description: "Sage",
    feature: "Magic Initiate",
    index: "sage",
    name: "Sage",
    proficiencies: [],
  };
}

function createSoldierReference(): ReferenceBackground {
  return {
    abilityOptions: [
      createBackgroundAbilityOption("str", "Strength", "soldier"),
      createBackgroundAbilityOption("dex", "Dexterity", "soldier"),
      createBackgroundAbilityOption("con", "Constitution", "soldier"),
    ],
    description: "Soldier",
    feature: "Savage Attacker",
    index: "soldier",
    name: "Soldier",
    proficiencies: [],
    sourceJson: {
      proficiency_choices: [
        {
          choose: 1,
          desc: "Choose one gaming set.",
          id: "soldier-gaming-set",
          label: "Gaming Set",
          type: "proficiencies",
          from: {
            options: [
              {
                option_type: "reference",
                item: {
                  index: "tool-dice",
                  name: "Tool: Dice",
                  url: "/api/2024/proficiencies/tool-dice",
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function createBackgroundAbilityOption(
  index: AbilityScoreKey,
  fullName: string,
  backgroundIndex = "sage",
) {
  return {
    abilityScore: {
      fullName,
      index,
      name: fullName,
    },
    abilityScoreIndex: index,
    backgroundIndex,
    id: `${backgroundIndex}-${index}`,
  };
}

function createSorcererReference(): ReferenceClass {
  return {
    description: "Sorcerer",
    hitDie: 6,
    index: "sorcerer",
    name: "Sorcerer",
    primaryAbilities: [
      {
        abilityScore: {
          fullName: "Charisma",
          index: "cha",
          name: "Charisma",
        },
        abilityScoreIndex: "cha",
        classIndex: "sorcerer",
        id: "sorcerer-cha",
      },
    ],
    sourceJson: {
      hit_die: 6,
      index: "sorcerer",
      name: "Sorcerer",
    },
  };
}

function createBackgroundFeatureSelection({
  choiceKey,
  choicePath,
  selectedOptionIndex,
  selectedOptionName,
  sourceIndex,
}: {
  choiceKey: string;
  choicePath: string;
  selectedOptionIndex: string;
  selectedOptionName: string;
  sourceIndex: string;
}): CharacterFeatureChoiceSelection {
  return {
    choiceKey,
    choiceLabel: choiceKey,
    choicePath,
    classIndex: null,
    featureIndex: null,
    level: null,
    selectedOptionIndex,
    selectedOptionName,
    selectedOptionType: "reference",
    selectedOptionUrl: null,
    selectedRawJson: {
      item: {
        index: selectedOptionIndex,
        name: selectedOptionName,
      },
    },
    sourceIndex,
    sourceType: "BACKGROUND",
    subclassIndex: null,
  };
}

function createClassOption(index: string): ClassOption {
  return {
    description: index,
    features: [],
    hitDie: 10,
    index,
    name: index,
    previewOverview: [],
    primaryAbility: "STR",
    proficiencies: {
      armor: [],
      tools: [],
      weapons: [],
    },
    savingThrows: [],
    skillChoices: {
      choose: 0,
      options: [],
    },
    startingEquipment: [],
  };
}

function createSoldierBackgroundOption(): BackgroundOption {
  return {
    description: "Soldier",
    feature: "Savage Attacker",
    index: "soldier",
    name: "Soldier",
    proficiencies: [],
    skillProficiencies: [],
    toolProficiencies: [],
    previewSections: [
      {
        details: [],
        id: "soldier-origin-proficiencies",
        subtitle: "1 choice",
        title: "Origin Proficiencies",
        choiceFields: [
          {
            choiceGroupId: "soldier-gaming-set",
            choiceGroupLabel: "Gaming Set",
            choiceGroupLimit: 1,
            choiceKey: "soldier-gaming-set",
            choiceKind: "tool-proficiency",
            choiceLabel: "Gaming Set",
            choicePath: "proficiency_choices[0]",
            id: "soldier-gaming-set",
            label: "Gaming Set",
            options: [
              {
                label: "Dice",
                selectedOptionIndex: "tool-dice",
                selectedOptionName: "Tool: Dice",
                selectedOptionType: "reference",
                value: "tool-dice",
              },
            ],
            sourceIndex: "soldier",
            sourceType: "BACKGROUND",
          },
        ],
      },
    ],
  };
}

function createSageBackgroundOption(): BackgroundOption {
  return {
    description: "Sage",
    feature: "Magic Initiate",
    index: "sage",
    name: "Sage",
    proficiencies: [],
    skillProficiencies: [],
    toolProficiencies: [],
    previewSections: [
      {
        details: [],
        id: "sage-ability-scores",
        subtitle: "3 Choices",
        title: "Ability Scores",
        choiceFields: [],
      },
    ],
  };
}
