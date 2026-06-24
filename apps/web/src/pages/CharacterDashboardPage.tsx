import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import {
  ConditionsSidebar,
  createDefaultConditionState,
  getConditionSummaryEntries,
  type ConditionId,
  type ConditionState,
} from "../features/characters/components/ConditionsSidebar";
import { CharacterBuilderSidebar } from "../features/characters/components/CharacterBuilderSidebar";
import { CharacterSelectionPanel } from "../features/characters/components/CharacterSelectionPanel";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import type {
  ProgressionChoiceSummary,
  ResourceActionSummary,
  SpellcastingSummary,
  WorkspaceTab,
} from "../features/characters/components/CharacterSheet";
import { useCharacterBuilder } from "../features/characters/hooks/useCharacterBuilder";
import { useCharacterDerivedState } from "../features/characters/hooks/useCharacterDerivedState";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  ClassSpellcastingLevelSummary,
  ClassSubclassOption,
  FeatureChoiceSelections,
  FeatureChoiceField,
  SpeciesOption,
} from "../features/characters/types/characterBuilder";
import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
} from "../features/characters/utils/selectedCharacter";
import { getSelectedFeatIndexesForPreview } from "../features/characters/utils/buildCharacterPreview";
import {
  buildGenericBackgroundFeatureChoices,
  buildGenericClassFeatureChoices,
  getVisibleChoiceFieldsForSelection,
} from "../features/characters/utils/buildFeatureChoiceSelections";
import type {
  AbilityScores,
  Character,
  CharacterFeatureSelection,
  CharacterSavePayload,
} from "../types/character";
import type { CharacterDerivedState } from "../types/characterDerived";
import {
  InventoryDetailsSidebar,
  useInventorySandboxController,
} from "./InventorySandboxPage";

const abilityScoreIndexes = ["str", "dex", "con", "int", "wis", "cha"] as const;
const backgroundAbilityPlanThreeScores = "increase-all-three-by-1";
const spellcastingAbilityFallbacks: Record<string, keyof AbilityScores> = {
  bard: "cha",
  cleric: "wis",
  druid: "wis",
  paladin: "cha",
  ranger: "wis",
  sorcerer: "cha",
  warlock: "cha",
  wizard: "int",
};
const spellcastingTypeFallbacks: Record<string, SpellcastingSummary["castingType"]> = {
  bard: "Full caster",
  cleric: "Full caster",
  druid: "Full caster",
  paladin: "Half caster",
  ranger: "Half caster",
  sorcerer: "Full caster",
  warlock: "Pact Magic",
  wizard: "Full caster",
};
const fullCasterSlotProgression: Array<{ cantripsKnown: number; spellSlots: number[] }> = [
  { cantripsKnown: 3, spellSlots: [2] },
  { cantripsKnown: 3, spellSlots: [3] },
  { cantripsKnown: 3, spellSlots: [4, 2] },
  { cantripsKnown: 4, spellSlots: [4, 3] },
  { cantripsKnown: 4, spellSlots: [4, 3, 2] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3, 1] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3, 2] },
  { cantripsKnown: 4, spellSlots: [4, 3, 3, 3, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 2, 1, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 1, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 1, 1, 1] },
  { cantripsKnown: 5, spellSlots: [4, 3, 3, 3, 3, 2, 2, 1, 1] },
];
const halfCasterSlotProgression: number[][] = [
  [2],
  [2],
  [3],
  [3],
  [4, 2],
  [4, 2],
  [4, 3],
  [4, 3],
  [4, 3, 2],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2],
];
const knownSpellFallbacks: Record<string, number[]> = {
  bard: [4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22],
  sorcerer: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15],
  warlock: [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15],
};
const abilityScoreIndexAliases: Record<string, keyof AbilityScores> = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

