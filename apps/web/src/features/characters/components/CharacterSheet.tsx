import { useEffect, useMemo, useState } from "react";
import { Card } from "../../../components/ui/Card";
import { ActionsTab } from "./character-sheet/ActionsTab";
import { FeaturesTab } from "./character-sheet/FeaturesTab";
import { SpellsTab } from "./character-sheet/SpellsTab";
import {
  InventoryWorkbench,
  type InventorySandboxController,
} from "../../../pages/InventorySandboxPage";
import { Rollable, type RollableResult } from "./Rollable";
import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  ClassSubclassOption,
  FeatureChoiceField,
  FeatureChoiceSelections,
  SpeciesOption,
} from "../types/characterBuilder";
import type {
  ActionActivationType,
  CharacterActionEntry,
} from "../../../types/characterAction";
import type { Character } from "../../../types/character";
import type { CharacterFeatureChoiceSelection } from "../../../types/character";
import type { CharacterResourceState } from "../../../types/character";
import type { CharacterSpellcastingState } from "../../../types/character";
import type { SpeciesHeritageOption } from "../types/characterBuilder";
import type {
  CharacterDerivedSource,
  CharacterDerivedState,
  CharacterSpellEntry,
  DerivedArmorClassMode,
} from "../../../types/characterDerived";
import { abilityModifier, formatModifier } from "../utils/characterFormat";
import {
  canParseDiceExpression,
  formatD20Formula,
} from "../utils/diceRoller";
import { getVisibleFeatureChoiceFields } from "../utils/featureChoiceVisibility";
import {
  extractSpellAttackDamage,
  findSpellLibraryRecordByName,
  formatSpellAttackNotes,
  formatSpellAttackRange,
  formatSpellAttackSubtitle,
  getManagedSpellEntriesForClass,
  inferSpellActionActivationType,
  isAttackRollSpell,
  type SpellLibraryRecord,
} from "../utils/spellLibrary";
import {
  deriveReferenceEquipmentEffects,
  itemRequiresAttunement,
} from "../utils/inventoryReferenceEffects";

type CharacterSheetProps = {
  activeTab: WorkspaceTab;
  backgroundChoices: Record<string, string>;
  character: Character;
  conditionSummary: Array<{ label: string; value: string }>;
  currentHp: number;
  defenseSummary: Array<{ label: string; value: string }>;
  derivedState: CharacterDerivedState | null;
  derivedStateError: string | null;
  derivedStateLoading: boolean;
  featureChoices: FeatureChoiceSelections;
  inventoryController: InventorySandboxController;
  onActiveTabChange: (tab: WorkspaceTab) => void;
  onLocalRoll: (result: RollableResult) => void;
  onOpenConditions: () => void;
  onOpenSpellLibrary: () => void;
  onResourceStateChange: (state: CharacterResourceState) => void;
  onSpellcastingStateChange: (state: CharacterSpellcastingState) => void;
  progressionChoiceSummaries: ProgressionChoiceSummary[];
  resolvedFeatureChoices: CharacterFeatureChoiceSelection[];
  resourceActionSummaries: ResourceActionSummary[];
  selectedHeritage?: SpeciesHeritageOption | null;
  selectedBackground: BackgroundOption;
  selectedClass: ClassOption;
  selectedSpecies: SpeciesOption;
  selectedSubclassName?: string | null;
  speciesChoices: Record<string, string>;
  spellcastingSummary: SpellcastingSummary | null;
  spellcastingState: CharacterSpellcastingState;
  resourceState: CharacterResourceState;
  tempHp: number;
  onApplyCurrentHpAdjustment: (mode: "heal" | "damage", amount: number) => void;
  onApplyLongRest: () => void;
  onSetTempHp: (amount: number) => void;
};

type AbilityIndex = "str" | "dex" | "con" | "int" | "wis" | "cha";
type WorkspaceTab =
  | "actions"
  | "spells"
  | "inventory"
  | "features"
  | "background"
  | "notes"
  | "extras";

type SkillWithTotal = {
  ability: string;
  hasExpertise: boolean;
  isProficient: boolean;
  name: string;
  proficiencyMultiplier: number;
  total: number;
};

type ActionFilter = "all" | ActionActivationType;

type ActionDisplayRow = {
  activationType: ActionActivationType;
  damage: string;
  displayMode: "detail" | "table";
  hit: string;
  id: string;
  notes: string;
  range: string;
  subtitle: string;
  title: string;
};

type ReferenceItem = {
  index?: unknown;
  name?: unknown;
  url?: unknown;
};

type FeatureChoiceEffectSummary = {
  armorNames: string[];
  combatOptionIndexes: Set<string>;
  expertiseSkillIndexes: Set<string>;
  expertiseToolNames: string[];
  featIndexes: Set<string>;
  languageNames: string[];
  savingThrowProficiencyIndexes: Set<AbilityIndex>;
  skillProficiencyIndexes: Set<string>;
  toolNames: string[];
  weaponNames: string[];
};

type ProgressionChoiceSummary = {
  id: string;
  label: string;
  level: number;
  status: "missing" | "selected";
  value: string;
};

type SpellcastingSummary = {
  abilityLabel: string;
  attackBonus: number;
  castingType: string;
  knownPrepared: Array<{
    label: string;
    value: string;
  }>;
  notes: string[];
  proficiencyBonus: number;
  saveDc: number;
  slotLevels: Array<{
    level: number;
    max: number;
  }>;
  slotsAvailable: boolean;
  slotsUnavailableReason: string;
};

type ResourceActionSummary = {
  automationNote: string;
  category: "action" | "bonus action" | "reaction" | "passive" | "resource";
  id: string;
  level: number | null;
  maxUsesValue?: number | null;
  maxUses?: string;
  name: string;
  recharge?: string;
  resourceKey: string;
  sourceFeature: string;
  trackingMode: "none" | "pool" | "uses";
};

type ProficiencySourceJson = {
  proficiencies?: ReferenceItem[];
  proficiency_choices?: Array<{
    desc?: unknown;
  }>;
};

type LanguageSourceJson = {
  languages?: ReferenceItem[];
  language_options?: {
    desc?: unknown;
  };
};

type TrainingReferenceCharacter = Character & {
  background: Character["background"] & {
    proficiencyGrants?: Array<{
      grantType: string;
      proficiencyIndex: string;
      sourceLabel?: string | null;
      proficiency?: {
        name: string;
      } | null;
    }>;
    sourceJson?: unknown;
    toolProficiencies?: string[];
  };
  class: Character["class"] & {
    proficiencies?: {
      armor: string[];
      tools: string[];
      weapons: string[];
    };
    sourceJson?: unknown;
  };
  species: Character["species"] & {
    traits?: Array<{
      description?: string | null;
      name: string;
    }>;
    sourceJson?: unknown;
  };
};

type LiveInventoryItem = InventorySandboxController["items"][number];

const abilityOrder: AbilityIndex[] = ["str", "dex", "con", "int", "wis", "cha"];
const skillOrder = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];
const unavailableTrainingValue = "Not available from current reference data";

