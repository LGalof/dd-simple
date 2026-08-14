import { afterEach, describe, expect, it } from "vitest";
import {
  buildCharacterSavePayload,
  getDashboardAttunementLimit,
  getResourceActionSummaries,
  isKeepaliveSafePayload,
  loadDashboardUiState,
  mergeResourceActionSummaries,
  normalizeResourceState,
  normalizeSpellcastingState,
  saveDashboardUiState,
} from "./CharacterDashboardPage";
import type { Character } from "../types/character";
import type {
  BackgroundOption,
  ClassOption,
  SpeciesOption,
} from "../features/characters/types/characterBuilder";

const classOption: ClassOption = {
  description: "A primal warrior.",
  features: [
    {
      choiceFields: [
        {
          choiceGroupId: "class-skill-choice",
          choiceKind: "skill-proficiency",
          id: "skill-a",
          label: "Skill",
          options: [{ label: "Athletics", value: "skill-athletics" }],
        },
        {
          choiceKind: "subclass",
          id: "path",
          label: "Path",
          options: [{ label: "Berserker", selectedOptionIndex: "berserker", value: "berserker" }],
        },
      ],
      id: "class-choices",
      level: 1,
      summary: "Choose training.",
      title: "Class Choices",
    },
    { id: "rage", level: 1, summary: "Enter a rage.", title: "Rage" },
    { id: "bardic-inspiration", level: 2, summary: "Inspire allies.", title: "Bardic Inspiration" },
    { id: "channel-divinity", level: 3, summary: "Channel power.", title: "Channel Divinity" },
    { id: "cunning-action", level: 4, summary: "Move quickly.", title: "Cunning Action" },
    { id: "cunning-strike", level: 5, summary: "Trade Sneak Attack dice.", title: "Cunning Strike" },
    { id: "arcane-recovery", level: 5, summary: "Recover magic.", title: "Arcane Recovery" },
    { id: "arcane-shot", level: 5, summary: "Imbue an arrow.", title: "Arcane Shot" },
    { id: "divine-intervention", level: 10, summary: "Call for aid.", title: "Divine Intervention" },
    { id: "improved-cunning-strike", level: 11, summary: "Stronger strike options.", title: "Improved Cunning Strike" },
    { id: "stroke-of-luck", level: 20, summary: "Turn failure into success.", title: "Stroke of Luck" },
    { id: "future-choice", level: 7, summary: "Later path.", title: "Future Path" },
  ],
  hitDie: 12,
  index: "barbarian",
  name: "Barbarian",
  previewOverview: [],
  primaryAbility: "Strength",
  proficiencies: { armor: [], tools: [], weapons: [] },
  savingThrows: ["Strength", "Constitution"],
  skillChoices: { choose: 2, options: ["Athletics"] },
  startingEquipment: [],
  subclasses: [{ features: [], index: "berserker", name: "Berserker" }],
};

const backgroundOption: BackgroundOption = {
  description: "Soldier",
  feature: "Savage Attacker",
  index: "soldier",
  name: "Soldier",
  previewSections: [
    {
      choiceFields: [
        {
          id: "score-plan",
          label: "Plan",
          options: [{ label: "Three", value: "increase-all-three-by-1" }],
        },
        {
          id: "score-a",
          label: "First",
          options: [{ label: "Strength", value: "str" }],
        },
      ],
      details: [],
      id: "ability-scores",
      subtitle: "Scores",
      title: "Scores",
    },
  ],
  proficiencies: [],
  skillProficiencies: [],
  toolProficiencies: [],
};

const speciesOption: SpeciesOption = {
  creatureType: "Humanoid",
  description: "Human",
  index: "human",
  languages: ["Common"],
  name: "Human",
  previewSections: [
    {
      choiceFields: [
        {
          id: "language",
          label: "Language",
          options: [{ label: "Elvish", value: "elvish" }],
        },
        {
          id: "heritage",
          label: "Heritage",
          options: [
            {
              label: "Woodland",
              selectedOptionIndex: "woodland",
              selectedOptionType: "heritage",
              value: "woodland",
            },
          ],
        },
      ],
      details: [],
      id: "choices",
      title: "Choices",
    },
  ],
  size: "Medium",
  speed: 30,
  traits: ["Resourceful"],
};