function CharacterDashboardPage() {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>("actions");
  const [isBuilderSidebarHidden, setIsBuilderSidebarHidden] = useState(false);
  const [rightRailMode, setRightRailMode] = useState<"conditions" | "inventory" | null>(null);
  const [conditionState, setConditionState] = useState<ConditionState>(createDefaultConditionState);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const {
    addCondition,
    characters,
    error,
    loading,
    removeCondition,
    saveCharacter,
    saveError,
    savingCharacterId,
  } = useCharacters();
  const selectedCharacterId = getSelectedCharacterId();
  const selectedCharacter = useMemo(
    () =>
      selectedCharacterId
        ? characters.find((entry) => entry.id === selectedCharacterId)
        : undefined,
    [characters, selectedCharacterId],
  );
  const character = selectedCharacter ?? characters[0];
  const inventoryController = useInventorySandboxController(
    character ? `character-${character.id}` : "dashboard",
    character?.id,
  );

  useEffect(() => {
    if (!loading && selectedCharacterId && characters.length > 0 && !selectedCharacter) {
      clearSelectedCharacterId(selectedCharacterId);
    }
  }, [characters.length, loading, selectedCharacter, selectedCharacterId]);

  const {
    activePanel,
    applyCurrentHpAdjustment,
    applyHitPointConfiguration,
    backgroundChoices,
    backgroundOptions,
    builderState,
    classOptions,
    closePanel,
    confirmSelection,
    featureChoices,
    handleRollAbility,
    handleRollAllAbilities,
    hitPointPreview,
    hitPointSettings,
    openPanel,
    pendingSelection,
    persistedSkillIndexes,
    previewCharacter,
    selectedBackground,
    selectedClass,
    selectedPanelOption,
    selectedSkillIndexes,
    selectedSpecies,
    setFeatureChoices,
    setSelection,
    setSubclassIndex,
    setTempHp,
    speciesChoices,
    speciesOptions,
    updateAbilityAssignment,
  } = useCharacterBuilder(character);
  const resolvedSubclassIndex = useMemo(
    () =>
      getSelectedSubclassIndexForSave(
        builderState?.subclassIndex ?? character?.subclassIndex ?? null,
        selectedClass,
        featureChoices,
      ),
    [
      builderState?.subclassIndex,
      character?.subclassIndex,
      featureChoices,
      selectedClass,
    ],
  );

  const builderActionPreview = useMemo(
    () => ({
      backgroundIndex: builderState?.backgroundIndex ?? character?.backgroundIndex,
      classIndex: builderState?.classIndex ?? character?.classIndex,
      featIndexes: getSelectedFeatIndexesForPreview(
        selectedClass,
        featureChoices,
        builderState?.level ?? character?.level ?? 1,
      ),
      level: builderState?.level ?? character?.level,
      speciesIndex: builderState?.speciesIndex ?? character?.speciesIndex,
      subclassIndex: resolvedSubclassIndex ?? undefined,
      subspeciesIndex: getSelectedSpeciesHeritageIndex(selectedSpecies, speciesChoices),
    }),
    [
      builderState?.backgroundIndex,
      builderState?.classIndex,
      builderState?.level,
      builderState?.speciesIndex,
      character?.backgroundIndex,
      character?.classIndex,
      character?.level,
      character?.speciesIndex,
      featureChoices,
      resolvedSubclassIndex,
      selectedClass,
      selectedSpecies,
      speciesChoices,
    ],
  );
  const selectedHeritage = useMemo(
    () => getSelectedSpeciesHeritage(selectedSpecies, speciesChoices),
    [selectedSpecies, speciesChoices],
  );
  const selectedSubclass = useMemo(
    () =>
      selectedClass.subclasses?.find(
        (subclass) => subclass.index === resolvedSubclassIndex,
      ) ?? null,
    [resolvedSubclassIndex, selectedClass.subclasses],
  );
  const progressionChoiceSummaries = useMemo(
    () =>
      builderState
        ? getProgressionChoiceSummaries(
            selectedClass,
            builderState.level,
            featureChoices,
          )
        : [],
    [builderState, featureChoices, selectedClass],
  );
  const spellcastingSummary = useMemo(
    () =>
      previewCharacter && builderState
        ? getSpellcastingSummary(previewCharacter, selectedClass, selectedSubclass)
        : null,
    [builderState, previewCharacter, selectedClass, selectedSubclass],
  );
  const resourceActionSummaries = useMemo(
    () =>
      builderState
        ? getResourceActionSummaries(selectedClass, builderState.level)
        : [],
    [builderState, selectedClass],
  );
  const {
    derivedState: characterDerivedStateWithPreview,
    error: characterDerivedStateErrorWithPreview,
    loading: characterDerivedStateLoadingWithPreview,
  } = useCharacterDerivedState(character?.id ?? null, builderActionPreview);
  const defenseSummary = useMemo(
    () => summarizeDefenses(characterDerivedStateWithPreview?.defenses ?? []),
    [characterDerivedStateWithPreview?.defenses],
  );
  const conditionSummary = useMemo(
    () => getConditionSummaryEntries(conditionState),
    [conditionState],
  );
  const isSavingBuild = Boolean(character && savingCharacterId === character.id);

  useEffect(() => {
    if (activeWorkspaceTab === "inventory") {
      setRightRailMode("inventory");
      return;
    }

    setRightRailMode((currentMode) => (currentMode === "inventory" ? null : currentMode));
  }, [activeWorkspaceTab]);

  useEffect(() => {
    setConditionState(buildConditionStateFromCharacter(character));
  }, [character]);

  async function handleSaveBuild() {
    if (!character || !builderState) {
      return;
    }

    setSaveSuccessMessage(null);

    const updatedCharacter = await saveCharacter(
      character.id,
      buildCharacterSavePayload(
        character,
        builderState,
        selectedClass,
        selectedBackground,
        persistedSkillIndexes,
        selectedSkillIndexes,
        featureChoices,
        backgroundChoices,
        speciesChoices,
      ),
    );

    if (updatedCharacter) {
      setSaveSuccessMessage("Build saved.");
    }
  }

  async function toggleCondition(conditionId: ConditionId) {
    if (!character) {
      return;
    }

    const isActive = conditionState.activeConditions[conditionId];
    const updatedCharacter = isActive
      ? await removeCondition(character.id, conditionId)
      : await addCondition(character.id, conditionId);

    if (updatedCharacter) {
      setConditionState(buildConditionStateFromCharacter(updatedCharacter));
    }
  }

  return (
    <AppLayout variant="wide-left">
      <section className="character-section">
        {loading && <p>Loading character...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && !character && <p>No characters found.</p>}

        {previewCharacter && builderState ? (
          <div
            className={
              isBuilderSidebarHidden
                ? "dashboard-layout dashboard-layout-sidebar-hidden"
                : "dashboard-layout"
            }
          >
            <div
              className={
                isBuilderSidebarHidden
                  ? "dashboard-builder-shell dashboard-builder-shell-hidden"
                  : "dashboard-builder-shell dashboard-builder-shell-open"
              }
            >
              <button
                type="button"
                className="dashboard-sidebar-toggle"
                aria-label={isBuilderSidebarHidden ? "Show sidebar" : "Hide sidebar"}
                onClick={() => setIsBuilderSidebarHidden((currentValue) => !currentValue)}
              >
                <span className="dashboard-sidebar-toggle-icon" aria-hidden="true">
                  {isBuilderSidebarHidden ? "\u203A\u203A" : "\u2039\u2039"}
                </span>
              </button>

              <div className="dashboard-builder-panel">
                <button
                  type="button"
                  className="primary-button primary-button-uppercase"
                  disabled={isSavingBuild}
                  onClick={handleSaveBuild}
                >
                  {isSavingBuild ? "Saving..." : "Save Build"}
                </button>
                {saveSuccessMessage ? <p className="muted">{saveSuccessMessage}</p> : null}
                {saveError ? <p className="error-message">{saveError}</p> : null}

                <CharacterBuilderSidebar
                  abilityAssignments={builderState.abilityAssignments}
                  abilityScores={previewCharacter.abilityScores}
                  background={selectedBackground}
                  characterLevel={previewCharacter.level}
                  classOption={selectedClass}
                  hitPointPreview={hitPointPreview}
                  hitPointSettings={hitPointSettings}
                  onAbilityAssignmentChange={updateAbilityAssignment}
                  onApplyHitPointSettings={applyHitPointConfiguration}
                  onFeatureChoicesChange={setFeatureChoices}
                  onOpenPanel={openPanel}
                  onRollAbility={handleRollAbility}
                  onRollAllAbilities={handleRollAllAbilities}
                  onSubclassChange={setSubclassIndex}
                  selectedChoices={featureChoices}
                  selectedSubclassIndex={builderState.subclassIndex}
                  species={selectedSpecies}
                />
              </div>
            </div>

            <CharacterSheet
              activeTab={activeWorkspaceTab}
              backgroundChoices={backgroundChoices}
              character={previewCharacter}
              conditionSummary={conditionSummary}
              currentHp={builderState.currentHp}
              defenseSummary={defenseSummary}
              derivedState={characterDerivedStateWithPreview}
              derivedStateError={characterDerivedStateErrorWithPreview}
              derivedStateLoading={characterDerivedStateLoadingWithPreview}
              featureChoices={featureChoices}
              inventoryController={inventoryController}
              onActiveTabChange={setActiveWorkspaceTab}
              progressionChoiceSummaries={progressionChoiceSummaries}
              resourceActionSummaries={resourceActionSummaries}
              selectedHeritage={selectedHeritage}
              selectedSubclassName={selectedSubclass?.name ?? null}
              spellcastingSummary={spellcastingSummary}
              onApplyCurrentHpAdjustment={applyCurrentHpAdjustment}
              onOpenConditions={() => setRightRailMode("conditions")}
              onSetTempHp={setTempHp}
              selectedBackground={selectedBackground}
              selectedClass={selectedClass}
              selectedSpecies={selectedSpecies}
              speciesChoices={speciesChoices}
              tempHp={builderState.tempHp}
            />

            {rightRailMode === "conditions" ? (
              <ConditionsSidebar
                conditionState={conditionState}
                isOpen
                onSetExhaustionLevel={(level) =>
                  setConditionState((currentState) => ({
                    ...currentState,
                    exhaustionLevel: level,
                  }))
                }
                onToggleCondition={(conditionId) => {
                  void toggleCondition(conditionId);
                }}
              />
            ) : (
              <InventoryDetailsSidebar
                controller={inventoryController}
                isOpen={rightRailMode === "inventory"}
              />
            )}
          </div>
        ) : null}
      </section>

      <CharacterSelectionPanel
        activePanel={activePanel}
        backgroundSelectionValues={backgroundChoices}
        backgroundOptions={backgroundOptions}
        classOptions={classOptions}
        onClose={closePanel}
        onConfirm={confirmSelection}
        onSelect={setSelection}
        pendingSelection={pendingSelection}
        selectedOption={selectedPanelOption}
        speciesSelectionValues={speciesChoices}
        speciesOptions={speciesOptions}
      />
    </AppLayout>
  );
}

