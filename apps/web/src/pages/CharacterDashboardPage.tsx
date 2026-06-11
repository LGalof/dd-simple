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
import { useCharacterDefenses } from "../features/characters/hooks/useCharacterDefenses";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import type {
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
  CharacterFeatureSelection,
  CharacterSavePayload,
} from "../types/character";
import type { CharacterDefenseEntry } from "../types/characterDefense";
import {
  InventoryDetailsSidebar,
  useInventorySandboxController,
} from "./InventorySandboxPage";

const abilityScoreIndexes = ["str", "dex", "con", "int", "wis", "cha"] as const;

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
      subspeciesIndex: getSelectedSpeciesHeritageIndex(selectedSpecies, speciesChoices),
    }),
    [
      builderState?.classIndex,
      builderState?.level,
      builderState?.speciesIndex,
      character?.classIndex,
      character?.level,
      character?.speciesIndex,
      selectedSpecies,
      speciesChoices,
    ],
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
        persistedSkillIndexes,
        selectedSkillIndexes,
        featureChoices,
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
                  selectedChoices={featureChoices}
                  species={selectedSpecies}
                />
              </div>
            </div>

            <CharacterSheet
              activeTab={activeWorkspaceTab}
              character={previewCharacter}
              conditionSummary={conditionSummary}
              currentHp={builderState.currentHp}
              defenseSummary={defenseSummary}
              inventoryController={inventoryController}
              normalizedActions={normalizedActionsWithPreview}
              normalizedActionsError={normalizedActionsErrorWithPreview}
              normalizedActionsLoading={normalizedActionsLoadingWithPreview}
              onActiveTabChange={setActiveWorkspaceTab}
              onApplyCurrentHpAdjustment={applyCurrentHpAdjustment}
              onOpenConditions={() => setRightRailMode("conditions")}
              onSetTempHp={setTempHp}
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
  persistedSkillIndexes: string[],
  selectedSkillIndexes: string[],
  featureChoices: FeatureChoiceSelections,
  speciesChoices: Record<string, string>,
): CharacterSavePayload {
  return {
    name: character.name,
    speciesIndex: builderState.speciesIndex,
    classIndex: builderState.classIndex,
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
      ...buildClassSkillChoices(builderState.classIndex, featureChoices),
      ...buildSpeciesLanguageChoices(builderState.speciesIndex, speciesChoices),
      ...buildSpeciesHeritageChoices(builderState.speciesIndex, speciesChoices),
    ],
    abilityScores: buildAbilityScorePayload(character, builderState),
    featureChoices,
  };
}

function buildClassSkillChoices(
  classIndex: string,
  featureChoices: FeatureChoiceSelections,
): CharacterFeatureSelection[] {
  return Object.entries(featureChoices)
    .filter(([, selectedIndex]) => selectedIndex.startsWith("skill-"))
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