const character = {
  abilityScores: [
    { ability: { index: "str", name: "STR" }, abilityIndex: "str", baseScore: 10, score: 10 },
    { ability: { index: "dex", name: "DEX" }, abilityIndex: "dex", baseScore: 10, score: 10 },
    { ability: { index: "con", name: "CON" }, abilityIndex: "con", baseScore: 10, score: 10 },
    { ability: { index: "int", name: "INT" }, abilityIndex: "int", baseScore: 10, score: 10 },
    { ability: { index: "wis", name: "WIS" }, abilityIndex: "wis", baseScore: 10, score: 10 },
    { ability: { index: "cha", name: "CHA" }, abilityIndex: "cha", baseScore: 10, score: 10 },
  ],
  alignment: "Neutral",
  choices: [
    {
      choiceType: "class-skill-choice",
      featureId: "old",
      fieldId: "old",
      selectedIndex: "skill-stealth",
      selectedType: "skill",
      sourceIndex: "rogue:old:old",
      sourceType: "class",
    },
    {
      choiceType: "species-language-choice",
      selectedIndex: "dwarvish",
      selectedType: "language",
      sourceIndex: "human:choices:language",
      sourceType: "species",
    },
  ],
  featureChoices: [
    {
      choiceKey: "old",
      choiceLabel: "Old",
      choicePath: "old.path",
      classIndex: "rogue",
      featureIndex: "old",
      level: 1,
      selectedOptionIndex: "old",
      selectedOptionName: "Old",
      selectedOptionType: "reference",
      sourceIndex: "old",
      sourceType: "FEATURE",
    },
    {
      choiceKey: "future",
      choiceLabel: "Future",
      choicePath: "future.path",
      classIndex: "barbarian",
      featureIndex: "future-choice",
      level: 10,
      selectedOptionIndex: "future",
      selectedOptionName: "Future",
      selectedOptionType: "reference",
      sourceIndex: "future-choice",
      sourceType: "FEATURE",
    },
  ],
  id: "character-1",
  name: "Kael",
} as Character;

const builderState = {
  abilityAssignments: [
    { abilityIndex: "str", dice: [6, 5, 4], id: "slot-str", score: 16 },
    { abilityIndex: "dex", dice: [5, 4, 3], id: "slot-dex", score: 14 },
  ],
  backgroundIndex: "soldier",
  classIndex: "barbarian",
  currentHp: 32,
  hitPointSettings: {
    bonusHp: 1,
    calculationMode: "fixed",
    overrideMaxHp: null,
    rolledHitPoints: [12, 7, 6],
  },
  level: 5,
  speciesChoices: {},
  speciesIndex: "human",
  subclassIndex: null,
  tempHp: 4,
};