function buildCharacterSavePayload(
  character: Character,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
  classOption: ClassOption,
  backgroundOption: BackgroundOption,
  persistedSkillIndexes: string[],
  selectedSkillIndexes: string[],
  featureChoices: FeatureChoiceSelections,
  backgroundChoices: Record<string, string>,
  speciesChoices: Record<string, string>,
): CharacterSavePayload {
  return {
    name: character.name,
    speciesIndex: builderState.speciesIndex,
    classIndex: builderState.classIndex,
    subclassIndex: getSelectedSubclassIndexForSave(
      builderState.subclassIndex,
      classOption,
      featureChoices,
    ),
    backgroundIndex: builderState.backgroundIndex,
    alignment: character.alignment,
    level: builderState.level,
    currentHp: builderState.currentHp,
    hitPointState: {
      ...builderState.hitPointSettings,
      tempHp: builderState.tempHp,
    },
    skillIndexes: [...new Set([...persistedSkillIndexes, ...selectedSkillIndexes])],
    choices: [
      ...buildClassSkillChoices(builderState.classIndex, classOption, featureChoices),
      ...buildSpeciesLanguageChoices(builderState.speciesIndex, speciesChoices),
      ...buildSpeciesHeritageChoices(builderState.speciesIndex, speciesChoices),
      ...buildBackgroundAbilityChoices(builderState.backgroundIndex, backgroundChoices),
    ],
    featureChoices: buildGenericClassFeatureChoices(
      builderState.classIndex,
      classOption,
      builderState.level,
      featureChoices,
    ).concat(buildGenericBackgroundFeatureChoices(backgroundOption, backgroundChoices)),
    abilityScores: buildAbilityScorePayload(character, builderState),
  };
}

