import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AbilityScoreKey } from "@dd-simple/shared";
import type { Character, CharacterFeatureChoiceSelection } from "../../../types/character";
import type { ReferenceBackground, ReferenceClass, ReferenceSpecies } from "../../../types/reference";
import type {
  BackgroundOption,
  CharacterBuilderState,
  ClassOption,
  FeatureChoiceSelections,
  SpeciesOption,
} from "../types/characterBuilder";
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

function BuilderHarness({ character }: { character?: Character }) {
  const builder = useCharacterBuilder(character);

  return (
    <div>
      <span data-testid="current-hp">{builder.builderState?.currentHp ?? ""}</span>
      <span data-testid="class-index">{builder.builderState?.classIndex ?? ""}</span>
      <span data-testid="selected-class-index">{builder.selectedClass?.index ?? ""}</span>
      <span data-testid="preview-class-name">{builder.previewCharacter?.class.name ?? ""}</span>
      <span data-testid="species-index">{builder.builderState?.speciesIndex ?? ""}</span>
      <span data-testid="selected-species-index">{builder.selectedSpecies?.index ?? ""}</span>
      <span data-testid="preview-species-name">{builder.previewCharacter?.species.name ?? ""}</span>
      <span data-testid="background-index">{builder.builderState?.backgroundIndex ?? ""}</span>
      <span data-testid="selected-background-index">{builder.selectedBackground?.index ?? ""}</span>
      <span data-testid="preview-background-name">{builder.previewCharacter?.background.name ?? ""}</span>
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
      name: "Rogue",
    },
    classIndex: "rogue",
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

const characterBuilderDraftStoragePrefix = "dd-simple.characterBuilderDraft";

type PersistedCharacterBuilderDraft = {
  baseCharacterUpdatedAt: string | null;
  builderState: CharacterBuilderState;
  dirty: boolean;
  featureChoices: FeatureChoiceSelections;
  updatedAt: string;
  version: 2;
};

function createDraftBuilderState(
  overrides: Partial<CharacterBuilderState> = {},
): CharacterBuilderState {
  return {
    abilityAssignments: ["str", "dex", "con", "int", "wis", "cha"].map(
      (abilityIndex, index) => ({
        abilityIndex,
        dice: [],
        id: `slot-${index + 1}`,
        score: 10,
      }),
    ),
    backgroundChoices: {},
    backgroundIndex: "acolyte",
    classIndex: "rogue",
    currentHp: 10,
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
    ...overrides,
  };
}

function saveDraftToLocalStorage(
  characterId: string,
  overrides: Partial<PersistedCharacterBuilderDraft> = {},
) {
  const draft: PersistedCharacterBuilderDraft = {
    baseCharacterUpdatedAt: "2026-01-01T00:00:00.000Z",
    builderState: createDraftBuilderState(),
    dirty: true,
    featureChoices: {},
    updatedAt: "2026-01-01T00:01:00.000Z",
    version: 2,
    ...overrides,
  };

  window.localStorage.setItem(
    `${characterBuilderDraftStoragePrefix}:${characterId}`,
    JSON.stringify(draft),
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });

  return {
    promise,
    resolve,
  };
}