describe("CharacterDashboardPage helpers", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("builds save payloads from current builder state and scoped choices", () => {
    const payload = buildCharacterSavePayload(
      character,
      builderState as never,
      classOption,
      backgroundOption,
      speciesOption,
      ["athletics", "athletics", "perception"],
      {
        "class-choices:skill-a": "skill-athletics",
        "class-choices:path": "berserker",
      },
      { learnedSpellIds: ["fire-bolt"], preparedSpellIds: [], slotUsageByLevel: { "1": 1 } },
      {
        activeByResourceKey: { rage: true },
        customMaxByResourceKey: { rage: 4 },
        usageByResourceKey: { rage: 1 },
      },
      {
        "soldier:ability-scores:score-plan": "increase-all-three-by-1",
        "soldier:ability-scores:score-a": "str",
      },
      {
        "human:choices:language": "elvish",
        "human:choices:heritage": "woodland",
      },
    );

    expect(payload.subclassIndex).toBe("berserker");
    expect(payload.skillIndexes).toEqual(["athletics", "perception"]);
    expect(payload.hitPointState).toEqual(
      expect.objectContaining({ bonusHp: 1, tempHp: 4 }),
    );
    expect(payload.choices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ choiceType: "class-skill-choice", selectedIndex: "skill-athletics" }),
        expect.objectContaining({ choiceType: "species-language-choice", selectedIndex: "elvish" }),
        expect.objectContaining({ choiceType: "species-heritage-choice", selectedIndex: "woodland" }),
        expect.objectContaining({ choiceType: "background-ability-plan" }),
      ]),
    );
    expect(payload.abilityScores).toEqual(
      expect.objectContaining({ dex: 14, str: 16 }),
    );
  });

  it("summarizes dashboard resources and attunement limits", () => {
    expect(getDashboardAttunementLimit(13, "rogue", "thief")).toBe(4);
    expect(getDashboardAttunementLimit(12, "rogue", "thief")).toBe(3);

    const resources = getResourceActionSummaries(classOption, 20, ["lucky"]);
    expect(resources.map((resource) => resource.name)).toEqual(
      expect.arrayContaining([
        "Arcane Recovery",
        "Bardic Inspiration",
        "Channel Divinity",
        "Cunning Action",
        "Cunning Strike",
        "Divine Intervention",
        "Improved Cunning Strike",
        "Luck Points",
        "Rage",
        "Stroke of Luck",
      ]),
    );

    const merged = mergeResourceActionSummaries(
      [{ ...resources[0], name: "Rage", maxUsesValue: 6 }],
      resources,
    );
    expect(merged.find((resource) => resource.name === "Rage")?.maxUsesValue).toBe(6);

    const resourceAtLevel = (level: number, name: string) =>
      getResourceActionSummaries(classOption, level, []).find(
        (resource) => resource.name === name,
      );

    expect(resourceAtLevel(1, "Rage")?.maxUsesValue).toBe(2);
    expect(resourceAtLevel(3, "Rage")?.maxUsesValue).toBe(3);
    expect(resourceAtLevel(6, "Rage")?.maxUsesValue).toBe(4);
    expect(resourceAtLevel(12, "Rage")?.maxUsesValue).toBe(5);
    expect(resourceAtLevel(4, "Bardic Inspiration")?.automationNote).toContain("d6");
    expect(resourceAtLevel(5, "Bardic Inspiration")?.automationNote).toContain("d8");
    expect(resourceAtLevel(10, "Bardic Inspiration")?.automationNote).toContain("d10");
    expect(resourceAtLevel(18, "Bardic Inspiration")?.automationNote).toContain("restore uses");
    expect(resourceAtLevel(3, "Channel Divinity")?.maxUsesValue).toBe(2);
    expect(resourceAtLevel(6, "Channel Divinity")?.maxUsesValue).toBe(3);
  });

  it("normalizes and persists dashboard UI state safely", () => {
    expect(normalizeSpellcastingState(null)).toEqual({
      learnedSpellIds: [],
      preparedSpellIds: [],
      slotUsageByLevel: {},
    });
    expect(
      normalizeSpellcastingState({
        learnedSpellIds: [" fire-bolt ", "fire-bolt", ""],
        preparedSpellIds: ["shield"],
        slotUsageByLevel: { "1": 1.8, bad: -1 },
      }),
    ).toEqual({
      learnedSpellIds: ["fire-bolt"],
      preparedSpellIds: ["shield"],
      slotUsageByLevel: { "1": 1 },
    });
    expect(
      normalizeResourceState({
        activeByResourceKey: { rage: true, empty: "yes" },
        customMaxByResourceKey: { rage: 4.9 },
        usageByResourceKey: { rage: 1.1, bad: Number.NaN },
      }),
    ).toEqual({
      activeByResourceKey: { rage: true },
      customMaxByResourceKey: { rage: 4 },
      usageByResourceKey: { rage: 1 },
    });

    saveDashboardUiState("character-1", {
      activeWorkspaceTab: "background" as never,
      isBuilderSidebarHidden: true,
      resourceState: { activeByResourceKey: {}, customMaxByResourceKey: {}, usageByResourceKey: {} },
      rightRailMode: "spells",
      spellcastingState: { learnedSpellIds: ["shield"], preparedSpellIds: [], slotUsageByLevel: {} },
      version: 1,
    });
    expect(loadDashboardUiState("character-1")).toEqual(
      expect.objectContaining({
        isBuilderSidebarHidden: true,
        rightRailMode: "spells",
      }),
    );
    window.localStorage.setItem("dd-simple.dashboardUiState:broken", "{");
    expect(loadDashboardUiState("broken")).toBeNull();
    expect(isKeepaliveSafePayload({ name: "small" } as never)).toBe(true);
    expect(isKeepaliveSafePayload({ notes: "x".repeat(61_000) } as never)).toBe(false);
  });
});