function getSelectedSubclassIndexForSave(
  subclassIndex: string | null,
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (subclassIndex && subclassIndexes.has(subclassIndex)) {
    return subclassIndex;
  }

  for (const feature of classOption.features) {
    for (const field of feature.choiceFields ?? []) {
      if (field.choiceKind !== "subclass") {
        continue;
      }

      const selectedValue = featureChoices[`${feature.id}:${field.id}`];
      const selectedOption = field.options.find((option) => option.value === selectedValue);
      const selectedSubclassIndex = selectedOption?.selectedOptionIndex ?? selectedOption?.value;

      if (selectedSubclassIndex && subclassIndexes.has(selectedSubclassIndex)) {
        return selectedSubclassIndex;
      }
    }
  }

  return null;
}

function getProgressionChoiceSummaries(
  classOption: ClassOption,
  characterLevel: number,
  featureChoices: FeatureChoiceSelections,
): ProgressionChoiceSummary[] {
  return classOption.features
    .filter((feature) => feature.level <= characterLevel)
    .flatMap((feature) =>
      getVisibleChoiceFieldsForSelection(feature.id, feature.choiceFields, featureChoices)
        .filter((field) => isProgressionChoiceField(feature, field))
        .map((field) => {
          const selectedValue = featureChoices[`${feature.id}:${field.id}`];
          const selectedOption = field.options.find((option) => option.value === selectedValue);

          return {
            id: `${feature.id}:${field.id}`,
            label: `${feature.title}: ${field.label}`,
            level: field.level ?? feature.level,
            status: selectedOption ? "selected" as const : "missing" as const,
            value: selectedOption?.label ?? "Missing required choice",
          };
        }),
    );
}

function getSpellcastingSummary(
  character: Character,
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
): SpellcastingSummary | null {
  const abilityIndex = getSpellcastingAbilityIndex(classOption);

  if (!abilityIndex) {
    return null;
  }

  const abilityScore = character.abilityScores.find(
    (score) => score.abilityIndex === abilityIndex,
  );
  const abilityValue = abilityScore?.score ?? 10;
  const abilityModifier = Math.floor((abilityValue - 10) / 2);
  const proficiencyBonus = getProficiencyBonus(character.level);
  const levelSummary = getCurrentSpellcastingLevel(classOption, character.level);
  const slotRows = (levelSummary?.spellSlots ?? []).map((slot) => ({
    label: `Level ${slot.level}`,
    level: slot.level,
    slots: slot.slots,
    value: String(slot.slots),
  }));
  const knownPrepared = [
    levelSummary?.cantripsKnown !== undefined
      ? {
          label: "Cantrips Known",
          value: String(levelSummary.cantripsKnown),
        }
      : null,
    levelSummary?.spellsKnown !== undefined
      ? {
          label: "Spells Known",
          value: String(levelSummary.spellsKnown),
        }
      : null,
    levelSummary?.preparedSpells !== undefined
      ? {
          label: "Prepared Spells",
          value: String(levelSummary.preparedSpells),
        }
      : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry));

  return {
    abilityLabel: abilityScore?.ability.fullName ?? abilityIndex.toUpperCase(),
    attackBonus: abilityModifier + proficiencyBonus,
    castingType: getSpellcastingTypeLabel(classOption),
    knownPrepared,
    notes: getSpellcastingNotesForDisplay(classOption, selectedSubclass, character.level),
    proficiencyBonus,
    saveDc: 8 + abilityModifier + proficiencyBonus,
    slotRows,
    slotsAvailable: slotRows.length > 0,
    slotsUnavailableReason:
      "Spell slots are not available from the current reference data for this class level yet.",
  };
}

