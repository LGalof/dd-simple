import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterSelectionPanel } from "./CharacterSelectionPanel";
import type {
  BackgroundOption,
  ClassOption,
  SpeciesOption,
} from "../types/characterBuilder";

const classOptions: ClassOption[] = [
  {
    description: "A master of arms.",
    features: [
      {
        choiceFields: [
          {
            choiceKind: "subclass",
            id: "subclass",
            label: "Subclass",
            options: [{ label: "Champion", value: "champion" }],
          },
        ],
        details: ["Pick a martial path."],
        id: "martial-archetype",
        level: 3,
        summary: "Choose a martial archetype.",
        title: "Martial Archetype",
      },
      {
        id: "extra-attack",
        level: 5,
        summary: "You can attack twice.",
        title: "Extra Attack",
      },
    ],
    hitDie: 10,
    index: "fighter",
    name: "Fighter",
    previewOverview: [
      { label: "Primary Ability", value: "Strength or Dexterity" },
      { label: "Saving Throws", value: "Strength, Constitution" },
    ],
    primaryAbility: "Strength or Dexterity",
    proficiencies: {
      armor: ["Light Armor", "Medium Armor"],
      tools: [],
      weapons: ["Simple Weapons", "Martial Weapons"],
    },
    savingThrows: ["Strength", "Constitution"],
    skillChoices: { choose: 2, options: ["Athletics", "Perception"] },
    startingEquipment: ["Chain Mail"],
  },
];

const backgroundOptions: BackgroundOption[] = [
  {
    description: "You trained in an army.",
    feature: "Savage Attacker",
    index: "soldier",
    name: "Soldier",
    previewSections: [
      {
        choiceFields: [
          {
            id: "score-plan",
            label: "Ability Plan",
            options: [
              { label: "Two scores", value: "two-scores" },
              { label: "Three scores", value: "increase-all-three-by-1" },
            ],
          },
          {
            id: "score-a",
            label: "First Score",
            options: [
              { label: "Strength", value: "str" },
              { label: "Dexterity", value: "dex" },
            ],
          },
          {
            id: "score-b",
            label: "Second Score",
            options: [
              { label: "Constitution", value: "con" },
              { label: "Strength", value: "ability-strength-score" },
            ],
          },
          {
            id: "score-c",
            label: "Third Score",
            options: [{ label: "Wisdom", value: "wis" }],
          },
        ],
        details: ["Increase your background ability scores."],
        id: "soldier-ability-scores",
        subtitle: "Ability Choices",
        title: "Ability Scores",
      },
    ],
    proficiencies: ["Athletics"],
    skillProficiencies: ["Athletics"],
    toolProficiencies: ["Dice Set"],
  },
];

const speciesOptions: SpeciesOption[] = [
  {
    creatureType: "Humanoid",
    description: "A flexible lineage.",
    index: "human",
    languages: ["Common"],
    name: "Human",
    previewSections: [
      {
        choiceFields: [
          {
            id: "language",
            label: "Extra Language",
            options: [
              { label: "Elvish", value: "elvish" },
              { label: "Dwarvish", value: "dwarvish" },
            ],
          },
        ],
        details: ["Choose one extra language."],
        id: "human-language",
        subtitle: "Choice",
        title: "Languages",
      },
      {
        details: ["You are resourceful."],
        id: "human-traits",
        title: "Traits",
      },
    ],
    size: "Medium",
    speed: 30,
    traits: ["Resourceful"],
  },
];

function buildProps(activePanel: "class" | "background" | "species") {
  return {
    activePanel,
    backgroundOptions,
    backgroundSelectionValues: {},
    classOptions,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    onSelect: vi.fn(),
    pendingSelection:
      activePanel === "class" ? "fighter" : activePanel === "background" ? "soldier" : "human",
    selectedOption:
      activePanel === "class"
        ? classOptions[0]
        : activePanel === "background"
          ? backgroundOptions[0]
          : speciesOptions[0],
    speciesOptions,
    speciesSelectionValues: {},
  };
}

describe("CharacterSelectionPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders class preview and confirms the selected class", () => {
    const props = buildProps("class");

    render(<CharacterSelectionPanel {...props} />);

    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Primary Ability")).toBeTruthy();
    expect(screen.getAllByText("Martial Archetype").length).toBeGreaterThan(0);

    expect(screen.getByText("Choose a martial archetype.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Add Class" }));
    expect(props.onConfirm).toHaveBeenCalledWith(undefined);
  });

  it("renders background choices and submits scoped preview choices", () => {
    const props = buildProps("background");

    render(<CharacterSelectionPanel {...props} />);

    expect(screen.getByText("Choose Origin: Background")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Ability Scores/i }));
    fireEvent.change(screen.getByDisplayValue("Ability Plan"), {
      target: { value: "increase-all-three-by-1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Background" }));

    expect(props.onConfirm).toHaveBeenCalledWith({
      backgroundChoices: {
        "soldier:soldier-ability-scores:score-plan": "increase-all-three-by-1",
      },
    });
  });

  it("renders species preview choices, closes, and submits selected options", () => {
    const props = buildProps("species");

    render(<CharacterSelectionPanel {...props} />);

    expect(screen.getByText("Human Traits")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Change Species" }));
    expect(props.onClose).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Extra Language"), {
      target: { value: "elvish" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add Species" }));

    expect(props.onConfirm).toHaveBeenCalledWith({
      speciesChoices: {
        "human:human-language:language": "elvish",
      },
    });
  });
});