describe("useCharacterBuilder", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
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
    const stableHitPointState = {
      bonusHp: 0,
      calculationMode: "override" as const,
      overrideMaxHp: 10,
      rolledHitPoints: [10],
      tempHp: 0,
    };
    const { rerender } = render(
      <BuilderHarness
        character={createCharacter({
          hitPointState: stableHitPointState,
        })}
      />,
    );

    expect(screen.getByTestId("current-hp").textContent).toBe("10");

    act(() => {
      screen.getByRole("button", { name: "Damage" }).click();
    });

    expect(screen.getByTestId("current-hp").textContent).toBe("7");

    rerender(
      <BuilderHarness
        character={createCharacter({
          currentHp: 10,
          hitPointState: stableHitPointState,
          updatedAt: "2026-01-01T00:00:01.000Z",
        })}
      />,
    );

    expect(screen.getByTestId("current-hp").textContent).toBe("7");
  });

  it("applies refreshed database values when local builder state is clean", async () => {
    const { rerender } = render(<BuilderHarness character={createCharacter()} />);

    expect(screen.getByTestId("current-hp").textContent).toBe("10");
    expect(screen.getByTestId("background-index").textContent).toBe("acolyte");

    rerender(
      <BuilderHarness
        character={createCharacter({
          background: {
            name: "Soldier",
          },
          backgroundIndex: "soldier",
          class: {
            name: "Wizard",
          },
          classIndex: "wizard",
          currentHp: 14,
          species: {
            name: "Elf",
          },
          speciesIndex: "elf",
          updatedAt: "2026-01-01T00:00:01.000Z",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-hp").textContent).toBe("14");
      expect(screen.getByTestId("background-index").textContent).toBe("soldier");
      expect(screen.getByTestId("class-index").textContent).toBe("wizard");
      expect(screen.getByTestId("species-index").textContent).toBe("elf");
    });
  });

  it("does not expose Rogue while a Cleric character waits for class reference hydration", async () => {
    const classReferences = createDeferred<ReferenceClass[]>();

    referenceMocks.fetchClasses.mockReturnValue(classReferences.promise);

    render(
      <BuilderHarness
        character={createCharacter({
          class: {
            name: "Cleric",
          },
          classIndex: "cleric",
          id: "cleric-1",
          name: "Refresh Cleric",
        })}
      />,
    );

    await waitFor(() => {
      expect(referenceMocks.fetchClasses).toHaveBeenCalled();
    });

    expect(screen.getByTestId("class-index").textContent).toBe("");
    expect(screen.getByTestId("selected-class-index").textContent).toBe("");
    expect(screen.getByTestId("preview-class-name").textContent).toBe("");

    await act(async () => {
      classReferences.resolve([createClericReference()]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("class-index").textContent).toBe("cleric");
      expect(screen.getByTestId("selected-class-index").textContent).toBe("cleric");
      expect(screen.getByTestId("preview-class-name").textContent).toBe("Cleric");
    });
  });

  it("does not expose the first species option while a persisted species waits for hydration", async () => {
    const speciesReferences = createDeferred<ReferenceSpecies[]>();

    referenceMocks.fetchSpecies.mockReturnValue(speciesReferences.promise);
    saveDraftToLocalStorage("dragonborn-1", {
      builderState: createDraftBuilderState({
        currentHp: 4,
        speciesIndex: "human",
      }),
      updatedAt: "2026-01-01T00:03:00.000Z",
    });

    render(
      <BuilderHarness
        character={createCharacter({
          id: "dragonborn-1",
          name: "Refresh Dragonborn",
          species: {
            name: "Dragonborn",
          },
          speciesIndex: "dragonborn",
        })}
      />,
    );

    await waitFor(() => {
      expect(referenceMocks.fetchSpecies).toHaveBeenCalled();
    });

    expect(screen.getByTestId("species-index").textContent).toBe("");
    expect(screen.getByTestId("selected-species-index").textContent).toBe("");
    expect(screen.getByTestId("preview-species-name").textContent).toBe("");

    await act(async () => {
      speciesReferences.resolve([createDragonbornReference()]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("species-index").textContent).toBe("dragonborn");
      expect(screen.getByTestId("selected-species-index").textContent).toBe("dragonborn");
      expect(screen.getByTestId("preview-species-name").textContent).toBe("Dragonborn");
    });
  });

  it("does not expose the first background option while a persisted background waits for hydration", async () => {
    const backgroundReferences = createDeferred<ReferenceBackground[]>();

    referenceMocks.fetchBackgrounds.mockReturnValue(backgroundReferences.promise);
    saveDraftToLocalStorage("artisan-1", {
      builderState: createDraftBuilderState({
        backgroundIndex: "criminal",
        currentHp: 4,
      }),
      updatedAt: "2026-01-01T00:03:00.000Z",
    });

    render(
      <BuilderHarness
        character={createCharacter({
          background: {
            name: "Artisan",
          },
          backgroundIndex: "artisan",
          id: "artisan-1",
          name: "Refresh Artisan",
        })}
      />,
    );

    await waitFor(() => {
      expect(referenceMocks.fetchBackgrounds).toHaveBeenCalled();
    });

    expect(screen.getByTestId("background-index").textContent).toBe("");
    expect(screen.getByTestId("selected-background-index").textContent).toBe("");
    expect(screen.getByTestId("preview-background-name").textContent).toBe("");

    await act(async () => {
      backgroundReferences.resolve([createArtisanReference()]);
    });

    await waitFor(() => {
      expect(screen.getByTestId("background-index").textContent).toBe("artisan");
      expect(screen.getByTestId("selected-background-index").textContent).toBe("artisan");
      expect(screen.getByTestId("preview-background-name").textContent).toBe("Artisan");
    });
  });

  it("ignores an old local draft when database character data is newer", async () => {
    referenceMocks.fetchBackgrounds.mockResolvedValue([createSoldierReference()]);
    referenceMocks.fetchClasses.mockResolvedValue([createWizardReference()]);
    referenceMocks.fetchSpecies.mockResolvedValue([createElfReference()]);

    saveDraftToLocalStorage("character-1", {
      baseCharacterUpdatedAt: "2026-01-01T00:00:00.000Z",
      builderState: createDraftBuilderState({
        backgroundChoices: {
          "acolyte:old-background:choice": "stale-background-choice",
        },
        backgroundIndex: "acolyte",
        classIndex: "rogue",
        currentHp: 1,
        speciesIndex: "human",
      }),
      featureChoices: {
        "old-feature:choice": "stale-feature-choice",
      },
      updatedAt: "2026-01-01T00:01:00.000Z",
    });

    render(
      <BuilderHarness
        character={createCharacter({
          background: {
            name: "Soldier",
          },
          backgroundIndex: "soldier",
          class: {
            name: "Wizard",
          },
          classIndex: "wizard",
          currentHp: 14,
          featureChoices: [
            createBackgroundFeatureSelection({
              choiceKey: "soldier-gaming-set",
              choicePath: "proficiency_choices[0]",
              selectedOptionIndex: "tool-dice",
              selectedOptionName: "Tool: Dice",
              sourceIndex: "soldier",
            }),
          ],
          species: {
            name: "Elf",
          },
          speciesIndex: "elf",
          updatedAt: "2026-01-02T00:00:00.000Z",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-hp").textContent).toBe("14");
      expect(screen.getByTestId("background-index").textContent).toBe("soldier");
      expect(screen.getByTestId("class-index").textContent).toBe("wizard");
      expect(screen.getByTestId("species-index").textContent).toBe("elf");
      expect(screen.getByTestId("background-choices").textContent).toContain(
        "\"soldier:soldier-origin-proficiencies:soldier-gaming-set\":\"tool-dice\"",
      );
      expect(screen.getByTestId("feature-choices").textContent).not.toContain(
        "stale-feature-choice",
      );
    });
  });

  it("ignores an empty clean local draft when database choices are populated", async () => {
    referenceMocks.fetchBackgrounds.mockResolvedValue([createSoldierReference()]);

    saveDraftToLocalStorage("character-1", {
      builderState: createDraftBuilderState({
        backgroundChoices: {},
        backgroundIndex: "acolyte",
      }),
      dirty: false,
      featureChoices: {},
      updatedAt: "2026-01-01T00:02:00.000Z",
    });

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
          updatedAt: "2026-01-01T00:00:00.000Z",
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

  it("restores a genuinely newer unsaved draft over older database data", async () => {
    saveDraftToLocalStorage("character-1", {
      baseCharacterUpdatedAt: "2026-01-01T00:00:00.000Z",
      builderState: createDraftBuilderState({
        backgroundChoices: {
          "soldier:soldier-origin-proficiencies:soldier-gaming-set": "tool-dice",
        },
        backgroundIndex: "soldier",
        classIndex: "wizard",
        currentHp: 4,
        speciesIndex: "elf",
      }),
      dirty: true,
      featureChoices: {
        "draft-feature:choice": "draft-feature-choice",
      },
      updatedAt: "2026-01-01T00:03:00.000Z",
    });

    render(
      <BuilderHarness
        character={createCharacter({
          background: {
            name: "Acolyte",
          },
          backgroundIndex: "acolyte",
          class: {
            name: "Rogue",
          },
          classIndex: "rogue",
          currentHp: 10,
          species: {
            name: "Human",
          },
          speciesIndex: "human",
          updatedAt: "2026-01-01T00:00:00.000Z",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-hp").textContent).toBe("4");
      expect(screen.getByTestId("background-index").textContent).toBe("soldier");
      expect(screen.getByTestId("class-index").textContent).toBe("wizard");
      expect(screen.getByTestId("species-index").textContent).toBe("elf");
      expect(screen.getByTestId("background-choices").textContent).toContain(
        "\"soldier:soldier-origin-proficiencies:soldier-gaming-set\":\"tool-dice\"",
      );
      expect(screen.getByTestId("feature-choices").textContent).toContain(
        "\"draft-feature:choice\":\"draft-feature-choice\"",
      );
    });
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
        classIndex: "rogue",
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
      createClassOption("rogue"),
      createSoldierBackgroundOption(),
      createHumanSpeciesOption(),
      [],
      [],
      {},
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
        classIndex: "rogue",
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
      createClassOption("rogue"),
      createSageBackgroundOption(),
      createHumanSpeciesOption(),
      [],
      [],
      {},
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

  it("rehydrates a saved class from reference data", async () => {
    referenceMocks.fetchClasses.mockResolvedValue([createWizardReference()]);

    render(
      <BuilderHarness
        character={createCharacter({
          class: {
            name: "Wizard",
          },
          classIndex: "wizard",
        })}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("class-index").textContent).toBe("wizard");
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

function createDragonbornReference(): ReferenceSpecies {
  return {
    baseSpeed: 30,
    description: "Dragonborn",
    index: "dragonborn",
    name: "Dragonborn",
    size: "Small",
    sourceJson: {
      index: "dragonborn",
      name: "Dragonborn",
      speed: 30,
      type: "Humanoid",
    },
  };
}

function createHumanSpeciesOption(): SpeciesOption {
  return {
    creatureType: "Humanoid",
    description: "Human",
    index: "human",
    languages: ["Common"],
    name: "Human",
    previewSections: [],
    size: "Medium",
    speed: 30,
    traits: ["Skillful", "Versatile"],
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

function createArtisanReference(): ReferenceBackground {
  return {
    abilityOptions: [
      createBackgroundAbilityOption("dex", "Dexterity", "artisan"),
      createBackgroundAbilityOption("int", "Intelligence", "artisan"),
      createBackgroundAbilityOption("cha", "Charisma", "artisan"),
    ],
    description: "Artisan",
    feature: "Crafter",
    index: "artisan",
    name: "Artisan",
    proficiencies: [],
    sourceJson: {
      index: "artisan",
      name: "Artisan",
    },
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

function createWizardReference(): ReferenceClass {
  return {
    description: "Wizard",
    hitDie: 6,
    index: "wizard",
    name: "Wizard",
    primaryAbilities: [
      {
        abilityScore: {
          fullName: "Intelligence",
          index: "int",
          name: "Intelligence",
        },
        abilityScoreIndex: "int",
        classIndex: "wizard",
        id: "wizard-int",
      },
    ],
    sourceJson: {
      hit_die: 6,
      index: "wizard",
      name: "Wizard",
    },
  };
}

function createClericReference(): ReferenceClass {
  return {
    description: "Cleric",
    hitDie: 8,
    index: "cleric",
    name: "Cleric",
    primaryAbilities: [
      {
        abilityScore: {
          fullName: "Wisdom",
          index: "wis",
          name: "Wisdom",
        },
        abilityScoreIndex: "wis",
        classIndex: "cleric",
        id: "cleric-wis",
      },
    ],
    sourceJson: {
      hit_die: 8,
      index: "cleric",
      name: "Cleric",
      saving_throws: [
        {
          index: "wis",
          name: "Wisdom",
        },
        {
          index: "cha",
          name: "Charisma",
        },
      ],
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