function CharacterSheet({
  activeTab,
  backgroundChoices,
  character,
  conditionSummary,
  currentHp,
  defenseSummary,
  derivedState,
  derivedStateError,
  derivedStateLoading,
  featureChoices,
  inventoryController,
  onActiveTabChange,
  onLocalRoll,
  onOpenConditions,
  onOpenSpellLibrary,
  onResourceStateChange,
  onSpellcastingStateChange,
  progressionChoiceSummaries,
  resolvedFeatureChoices,
  resourceActionSummaries,
  selectedHeritage,
  selectedBackground,
  selectedClass,
  selectedSpecies,
  selectedSubclassName,
  speciesChoices,
  spellcastingSummary,
  spellcastingState,
  resourceState,
  tempHp,
  onApplyCurrentHpAdjustment,
  onApplyLongRest,
  onSetTempHp,
}: CharacterSheetProps) {
  const [isCurrentHpModalOpen, setIsCurrentHpModalOpen] = useState(false);
  const [isTempHpModalOpen, setIsTempHpModalOpen] = useState(false);
  const [activeActionFilter, setActiveActionFilter] = useState<ActionFilter>("all");
  const [activeSpellLevelFilter, setActiveSpellLevelFilter] = useState<"all" | number>("all");
  const [spellSearchText, setSpellSearchText] = useState("");
  const [hitPointAmountInput, setHitPointAmountInput] = useState("");
  const [tempHpInput, setTempHpInput] = useState("");
  const equippedItems = character.inventory.filter((item) => item.equipped);
  const liveEquippedInventoryItems = useMemo(
    () => inventoryController.items.filter((item) => item.location === "equipped"),
    [inventoryController.items],
  );
  const persistedEquippedItemEffectTotals = useMemo(
    () =>
      inventoryController.persistedItems
        .filter((item) => item.location === "equipped")
        .reduce(
          (totals, item) => {
            const referenceItem = {
              description: item.notes,
              equipmentCategory: null,
              index: item.referenceEquipmentIndex,
              itemType: item.kind,
              name: item.name,
              sourceJson: undefined,
            };

            if (!itemGrantsAttunementBenefits(item)) {
              return totals;
            }

            const effects = deriveReferenceEquipmentEffects(referenceItem);
            const equippedSlot = item.equippedSlot ?? inferEquipmentSlotFromName(referenceItem.name);

            return {
              armorClassBonus: totals.armorClassBonus + effects.armorClassBonus,
              nonBodyArmorClassBonus:
                totals.nonBodyArmorClassBonus +
                (equippedSlot === "body" ? 0 : effects.armorClassBonus),
              savingThrowBonus: totals.savingThrowBonus + effects.savingThrowBonus,
              strengthMinimum:
                effects.strengthMinimum == null
                  ? totals.strengthMinimum
                  : Math.max(totals.strengthMinimum ?? 0, effects.strengthMinimum),
            };
          },
          {
            armorClassBonus: 0,
            nonBodyArmorClassBonus: 0,
            savingThrowBonus: 0,
            strengthMinimum: null as number | null,
          },
        ),
    [inventoryController.persistedItems],
  );
  const liveEquippedItemEffectTotals = useMemo(
    () =>
      liveEquippedInventoryItems.reduce(
        (totals, item) => {
          if (!itemGrantsAttunementBenefits(item)) {
            return totals;
          }

          const effects = deriveReferenceEquipmentEffects({
            description: item.notes,
            equipmentCategory: null,
            index: item.referenceEquipmentIndex,
            itemType: item.kind,
            name: item.name,
            sourceJson: undefined,
          });
          const equippedSlot = item.equippedSlot ?? inferEquipmentSlotFromName(item.name);

          return {
            armorClassBonus: totals.armorClassBonus + effects.armorClassBonus,
            nonBodyArmorClassBonus:
              totals.nonBodyArmorClassBonus +
              (equippedSlot === "body" ? 0 : effects.armorClassBonus),
            savingThrowBonus: totals.savingThrowBonus + effects.savingThrowBonus,
            strengthMinimum:
              effects.strengthMinimum == null
                ? totals.strengthMinimum
                : Math.max(totals.strengthMinimum ?? 0, effects.strengthMinimum),
          };
        },
        {
          armorClassBonus: 0,
          nonBodyArmorClassBonus: 0,
          savingThrowBonus: 0,
          strengthMinimum: null as number | null,
        },
      ),
    [liveEquippedInventoryItems],
  );
  const sortedAbilityScores = useMemo(
    () =>
      [...character.abilityScores]
        .map((abilityScore) => ({
          ...abilityScore,
          score:
            abilityScore.abilityIndex === "str" && liveEquippedItemEffectTotals.strengthMinimum != null
              ? Math.max(abilityScore.score, liveEquippedItemEffectTotals.strengthMinimum)
              : abilityScore.score,
        }))
        .sort(
        (left, right) =>
          abilityOrder.indexOf(left.abilityIndex as AbilityIndex) -
          abilityOrder.indexOf(right.abilityIndex as AbilityIndex),
      ),
    [character.abilityScores, liveEquippedItemEffectTotals.strengthMinimum],
  );
  const abilityScoreMap = useMemo(
    () =>
      new Map(
        sortedAbilityScores.map((abilityScore) => [abilityScore.abilityIndex, abilityScore]),
      ),
    [sortedAbilityScores],
  );
  const dexterityScore = abilityScoreMap.get("dex")?.score ?? 10;
  const strengthScore = abilityScoreMap.get("str")?.score ?? 10;
  const constitutionScore = abilityScoreMap.get("con")?.score ?? 10;
  const wisdomScore = abilityScoreMap.get("wis")?.score ?? 10;
  const charismaScore = abilityScoreMap.get("cha")?.score ?? 10;
  const dexterityModifier = abilityModifier(dexterityScore);
  const strengthModifier = abilityModifier(strengthScore);
  const constitutionModifier = abilityModifier(constitutionScore);
  const wisdomModifier = abilityModifier(wisdomScore);
  const charismaModifier = abilityModifier(charismaScore);
  const previewArmorClassBonusDelta = useMemo(
    () => liveEquippedItemEffectTotals.armorClassBonus - persistedEquippedItemEffectTotals.armorClassBonus,
    [liveEquippedItemEffectTotals.armorClassBonus, persistedEquippedItemEffectTotals.armorClassBonus],
  );
  const previewNonBodyArmorClassBonusDelta = useMemo(
    () => liveEquippedItemEffectTotals.nonBodyArmorClassBonus - persistedEquippedItemEffectTotals.nonBodyArmorClassBonus,
    [liveEquippedItemEffectTotals.nonBodyArmorClassBonus, persistedEquippedItemEffectTotals.nonBodyArmorClassBonus],
  );
  const previewSavingThrowBonusDelta = useMemo(
    () => liveEquippedItemEffectTotals.savingThrowBonus - persistedEquippedItemEffectTotals.savingThrowBonus,
    [liveEquippedItemEffectTotals.savingThrowBonus, persistedEquippedItemEffectTotals.savingThrowBonus],
  );
  const equippedSpeedPenalty = useMemo(
    () =>
      liveEquippedInventoryItems
        .filter(itemGrantsAttunementBenefits)
        .reduce((total, item) => total + item.speedPenalty, 0),
    [liveEquippedInventoryItems],
  );
  const isBodyArmorEquipped = useMemo(
    () => liveEquippedInventoryItems.some((item) => item.equippedSlot === "body"),
    [liveEquippedInventoryItems],
  );
  const proficiencyBonus =
    derivedState?.stats.proficiencyBonus ??
    (character.level <= 4
      ? 2
      : character.level <= 8
        ? 3
        : character.level <= 12
          ? 4
          : character.level <= 16
            ? 5
            : 6);
  const featureChoiceEffects = useMemo(
    () => getFeatureChoiceEffects(resolvedFeatureChoices, character.level),
    [character.level, resolvedFeatureChoices],
  );
  const activeCombatOptionIndexes = useMemo(
    () => getActiveCombatOptionIndexes(featureChoiceEffects, derivedState?.activeSources ?? []),
    [derivedState?.activeSources, featureChoiceEffects],
  );
  const skillCheckHalfProficiencyBonusMultiplier = Math.max(
    derivedState?.stats.skillCheckHalfProficiencyBonusMultiplier ?? 0,
    hasUnlockedClassFeature(selectedClass, character.level, "jack-of-all-trades") ? 0.5 : 0,
  );
  const skillTotals = useMemo(
    () =>
      character.skills
        .map((characterSkill) => {
          const abilityScore = abilityScoreMap.get(characterSkill.skill.ability.index);
          const baseModifier = abilityScore ? abilityModifier(abilityScore.score) : 0;
          const skillIndex = canonicalSkillIndex(characterSkill.skillIndex);
          const isProficient =
            characterSkill.isProficient ||
            featureChoiceEffects.skillProficiencyIndexes.has(skillIndex);
          const hasExpertise =
            isProficient && featureChoiceEffects.expertiseSkillIndexes.has(skillIndex);
          const proficiencyMultiplier = hasExpertise ? 2 : isProficient ? 1 : 0;
          const halfProficiencyModifier =
            !isProficient && !hasExpertise
              ? Math.floor(
                  proficiencyBonus *
                    skillCheckHalfProficiencyBonusMultiplier,
                )
              : 0;
          const proficiencyModifier =
            proficiencyBonus * proficiencyMultiplier + halfProficiencyModifier;

          return {
            ability: characterSkill.skill.ability.index.toUpperCase(),
            hasExpertise,
            isProficient,
            name: characterSkill.skill.name,
            proficiencyMultiplier,
            total: baseModifier + proficiencyModifier + characterSkill.customBonus,
          };
        })
        .sort(compareSkills),
    [
      abilityScoreMap,
      character.skills,
      featureChoiceEffects,
      proficiencyBonus,
      skillCheckHalfProficiencyBonusMultiplier,
    ],
  );
  const sizeLabel = useMemo(() => getCreatureSize(character.species.name), [character.species.name]);
  const saveProficiencies = getSavingThrowProficiencyIndexes(character, featureChoiceEffects);
  const savingThrows = sortedAbilityScores.map((abilityScore) => {
    const modifier = abilityModifier(abilityScore.score);
    const hasSaveProficiency = saveProficiencies.includes(abilityScore.abilityIndex as AbilityIndex);

    return {
      shortLabel: abilityScore.ability.name,
      total:
        modifier +
        (hasSaveProficiency ? proficiencyBonus : 0) +
        (derivedState?.stats.savingThrowBonus ?? 0) +
        previewSavingThrowBonusDelta,
    };
  });
  const passiveStats = [
    {
      label: "Passive Perception",
      value:
        10 +
        getSkillTotal(skillTotals, "Perception") +
        (derivedState?.stats.passivePerceptionBonus ?? 0),
    },
    {
      label: "Passive Investigation",
      value:
        10 +
        getSkillTotal(skillTotals, "Investigation") +
        (derivedState?.stats.passiveInvestigationBonus ?? 0),
    },
    {
      label: "Passive Insight",
      value:
        10 + getSkillTotal(skillTotals, "Insight") + (derivedState?.stats.passiveInsightBonus ?? 0),
    },
  ];
  const derivedSpeed = useMemo(
    () =>
      Math.max(
        0,
        character.speed + (derivedState?.stats.speedBonus ?? 0) - equippedSpeedPenalty,
      ),
    [character.speed, derivedState?.stats.speedBonus, equippedSpeedPenalty],
  );
  const derivedInitiative = useMemo(
    () => dexterityModifier + (derivedState?.stats.initiativeBonus ?? 0),
    [derivedState?.stats.initiativeBonus, dexterityModifier],
  );
  const derivedArmorClass = useMemo(
    () =>
      calculateDisplayedArmorClass({
        baseArmorClass: character.armorClass,
        charismaModifier,
        constitutionModifier,
        dexterityModifier,
        derivedArmorClassBonus: derivedState?.stats.armorClassBonus ?? 0,
        mode: derivedState?.stats.armorClassMode ?? "base",
        nonBodyArmorClassBonus: previewNonBodyArmorClassBonusDelta,
        equippedArmorClassBonus: previewArmorClassBonusDelta,
        isBodyArmorEquipped,
        wisdomModifier,
      }),
    [
      character.armorClass,
      charismaModifier,
      constitutionModifier,
      dexterityModifier,
      derivedState?.stats.armorClassBonus,
      derivedState?.stats.armorClassMode,
      previewArmorClassBonusDelta,
      isBodyArmorEquipped,
      previewNonBodyArmorClassBonusDelta,
      wisdomModifier,
    ],
  );
  const spellEntries = derivedState?.spells ?? [];
  const spellSlotLevels = spellcastingSummary?.slotLevels ?? [];
  const normalizedActions = derivedState?.actions ?? [];
  const itemDefenseSummary = useMemo(
    () => summarizeEquippedItemDefenses(liveEquippedInventoryItems),
    [liveEquippedInventoryItems],
  );
  const mergedDefenseSummary = useMemo(
    () => mergeDefenseSummaryEntries(defenseSummary, itemDefenseSummary),
    [defenseSummary, itemDefenseSummary],
  );
  const training = getTrainingProfile(
    character,
    featureChoiceEffects,
    selectedClass,
    selectedSpecies,
    selectedBackground,
  );
  const actionFilterOptions: Array<{ id: ActionFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "action", label: "Action" },
    { id: "bonus_action", label: "Bonus Action" },
    { id: "reaction", label: "Reaction" },
    { id: "other", label: "Other" },
  ];
  const selectedSubclassIndex = useMemo(
    () =>
      getSelectedSubclassIndex(
        selectedClass,
        featureChoices,
        character.subclassIndex ?? null,
      ),
    [character.subclassIndex, featureChoices, selectedClass],
  );
  const visibleClassFeatureRecords = useMemo(
    () =>
      selectedClass.features
        .flatMap((baseFeature) =>
          getVisibleClassFeatures(baseFeature, selectedClass.subclasses ?? [], selectedSubclassIndex)
            .map((feature) => ({
              baseFeature,
              feature,
            })),
        )
        .filter(({ feature }) => feature.level <= character.level)
        .sort((left, right) => compareVisibleFeatures(left.feature, right.feature)),
    [character.level, featureChoices, selectedClass, selectedSubclassIndex],
  );
  const selectedSubclass = useMemo(
    () =>
      selectedClass.subclasses?.find((subclass) => subclass.index === selectedSubclassIndex) ?? null,
    [selectedClass.subclasses, selectedSubclassIndex],
  );
  const highestCompletedRequiredClassFeatureLevel = useMemo(() => {
    const requiredFeatures = visibleClassFeatureRecords
      .map(({ baseFeature }) => baseFeature)
      .filter((feature, index, features) => features.findIndex((candidate) => candidate.id === feature.id) === index)
      .filter((feature) => dashboardFeatureRequiresSelection(feature, featureChoices))
      .filter((feature) => dashboardFeatureChoiceComplete(feature, featureChoices));

    return requiredFeatures.reduce(
      (highestLevel, feature) => Math.max(highestLevel, feature.level),
      -1,
    );
  }, [featureChoices, visibleClassFeatureRecords]);
  const classFeatureEntries = useMemo(
    () =>
      visibleClassFeatureRecords
        .filter(({ baseFeature }) =>
          isDashboardFeatureMarkedComplete(
            baseFeature,
            featureChoices,
            highestCompletedRequiredClassFeatureLevel,
          ),
        )
        .map(({ feature }) => ({
        feature,
        selections: getSelectedClassFeatureSummaries(feature, featureChoices),
      })),
    [
      featureChoices,
      highestCompletedRequiredClassFeatureLevel,
      visibleClassFeatureRecords,
    ],
  );
  const coreClassFeatureEntries = useMemo(
    () =>
      classFeatureEntries.filter(
        ({ feature }) => !feature.id.includes("subclass-feature"),
      ),
    [classFeatureEntries],
  );
  const subclassFeatureEntries = useMemo(
    () =>
      classFeatureEntries.filter(({ feature }) => feature.id.includes("subclass-feature")),
    [classFeatureEntries],
  );
  const speciesSectionEntries = useMemo(
    () =>
      selectedSpecies.previewSections.map((section) => ({
        id: section.id,
        title: section.title,
        subtitle: section.subtitle ?? null,
        details: section.details,
        selections: getSectionSelectionSummaries(
          selectedSpecies.index,
          section.choiceFields,
          speciesChoices,
          section.id,
        ),
      })),
    [selectedSpecies, speciesChoices],
  );
  const speciesIdentityEntries = useMemo(
    () =>
      speciesSectionEntries.filter((section) =>
        ["Creature Type", "Size", "Speed", "Languages"].includes(section.title),
      ),
    [speciesSectionEntries],
  );
  const speciesTraitEntries = useMemo(
    () =>
      speciesSectionEntries.filter(
        (section) => !["Creature Type", "Size", "Speed", "Languages"].includes(section.title),
      ),
    [speciesSectionEntries],
  );
  const backgroundSectionEntries = useMemo(
    () =>
      selectedBackground.previewSections.map((section) => ({
        id: section.id,
        title: section.title,
        subtitle: section.subtitle,
        details: section.details,
        selections: getSectionSelectionSummaries(
          selectedBackground.index,
          getVisibleBackgroundChoiceFields(
            selectedBackground.index,
            section.id,
            section.choiceFields ?? [],
            backgroundChoices,
          ),
          backgroundChoices,
          section.id,
        ),
      })),
    [backgroundChoices, selectedBackground],
  );
  const backgroundChoiceEntries = useMemo(
    () =>
      backgroundSectionEntries.filter((section) => section.selections.length > 0),
    [backgroundSectionEntries],
  );
  const passiveDerivedSources = useMemo(
    () =>
      getPassiveDerivedSources(
        derivedState?.activeSources ?? [],
        normalizedActions,
        spellEntries,
      ),
    [derivedState?.activeSources, normalizedActions, spellEntries],
  );
  const savedFeatureChoices = useMemo(
    () =>
      resolvedFeatureChoices.filter((choice) =>
        isSupplementalSavedFeatureChoice(choice),
      ),
    [resolvedFeatureChoices],
  );
  const savedFeatureChoiceRows = useMemo(
    () =>
      savedFeatureChoices.map((choice) => ({
        id: `${choice.sourceType}:${choice.sourceIndex}:${choice.choicePath}`,
        label: choice.choiceLabel ?? choice.choiceKey ?? choice.choicePath,
        status: getSavedFeatureChoiceStatus(choice, featureChoiceEffects, character),
        value:
          choice.selectedOptionName ??
          choice.selectedOptionIndex ??
          choice.selectedOptionType ??
          "Unknown",
      })),
    [character, featureChoiceEffects, savedFeatureChoices],
  );
  const characterOverviewRows = useMemo(
    () =>
      [
        { label: "Species", value: character.species.name },
        selectedHeritage ? { label: "Heritage", value: selectedHeritage.name } : null,
        { label: "Class", value: character.class.name },
        selectedSubclassName ? { label: "Subclass", value: selectedSubclassName } : null,
        { label: "Background", value: character.background.name },
        { label: "Size", value: sizeLabel },
      ].filter((entry): entry is { label: string; value: string } => entry !== null),
    [character.background.name, character.class.name, character.species.name, selectedHeritage, selectedSubclassName, sizeLabel],
  );
  const spellEntriesForDisplay = useMemo(
    () => {
      const derivedEntries = spellEntries.filter((entry) => entry.kind !== "spellcasting");
      const managedEntries = getManagedSpellEntriesForClass(selectedClass.index, spellcastingState);
      const entriesById = new Map<string, CharacterSpellEntry>();
      const entriesByTitle = new Set(
        derivedEntries.map((entry) => entry.title.trim().toLowerCase()),
      );

      for (const entry of derivedEntries) {
        entriesById.set(entry.id, entry);
      }

      for (const entry of managedEntries) {
        if (entriesById.has(entry.id) || entriesByTitle.has(entry.title.trim().toLowerCase())) {
          continue;
        }

        entriesById.set(entry.id, entry);
      }

      return [...entriesById.values()];
    },
    [selectedClass.index, spellEntries, spellcastingState],
  );
  const spellAttackRows = useMemo<ActionDisplayRow[]>(
    () =>
      spellEntriesForDisplay.reduce<ActionDisplayRow[]>((rows, entry) => {
        if (!isConcreteSpellEntry(entry)) {
          return rows;
        }

        const spellRecord = findSpellLibraryRecordByName(entry.title);

        if (!spellRecord || !isAttackRollSpell(spellRecord)) {
          return rows;
        }

        rows.push({
          activationType: inferSpellActionActivationType(spellRecord),
          damage: extractSpellAttackDamage(spellRecord.description),
          displayMode: "table",
          hit: spellcastingSummary ? formatModifier(spellcastingSummary.attackBonus) : "--",
          id: `spell-attack-${entry.id}`,
          notes: formatSpellAttackNotes(spellRecord),
          range: formatSpellAttackRange(spellRecord.range),
          subtitle: formatSpellAttackSubtitle(entry, selectedClass.name),
          title: entry.title,
        });

        return rows;
      }, []),
    [selectedClass.name, spellEntriesForDisplay, spellcastingSummary],
  );
  const liveWeaponActionRows = useMemo<ActionDisplayRow[]>(
    () =>
      liveEquippedInventoryItems
        .filter(itemGrantsAttunementBenefits)
        .filter(isLiveAttackItem)
        .map((item) =>
          createLiveWeaponActionRow({
            dexterityModifier,
            item,
            proficiencyBonus,
            strengthModifier,
          }),
        ),
    [dexterityModifier, liveEquippedInventoryItems, proficiencyBonus, strengthModifier],
  );
  const liveWeaponActionTitles = useMemo(
    () => new Set(liveWeaponActionRows.map((row) => row.title.trim().toLowerCase())),
    [liveWeaponActionRows],
  );
  const actionRows = useMemo<ActionDisplayRow[]>(
    () => [
      ...spellAttackRows,
      ...liveWeaponActionRows,
      ...normalizedActions.map((action) => {
        const combatSummary = action.combat;
        const hasCombatSummary = Boolean(
          combatSummary?.range || combatSummary?.hit || combatSummary?.damage || combatSummary?.notes,
        );

        return {
          activationType: action.activationType,
          damage: combatSummary?.damage ?? "--",
          displayMode: hasCombatSummary ? ("table" as const) : ("detail" as const),
          hit: combatSummary?.hit ?? "--",
          id: action.id,
          notes: combatSummary?.notes ?? action.description,
          range: combatSummary?.range ?? "--",
          subtitle: combatSummary?.subtitle ?? getReadableActionSubtitle(action),
          title: action.title,
        };
      }).filter((action) => !liveWeaponActionTitles.has(action.title.trim().toLowerCase())),
    ],
    [liveWeaponActionRows, liveWeaponActionTitles, normalizedActions, spellAttackRows],
  );
  const filteredActionRows = useMemo(
    () =>
      actionRows.filter((action) => {
        if (activeActionFilter === "all") {
          return true;
        }

        if (activeActionFilter === "action") {
          return action.activationType === "action" || action.activationType === "attack";
        }

        return action.activationType === activeActionFilter;
      }),
    [actionRows, activeActionFilter],
  );
  const attackActionRows = useMemo(
    () => filteredActionRows.filter((action) => action.displayMode === "table"),
    [filteredActionRows],
  );
  const detailActionRows = useMemo(
    () => filteredActionRows.filter((action) => action.displayMode === "detail"),
    [filteredActionRows],
  );
  const shouldShowActionsInCombat =
    (activeActionFilter === "all" ||
      activeActionFilter === "attack" ||
      activeActionFilter === "action") &&
    attackActionRows.length > 0;
  const hasVisibleActionContent = attackActionRows.length > 0 || detailActionRows.length > 0;
  const preparedSpellIdSet = useMemo(
    () => new Set<string>(spellcastingState.preparedSpellIds ?? []),
    [spellcastingState.preparedSpellIds],
  );
  const spellFeatureEntries = useMemo(
    () => spellEntriesForDisplay.filter((entry) => !isConcreteSpellEntry(entry)),
    [spellEntriesForDisplay],
  );
  const spellLevelSections = useMemo(
    () => groupSpellEntriesByLevel(spellEntriesForDisplay, preparedSpellIdSet),
    [preparedSpellIdSet, spellEntriesForDisplay],
  );
  const spellSlotUsage = spellcastingState.slotUsageByLevel ?? {};
  const spellSlotSummary = useMemo(
    () =>
      spellSlotLevels.map((slotLevel) => {
        const used = spellSlotUsage[String(slotLevel.level)] ?? 0;
        const remaining = Math.max(0, slotLevel.max - used);

        return {
          ...slotLevel,
          remaining,
          used,
        };
      }),
    [spellSlotLevels, spellSlotUsage],
  );
  const spellModifierValue = useMemo(
    () =>
      spellcastingSummary
        ? formatModifier(spellcastingSummary.attackBonus - spellcastingSummary.proficiencyBonus)
        : "--",
    [spellcastingSummary],
  );
  const spellLevelFilterOptions = useMemo(
    () => [
      "all" as const,
      ...new Set(
        spellEntriesForDisplay
          .filter(isConcreteSpellEntry)
          .map((entry) => entry.spellLevel ?? 0)
          .sort((left, right) => left - right),
      ),
    ],
    [spellEntriesForDisplay],
  );
  const filteredSpellLevelSections = useMemo(
    () =>
      spellLevelSections
        .map((section) => ({
          ...section,
          entries: section.entries.filter((entry) =>
            matchesSpellFilters(entry, spellSearchText, activeSpellLevelFilter),
          ),
        }))
        .filter((section) => section.entries.length > 0),
    [activeSpellLevelFilter, spellLevelSections, spellSearchText],
  );
  const filteredSpellFeatureEntries = useMemo(
    () =>
      spellFeatureEntries.filter((entry) =>
        matchesSpellFilters(entry, spellSearchText, activeSpellLevelFilter),
      ),
    [activeSpellLevelFilter, spellFeatureEntries, spellSearchText],
  );
  const speciesSenseDetails = getSpeciesSenseDetails(character);
  const heritageSenseDetails = getHeritageSenseDetails(selectedHeritage);
  const derivedSenseDetails = useMemo(
    () => getDerivedSourceSenseDetails(derivedState?.activeSources ?? []),
    [derivedState?.activeSources],
  );
  const senseDetails = uniqueTrainingValues([
    ...speciesSenseDetails,
    ...heritageSenseDetails,
    ...derivedSenseDetails,
  ]);
  const workspaceTabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: "actions", label: "Actions" },
    { id: "spells", label: "Spells" },
    { id: "inventory", label: "Inventory" },
    { id: "features", label: "Features & Traits" },
    { id: "background", label: "Background" },
    { id: "notes", label: "Notes" },
    { id: "extras", label: "Extras" },
  ];

  function openCurrentHpModal() {
    setHitPointAmountInput("");
    setIsCurrentHpModalOpen(true);
  }

  function setUsedSpellSlots(slotLevel: number, used: number, max: number) {
    onSpellcastingStateChange({
      ...spellcastingState,
      slotUsageByLevel: {
        ...spellSlotUsage,
        [String(slotLevel)]: Math.max(0, Math.min(max, used)),
      },
    });
  }

  function spendSpellSlot(slotLevel: number, max: number) {
    setUsedSpellSlots(slotLevel, (spellSlotUsage[String(slotLevel)] ?? 0) + 1, max);
  }

  function restoreSpellSlot(slotLevel: number, max: number) {
    setUsedSpellSlots(slotLevel, (spellSlotUsage[String(slotLevel)] ?? 0) - 1, max);
  }

  function applyLongRest() {
    onApplyLongRest();
    onSpellcastingStateChange({
      ...spellcastingState,
      slotUsageByLevel: {},
    });
  }

  function togglePreparedSpell(entry: CharacterSpellEntry) {
    if (!canPrepareSpell(entry)) {
      return;
    }

    const currentPreparedSpellIds = new Set(spellcastingState.preparedSpellIds ?? []);

    if (currentPreparedSpellIds.has(entry.id)) {
      currentPreparedSpellIds.delete(entry.id);
    } else {
      currentPreparedSpellIds.add(entry.id);
    }

    onSpellcastingStateChange({
      ...spellcastingState,
      preparedSpellIds: [...currentPreparedSpellIds].sort(),
    });
  }

  function closeCurrentHpModal() {
    setIsCurrentHpModalOpen(false);
    setHitPointAmountInput("");
  }

  function applyCurrentHpChange(mode: "heal" | "damage") {
    const amount = Number.parseInt(hitPointAmountInput, 10);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    onApplyCurrentHpAdjustment(mode, amount);
    closeCurrentHpModal();
  }

  function openTempHpModal() {
    setTempHpInput(tempHp > 0 ? String(tempHp) : "");
    setIsTempHpModalOpen(true);
  }

  function closeTempHpModal() {
    setIsTempHpModalOpen(false);
    setTempHpInput("");
  }

  function applyTempHpChange() {
    const amount = Number.parseInt(tempHpInput, 10);

    onSetTempHp(Number.isFinite(amount) && amount > 0 ? amount : 0);
    closeTempHpModal();
  }

  return (
    <div className="character-sheet character-sheet-reference">
      <section className="character-dashboard-toolbar">
        <div className="character-dashboard-summary-row">
          <div className="character-dashboard-summary-chip character-dashboard-summary-chip-name">
            <span>Character Name</span>
            <strong>{character.name}</strong>
          </div>
        </div>

        <div className="character-dashboard-toolbar-actions">
          <button
            type="button"
            className="character-hit-points-action"
            onClick={applyLongRest}
          >
            Long Rest
          </button>
          <button
            type="button"
            className="character-hit-points-action"
            onClick={onOpenConditions}
          >
            Add Condition
          </button>
          <button
            type="button"
            className="character-hit-points-action character-hit-points-action-muted"
          >
            Add Custom Buff
          </button>
        </div>
      </section>

      <section className="character-dashboard-top-grid">
        <div className="character-primary-stats">
          <div className="character-primary-ability-grid">
            {sortedAbilityScores.map((abilityScore) => {
              const modifier = abilityModifier(abilityScore.score);
              const abilityLabel = abilityScore.ability.fullName ?? abilityScore.ability.name;

              return (
                <div key={abilityScore.abilityIndex} className="character-primary-stat-card">
                  <span>{abilityLabel}</span>
                  <Rollable
                    formula={formatD20Formula(modifier)}
                    label={`${abilityLabel} Check`}
                    rollType="ability"
                    source={abilityLabel}
                    onRoll={onLocalRoll}
                  >
                    <strong>{formatModifier(modifier)}</strong>
                  </Rollable>
                  <em>{abilityScore.score}</em>
                </div>
              );
            })}
          </div>

          <div className="character-primary-utility-grid">
            <div className="character-primary-metric-card">
              <span>Proficiency</span>
              <strong>{formatModifier(proficiencyBonus)}</strong>
              <em>Bonus</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Walking</span>
              <strong>{derivedSpeed} ft</strong>
              <em>Speed</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Initiative</span>
              <Rollable
                formula={formatD20Formula(derivedInitiative)}
                label="Initiative"
                rollType="initiative"
                source="Initiative"
                onRoll={onLocalRoll}
              >
                <strong>{formatModifier(derivedInitiative)}</strong>
              </Rollable>
              <em>Modifier</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Armor</span>
              <strong>{derivedArmorClass}</strong>
              <em>Class</em>
            </div>
          </div>
        </div>

        <div className="character-hit-points-panel">
          <div className="character-hit-points-actions">
            <button
              type="button"
              className="character-hit-points-action"
              onClick={openCurrentHpModal}
            >
              Heal
            </button>
            <button
              type="button"
              className="character-hit-points-action"
              onClick={openCurrentHpModal}
            >
              Damage
            </button>
          </div>

          <div className="character-hit-points-metrics">
            <div className="character-hit-points-stat">
              <span>Current</span>
              <strong>{currentHp}</strong>
            </div>
            <div className="character-hit-points-separator">/</div>
            <div className="character-hit-points-stat">
              <span>Max</span>
              <strong>{character.maxHp}</strong>
            </div>
            <button
              type="button"
              className="character-hit-points-stat character-hit-points-stat-muted character-hit-points-stat-button"
              onClick={openTempHpModal}
            >
              <span>Temp</span>
              <strong>{tempHp > 0 ? tempHp : "--"}</strong>
            </button>
          </div>

          <div className="character-hit-points-footer">Hit Points</div>
        </div>
      </section>

      <section className="character-dashboard-main-grid">
        <div className="character-dashboard-reference-columns">
          <aside className="character-dashboard-left-stack">
            <section className="character-reference-card">
              <div className="character-reference-card-header">
                <h3>Saving Throws</h3>
              </div>

              <div className="character-saving-throw-grid">
                {savingThrows.map((savingThrow) => (
                  <div key={savingThrow.shortLabel} className="character-save-pill">
                    <span>{savingThrow.shortLabel}</span>
                    <Rollable
                      formula={formatD20Formula(savingThrow.total)}
                      label={`${savingThrow.shortLabel} Saving Throw`}
                      rollType="saving_throw"
                      source="Saving Throws"
                      onRoll={onLocalRoll}
                    >
                      <strong>{formatModifier(savingThrow.total)}</strong>
                    </Rollable>
                  </div>
                ))}
              </div>
            </section>

            <section className="character-reference-card">
              <div className="character-reference-card-header">
                <h3>Senses</h3>
              </div>

              <div className="character-passive-list">
                {passiveStats.map((stat) => (
                  <div key={stat.label} className="character-passive-row">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <p className="character-reference-note">
                {senseDetails.length > 0 ? senseDetails.join(" - ") : training.senses}
              </p>
            </section>

          <section className="character-reference-card character-reference-card-training">
            <div className="character-reference-card-header">
              <h3>Proficiencies &amp; Training</h3>
            </div>

              <div className="character-training-stack">
                <TrainingBlock label="Armor" values={training.armor} />
                <TrainingBlock label="Weapons" values={training.weapons} />
                <TrainingBlock label="Tools" values={training.tools} />
                <TrainingBlock label="Languages" values={training.languages} />
              </div>
            </section>
          </aside>

          <section className="character-skills-board">
            <div className="character-skills-board-header">
              <span>Prof</span>
              <span>Mod</span>
              <h3>Skill</h3>
              <span>Bonus</span>
            </div>

            <div className="character-skills-table">
              {skillTotals.map((skill) => (
                <div key={skill.name} className="character-skill-table-row">
                  <span
                    className={
                      skill.isProficient
                        ? "character-skill-marker character-skill-marker-active"
                        : "character-skill-marker"
                    }
                  />
                  <em>{skill.ability}</em>
                  <span className="character-skill-name">
                    {skill.name}
                    {skill.hasExpertise ? " (Expertise)" : ""}
                  </span>
                  <Rollable
                    className="character-skill-bonus-pill"
                    formula={formatD20Formula(skill.total)}
                    label={`${skill.name} Check`}
                    rollType="skill"
                    source={`${skill.ability} Skill`}
                    onRoll={onLocalRoll}
                  >
                    {formatModifier(skill.total)}
                  </Rollable>
                </div>
              ))}
            </div>

            <div className="character-skills-board-footer">Additional Skills</div>
          </section>

          <div className="character-dashboard-support-grid">
            <div className="character-status-panel">
              <h3>Defenses</h3>
              <div className="character-status-list">
                {mergedDefenseSummary.length > 0 ? (
                  mergedDefenseSummary.map((entry) => (
                    <div key={entry.label} className="character-status-row">
                      <span>{entry.label}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))
                ) : (
                  <p className="muted">No active defenses</p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="character-status-panel character-status-panel-interactive"
              onClick={onOpenConditions}
            >
              <h3>Conditions</h3>
              {conditionSummary.length > 0 ? (
                <p className="character-status-summary">
                  {conditionSummary.map(formatConditionSummaryEntry).join(", ")}
                </p>
              ) : (
                <p className="muted">No active conditions</p>
              )}
            </button>
          </div>
        </div>

        <section className="character-main-workspace">
          <section className="character-workspace-panel character-workspace-panel-reference">
            <div className="character-tab-bar character-tab-bar-reference">
              {workspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={
                    activeTab === tab.id
                      ? "character-tab-button character-tab-button-active"
                      : "character-tab-button"
                  }
                  onClick={() => onActiveTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="character-tab-panel character-tab-panel-reference">
              {activeTab === "actions" && (
                <ActionsTab
                  actionFilterOptions={actionFilterOptions}
                  activeActionFilter={activeActionFilter}
                  attackActionRows={attackActionRows}
                  derivedStateError={derivedStateError}
                  derivedStateLoading={derivedStateLoading}
                  detailActionRows={detailActionRows}
                  formatActivationLabel={formatActivationLabel}
                  getDamageRollFromDisplay={getDamageRollFromDisplay}
                  getD20FormulaFromDisplayModifier={getD20FormulaFromDisplayModifier}
                  hasVisibleActionContent={hasVisibleActionContent}
                  onActiveActionFilterChange={setActiveActionFilter}
                  onLocalRoll={onLocalRoll}
                  shouldShowActionsInCombat={shouldShowActionsInCombat}
                />
              )}

              {activeTab === "spells" && (
                <SpellsTab
                  activeSpellLevelFilter={activeSpellLevelFilter}
                  canPrepareSpell={canPrepareSpell}
                  derivedStateError={derivedStateError}
                  derivedStateLoading={derivedStateLoading}
                  filteredSpellFeatureEntries={filteredSpellFeatureEntries}
                  filteredSpellLevelSections={filteredSpellLevelSections}
                  formatModifier={formatModifier}
                  formatSpellFilterLabel={formatSpellFilterLabel}
                  formatSpellPreparationLabel={getSpellPreparationLabel}
                  formatSpellSlotTitle={formatSpellSlotTitle}
                  getSpellEntrySubtitle={getSpellEntrySubtitle}
                  isSpellPrepared={isSpellPrepared}
                  onActiveSpellLevelFilterChange={setActiveSpellLevelFilter}
                  onOpenSpellLibrary={onOpenSpellLibrary}
                  onRestoreSpellSlot={restoreSpellSlot}
                  onSetUsedSpellSlots={setUsedSpellSlots}
                  onSpellSearchTextChange={setSpellSearchText}
                  onTogglePreparedSpell={togglePreparedSpell}
                  onUseSpellSlot={spendSpellSlot}
                  preparedSpellIds={preparedSpellIdSet}
                  spellEntriesForDisplayCount={spellEntriesForDisplay.length}
                  spellLevelFilterOptions={spellLevelFilterOptions}
                  spellModifierValue={spellModifierValue}
                  spellSearchText={spellSearchText}
                  spellSlotSummary={spellSlotSummary}
                  spellcastingState={spellcastingState}
                  spellcastingSummary={spellcastingSummary}
                />
              )}

              {activeTab === "inventory" && (
                <div className="character-tab-scroll-stage">
                  <InventoryWorkbench controller={inventoryController} embedded hideDetailsPanel />
                </div>
              )}

              {activeTab === "features" && (
                <FeaturesTab
                  backgroundChoiceEntries={backgroundChoiceEntries}
                  backgroundDescription={selectedBackground.description}
                  backgroundFeature={selectedBackground.feature}
                  backgroundName={selectedBackground.name}
                  backgroundSectionEntries={backgroundSectionEntries}
                  coreClassFeatureEntries={coreClassFeatureEntries}
                  formatDerivedSourceSubtitle={formatDerivedSourceSubtitle}
                  formatFeatureLevel={formatFeatureLevel}
                  passiveDerivedSources={passiveDerivedSources}
                  progressionChoiceSummaries={progressionChoiceSummaries}
                  resourceState={resourceState}
                  resourceActionSummaries={resourceActionSummaries}
                  savedFeatureChoiceRows={savedFeatureChoiceRows}
                  selectedHeritage={selectedHeritage}
                  selectedSubclassName={selectedSubclass?.name ?? null}
                  speciesIdentityEntries={speciesIdentityEntries}
                  speciesTraitEntries={speciesTraitEntries}
                  subclassFeatureEntries={subclassFeatureEntries}
                  onResourceStateChange={onResourceStateChange}
                />
              )}

              {activeTab === "background" && (
                <div className="character-tab-scroll-stage">
                  <div className="workspace-card-grid">
                    <Card title="Origin Summary">
                      <div className="list">
                        {characterOverviewRows.map((entry) => (
                          <div key={entry.label} className="list-row">
                            <span>{entry.label}</span>
                            <strong>{entry.value}</strong>
                          </div>
                        ))}
                        <div className="list-row">
                          <span>Alignment</span>
                          <strong>{character.alignment ?? "Unaligned"}</strong>
                        </div>
                      </div>
                    </Card>

                    <Card title="Background Summary">
                      <div className="list">
                        <div className="character-feature-entry">
                          <strong>{selectedBackground.name}</strong>
                          <p>{selectedBackground.description}</p>
                          <p className="muted">Signature feature: {selectedBackground.feature}</p>
                        </div>
                      </div>
                    </Card>

                    <Card title="Background Proficiencies">
                      <div className="list">
                        <div className="list-row">
                          <span>Skills</span>
                          <strong>{selectedBackground.skillProficiencies.join(", ") || "--"}</strong>
                        </div>
                        <div className="list-row">
                          <span>Tools</span>
                          <strong>{selectedBackground.toolProficiencies.join(", ") || "--"}</strong>
                        </div>
                        <div className="list-row">
                          <span>Reference Tags</span>
                          <strong>{selectedBackground.proficiencies.join(", ") || "--"}</strong>
                        </div>
                      </div>
                    </Card>

                    <Card title="Background Details">
                      <div className="list">
                        {backgroundSectionEntries.map((section) => (
                          <div key={section.id} className="character-feature-entry">
                            <strong>{section.title}</strong>
                            {section.subtitle ? <p className="muted">{section.subtitle}</p> : null}
                            {section.details.map((detail) => (
                              <p key={`${section.id}-${detail}`}>{detail}</p>
                            ))}
                            {section.selections.length > 0 ? (
                              <div className="list">
                                {section.selections.map((selection) => (
                                  <div
                                    key={`${section.id}-${selection.label}-${selection.value}`}
                                    className="list-row"
                                  >
                                    <span>{selection.label}</span>
                                    <strong>{selection.value}</strong>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="character-tab-scroll-stage">
                  <Card title="Notes">
                    <p className="muted">
                      Use this area later for session notes, encounter reminders, and party plans.
                    </p>
                  </Card>
                </div>
              )}

              {activeTab === "extras" && (
                <div className="character-tab-scroll-stage">
                  <div className="workspace-card-grid">
                    <Card title="Recent Dice Rolls">
                      <div className="list">
                        {character.diceRolls.map((roll) => (
                          <div key={roll.id} className="list-row">
                            <span>
                              {roll.reason ?? roll.rollType}{" "}
                              <span className="muted">({roll.formula})</span>
                            </span>
                            <strong>{roll.total}</strong>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="Quick Summary">
                      <div className="list">
                        <div className="list-row">
                          <span>Speed</span>
                          <strong>{derivedSpeed} ft</strong>
                        </div>
                        <div className="list-row">
                          <span>Proficiency</span>
                          <strong>{formatModifier(proficiencyBonus)}</strong>
                        </div>
                        <div className="list-row">
                          <span>Hit Points</span>
                          <strong>
                            {currentHp}/{character.maxHp}
                          </strong>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
      {isCurrentHpModalOpen ? (
        <div className="character-hp-modal-backdrop" onClick={closeCurrentHpModal}>
          <section
            className="character-hp-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="character-hp-modal-header">
              <h3>Adjust Current HP</h3>
              <button
                type="button"
                className="character-hp-modal-close"
                onClick={closeCurrentHpModal}
                aria-label="Close current HP dialog"
              >
              </button>
            </header>

            <div className="character-hp-modal-body">
              <label className="character-hp-modal-field">
                <span>Amount</span>
                <input
                  type="number"
                  min="1"
                  className="character-hp-modal-input"
                  data-testid="dashboard-current-hp-input"
                  value={hitPointAmountInput}
                  onChange={(event) => setHitPointAmountInput(event.target.value)}
                  placeholder="Enter HP amount"
                />
              </label>
            </div>

            <footer className="character-hp-modal-actions">
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-secondary"
                onClick={closeCurrentHpModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="character-hp-modal-button"
                onClick={() => applyCurrentHpChange("heal")}
              >
                Heal
              </button>
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-danger"
                onClick={() => applyCurrentHpChange("damage")}
              >
                Damage
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isTempHpModalOpen ? (
        <div className="character-hp-modal-backdrop" onClick={closeTempHpModal}>
          <section
            className="character-hp-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="character-hp-modal-header">
              <h3>Set Temporary HP</h3>
              <button
                type="button"
                className="character-hp-modal-close"
                onClick={closeTempHpModal}
                aria-label="Close temporary HP dialog"
              >
              </button>
            </header>

            <div className="character-hp-modal-body">
              <label className="character-hp-modal-field">
                <span>Temporary Hit Points</span>
                <input
                  type="number"
                  min="0"
                  className="character-hp-modal-input"
                  data-testid="dashboard-temp-hp-input"
                  value={tempHpInput}
                  onChange={(event) => setTempHpInput(event.target.value)}
                  placeholder="Enter temp HP"
                />
              </label>
            </div>

            <footer className="character-hp-modal-actions">
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-secondary"
                onClick={closeTempHpModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-secondary"
                onClick={() => {
                  onSetTempHp(0);
                  closeTempHpModal();
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="character-hp-modal-button"
                onClick={applyTempHpChange}
              >
                Apply
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

type TrainingBlockProps = {
  label: string;
  values: string[];
};

function TrainingBlock({ label, values }: TrainingBlockProps) {
  return (
    <div className="character-training-block">
      <span>{label}</span>
      <p>{values.join(", ")}</p>
    </div>
  );
}

function getSelectedClassFeatureSummaries(
  feature: ClassFeature,
  selectedChoices: FeatureChoiceSelections,
) {
  return getVisibleChoiceFieldsForFeature(feature, selectedChoices)
    .map((field) => {
      const selectedValue = selectedChoices[`${feature.id}:${field.id}`];

      if (!selectedValue) {
        return null;
      }

      const option = field.options.find((candidate) => candidate.value === selectedValue);

      return option
        ? {
            label: field.label,
            value: option.label,
          }
        : null;
    })
    .filter(isPresent);
}

function getSectionSelectionSummaries(
  prefixIndex: string,
  fields: FeatureChoiceField[] | undefined,
  selectedChoices: Record<string, string>,
  sectionId: string,
) {
  return (fields ?? [])
    .map((field) => {
      const selectedValue = selectedChoices[`${prefixIndex}:${sectionId}:${field.id}`];

      if (!selectedValue) {
        return null;
      }

      const option = field.options.find((candidate) => candidate.value === selectedValue);

      return option
        ? {
            label: field.label,
            value: option.label,
          }
        : null;
    })
    .filter(isPresent);
}

function getPassiveDerivedSources(
  activeSources: CharacterDerivedSource[],
  normalizedActions: CharacterActionEntry[],
  spellEntries: CharacterSpellEntry[],
) {
  const actionSourceKeys = new Set(
    normalizedActions.map((action) => `${action.sourceType}:${action.sourceIndex}`),
  );
  const spellSourceKeys = new Set(
    spellEntries.map((entry) => `${entry.sourceType}:${entry.sourceIndex}`),
  );

  return activeSources.filter((source) => {
    const sourceKey = `${source.sourceType}:${source.sourceIndex}`;

    return (
      source.sourceType !== "species_trait" &&
      !actionSourceKeys.has(sourceKey) &&
      !spellSourceKeys.has(sourceKey)
    );
  });
}

function formatFeatureLevel(level: number) {
  return `${formatOrdinal(level)} level`;
}

function formatDerivedSourceSubtitle(source: CharacterDerivedSource) {
  const sourceLabel =
    source.sourceType === "class_feature"
      ? "Class Feature"
      : source.sourceType === "subclass_feature"
        ? "Subclass Feature"
        : source.sourceType === "item"
          ? "Equipped Item"
          : "Species Trait";
  const levelLabel = source.level ? `Level ${source.level}` : null;

  return [sourceLabel, levelLabel].filter(isPresent).join(" - ");
}

function getSelectedSubclassIndex(
  classOption: ClassOption,
  selectedChoices: FeatureChoiceSelections,
  persistedSubclassIndex: string | null,
) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (persistedSubclassIndex && subclassIndexes.has(persistedSubclassIndex)) {
    return persistedSubclassIndex;
  }

  for (const feature of classOption.features) {
    if (!feature.id.includes("subclass") || !feature.choiceFields?.length) {
      continue;
    }

    for (const field of feature.choiceFields) {
      const selectedValue = selectedChoices[`${feature.id}:${field.id}`];

      if (selectedValue && subclassIndexes.has(selectedValue)) {
        return selectedValue;
      }
    }
  }

  return null;
}

function getVisibleClassFeatures(
  feature: ClassFeature,
  subclasses: ClassSubclassOption[],
  selectedSubclassIndex: string | null,
): ClassFeature[] {
  if (!selectedSubclassIndex || !feature.id.includes("subclass-feature")) {
    return [feature];
  }

  const selectedSubclass = subclasses.find((subclass) => subclass.index === selectedSubclassIndex);

  if (!selectedSubclass) {
    return [feature];
  }

  const subclassFeaturesAtLevel = selectedSubclass.features.filter(
    (subclassFeature) => subclassFeature.level === feature.level,
  );

  if (subclassFeaturesAtLevel.length > 0) {
    return subclassFeaturesAtLevel.map((subclassFeature) => ({
      choiceFields: subclassFeature.choiceFields,
      id: `${feature.id}:${slugifyFeatureName(subclassFeature.name)}`,
      level: feature.level,
      title: subclassFeature.name,
      summary: subclassFeature.description,
    }));
  }

  return [feature];
}

function compareVisibleFeatures(left: ClassFeature, right: ClassFeature) {
  if (left.level !== right.level) {
    return left.level - right.level;
  }

  return left.title.localeCompare(right.title);
}

function getVisibleChoiceFieldsForFeature(
  feature: ClassFeature,
  selectedChoices: FeatureChoiceSelections,
) {
  return getVisibleFeatureChoiceFields(feature.id, feature.choiceFields, selectedChoices);
}

function dashboardFeatureChoiceComplete(
  feature: ClassFeature,
  selectedChoices: FeatureChoiceSelections,
) {
  const visibleChoiceFields = getVisibleChoiceFieldsForFeature(feature, selectedChoices);

  if (visibleChoiceFields.length === 0) {
    return true;
  }

  return visibleChoiceFields.every((field) =>
    Boolean(selectedChoices[`${feature.id}:${field.id}`]),
  );
}

function dashboardFeatureRequiresSelection(
  feature: ClassFeature,
  selectedChoices: FeatureChoiceSelections,
) {
  return getVisibleChoiceFieldsForFeature(feature, selectedChoices).length > 0;
}

function isDashboardFeatureMarkedComplete(
  feature: ClassFeature,
  selectedChoices: FeatureChoiceSelections,
  highestCompletedRequiredFeatureLevel: number,
) {
  if (dashboardFeatureRequiresSelection(feature, selectedChoices)) {
    return dashboardFeatureChoiceComplete(feature, selectedChoices);
  }

  return highestCompletedRequiredFeatureLevel !== -1 &&
    feature.level <= highestCompletedRequiredFeatureLevel;
}

function getVisibleBackgroundChoiceFields(
  backgroundIndex: string,
  sectionId: string,
  fields: FeatureChoiceField[],
  selectedChoices: Record<string, string>,
) {
  if (!sectionId.endsWith("ability-scores")) {
    return fields;
  }

  const planKey = `${backgroundIndex}:${sectionId}:score-plan`;
  const selectedPlan = selectedChoices[planKey];

  if (selectedPlan === "increase-all-three-by-1") {
    const planField = fields.find((field) => field.id === "score-plan");
    const primaryField = fields.find((field) => field.id === "score-a");
    const secondaryField = fields.find((field) => field.id === "score-b");
    const thirdField = fields.find((field) => field.id === "score-c");

    if (planField && primaryField && secondaryField && thirdField) {
      return [planField, primaryField, secondaryField, thirdField];
    }

    if (planField && primaryField && secondaryField) {
      return [
        planField,
        primaryField,
        secondaryField,
        {
          ...secondaryField,
          id: "score-c",
          label: "Third Increase",
        },
      ];
    }
  }

  return fields.filter((field) => field.id !== "score-c");
}

function slugifyFeatureName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function formatOrdinal(value: number) {
  if (value % 100 >= 11 && value % 100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

function getCreatureSize(speciesName: string) {
  switch (speciesName.toLowerCase()) {
    case "halfling":
      return "Small";
    case "dwarf":
    case "human":
    case "elf":
    case "tiefling":
    default:
      return "Medium";
  }
}

function getSavingThrowProficiencyIndexes(
  character: Character,
  effects?: FeatureChoiceEffectSummary,
): AbilityIndex[] {
  const persistedSaveIndexes = (character.proficiencies ?? [])
    .map((proficiency) =>
      savingThrowAbilityIndexFromReference(
        proficiency.proficiency.index,
        proficiency.proficiency.name,
      ),
    )
    .filter(isPresent);

  const trainingCharacter = character as TrainingReferenceCharacter;
  const classSourceJson = getProficiencySourceJson(trainingCharacter.class.sourceJson);
  const sourceSaveIndexes = (classSourceJson.proficiencies ?? [])
    .map((proficiency) =>
      savingThrowAbilityIndexFromReference(
        stringValue(proficiency.index),
        stringValue(proficiency.name),
      ),
    )
    .filter(isPresent);

  return [
    ...new Set([
      ...persistedSaveIndexes,
      ...sourceSaveIndexes,
      ...(effects ? [...effects.savingThrowProficiencyIndexes] : []),
    ]),
  ];
}

function savingThrowAbilityIndexFromReference(
  index: string | null | undefined,
  name: string | null | undefined,
): AbilityIndex | null {
  const normalizedIndex = index?.toLowerCase() ?? "";
  const normalizedName = name?.toLowerCase() ?? "";
  const value = normalizedIndex.replace(/^saving-throw-/, "") ||
    normalizedName.replace(/^saving throw:\s*/, "").slice(0, 3);

  if (value.startsWith("str")) {
    return "str";
  }

  if (value.startsWith("dex")) {
    return "dex";
  }

  if (value.startsWith("con")) {
    return "con";
  }

  if (value.startsWith("int")) {
    return "int";
  }

  if (value.startsWith("wis")) {
    return "wis";
  }

  if (value.startsWith("cha")) {
    return "cha";
  }

  return null;
}

function getSkillTotal(skills: SkillWithTotal[], name: string) {
  return skills.find((skill) => skill.name === name)?.total ?? 0;
}

function hasUnlockedClassFeature(
  selectedClass: ClassOption,
  characterLevel: number,
  featureIndex: string,
) {
  const normalizedFeatureIndex = featureIndex.toLowerCase();

  return selectedClass.features.some((feature) => {
    if (feature.level > characterLevel) {
      return false;
    }

    return `${feature.id} ${feature.title}`.toLowerCase().includes(normalizedFeatureIndex);
  });
}

function getHeritageSenseDetails(heritage: SpeciesHeritageOption | null | undefined) {
  return (heritage?.traits ?? [])
    .filter((trait) =>
      hasSenseKeyword(`${trait.name} ${trait.description ?? ""}`),
    )
    .map((trait) => trait.description ?? trait.name);
}

function getSpeciesSenseDetails(character: Character) {
  const trainingCharacter = character as TrainingReferenceCharacter;

  return (trainingCharacter.species.traits ?? [])
    .filter((trait) => hasSenseKeyword(`${trait.name} ${trait.description ?? ""}`))
    .map((trait) => trait.description ?? trait.name);
}

function getDerivedSourceSenseDetails(sources: CharacterDerivedSource[]) {
  const senseMatches = sources.flatMap((source) => {
    const description = `${source.title}. ${source.description}`;
    const matches = [
      ...description.matchAll(
        /\b(darkvision|blindsight|tremorsense|truesight)\b[^.]*?(?:(\d+)\s*-?\s*foot|\((\d+)\s*ft\.?\))/gi,
      ),
    ];

    if (matches.length > 0) {
      return matches.map((match) => {
        const senseName = match[1] ? capitalizeLabel(match[1]) : source.title;
        const range = match[2] ?? match[3] ?? null;

        return range ? `${senseName} ${range} ft.` : senseName;
      });
    }

    if (hasSenseKeyword(description)) {
      return [source.title];
    }

    return [];
  });

  return uniqueTrainingValues(senseMatches);
}

function getActionSubtitle(action: CharacterActionEntry) {
  const sourceLabel =
    action.sourceType === "class_feature"
      ? "Class Feature"
      : action.sourceType === "subclass_feature"
        ? "Subclass Feature"
        : action.sourceType === "item"
          ? "Equipped Item"
          : "Species Trait";
  const activationLabel = formatActivationLabel(action.activationType);
  const levelLabel = action.level ? `Level ${action.level}` : null;

  return [activationLabel, sourceLabel, levelLabel].filter(isPresent).join(" - ");
}

function getReadableActionSubtitle(action: CharacterActionEntry) {
  const sourceLabel =
    action.sourceType === "class_feature"
      ? "Class Feature"
      : action.sourceType === "subclass_feature"
        ? "Subclass Feature"
        : action.sourceType === "item"
          ? "Equipped Item"
          : "Species Trait";
  const activationLabel = formatActivationLabel(action.activationType);
  const levelLabel = action.level ? `Level ${action.level}` : null;

  return [activationLabel, sourceLabel, levelLabel].filter(isPresent).join(" - ");
}

function getSpellEntrySubtitle(entry: CharacterSpellEntry) {
  const sourceLabel =
    entry.sourceType === "class_feature"
      ? "Class Feature"
      : entry.sourceType === "subclass_feature"
        ? "Subclass Feature"
        : entry.sourceType === "item"
          ? "Equipped Item"
          : "Species Trait";
  const kindLabel =
    entry.kind === "spellcasting"
      ? "Spellcasting"
      : entry.kind === "always_prepared"
        ? "Always Prepared"
        : "Spell Feature";
  const spellLevelLabel = getSpellLevelDisplay(entry.spellLevel);
  const levelLabel = entry.level ? `Character Level ${entry.level}` : null;

  return [spellLevelLabel, kindLabel, sourceLabel, levelLabel].filter(isPresent).join(" - ");
}

function isConcreteSpellEntry(entry: CharacterSpellEntry) {
  return (
    entry.preparationMode !== "feature" &&
    entry.preparationMode !== "spellcasting"
  );
}

function canPrepareSpell(entry: CharacterSpellEntry) {
  return (
    isConcreteSpellEntry(entry) &&
    !entry.isCantrip &&
    entry.preparationMode !== "always_prepared" &&
    entry.sourceType !== "species_trait"
  );
}

function isSpellPrepared(
  entry: CharacterSpellEntry,
  preparedSpellIds: Set<string>,
) {
  return (
    entry.preparationMode === "always_prepared" ||
    entry.preparationMode === "prepared" ||
    preparedSpellIds.has(entry.id)
  );
}

function getSpellLevelDisplay(spellLevel: number | null) {
  if (spellLevel === 0) {
    return "Cantrip";
  }

  if (spellLevel === null) {
    return null;
  }

  return `${formatOrdinal(spellLevel)}-level spell`;
}

function formatSpellFilterLabel(spellLevel: number) {
  if (spellLevel === 0) {
    return "- 0 -";
  }

  return formatOrdinal(spellLevel);
}

function formatSpellSlotTitle(spellLevel: number) {
  return spellLevel === 0
    ? "Cantrip"
    : `${formatOrdinal(spellLevel)}-level slots`;
}

function matchesSpellFilters(
  entry: CharacterSpellEntry,
  searchText: string,
  activeSpellLevelFilter: "all" | number,
) {
  const matchesLevel =
    activeSpellLevelFilter === "all" ||
    (entry.spellLevel ?? 0) === activeSpellLevelFilter;
  const normalizedSearch = searchText.trim().toLowerCase();

  if (!matchesLevel) {
    return false;
  }

  if (normalizedSearch.length === 0) {
    return true;
  }

  return `${entry.title} ${entry.description} ${getSpellEntrySubtitle(entry)}`
    .toLowerCase()
    .includes(normalizedSearch);
}

function getSpellPreparationLabel(
  entry: CharacterSpellEntry,
  preparedSpellIds: Set<string>,
) {
  switch (entry.preparationMode) {
    case "always_prepared":
      return "Always Prepared";
    case "prepared":
      return "Prepared";
    case "known":
      if (entry.isCantrip) {
        return "Cantrip";
      }

      return isSpellPrepared(entry, preparedSpellIds) ? "Prepared" : "Known";
    case "spellcasting":
      return "Spellcasting";
    case "feature":
    default:
      return "Feature";
  }
}

function groupSpellEntriesByLevel(
  entries: CharacterSpellEntry[],
  preparedSpellIds: Set<string>,
) {
  // The spells tab mixes persistent spell-library picks with derived spell features.
  // Only concrete spells are grouped here; passive spell features stay in their own section.
  const concreteEntries = entries.filter(isConcreteSpellEntry);
  const groupedEntries = new Map<string, { id: string; sortLevel: number; title: string; entries: CharacterSpellEntry[] }>();

  for (const entry of concreteEntries) {
    if (entry.spellLevel === null) {
      continue;
    }

    const spellLevel = entry.spellLevel;
    const sortLevel = spellLevel;
    const title =
      spellLevel === 0
        ? "Cantrips"
        : `${formatOrdinal(spellLevel)}-Level Spells`;
    const key = `spell-level-${spellLevel}`;
    const existingSection = groupedEntries.get(key);

    if (existingSection) {
      existingSection.entries.push(entry);
      continue;
    }

    groupedEntries.set(key, {
      entries: [entry],
      id: key,
      sortLevel,
      title,
    });
  }

  return [...groupedEntries.values()]
    .sort((left, right) => left.sortLevel - right.sortLevel)
    .map((section) => ({
      ...section,
      entries: [...section.entries].sort((left, right) => {
        const leftPrepared = isSpellPrepared(left, preparedSpellIds);
        const rightPrepared = isSpellPrepared(right, preparedSpellIds);

        if (leftPrepared !== rightPrepared) {
          return leftPrepared ? -1 : 1;
        }

        return left.title.localeCompare(right.title);
      }),
    }));
}

function itemGrantsAttunementBenefits(item: LiveInventoryItem) {
  return !item.requiresAttunement || item.attuned;
}

function calculateDisplayedArmorClass({
  baseArmorClass,
  constitutionModifier,
  dexterityModifier,
  charismaModifier,
  derivedArmorClassBonus,
  mode,
  nonBodyArmorClassBonus,
  equippedArmorClassBonus,
  isBodyArmorEquipped,
  wisdomModifier,
}: {
  baseArmorClass: number;
  constitutionModifier: number;
  derivedArmorClassBonus: number;
  dexterityModifier: number;
  charismaModifier: number;
  equippedArmorClassBonus: number;
  isBodyArmorEquipped: boolean;
  mode: DerivedArmorClassMode;
  nonBodyArmorClassBonus: number;
  wisdomModifier: number;
}) {
  // AC shown on the dashboard is the final blend of base character data,
  // backend-derived class rules, and live inventory sandbox bonuses.
  const baseWithBonuses = baseArmorClass + equippedArmorClassBonus + derivedArmorClassBonus;

  if (mode === "barbarian_unarmored" && !isBodyArmorEquipped) {
    return Math.max(
      baseWithBonuses,
      10 + dexterityModifier + constitutionModifier + nonBodyArmorClassBonus + derivedArmorClassBonus,
    );
  }

  if (mode === "monk_unarmored" && !isBodyArmorEquipped) {
    return Math.max(
      baseWithBonuses,
      10 + dexterityModifier + wisdomModifier + nonBodyArmorClassBonus + derivedArmorClassBonus,
    );
  }

  if (mode === "bard_dance_unarmored" && !isBodyArmorEquipped) {
    return Math.max(
      baseWithBonuses,
      10 + dexterityModifier + charismaModifier + nonBodyArmorClassBonus + derivedArmorClassBonus,
    );
  }

  return baseWithBonuses;
}

function formatConditionSummaryEntry(entry: { label: string; value: string }) {
  return entry.label === "Exhaustion" ? `${entry.label} ${entry.value}` : entry.label;
}

function formatActivationLabel(activationType: ActionActivationType) {
  switch (activationType) {
    case "attack":
      return "Attack";
    case "action":
      return "Action";
    case "bonus_action":
      return "Bonus Action";
    case "reaction":
      return "Reaction";
    case "other":
    default:
      return "Other";
  }
}

function formatActionFilterLabel(filter: ActionFilter) {
  if (filter === "all") {
    return "All Actions";
  }

  return formatActivationLabel(filter);
}

function formatEquipmentSlotLabel(slotId: string) {
  switch (slotId) {
    case "mainHand":
      return "Main Hand";
    case "offHand":
      return "Off Hand";
    default:
      return slotId.charAt(0).toUpperCase() + slotId.slice(1);
  }
}

function compareSkills(left: SkillWithTotal, right: SkillWithTotal) {
  const leftIndex = skillOrder.indexOf(left.name);
  const rightIndex = skillOrder.indexOf(right.name);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return (leftIndex === -1 ? Number.POSITIVE_INFINITY : leftIndex) -
      (rightIndex === -1 ? Number.POSITIVE_INFINITY : rightIndex);
  }

  return left.name.localeCompare(right.name);
}

function getTrainingProfile(
  character: Character,
  featureChoiceEffects: FeatureChoiceEffectSummary,
  selectedClass: ClassOption,
  selectedSpecies: SpeciesOption,
  selectedBackground: BackgroundOption,
) {
  const trainingCharacter = character as TrainingReferenceCharacter;
  const classSourceJson = getProficiencySourceJson(trainingCharacter.class.sourceJson);
  const backgroundSourceJson = getProficiencySourceJson(trainingCharacter.background.sourceJson);
  const speciesSourceJson = getLanguageSourceJson(trainingCharacter.species.sourceJson);
  const groupedClassProficiencies = groupClassProficiencies(
    getReferenceNames(classSourceJson.proficiencies),
  );
  const persistedTraining = getPersistedTrainingProficiencies(character);
  const armor = withFallbackLabel(
    mergeTrainingValues(
      groupedClassProficiencies.armor.length > 0
        ? groupedClassProficiencies.armor
        : trainingCharacter.class.proficiencies?.armor ??
          selectedClass.proficiencies?.armor ??
          [],
      persistedTraining.armor,
      featureChoiceEffects.armorNames,
    ),
    "None",
  );
  const weapons = withFallbackLabel(
    mergeTrainingValues(
      groupedClassProficiencies.weapons.length > 0
        ? groupedClassProficiencies.weapons
        : trainingCharacter.class.proficiencies?.weapons ??
          selectedClass.proficiencies?.weapons ??
          [],
      persistedTraining.weapons,
      featureChoiceEffects.weaponNames,
    ),
    "None",
  );
  const classTools =
    groupedClassProficiencies.tools.length > 0
      ? groupedClassProficiencies.tools
      : trainingCharacter.class.proficiencies?.tools ??
        selectedClass.proficiencies?.tools ??
        [];
  const backgroundTools = getToolProficiencies(backgroundSourceJson);
  const normalizedBackgroundTools = getNormalizedBackgroundToolProficiencies(
    trainingCharacter.background,
  );
  const mappedBackgroundTools = filterConcreteToolProficiencies(
    trainingCharacter.background.toolProficiencies ??
      selectedBackground.toolProficiencies ??
      [],
  );
  const concreteBackgroundTools = filterConcreteToolProficiencies(backgroundTools);
  const tools = withFallbackLabel(
    mergeTrainingValues(
      classTools,
      normalizedBackgroundTools.length > 0
        ? normalizedBackgroundTools
        : concreteBackgroundTools.length > 0
          ? concreteBackgroundTools
          : mappedBackgroundTools,
      persistedTraining.tools,
      featureChoiceEffects.toolNames,
      featureChoiceEffects.expertiseToolNames.map((toolName) => `${toolName} (Expertise)`),
    ),
    "None",
  );
  const languages = withFallbackLabel(
    mergeTrainingValues(
      trainingCharacter.languages?.length
        ? trainingCharacter.languages.map((language) => language.language.name)
        : getLanguages(speciesSourceJson).length > 0
          ? getLanguages(speciesSourceJson)
          : selectedSpecies.languages,
      getNormalizedBackgroundLanguageProficiencies(trainingCharacter.background),
      featureChoiceEffects.languageNames,
    ),
    "None recorded",
  );

  return {
    armor,
    languages,
    senses: "Standard vision",
    tools,
    weapons,
  };
}

function getFeatureChoiceEffects(
  featureChoices: CharacterFeatureChoiceSelection[],
  characterLevel: number,
): FeatureChoiceEffectSummary {
  const effects: FeatureChoiceEffectSummary = {
    armorNames: [],
    combatOptionIndexes: new Set(),
    expertiseSkillIndexes: new Set(),
    expertiseToolNames: [],
    featIndexes: new Set(),
    languageNames: [],
    savingThrowProficiencyIndexes: new Set(),
    skillProficiencyIndexes: new Set(),
    toolNames: [],
    weaponNames: [],
  };

  for (const choice of featureChoices) {
    if (isInactiveFeatureChoice(choice, characterLevel) || isEquipmentChoice(choice)) {
      continue;
    }

    const grantSummary = getFeatureChoiceGrantSummary(choice.grantsRawJson);

    grantSummary.combatOptionIndexes.forEach((index) => effects.combatOptionIndexes.add(index));
    grantSummary.expertiseSkillIndexes.forEach((index) => effects.expertiseSkillIndexes.add(index));
    effects.expertiseToolNames.push(...grantSummary.expertiseToolNames);
    grantSummary.savingThrowProficiencyIndexes.forEach((index) =>
      effects.savingThrowProficiencyIndexes.add(index),
    );
    grantSummary.skillProficiencyIndexes.forEach((index) => effects.skillProficiencyIndexes.add(index));
    effects.toolNames.push(...grantSummary.toolNames);
    effects.weaponNames.push(...grantSummary.weaponNames);
    effects.languageNames.push(...grantSummary.languageNames);
    effects.armorNames.push(...grantSummary.armorNames);

    const reference = getSelectedChoiceReference(choice);

    if (!reference) {
      continue;
    }

    if (reference.url?.toLowerCase().includes("/feats/") && reference.index) {
      effects.featIndexes.add(reference.index.toLowerCase());
    }

    const combatOptionIndex = getCombatOptionIndex(choice, reference);

    if (combatOptionIndex) {
      effects.combatOptionIndexes.add(combatOptionIndex);
    }

    const category = classifyChoiceReference(reference);

    if (!category) {
      continue;
    }

    if (isExpertiseFeatureChoice(choice)) {
      if (category === "skill") {
        const skillIndex = canonicalSkillIndex(reference.index ?? reference.name);

        if (skillIndex) {
          effects.expertiseSkillIndexes.add(skillIndex);
        }
      } else if (category === "tool") {
        effects.expertiseToolNames.push(stripReferencePrefix(reference.name));
      }

      continue;
    }

    switch (category) {
      case "armor":
        effects.armorNames.push(stripReferencePrefix(reference.name));
        break;
      case "language":
        effects.languageNames.push(stripReferencePrefix(reference.name));
        break;
      case "saving-throw": {
        const abilityIndex = savingThrowAbilityIndexFromReference(reference.index, reference.name);

        if (abilityIndex) {
          effects.savingThrowProficiencyIndexes.add(abilityIndex);
        }
        break;
      }
      case "skill": {
        const skillIndex = canonicalSkillIndex(reference.index ?? reference.name);

        if (skillIndex) {
          effects.skillProficiencyIndexes.add(skillIndex);
        }
        break;
      }
      case "tool":
        effects.toolNames.push(stripReferencePrefix(reference.name));
        break;
      case "weapon":
        effects.weaponNames.push(stripReferencePrefix(reference.name));
        break;
    }
  }

  return {
    ...effects,
    armorNames: uniqueTrainingValues(effects.armorNames),
    expertiseToolNames: uniqueTrainingValues(effects.expertiseToolNames),
    languageNames: uniqueTrainingValues(effects.languageNames),
    toolNames: uniqueTrainingValues(effects.toolNames),
    weaponNames: uniqueTrainingValues(effects.weaponNames),
  };
}

function getFeatureChoiceGrantSummary(grantsRawJson: unknown) {
  const emptySummary = {
    armorNames: [] as string[],
    combatOptionIndexes: new Set<string>(),
    expertiseSkillIndexes: new Set<string>(),
    expertiseToolNames: [] as string[],
    languageNames: [] as string[],
    savingThrowProficiencyIndexes: new Set<AbilityIndex>(),
    skillProficiencyIndexes: new Set<string>(),
    toolNames: [] as string[],
    weaponNames: [] as string[],
  };

  if (!isRecord(grantsRawJson)) {
    return emptySummary;
  }

  const stringArray = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      : [];
  const derivedSourceIndexes = Array.isArray(grantsRawJson.derivedSources)
    ? grantsRawJson.derivedSources
        .map((entry) =>
          isRecord(entry) ? stringValue(entry.sourceIndex)?.toLowerCase() ?? null : null,
        )
        .filter(isPresent)
    : [];

  return {
    armorNames: stringArray(grantsRawJson.armorNames),
    combatOptionIndexes: new Set(derivedSourceIndexes),
    expertiseSkillIndexes: new Set(stringArray(grantsRawJson.expertiseSkillIndexes)),
    expertiseToolNames: stringArray(grantsRawJson.expertiseToolNames),
    languageNames: stringArray(grantsRawJson.languageNames),
    savingThrowProficiencyIndexes: new Set(
      stringArray(grantsRawJson.savingThrowProficiencyIndexes)
        .map(normalizeSavingThrowGrantAbilityIndex)
        .filter(isPresent),
    ),
    skillProficiencyIndexes: new Set(stringArray(grantsRawJson.skillProficiencyIndexes)),
    toolNames: stringArray(grantsRawJson.toolNames),
    weaponNames: stringArray(grantsRawJson.weaponNames),
  };
}

function normalizeSavingThrowGrantAbilityIndex(value: string): AbilityIndex | null {
  return savingThrowAbilityIndexFromReference(value, value);
}

function getSavedFeatureChoiceStatus(
  choice: CharacterFeatureChoiceSelection,
  effects: FeatureChoiceEffectSummary,
  character: Character,
) {
  const reference = getSelectedChoiceReference(choice);
  const category = !isInactiveFeatureChoice(choice, character.level) &&
    !isEquipmentChoice(choice) &&
    reference
    ? classifyChoiceReference(reference)
    : null;

  if (isInactiveFeatureChoice(choice, character.level)) {
    return `${choice.selectedOptionType} - Choice selected; inactive until level ${choice.level}.`;
  }

  if (isExpertiseFeatureChoice(choice)) {
    if (category === "skill") {
      const skillIndex = canonicalSkillIndex(reference?.index ?? reference?.name);

      return skillIndex &&
        effects.expertiseSkillIndexes.has(skillIndex) &&
        isCharacterProficientInSkill(character, effects, skillIndex)
        ? `${choice.selectedOptionType} - Expertise applied where proficient.`
        : `${choice.selectedOptionType} - Expertise choice selected; inactive until proficient.`;
    }

    if (category === "tool") {
      return `${choice.selectedOptionType} - Expertise choice selected; tool roll mechanics are not automated yet.`;
    }
  }

  if (category) {
    return category === "saving-throw"
      ? `${choice.selectedOptionType} - Applied as saving throw proficiency.`
      : `${choice.selectedOptionType} - Applied as ${category} proficiency.`;
  }

  const combatOptionIndex = getCombatOptionIndex(choice, reference);

  if (combatOptionIndex && effects.combatOptionIndexes.has(combatOptionIndex)) {
    return `${choice.selectedOptionType} - Applied as an active combat feature.`;
  }

  return `${choice.selectedOptionType} - Choice selected; mechanics are not automated yet.`;
}

function isCharacterProficientInSkill(
  character: Character,
  effects: FeatureChoiceEffectSummary,
  skillIndex: string,
) {
  return (
    effects.skillProficiencyIndexes.has(skillIndex) ||
    character.skills.some(
      (skill) => skill.isProficient && canonicalSkillIndex(skill.skillIndex) === skillIndex,
    )
  );
}

function getSelectedChoiceReference(
  choice: CharacterFeatureChoiceSelection,
): { index: string | null; name: string; url: string | null } | null {
  const rawReference = getRawReference(choice.selectedRawJson);
  const name =
    rawReference?.name ??
    choice.selectedOptionName ??
    choice.selectedOptionIndex ??
    null;

  if (!name) {
    return null;
  }

  return {
    index: rawReference?.index ?? choice.selectedOptionIndex ?? null,
    name,
    url: rawReference?.url ?? choice.selectedOptionUrl ?? null,
  };
}

function getRawReference(value: unknown): { index?: string; name?: string; url?: string } | null {
  if (!isRecord(value)) {
    return null;
  }

  const item = isRecord(value.item) ? value.item : isRecord(value.of) ? value.of : null;

  if (!item) {
    return null;
  }

  return {
    index: stringValue(item.index) ?? undefined,
    name: stringValue(item.name) ?? undefined,
    url: stringValue(item.url) ?? undefined,
  };
}

function classifyChoiceReference(reference: { index: string | null; name: string; url: string | null }) {
  const index = reference.index?.toLowerCase() ?? "";
  const name = reference.name.toLowerCase();
  const url = reference.url?.toLowerCase() ?? "";
  const isProficiencyReference = url.includes("/proficiencies/");
  const isLanguageReference = url.includes("/languages/") || name.startsWith("language:");

  if (isProficiencyReference && (name.startsWith("skill:") || index.startsWith("skill-"))) {
    return "skill";
  }

  if (name.startsWith("saving throw:") || index.startsWith("saving-throw-")) {
    return "saving-throw";
  }

  if (isLanguageReference || index.startsWith("language-")) {
    return "language";
  }

  if (!isProficiencyReference) {
    return null;
  }

  if (
    name.startsWith("armor:") ||
    index.includes("armor") ||
    index === "shields" ||
    name === "shields"
  ) {
    return "armor";
  }

  if (
    name.startsWith("weapon:") ||
    index.includes("weapon") ||
    index.includes("weapons") ||
    isWeaponLikeProficiency(index, name)
  ) {
    return "weapon";
  }

  if (
    name.startsWith("tool:") ||
    index.includes("tools") ||
    url.includes("/proficiencies/tool-") ||
    isToolLikeProficiency(index, name)
  ) {
    return "tool";
  }

  return "tool";
}

function isInactiveFeatureChoice(
  choice: CharacterFeatureChoiceSelection,
  characterLevel: number,
) {
  return typeof choice.level === "number" && choice.level > characterLevel;
}

function isEquipmentChoice(choice: CharacterFeatureChoiceSelection) {
  if (getRawReference(choice.selectedRawJson)?.url?.includes("/equipment")) {
    return true;
  }

  return [
    choice.choicePath,
    choice.choiceKey,
    choice.choiceLabel,
    choice.sourceIndex,
  ]
    .filter(isPresent)
    .some((value) => {
      const normalizedValue = value.toLowerCase();

      return (
        normalizedValue.includes("starting_equipment") ||
        normalizedValue.includes("equipment_options") ||
        normalizedValue.includes("starting-equipment")
      );
    });
}

function isSupplementalSavedFeatureChoice(
  choice: CharacterFeatureChoiceSelection,
) {
  const searchableText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
    choice.sourceIndex,
    choice.featureIndex,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  if (
    searchableText.includes("asi-mode") ||
    searchableText.includes("asi-feat") ||
    searchableText.includes("epic-boon") ||
    searchableText.includes("feat-ability-") ||
    searchableText.includes("feat-save-") ||
    searchableText.includes("feat-skill-") ||
    searchableText.includes("feat-expertise-") ||
    searchableText.includes("feat-weapon-")
  ) {
    return false;
  }

  return true;
}

function isWeaponLikeProficiency(index: string, name: string) {
  return [
    "axe",
    "blowgun",
    "bow",
    "club",
    "crossbow",
    "dagger",
    "dart",
    "flail",
    "glaive",
    "halberd",
    "hammer",
    "javelin",
    "lance",
    "mace",
    "net",
    "pike",
    "rapier",
    "scimitar",
    "sickle",
    "sling",
    "spear",
    "staff",
    "sword",
    "trident",
    "war-pick",
    "whip",
  ].some((keyword) => index.includes(keyword) || name.includes(keyword.replace(/-/g, " ")));
}

function isToolLikeProficiency(index: string, name: string) {
  return [
    "bagpipes",
    "cards",
    "chess",
    "dice",
    "drum",
    "dulcimer",
    "flute",
    "horn",
    "lute",
    "lyre",
    "pan-flute",
    "shawm",
    "viol",
    "supplies",
    "tools",
    "utensils",
    "kit",
    "instrument",
    "vehicle",
  ].some((keyword) => index.includes(keyword) || name.includes(keyword.replace(/-/g, " ")));
}

function isExpertiseFeatureChoice(choice: CharacterFeatureChoiceSelection) {
  return [
    choice.sourceIndex,
    choice.featureIndex,
    choice.choiceLabel,
    choice.choicePath,
    choice.choiceKey,
  ]
    .filter(isPresent)
    .some((value) => value.toLowerCase().includes("expertise"));
}

function getCombatOptionIndex(
  choice: CharacterFeatureChoiceSelection,
  reference: { index: string | null; name: string; url: string | null } | null,
) {
  const searchText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
    choice.featureIndex,
    choice.sourceIndex,
    choice.selectedOptionType,
    reference?.url,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  if (
    ![
      "fighting style",
      "weapon mastery",
      "metamagic",
      "pact boon",
      "eldritch invocation",
      "mystic arcanum",
      "elemental fury",
    ].some((label) => searchText.includes(label))
  ) {
    return null;
  }

  return (reference?.index ?? reference?.name ?? null)?.toLowerCase().replace(/[^a-z0-9-]+/g, "-") ?? null;
}

function getActiveCombatOptionIndexes(
  effects: FeatureChoiceEffectSummary,
  activeSources: CharacterDerivedSource[],
) {
  return new Set([
    ...effects.featIndexes,
    ...effects.combatOptionIndexes,
    ...activeSources.map((source) => source.sourceIndex.toLowerCase()),
  ]);
}

function canonicalSkillIndex(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return stripReferencePrefix(value)
    .toLowerCase()
    .replace(/^skill-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPersistedTrainingProficiencies(character: Character) {
  return (character.proficiencies ?? []).reduce(
    (groups, entry) => {
      const reference = {
        index: entry.proficiency.index,
        name: entry.proficiency.name,
        url: `/proficiencies/${entry.proficiency.index}`,
      };
      const category = classifyChoiceReference(reference);
      const label = stripReferencePrefix(entry.proficiency.name);

      if (category === "armor") {
        groups.armor.push(label);
      } else if (category === "tool") {
        groups.tools.push(label);
      } else if (category === "weapon") {
        groups.weapons.push(label);
      }

      return groups;
    },
    {
      armor: [] as string[],
      tools: [] as string[],
      weapons: [] as string[],
    },
  );
}

function mergeTrainingValues(...valueGroups: string[][]) {
  return uniqueTrainingValues(
    valueGroups
      .flat()
      .filter((value) => value !== unavailableTrainingValue),
  );
}

function getProficiencySourceJson(sourceJson: unknown): ProficiencySourceJson {
  return typeof sourceJson === "object" && sourceJson !== null
    ? sourceJson as ProficiencySourceJson
    : {};
}

function getLanguageSourceJson(sourceJson: unknown): LanguageSourceJson {
  return typeof sourceJson === "object" && sourceJson !== null
    ? sourceJson as LanguageSourceJson
    : {};
}

function getReferenceNames(references: ReferenceItem[] | undefined) {
  return (references ?? []).map((reference) => stringValue(reference.name)).filter(isPresent);
}

function groupClassProficiencies(proficiencies: string[]) {
  return proficiencies.reduce(
    (groups, proficiency) => {
      const normalizedName = stripReferencePrefix(proficiency);
      const normalizedKey = normalizedName.toLowerCase();

      if (proficiency.startsWith("Saving Throw:") || proficiency.startsWith("Skill:")) {
        return groups;
      }

      if (proficiency.startsWith("Tool:")) {
        groups.tools.push(normalizedName);
        return groups;
      }

      if (normalizedKey.includes("armor") || normalizedKey === "shields") {
        groups.armor.push(normalizedName);
        return groups;
      }

      groups.weapons.push(normalizedName);
      return groups;
    },
    {
      armor: [] as string[],
      tools: [] as string[],
      weapons: [] as string[],
    },
  );
}

function getToolProficiencies(sourceJson: ProficiencySourceJson) {
  return [
    ...getReferenceNames(sourceJson.proficiencies)
      .filter((proficiency) => proficiency.startsWith("Tool:"))
      .map(stripReferencePrefix),
    ...(sourceJson.proficiency_choices ?? [])
      .map((choice) => stringValue(choice.desc))
      .filter(isPresent),
  ];
}

function getNormalizedBackgroundToolProficiencies(
  background: TrainingReferenceCharacter["background"],
) {
  return (background.proficiencyGrants ?? [])
    .filter((grant) => grant.grantType === "TOOL")
    .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
    .filter(isPresent)
    .map(stripReferencePrefix);
}

function getNormalizedBackgroundLanguageProficiencies(
  background: TrainingReferenceCharacter["background"],
) {
  return (background.proficiencyGrants ?? [])
    .filter((grant) => grant.grantType === "LANGUAGE")
    .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
    .filter(isPresent)
    .map(stripReferencePrefix);
}

function filterConcreteToolProficiencies(values: string[]) {
  return values.filter((value) => {
    const normalizedValue = value.toLowerCase();

    return (
      !normalizedValue.startsWith("choose ") &&
      !normalizedValue.includes("(see equipment)") &&
      !normalizedValue.includes(" of your choice")
    );
  });
}

function getLanguages(sourceJson: LanguageSourceJson) {
  return [
    ...getReferenceNames(sourceJson.languages),
    stringValue(sourceJson.language_options?.desc),
  ].filter(isPresent);
}

function hasSenseKeyword(value: string) {
  const normalizedValue = value.toLowerCase();

  return ["darkvision", "blindsight", "tremorsense", "truesight"].some((keyword) =>
    normalizedValue.includes(keyword),
  );
}

function withFallbackLabel(values: string[], fallbackLabel: string) {
  const uniqueValues = uniqueTrainingValues(values);

  return uniqueValues.length > 0 ? uniqueValues : [fallbackLabel];
}

function uniqueTrainingValues(values: string[]) {
  const seenValues = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLowerCase();

    if (!trimmedValue || seenValues.has(normalizedValue)) {
      continue;
    }

    seenValues.add(normalizedValue);
    uniqueValues.push(trimmedValue);
  }

  return uniqueValues;
}

function stripReferencePrefix(value: string) {
  return value
    .replace(/^Skill: /, "")
    .replace(/^Tool: /, "")
    .replace(/^Weapon: /, "")
    .replace(/^Saving Throw: /, "");
}

function capitalizeLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function inferEquipmentSlotFromName(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("shield")) {
    return "offHand";
  }

  if (
    normalizedName.includes("sword") ||
    normalizedName.includes("axe") ||
    normalizedName.includes("hammer") ||
    normalizedName.includes("mace") ||
    normalizedName.includes("dagger") ||
    normalizedName.includes("bow") ||
    normalizedName.includes("crossbow") ||
    normalizedName.includes("blowgun") ||
    normalizedName.includes("sling") ||
    normalizedName.includes("javelin") ||
    normalizedName.includes("spear") ||
    normalizedName.includes("staff") ||
    normalizedName.includes("wand") ||
    normalizedName.includes("rod")
  ) {
    return "mainHand";
  }

  if (normalizedName.includes("helmet") || normalizedName.includes("helm") || normalizedName.includes("hat")) {
    return "head";
  }

  if (normalizedName.includes("boot")) {
    return "feet";
  }

  if (normalizedName.includes("glove") || normalizedName.includes("gauntlet")) {
    return "hands";
  }

  if (
    normalizedName.includes("armor") ||
    normalizedName.includes("mail") ||
    normalizedName.includes("breastplate") ||
    normalizedName.includes("plate")
  ) {
    return "body";
  }

  return undefined;
}

function isLiveAttackItem(item: LiveInventoryItem) {
  return item.kind === "weapon" && item.damage.trim().length > 0 && !item.name.toLowerCase().includes("shield");
}

function createLiveWeaponActionRow({
  dexterityModifier,
  item,
  proficiencyBonus,
  strengthModifier,
}: {
  dexterityModifier: number;
  item: LiveInventoryItem;
  proficiencyBonus: number;
  strengthModifier: number;
}): ActionDisplayRow {
  const normalizedName = item.name.toLowerCase();
  const isRangedWeapon =
    normalizedName.includes("bow") ||
    normalizedName.includes("crossbow") ||
    normalizedName.includes("blowgun") ||
    normalizedName.includes("sling");
  const isFinesseWeapon =
    normalizedName.includes("dagger") ||
    normalizedName.includes("rapier") ||
    normalizedName.includes("shortsword") ||
    normalizedName.includes("scimitar");
  const abilityModifierValue = isRangedWeapon
    ? dexterityModifier
    : isFinesseWeapon
      ? Math.max(strengthModifier, dexterityModifier)
      : strengthModifier;
  const attackBonus = proficiencyBonus + abilityModifierValue + item.attackBonus;
  const damageBonus = abilityModifierValue + item.attackBonus;

  return {
    activationType: "attack",
    damage: appendDamageBonus(item.damage, damageBonus),
    displayMode: "table",
    hit: formatModifier(attackBonus),
    id: `live-weapon-${item.id}`,
    notes: item.notes || "Equipped weapon",
    range: inferWeaponRange(item.name),
    subtitle: "Equipped Weapon",
    title: item.name,
  };
}

function appendDamageBonus(damage: string, bonus: number) {
  const trimmedDamage = damage.trim();

  if (!trimmedDamage) {
    return bonus === 0 ? "--" : formatModifier(bonus);
  }

  if (bonus === 0) {
    return trimmedDamage;
  }

  const match = trimmedDamage.match(/^(\d*d\d+)(.*)$/i);

  if (!match) {
    return `${trimmedDamage} ${formatModifier(bonus)}`;
  }

  return `${match[1]} ${formatModifier(bonus)}${match[2] ?? ""}`.trim();
}

function inferWeaponRange(name: string) {
  const normalizedName = name.toLowerCase();

  if (normalizedName.includes("blowgun")) {
    return "25 ft.";
  }

  if (normalizedName.includes("longbow")) {
    return "150 ft.";
  }

  if (normalizedName.includes("shortbow") || normalizedName.includes("crossbow")) {
    return "80 ft.";
  }

  if (normalizedName.includes("sling")) {
    return "30 ft.";
  }

  if (normalizedName.includes("dagger") || normalizedName.includes("javelin") || normalizedName.includes("spear")) {
    return "20 ft.";
  }

  return "5 ft.";
}

function getD20FormulaFromDisplayModifier(value: string) {
  const trimmedValue = value.trim();

  if (!/^[+-]?\d+$/.test(trimmedValue)) {
    return null;
  }

  return formatD20Formula(Number.parseInt(trimmedValue, 10));
}

function getDamageRollFromDisplay(value: string) {
  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^((?:\d*)d\d+(?:\s*[+-]\s*\d+)?)(?:\s+([a-z][a-z -]*))?$/i);

  if (!match) {
    return null;
  }

  const formula = match[1].trim();

  if (!canParseDiceExpression(formula)) {
    return null;
  }

  return {
    damageType: match[2]?.trim().toLowerCase(),
    formula,
  };
}

function summarizeEquippedItemDefenses(items: LiveInventoryItem[]) {
  const resistances = new Set<string>();

  items
    .filter(itemGrantsAttunementBenefits)
    .forEach((item) => {
      const itemEffects = deriveReferenceEquipmentEffects({
        description: item.notes,
        index: item.referenceEquipmentIndex,
        itemType: item.kind,
        name: item.name,
      });

      itemEffects.resistances.forEach((resistance) => resistances.add(resistance));
    });

  if (resistances.size === 0) {
    return [];
  }

  return [
    {
      label: "Resistances",
      value: [...resistances].join(", "),
    },
  ];
}

function mergeDefenseSummaryEntries(
  baseEntries: Array<{ label: string; value: string }>,
  itemEntries: Array<{ label: string; value: string }>,
) {
  const grouped = new Map<string, Set<string>>();

  [...baseEntries, ...itemEntries].forEach((entry) => {
    const values = entry.value
      .split(",")
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const bucket = grouped.get(entry.label) ?? new Set<string>();

    values.forEach((value) => bucket.add(value));
    grouped.set(entry.label, bucket);
  });

  return [...grouped.entries()].map(([label, values]) => ({
    label,
    value: [...values].join(", "),
  }));
}

export { CharacterSheet };
export type { WorkspaceTab };
export type { ProgressionChoiceSummary, ResourceActionSummary, SpellcastingSummary };
