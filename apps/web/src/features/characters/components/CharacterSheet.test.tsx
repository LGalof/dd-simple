import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterSheet, type WorkspaceTab } from "./CharacterSheet";
import type { Character } from "../../../types/character";
import type { CharacterDerivedState } from "../../../types/characterDerived";
import type { ClassOption } from "../types/characterBuilder";

const abilityDefinitions = {
  cha: { index: "cha", name: "CHA", fullName: "Charisma" },
  con: { index: "con", name: "CON", fullName: "Constitution" },
  dex: { index: "dex", name: "DEX", fullName: "Dexterity" },
  int: { index: "int", name: "INT", fullName: "Intelligence" },
  str: { index: "str", name: "STR", fullName: "Strength" },
  wis: { index: "wis", name: "WIS", fullName: "Wisdom" },
};

function createCharacter(): Character {
  return {
    abilityScores: [
      { ability: abilityDefinitions.str, abilityIndex: "str", baseScore: 16, score: 16 },
      { ability: abilityDefinitions.dex, abilityIndex: "dex", baseScore: 14, score: 14 },
      { ability: abilityDefinitions.con, abilityIndex: "con", baseScore: 14, score: 14 },
      { ability: abilityDefinitions.int, abilityIndex: "int", baseScore: 10, score: 10 },
      { ability: abilityDefinitions.wis, abilityIndex: "wis", baseScore: 12, score: 12 },
      { ability: abilityDefinitions.cha, abilityIndex: "cha", baseScore: 8, score: 8 },
    ],
    alignment: "Neutral Good",
    armorClass: 16,
    background: {
      name: "Soldier",
      proficiencyGrants: [
        {
          backgroundIndex: "soldier",
          grantType: "TOOL",
          id: "tool",
          proficiencyIndex: "gaming-set",
          sourceLabel: "Tool: Dice Set",
        },
      ],
      sourceJson: {
        proficiencies: [{ name: "Skill: Athletics" }],
      },
    } as Character["background"],
    backgroundIndex: "soldier",
    choices: [],
    class: {
      name: "Fighter",
      proficiencies: {
        armor: ["Light Armor", "Medium Armor", "Shields"],
        tools: [],
        weapons: ["Simple Weapons", "Martial Weapons"],
      },
      sourceJson: {
        saving_throws: [{ index: "str" }, { index: "con" }],
      },
    } as Character["class"],
    classIndex: "fighter",
    conditions: [
      {
        appliedAt: "2026-01-01T00:00:00.000Z",
        condition: { index: "blinded", name: "Blinded" },
        conditionIndex: "blinded",
        id: "condition-1",
        notes: "Until next turn",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    currentHp: 22,
    diceRolls: [
      {
        formula: "1d20+5",
        id: "roll-1",
        reason: "Longsword",
        rollType: "attack",
        total: 17,
      },
    ],
    experiencePoints: 0,
    featureChoices: [],
    hitPointState: null,
    id: "character-1",
    inventory: [],
    languages: [
      {
        id: "language-1",
        language: { index: "common", name: "Common" },
        languageIndex: "common",
        sourceIndex: "human",
        sourceType: "species",
      },
    ],
    level: 5,
    maxHp: 44,
    name: "Kael",
    proficiencies: [
      {
        proficiency: { index: "skill-athletics", name: "Skill: Athletics", type: "SKILL" },
        proficiencyIndex: "skill-athletics",
        sourceType: "class",
      },
    ],
    resourceState: null,
    skills: [
      {
        customBonus: 0,
        isProficient: true,
        skill: { ability: abilityDefinitions.str, name: "Athletics" },
        skillIndex: "athletics",
      },
      {
        customBonus: 1,
        isProficient: false,
        skill: { ability: abilityDefinitions.wis, name: "Perception" },
        skillIndex: "perception",
      },
      {
        customBonus: 0,
        isProficient: false,
        skill: { ability: abilityDefinitions.int, name: "Investigation" },
        skillIndex: "investigation",
      },
      {
        customBonus: 0,
        isProficient: false,
        skill: { ability: abilityDefinitions.wis, name: "Insight" },
        skillIndex: "insight",
      },
    ],
    species: {
      name: "Human",
      sourceJson: { languages: [{ name: "Common" }] },
      traits: [{ name: "Resourceful", description: "You gain Heroic Inspiration after a Long Rest." }],
    } as Character["species"],
    speciesIndex: "human",
    speed: 30,
    spellcastingState: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

const selectedClass: ClassOption = {
  description: "A master of arms.",
  features: [
    {
      id: "fighting-style",
      level: 1,
      title: "Fighting Style",
      summary: "You adopt a fighting style.",
      choiceFields: [
        {
          choiceKind: "fighting-style",
          id: "style",
          label: "Style",
          options: [{ label: "Defense", value: "defense" }],
        },
      ],
    },
    {
      id: "subclass-feature-3",
      level: 3,
      subclassIndex: "champion",
      summary: "Critical hits happen on a 19 or 20.",
      title: "Improved Critical",
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
    {
      description: "A focused warrior.",
      features: [{ description: "Better critical hits.", level: 3, name: "Improved Critical" }],
      index: "champion",
      name: "Champion",
    },
  ],
};

const derivedState: CharacterDerivedState = {
  actions: [
    {
      activationType: "attack",
      combat: {
        damage: "1d8 + 3 slashing",
        hit: "+6",
        range: "5 ft",
        subtitle: "Melee Weapon Attack",
      },
      description: "Strike with a longsword.",
      id: "longsword",
      level: null,
      sourceIndex: "longsword",
      sourceType: "item",
      title: "Longsword",
    },
    {
      activationType: "bonus_action",
      description: "Regain stamina.",
      id: "second-wind",
      level: 1,
      sourceIndex: "second-wind",
      sourceType: "class_feature",
      title: "Second Wind",
    },
  ],
  activeSources: [
    {
      description: "You have Darkvision 60 feet.",
      level: 1,
      sourceIndex: "darkvision",
      sourceType: "species_trait",
      title: "Darkvision",
    },
  ],
  defenses: [
    {
      description: "Poison resistance.",
      id: "poison-resistance",
      label: "Resistances",
      sourceIndex: "poison",
      sourceType: "species_trait",
      value: "Poison",
    },
  ],
  resources: [
    {
      automationNote: "Recover on short or long rest.",
      category: "resource",
      id: "second-wind-resource",
      level: 1,
      maxUses: "1",
      maxUsesValue: 1,
      name: "Second Wind",
      recharge: "Short Rest",
      resourceKey: "second-wind",
      sourceFeature: "Second Wind",
      sourceIndex: "second-wind",
      sourceType: "class_feature",
      trackingMode: "uses",
    },
  ],
  selectedSubclassIndex: "champion",
  selectedSubspeciesIndex: null,
  spells: [
    {
      description: "A bolt of fire.",
      id: "fire-bolt",
      isCantrip: true,
      kind: "spell_feature",
      level: 1,
      preparationMode: "known",
      sourceIndex: "magic-initiate",
      sourceType: "class_feature",
      spellLevel: 0,
      title: "Fire Bolt",
    },
  ],
  stats: {
    armorClassBonus: 1,
    armorClassMode: "base",
    initiativeBonus: 1,
    oneHandedMeleeDamageBonus: 0,
    passiveInsightBonus: 0,
    passiveInvestigationBonus: 0,
    passivePerceptionBonus: 1,
    proficiencyBonus: 3,
    rangedAttackBonus: 0,
    savingThrowBonus: 0,
    skillCheckHalfProficiencyBonusMultiplier: 0,
    speedBonus: 5,
    strengthMinimum: null,
  },
};

function createInventoryController() {
  return {
    activeContainerId: "inventory",
    addReferenceEquipment: vi.fn(),
    applyItemTemplate: vi.fn(),
    clearContainer: vi.fn(),
    containers: [{ columns: 10, id: "inventory", name: "Inventory", rows: 6 }],
    deleteContainer: vi.fn(),
    discardItem: vi.fn(),
    equipmentLoadError: null,
    equipmentLoading: false,
    equipmentSlots: [],
    items: [
      {
        armorClassBonus: 1,
        attackBonus: 1,
        attuned: true,
        color: "#64748b",
        damage: "1d8 slashing",
        equippedSlot: "mainHand",
        height: 3,
        id: "sword",
        kind: "weapon",
        location: "equipped",
        maxStack: 1,
        name: "Longsword +1",
        notes: "Magic weapon. You gain a +1 bonus to attack and damage rolls.",
        quantity: 1,
        rarity: "Magical",
        referenceEquipmentIndex: "longsword",
        requiresAttunement: false,
        rotated: false,
        speedPenalty: 0,
        stackable: false,
        value: 15,
        weight: 3,
        width: 1,
        x: 0,
        y: 0,
      },
    ],
    persistedItems: [],
    selectedItem: null,
    selectedItemId: "",
  } as never;
}

function buildSheetProps(activeTab: WorkspaceTab = "actions") {
  return {
    activeTab,
    backgroundChoices: {},
    character: createCharacter(),
    compactSection: "overview" as const,
    conditionSummary: [{ label: "Blinded", value: "Until next turn" }],
    currentHp: 22,
    defenseSummary: [{ label: "Resistances", value: "Poison" }],
    derivedState,
    derivedStateError: null,
    derivedStateLoading: false,
    featureChoices: { "fighting-style:style": "defense" },
    inventoryController: createInventoryController(),
    onActiveTabChange: vi.fn(),
    onApplyCurrentHpAdjustment: vi.fn(),
    onApplyLongRest: vi.fn(),
    onLocalRoll: vi.fn(),
    onOpenConditions: vi.fn(),
    onOpenSpellLibrary: vi.fn(),
    onResourceStateChange: vi.fn(),
    onSelectSpellEntry: vi.fn(),
    onSetTempHp: vi.fn(),
    onSpellcastingStateChange: vi.fn(),
    resolvedFeatureChoices: [
      {
        choiceKey: "style",
        choiceLabel: "Fighting Style",
        choicePath: "feature.style",
        grantsRawJson: {
          armorNames: ["Shields"],
          weaponNames: ["Longsword"],
        },
        selectedOptionIndex: "defense",
        selectedOptionName: "Defense",
        selectedOptionType: "reference",
        selectedRawJson: { item: { index: "defense", name: "Defense" } },
        sourceIndex: "fighting-style",
        sourceType: "FEATURE",
      },
    ],
    resourceActionSummaries: derivedState.resources.map((resource) => ({
      automationNote: resource.automationNote,
      category: resource.category,
      id: resource.id,
      level: resource.level,
      maxUses: resource.maxUses,
      maxUsesValue: resource.maxUsesValue,
      name: resource.name,
      recharge: resource.recharge,
      resourceKey: resource.resourceKey,
      sourceFeature: resource.sourceFeature,
      trackingMode: resource.trackingMode,
    })),
    resourceState: {
      activeByResourceKey: {},
      customMaxByResourceKey: {},
      usageByResourceKey: { "second-wind": 0 },
    },
    selectedBackground: {
      description: "A trained soldier.",
      feature: "Savage Attacker",
      index: "soldier",
      name: "Soldier",
      previewSections: [
        {
          details: ["Increase Strength, Dexterity, or Constitution."],
          id: "soldier-ability",
          subtitle: "3 Choices",
          title: "Ability Scores",
        },
      ],
      proficiencies: ["Athletics"],
      skillProficiencies: ["Athletics"],
      toolProficiencies: ["Dice Set"],
    },
    selectedClass,
    selectedHeritage: null,
    selectedSpecies: {
      creatureType: "Humanoid",
      description: "A resourceful human.",
      heritageOptions: [],
      index: "human",
      languages: ["Common"],
      name: "Human",
      previewSections: [
        {
          details: ["You are a Humanoid."],
          id: "human-type",
          title: "Creature Type",
        },
        {
          details: ["You can speak Common."],
          id: "human-languages",
          title: "Languages",
        },
      ],
      size: "Medium",
      speed: 30,
      traits: ["Resourceful"],
    },
    speciesChoices: {},
    spellcastingState: {
      learnedSpellIds: ["fire-bolt"],
      preparedSpellIds: [],
      slotUsageByLevel: { "1": 1 },
    },
    spellcastingSummary: {
      abilityLabel: "Intelligence",
      attackBonus: 6,
      castingType: "Feature Magic",
      knownPrepared: [{ label: "Cantrips", value: "1" }],
      notes: ["Magic Initiate spells use Intelligence."],
      proficiencyBonus: 3,
      saveDc: 14,
      slotLevels: [{ level: 1, max: 2 }],
      slotsAvailable: true,
      slotsUnavailableReason: "",
    },
    tempHp: 3,
  };
}

function renderSheet(activeTab: WorkspaceTab = "actions") {
  const props = buildSheetProps(activeTab);
  return render(<CharacterSheet {...props} />);
}

describe("CharacterSheet", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders overview stats, actions, and hit point dialogs", () => {
    renderSheet("actions");

    expect(screen.getByText("Kael")).toBeTruthy();
    expect(screen.getByText("Saving Throws")).toBeTruthy();
    expect(screen.getByText("Longsword")).toBeTruthy();
    expect(screen.getByText("Second Wind")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Heal" }));
    fireEvent.change(screen.getByTestId("dashboard-current-hp-input"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Damage" })[1]);

    fireEvent.click(screen.getByRole("button", { name: /Temp/i }));
    fireEvent.change(screen.getByTestId("dashboard-temp-hp-input"), {
      target: { value: "7" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  });

  it("renders spell, feature, note, and extras tabs", () => {
    const { rerender } = renderSheet("spells");

    expect(screen.getByText("Fire Bolt")).toBeTruthy();
    expect(screen.getByText("Intelligence")).toBeTruthy();

    rerender(<CharacterSheet {...buildSheetProps("features")} />);
    expect(screen.getAllByText("Fighting Style").length).toBeGreaterThan(0);
    expect(screen.getByText("Soldier")).toBeTruthy();

    rerender(<CharacterSheet {...buildSheetProps("notes")} />);
    expect(screen.getAllByText("Notes").length).toBeGreaterThan(0);

    rerender(<CharacterSheet {...buildSheetProps("extras")} />);
    expect(screen.getByText("Recent Dice Rolls")).toBeTruthy();
    expect(screen.getByText("Quick Summary")).toBeTruthy();
  });
});
