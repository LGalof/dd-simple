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
import type { WorkspaceTab } from "../features/characters/components/CharacterSheet";
import { useCharacterActions } from "../features/characters/hooks/useCharacterActions";
import { useCharacterBuilder } from "../features/characters/hooks/useCharacterBuilder";
import { useCharacterDerivedState } from "../features/characters/hooks/useCharacterDerivedState";
import { useCharacterDefenses } from "../features/characters/hooks/useCharacterDefenses";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import type {
  BackgroundOption,
  ClassOption,
  FeatureChoiceSelections,
  SpeciesOption,
} from "../features/characters/types/characterBuilder";
import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
} from "../features/characters/utils/selectedCharacter";
import type {
  AbilityScores,
  Character,
  CharacterFeatureChoiceSelection,
  CharacterFeatureSelection,
  CharacterSavePayload,
} from "../types/character";
import type { CharacterDefenseEntry } from "../types/characterDefense";
import {
  InventoryDetailsSidebar,
  useInventorySandboxController,
} from "./InventorySandboxPage";

const abilityScoreIndexes = ["str", "dex", "con", "int", "wis", "cha"] as const;
const backgroundAbilityPlanThreeScores = "increase-all-three-by-1";
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
  const inventoryController = useInventorySandboxController();
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

  const builderActionPreview = useMemo(
    () => ({
      classIndex: builderState?.classIndex ?? character?.classIndex,
      level: builderState?.level ?? character?.level,
      speciesIndex: builderState?.speciesIndex ?? character?.speciesIndex,
      subclassIndex: getSelectedClassSubclassIndex(selectedClass, featureChoices),
      subspeciesIndex: getSelectedSpeciesHeritageIndex(selectedSpecies, speciesChoices),
    }),
    [
      builderState?.classIndex,
      builderState?.level,
      builderState?.speciesIndex,
      character?.classIndex,
      character?.level,
      character?.speciesIndex,
      featureChoices,
      selectedClass,
      selectedSpecies,
      speciesChoices,
    ],
  );
  const selectedHeritage = useMemo(
    () => getSelectedSpeciesHeritage(selectedSpecies, speciesChoices),
    [selectedSpecies, speciesChoices],
  );
  const {
    actions: normalizedActionsWithPreview,
    error: normalizedActionsErrorWithPreview,
    loading: normalizedActionsLoadingWithPreview,
  } = useCharacterActions(character?.id ?? null, builderActionPreview);
  const { defenses: normalizedDefensesWithPreview } = useCharacterDefenses(
    character?.id ?? null,
    builderActionPreview,
  );
  const {
    derivedState: characterDerivedStateWithPreview,
    error: characterDerivedStateErrorWithPreview,
    loading: characterDerivedStateLoadingWithPreview,
  } = useCharacterDerivedState(character?.id ?? null, builderActionPreview);
  const defenseSummary = useMemo(
    () => summarizeDefenses(normalizedDefensesWithPreview),
    [normalizedDefensesWithPreview],
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
              normalizedActions={normalizedActionsWithPreview}
              normalizedActionsError={normalizedActionsErrorWithPreview}
              normalizedActionsLoading={normalizedActionsLoadingWithPreview}
              onActiveTabChange={setActiveWorkspaceTab}
              selectedHeritage={selectedHeritage}
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

function buildGenericClassFeatureChoices(
  classIndex: string,
  classOption: ClassOption,
  characterLevel: number,
  featureChoices: FeatureChoiceSelections,
): CharacterFeatureChoiceSelection[] {
  const selections: CharacterFeatureChoiceSelection[] = [];

  for (const feature of classOption.features) {
    if (feature.level > characterLevel) {
      continue;
    }

    for (const field of feature.choiceFields ?? []) {
      if (!field.sourceType || !field.sourceIndex || !field.choicePath) {
        continue;
      }

      const selectedValue = featureChoices[`${feature.id}:${field.id}`];

      if (!selectedValue) {
        continue;
      }

      const selectedOption = field.options.find((option) => option.value === selectedValue);

      if (!selectedOption) {
        continue;
      }

      selections.push({
        sourceType: field.sourceType,
        sourceIndex: field.sourceIndex,
        classIndex: field.classIndex ?? classIndex,
        subclassIndex: field.subclassIndex ?? null,
        level: field.level ?? feature.level ?? null,
        featureIndex: field.featureIndex ?? feature.id,
        choicePath: field.choicePath,
        choiceKey: field.choiceKey ?? field.id,
        choiceLabel: field.choiceLabel ?? field.choiceGroupLabel ?? field.label,
        selectedOptionType: selectedOption.selectedOptionType ?? "string",
        selectedOptionIndex: selectedOption.selectedOptionIndex ?? selectedOption.value,
        selectedOptionName: selectedOption.selectedOptionName ?? selectedOption.label,
        selectedOptionUrl: selectedOption.selectedOptionUrl ?? null,
        selectedRawJson: selectedOption.selectedRawJson ?? {
          label: selectedOption.label,
          value: selectedOption.value,
        },
        grantsRawJson: null,
      });
    }
  }

  return selections;
}

function buildGenericBackgroundFeatureChoices(
  backgroundOption: BackgroundOption,
  backgroundChoices: Record<string, string>,
): CharacterFeatureChoiceSelection[] {
  const selections: CharacterFeatureChoiceSelection[] = [];

  for (const section of backgroundOption.previewSections) {
    for (const field of section.choiceFields ?? []) {
      if (!field.sourceType || !field.sourceIndex || !field.choicePath) {
        continue;
      }

      const selectedValue = backgroundChoices[`${backgroundOption.index}:${section.id}:${field.id}`];

      if (!selectedValue) {
        continue;
      }

      const selectedOption = field.options.find((option) => option.value === selectedValue);

      if (!selectedOption) {
        continue;
      }

      selections.push({
        sourceType: field.sourceType,
        sourceIndex: field.sourceIndex,
        classIndex: null,
        subclassIndex: null,
        level: null,
        featureIndex: null,
        choicePath: field.choicePath,
        choiceKey: field.choiceKey ?? field.id,
        choiceLabel: field.choiceLabel ?? field.choiceGroupLabel ?? field.label,
        selectedOptionType: selectedOption.selectedOptionType ?? "string",
        selectedOptionIndex: selectedOption.selectedOptionIndex ?? selectedOption.value,
        selectedOptionName: selectedOption.selectedOptionName ?? selectedOption.label,
        selectedOptionUrl: selectedOption.selectedOptionUrl ?? null,
        selectedRawJson: selectedOption.selectedRawJson ?? {
          label: selectedOption.label,
          value: selectedOption.value,
        },
        grantsRawJson: null,
      });
    }
  }

  return selections;
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

function summarizeDefenses(defenses: CharacterDefenseEntry[]) {
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