function getSpellcastingNotesForDisplay(
  classOption: ClassOption,
  selectedSubclass: ClassSubclassOption | null,
  characterLevel: number,
) {
  const baseNotes =
    classOption.index === "wizard"
      ? ["Prepare Wizard spells from your spellbook for which you have spell slots."]
      : classOption.spellcasting?.notes ?? [];

  return uniqueStrings([
    ...baseNotes,
    ...getSubclassSpellcastingNotes(selectedSubclass, characterLevel),
  ]);
}

function getSubclassSpellcastingNotes(
  selectedSubclass: ClassSubclassOption | null,
  characterLevel: number,
) {
  return (selectedSubclass?.features ?? [])
    .filter((feature) => feature.level <= characterLevel)
    .filter((feature) => {
      const searchableText = `${feature.name} ${feature.description}`.toLowerCase();

      return searchableText.includes("spell");
    })
    .map((feature) => `${selectedSubclass?.name}: ${feature.name} - ${feature.description}`);
}

function getSpellcastingAbilityIndex(classOption: ClassOption): keyof AbilityScores | null {
  const structuredAbilityIndex = canonicalAbilityScoreIndex(
    classOption.spellcasting?.abilityIndex ?? undefined,
  );

  if (structuredAbilityIndex) {
    return structuredAbilityIndex;
  }

  return spellcastingAbilityFallbacks[classOption.index] ?? null;
}

function getSpellcastingTypeLabel(classOption: ClassOption) {
  if (classOption.spellcasting?.castingType === "pact-magic") {
    return "Pact Magic";
  }

  if (classOption.spellcasting?.castingType === "half-caster") {
    return "Half caster";
  }

  if (classOption.spellcasting?.castingType === "full-caster") {
    return "Full caster";
  }

  return spellcastingTypeFallbacks[classOption.index] ?? "Spellcaster";
}

function getCurrentSpellcastingLevel(
  classOption: ClassOption,
  characterLevel: number,
): ClassSpellcastingLevelSummary | null {
  const levels = classOption.spellcasting?.levels ?? [];
  const referenceLevel = [...levels].reverse().find((level) => level.level <= characterLevel);

  if (referenceLevel) {
    return referenceLevel;
  }

  return getFallbackSpellcastingLevel(classOption.index, characterLevel);
}

function getFallbackSpellcastingLevel(
  classIndex: string,
  characterLevel: number,
): ClassSpellcastingLevelSummary | null {
  const normalizedLevel = Math.max(1, Math.min(20, characterLevel));
  const castingType = spellcastingTypeFallbacks[classIndex];

  if (castingType === "Full caster") {
    const progression = fullCasterSlotProgression[normalizedLevel - 1];

    return {
      cantripsKnown: progression.cantripsKnown,
      level: normalizedLevel,
      preparedSpells: getPreparedSpellFallback(classIndex, normalizedLevel),
      spellSlots: progression.spellSlots.map((slots, index) => ({
        level: index + 1,
        slots,
      })),
      spellsKnown: getKnownSpellFallback(classIndex, normalizedLevel),
    };
  }

  if (castingType === "Half caster") {
    const progression = halfCasterSlotProgression[normalizedLevel - 1] ?? [];

    return {
      level: normalizedLevel,
      preparedSpells: Math.max(1, Math.floor(normalizedLevel / 2) + 1),
      spellSlots: progression.map((slots, index) => ({
        level: index + 1,
        slots,
      })),
    };
  }

  if (castingType === "Pact Magic") {
    return {
      cantripsKnown: normalizedLevel < 4 ? 2 : normalizedLevel < 10 ? 3 : 4,
      level: normalizedLevel,
      spellSlots: [
        {
          level: normalizedLevel < 3 ? 1 : normalizedLevel < 5 ? 2 : normalizedLevel < 7 ? 3 : normalizedLevel < 9 ? 4 : 5,
          slots: normalizedLevel < 11 ? 2 : normalizedLevel < 17 ? 3 : 4,
        },
      ],
      spellsKnown: getKnownSpellFallback(classIndex, normalizedLevel),
    };
  }

  return null;
}

function getPreparedSpellFallback(classIndex: string, characterLevel: number) {
  if (["cleric", "druid", "wizard"].includes(classIndex)) {
    return Math.max(1, characterLevel + 3);
  }

  return undefined;
}

