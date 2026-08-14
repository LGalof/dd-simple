import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterBuilderSidebar } from "./CharacterBuilderSidebar";
import type { AbilityScore } from "../../../types/character";
import type {
  AbilityAssignment,
  BackgroundOption,
  ClassOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";

const abilityDefinitions = {
  cha: { index: "cha", name: "CHA", fullName: "Charisma" },
  con: { index: "con", name: "CON", fullName: "Constitution" },
  dex: { index: "dex", name: "DEX", fullName: "Dexterity" },
  int: { index: "int", name: "INT", fullName: "Intelligence" },
  str: { index: "str", name: "STR", fullName: "Strength" },
  wis: { index: "wis", name: "WIS", fullName: "Wisdom" },
};

const abilityScores: AbilityScore[] = [
  { ability: abilityDefinitions.str, abilityIndex: "str", baseScore: 16, score: 16 },
  { ability: abilityDefinitions.dex, abilityIndex: "dex", baseScore: 14, score: 14 },
  { ability: abilityDefinitions.con, abilityIndex: "con", baseScore: 14, score: 14 },
  { ability: abilityDefinitions.int, abilityIndex: "int", baseScore: 12, score: 12 },
  { ability: abilityDefinitions.wis, abilityIndex: "wis", baseScore: 10, score: 10 },
  { ability: abilityDefinitions.cha, abilityIndex: "cha", baseScore: 8, score: 8 },
];

const abilityAssignments: AbilityAssignment[] = abilityScores.map((score, index) => ({
  abilityIndex: score.abilityIndex,
  dice: [6, 5, 4, 3].slice(0, index % 4),
  id: `slot-${score.abilityIndex}`,
  score: score.score,
}));

const background: BackgroundOption = {
  description: "You served in a disciplined company.",
  feature: "Savage Attacker",
  index: "soldier",
  name: "Soldier",
  previewSections: [],
  proficiencies: ["Athletics", "Intimidation"],
  skillProficiencies: ["Athletics"],
  toolProficiencies: ["Dice Set"],
};

const species: SpeciesOption = {
  creatureType: "Humanoid",
  description: "A resourceful human.",
  index: "human",
  languages: ["Common"],
  name: "Human",
  previewSections: [],
  size: "Medium",
  speed: 30,
  traits: ["Resourceful"],
};

const classOption: ClassOption = {
  description: "A master of weapons.",
  features: [
    {
      choiceFields: [
        {
          choiceKind: "fighting-style",
          id: "style",
          label: "Fighting Style",
          options: [
            { description: "You gain +1 AC while armored.", label: "Defense", value: "defense" },
            { description: "Add damage to one handed attacks.", label: "Dueling", value: "dueling" },
          ],
        },
      ],
      details: ["Your martial training shapes how you fight."],
      id: "fighting-style",
      level: 1,
      summary: "You adopt a fighting style.",
      title: "Fighting Style",
    },
    {
      choiceFields: [
        {
          choiceKind: "subclass",
          id: "subclass",
          label: "Martial Archetype",
          options: [
            { label: "Champion", value: "champion" },
            { label: "Battle Master", value: "battle-master" },
          ],
        },
      ],
      id: "martial-archetype",
      level: 3,
      summary: "Choose a martial archetype.",
      title: "Martial Archetype",
    },
    {
      choiceFields: [
        {
          choiceGroupId: "asi-score",
          choiceGroupLabel: "Ability Score Increase",
          choiceKind: "option",
          id: "score-a",
          label: "First Ability",
          options: [
            { label: "Strength", value: "str" },
            { label: "Constitution", value: "con" },
          ],
        },
        {
          choiceGroupId: "asi-score",
          choiceGroupLabel: "Ability Score Increase",
          choiceKind: "option",
          id: "score-b",
          label: "Second Ability",
          options: [
            { label: "Dexterity", value: "dex" },
            { label: "Wisdom", value: "wis" },
          ],
        },
      ],
      id: "ability-score-improvement-4",
      level: 4,
      summary: "Increase two ability scores.",
      title: "Ability Score Improvement",
    },
    {
      id: "champion-improved-critical",
      level: 3,
      subclassIndex: "champion",
      summary: "Your weapon attacks score a critical hit on 19 or 20.",
      title: "Improved Critical",
    },
    {
      id: "battle-master-maneuvers",
      level: 3,
      subclassIndex: "battle-master",
      summary: "You learn maneuvers fueled by superiority dice.",
      title: "Combat Superiority",
    },
  ],
  hitDie: 10,
  index: "fighter",
  name: "Fighter",
  previewOverview: [],
  primaryAbility: "Strength or Dexterity",
  proficiencies: {
    armor: ["Light Armor", "Medium Armor", "Shields"],
    tools: [],
    weapons: ["Simple Weapons", "Martial Weapons"],
  },
  savingThrows: ["Strength", "Constitution"],
  skillChoices: { choose: 2, options: ["Athletics", "Perception"] },
  startingEquipment: ["Chain Mail", "Longsword"],
  subclasses: [
    { description: "Simple and deadly.", features: [], index: "champion", name: "Champion" },
    { description: "Tactical and precise.", features: [], index: "battle-master", name: "Battle Master" },
  ],
};

const hitPointSettings: HitPointSettings = {
  bonusHp: 2,
  calculationMode: "fixed",
  overrideMaxHp: null,
  rolledHitPoints: [10, 6, 7, 5, 8],
};

function buildProps(selectedChoices: FeatureChoiceSelections = {}) {
  return {
    abilityAssignments,
    abilityScores,
    background,
    characterLevel: 5,
    classOption,
    hitPointPreview: {
      averageHp: 39,
      bonusHp: 2,
      constitutionBonus: 10,
      fixedClassHp: 34,
      hitDie: 10,
      maxHp: 46,
      possibleHp: 62,
      rolledClassHp: 36,
      rolledHitPoints: [10, 6, 7, 5, 8],
      totalFixedHp: 46,
      totalRolledHp: 48,
    },
    hitPointSettings,
    onAbilityAssignmentChange: vi.fn(),
    onApplyHitPointSettings: vi.fn(),
    onFeatureChoicesChange: vi.fn((updater) => updater(selectedChoices)),
    onLevelChange: vi.fn(),
    onOpenPanel: vi.fn(),
    onRollAbility: vi.fn(),
    onRollAllAbilities: vi.fn(),
    onSubclassChange: vi.fn(),
    selectedChoices,
    selectedSubclassIndex: "champion",
    species,
  };
}

describe("CharacterBuilderSidebar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders build selections, visible features, and updates choices", () => {
    const props = buildProps({
      "fighting-style:style": "defense",
      "martial-archetype:subclass": "champion",
      "ability-score-improvement-4:score-a": "str",
    });

    render(<CharacterBuilderSidebar {...props} />);

    expect(screen.getByText("Human")).toBeTruthy();
    expect(screen.getByText("Soldier")).toBeTruthy();
    expect(screen.getAllByText("Fighter").length).toBeGreaterThan(0);
    expect(screen.getByText("Max Hit Points:")).toBeTruthy();
    expect(screen.getAllByText("Fighting Style").length).toBeGreaterThan(0);
    expect(screen.getByText("Improved Critical")).toBeTruthy();
    expect(screen.queryByText("Combat Superiority")).toBeNull();

    fireEvent.change(screen.getByDisplayValue("Level 5"), { target: { value: "6" } });
    expect(props.onLevelChange).toHaveBeenCalledWith(6);

    fireEvent.click(screen.getByRole("button", { name: /Roll All/i }));
    expect(props.onRollAllAbilities).toHaveBeenCalled();

    fireEvent.change(screen.getByDisplayValue("Defense"), { target: { value: "dueling" } });
    expect(props.onFeatureChoicesChange).toHaveBeenCalled();
  });

  it("opens and applies the hit point manager", () => {
    const props = buildProps();

    render(<CharacterBuilderSidebar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Manage HP" }));
    expect(screen.getByRole("dialog", { name: "Hit point manager" })).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("0"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Roll Hit Dice" }));
    fireEvent.change(screen.getByPlaceholderText("--"), { target: { value: "55" } });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));

    expect(props.onApplyHitPointSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        bonusHp: 4,
        calculationMode: "override",
        overrideMaxHp: 55,
      }),
    );
  });
});