function getKnownSpellFallback(classIndex: string, characterLevel: number) {
  return knownSpellFallbacks[classIndex]?.[characterLevel - 1];
}

function uniqueStrings(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLowerCase();

    if (!trimmedValue || seen.has(normalizedValue)) {
      continue;
    }

    seen.add(normalizedValue);
    result.push(trimmedValue);
  }

  return result;
}

function getResourceActionSummaries(
  classOption: ClassOption,
  characterLevel: number,
): ResourceActionSummary[] {
  const summaries = classOption.features
    .filter((feature) => feature.level <= characterLevel)
    .map((feature) => getResourceActionSummary(feature, characterLevel))
    .filter((summary): summary is ResourceActionSummary => Boolean(summary));
  const byName = new Map<string, ResourceActionSummary>();

  for (const summary of summaries) {
    const existing = byName.get(summary.name);

    if (!existing || existing.level <= summary.level) {
      byName.set(summary.name, summary);
    }
  }

  return [...byName.values()].sort((left, right) => left.level - right.level || left.name.localeCompare(right.name));
}

function getResourceActionSummary(
  feature: ClassFeature,
  characterLevel: number,
): ResourceActionSummary | null {
  const key = `${feature.id} ${feature.title}`.toLowerCase();
  const base = {
    id: `resource:${feature.id}`,
    level: feature.level,
    sourceFeature: feature.title,
  };

  if (key.includes("rage")) {
    return {
      ...base,
      automationNote: "Summary only; damage, resistance, and duration automation are not implemented.",
      category: "bonus action",
      maxUses: "Uses follow class progression",
      name: "Rage",
      recharge: "Long Rest",
    };
  }

  if (key.includes("bardic-inspiration")) {
    return {
      ...base,
      automationNote: "Summary only; die size and target tracking are not automated.",
      category: "bonus action",
      maxUses: "Uses follow class progression",
      name: "Bardic Inspiration",
      recharge: "Long Rest / feature-based recovery",
    };
  }

  if (key.includes("channel-divinity")) {
    return {
      ...base,
      automationNote: "Summary only; subclass Channel Divinity effects are not automated.",
      category: "resource",
      maxUses: "Uses follow class progression",
      name: "Channel Divinity",
      recharge: "Short or Long Rest",
    };
  }

  if (key.includes("wild-shape")) {
    return {
      ...base,
      automationNote: "Summary only; beast forms and transformation stats are not implemented.",
      category: "resource",
      maxUses: "Uses follow class progression",
      name: "Wild Shape",
      recharge: "Short or Long Rest",
    };
  }

  if (key.includes("second-wind")) {
    return {
      ...base,
      automationNote: "Summary only; healing roll and use tracking are not automated.",
      category: "bonus action",
      maxUses: "Uses follow class progression",
      name: "Second Wind",
      recharge: "Long Rest",
    };
  }

  if (key.includes("action-surge")) {
    return {
      ...base,
      automationNote: "Summary only; extra action timing is not automated.",
      category: "resource",
      maxUses: key.includes("2-use") ? "2 uses" : "1 use",
      name: "Action Surge",
      recharge: "Short or Long Rest",
    };
  }

  if (key.includes("monks-focus") || key.includes("monk's focus")) {
    return {
      ...base,
      automationNote: "Summary only; Focus spenders are not automated.",
      category: "resource",
      maxUses: `${characterLevel} Focus Points`,
      name: "Monk's Focus",
      recharge: "Short or Long Rest",
    };
  }

  if (key.includes("lay-on-hands")) {
    return {
      ...base,
      automationNote: "Summary only; healing pool spending is not automated.",
      category: "bonus action",
      maxUses: `${characterLevel * 5} HP pool`,
      name: "Lay on Hands",
      recharge: "Long Rest",
    };
  }

  if (key.includes("cunning-action")) {
    return {
      ...base,
      automationNote: "Display only; action economy reminders are not automated.",
      category: "bonus action",
      maxUses: "At will",
      name: "Cunning Action",
    };
  }

  if (key.includes("cunning-strike")) {
    return {
      ...base,
      automationNote: "Summary only; Sneak Attack tradeoffs and save DCs are not automated.",
      category: "passive",
      name: key.includes("improved") ? "Improved Cunning Strike" : "Cunning Strike",
    };
  }

  if (key.includes("font-of-magic")) {
    return {
      ...base,
      automationNote: "Summary only; Sorcery Point spending and conversion are not automated.",
      category: "resource",
      maxUses: `${characterLevel} Sorcery Points`,
      name: "Font of Magic",
      recharge: "Long Rest",
    };
  }

  if (key.includes("pact-magic")) {
    return {
      ...base,
      automationNote: "Spell slot details appear in the Spells tab when reference data provides them.",
      category: "resource",
      name: "Pact Magic",
      recharge: "Short or Long Rest",
    };
  }

  if (key.includes("mystic-arcanum")) {
    return {
      ...base,
      automationNote: "Summary only; arcanum spell choice and casting are not automated.",
      category: "resource",
      maxUses: "1 use",
      name: "Mystic Arcanum",
      recharge: "Long Rest",
    };
  }

  if (key.includes("arcane-recovery")) {
    return {
      ...base,
      automationNote: "Summary only; recovered slot selection is not automated.",
      category: "resource",
      name: "Arcane Recovery",
      recharge: "Long Rest",
    };
  }

  return null;
}

function getProficiencyBonus(level: number) {
  return level <= 4
    ? 2
    : level <= 8
      ? 3
      : level <= 12
        ? 4
        : level <= 16
          ? 5
          : 6;
}

function isProgressionChoiceField(feature: ClassFeature, field: FeatureChoiceField) {
  if (field.choiceKind === "asi-feat" || field.choiceKind === "epic-boon") {
    return true;
  }

  const normalizedChoiceKey = field.choiceKey?.toLowerCase() ?? field.id.toLowerCase();

  if (
    normalizedChoiceKey.startsWith("feat-ability-") ||
    normalizedChoiceKey.startsWith("feat-save-") ||
    normalizedChoiceKey.startsWith("feat-skill-") ||
    normalizedChoiceKey.startsWith("feat-expertise-") ||
    normalizedChoiceKey.startsWith("feat-weapon-")
  ) {
    return true;
  }

  const searchableText = [
    feature.id,
    feature.title,
    field.choiceKey,
    field.choiceLabel,
    field.choiceGroupLabel,
    field.choicePath,
    field.label,
    field.sourceIndex,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return (
    searchableText.includes("ability score improvement") ||
    searchableText.includes("epic boon") ||
    searchableText.includes("asi-feat")
  );
}

function buildClassSkillChoices(
  classIndex: string,
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
): CharacterFeatureSelection[] {
  return Object.entries(featureChoices)
    .filter(
      ([choiceKey, selectedIndex]) =>
        selectedIndex.startsWith("skill-") &&
        isClassSkillChoiceFieldByKey(classOption, choiceKey),
    )
    .map(([choiceKey, selectedIndex]) => {
      const [featureId, fieldId] = choiceKey.split(":");

      return {
        choiceType: "class-skill-choice",
        featureId,
        fieldId,
        sourceType: "class",
        sourceIndex: `${classIndex}:${featureId}:${fieldId}`,
        selectedType: "skill",
        selectedIndex,
      };
    });
}

function isClassSkillChoiceFieldByKey(
  classOption: ClassOption,
  choiceKey: string,
) {
  const [featureId, fieldId] = choiceKey.split(":");
  const feature = classOption.features.find((classFeature) => classFeature.id === featureId);
  const field = feature?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return field?.choiceGroupId === "class-skill-choice";
}

function buildSpeciesLanguageChoices(
  speciesIndex: string,
  speciesChoices: Record<string, string>,
): CharacterFeatureSelection[] {
  return Object.entries(speciesChoices)
    .filter(([choiceKey, selectedIndex]) => {
      const [choiceSpeciesIndex, , fieldId] = choiceKey.split(":");

      return (
        choiceSpeciesIndex === speciesIndex &&
        fieldId === "language" &&
        selectedIndex.trim().length > 0
      );
    })
    .map(([choiceKey, selectedIndex]) => {
      const [, featureId, fieldId] = choiceKey.split(":");

      return {
        choiceType: "species-language-choice",
        featureId,
        fieldId,
        sourceType: "species",
        sourceIndex: `${speciesIndex}:${featureId}:${fieldId}`,
        selectedType: "language",
        selectedIndex,
      };
    });
}

function buildSpeciesHeritageChoices(
  speciesIndex: string,
  speciesChoices: Record<string, string>,
): CharacterFeatureSelection[] {
  return Object.entries(speciesChoices)
    .filter(([choiceKey, selectedIndex]) => {
      const [choiceSpeciesIndex, , fieldId] = choiceKey.split(":");

      return (
        choiceSpeciesIndex === speciesIndex &&
        fieldId === "heritage" &&
        selectedIndex.trim().length > 0
      );
    })
    .map(([choiceKey, selectedIndex]) => {
      const [, featureId, fieldId] = choiceKey.split(":");

      return {
        choiceType: "species-heritage-choice",
        featureId,
        fieldId,
        sourceType: "species",
        sourceIndex: `${speciesIndex}:${featureId}:${fieldId}`,
        selectedType: "subspecies",
        selectedIndex,
      };
    });
}

function buildBackgroundAbilityChoices(
  backgroundIndex: string,
  backgroundChoices: Record<string, string>,
): CharacterFeatureSelection[] {
  return Object.entries(backgroundChoices)
    .filter(([choiceKey, selectedIndex]) => {
      const [choiceBackgroundIndex, featureId, fieldId] = choiceKey.split(":");
      const planKey = `${choiceBackgroundIndex}:${featureId}:score-plan`;
      const selectedPlan = backgroundChoices[planKey];

      return (
        choiceBackgroundIndex === backgroundIndex &&
        fieldId.startsWith("score-") &&
        (fieldId === "score-plan" || selectedPlan !== backgroundAbilityPlanThreeScores) &&
        selectedIndex.trim().length > 0
      );
    })
    .map(([choiceKey, selectedIndex]) => {
      const [, featureId, fieldId] = choiceKey.split(":");
      const isPlanChoice = fieldId === "score-plan";
      const normalizedSelectedIndex =
        isPlanChoice ? selectedIndex : canonicalAbilityScoreIndex(selectedIndex) ?? selectedIndex;

      return {
        choiceType: isPlanChoice ? "background-ability-plan" : "background-ability-score-choice",
        featureId,
        fieldId,
        sourceType: "background",
        sourceIndex: `${backgroundIndex}:${featureId}:${fieldId}`,
        selectedType: isPlanChoice ? "ability-plan" : "ability-score",
        selectedIndex: normalizedSelectedIndex,
      };
    });
}

function buildAbilityScorePayload(
  character: Character,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
): AbilityScores {
  const abilityScores = Object.fromEntries(
    abilityScoreIndexes.map((abilityIndex) => [
      abilityIndex,
      character.abilityScores.find((abilityScore) => abilityScore.abilityIndex === abilityIndex)
        ?.score ?? 10,
    ]),
  ) as AbilityScores;

  builderState.abilityAssignments.forEach((assignment) => {
    if (isAbilityScoreIndex(assignment.abilityIndex)) {
      abilityScores[assignment.abilityIndex] = assignment.score;
    }
  });

  return abilityScores;
}

function isAbilityScoreIndex(value: string): value is keyof AbilityScores {
  return abilityScoreIndexes.some((abilityIndex) => abilityIndex === value);
}

function canonicalAbilityScoreIndex(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .toLowerCase()
    .replace(/^ability-/, "")
    .replace(/-score$/, "");

  return abilityScoreIndexAliases[normalizedValue] ?? null;
}

function getSelectedSpeciesHeritage(
  species: SpeciesOption | undefined,
  speciesChoices: Record<string, string>,
) {
  if (!species?.heritageOptions?.length) {
    return null;
  }

  const selectedIndex = getSelectedSpeciesHeritageIndex(species, speciesChoices);

  return species.heritageOptions.find((option) => option.index === selectedIndex) ?? null;
}

function getSelectedSpeciesHeritageIndex(
  species: SpeciesOption | undefined,
  speciesChoices: Record<string, string>,
) {
  if (!species) {
    return undefined;
  }

  const choiceKey = `${species.index}:${species.index}-heritage-choice:heritage`;

  return speciesChoices[choiceKey];
}

function getSelectedClassSubclassIndex(
  classOption: ClassOption | undefined,
  featureChoices: Record<string, string>,
) {
  if (!classOption?.subclasses?.length) {
    return undefined;
  }

  const subclassIndexes = new Set(classOption.subclasses.map((subclassOption) => subclassOption.index));

  return Object.values(featureChoices).find((selectedIndex) => subclassIndexes.has(selectedIndex));
}

function buildConditionStateFromCharacter(character: Character | undefined): ConditionState {
  const nextState = createDefaultConditionState();

  if (!character?.conditions?.length) {
    return nextState;
  }

  for (const condition of character.conditions) {
    const normalizedIndex = condition.conditionIndex.toLowerCase() as ConditionId;

    if (normalizedIndex in nextState.activeConditions) {
      nextState.activeConditions[normalizedIndex] = true;
    }
  }

  return nextState;
}

function summarizeDefenses(
  defenses: CharacterDerivedState["defenses"],
) {
  const groupedValues = defenses.reduce(
    (groups, entry) => {
      switch (entry.kind) {
        case "resistance":
          groups.resistances.push(entry.target);
          break;
        case "immunity":
          groups.immunities.push(entry.target);
          break;
        case "vulnerability":
          groups.vulnerabilities.push(entry.target);
          break;
        case "condition_immunity":
          groups.conditionImmunities.push(entry.target);
          break;
        default:
          break;
      }

      return groups;
    },
    {
      conditionImmunities: [] as string[],
      immunities: [] as string[],
      resistances: [] as string[],
      vulnerabilities: [] as string[],
    },
  );

  return [
    createDefenseSummaryRow("Resistances", groupedValues.resistances),
    createDefenseSummaryRow("Immunities", groupedValues.immunities),
    createDefenseSummaryRow("Vulnerabilities", groupedValues.vulnerabilities),
    createDefenseSummaryRow("Condition Immunities", groupedValues.conditionImmunities),
  ].filter((entry): entry is { label: string; value: string } => entry !== null);
}

function createDefenseSummaryRow(label: string, values: string[]) {
  const uniqueValues = [...new Set(values)];

  if (uniqueValues.length === 0) {
    return null;
  }

  return {
    label,
    value: uniqueValues.join(", "),
  };
}

export { CharacterDashboardPage };
