import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { CharacterBuilderSidebar } from "../features/characters/components/CharacterBuilderSidebar";
import { CharacterSelectionPanel } from "../features/characters/components/CharacterSelectionPanel";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import type { WorkspaceTab } from "../features/characters/components/CharacterSheet";
import { useCharacterActions } from "../features/characters/hooks/useCharacterActions";
import { useCharacterBuilder } from "../features/characters/hooks/useCharacterBuilder";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
} from "../features/characters/utils/selectedCharacter";
import { fetchConditions } from "../features/references/api/fetchReferences";
import {
  InventoryDetailsSidebar,
  useInventorySandboxController,
} from "./InventorySandboxPage";
import type {
  AbilityScores,
  Character,
  CharacterFeatureChoiceSelection,
  CharacterFeatureSelection,
  CharacterSavePayload,
} from "../types/character";
import type { ReferenceCondition } from "../types/reference";
import type {
  BackgroundOption,
  FeatureChoiceSelections,
  ClassOption,
  SpeciesOption,
} from "../features/characters/types/characterBuilder";

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
  const [conditionOptions, setConditionOptions] = useState<ReferenceCondition[]>([]);
  const [conditionOptionsError, setConditionOptionsError] = useState<string | null>(null);
  const inventoryController = useInventorySandboxController();
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const {
    addCondition,
    characters,
    loading,
    error,
    removeCondition,
    saveCharacter,
    saveError,
    savingCharacterId,
  } = useCharacters();
  const selectedCharacterId = getSelectedCharacterId();
  const selectedCharacter = useMemo(
    () =>
      selectedCharacterId
        ? characters.find((character) => character.id === selectedCharacterId)
        : undefined,
    [characters, selectedCharacterId],
  );
  const character = selectedCharacter ?? characters[0];

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadConditionOptions() {
      try {
        const conditions = await fetchConditions();

        if (isCurrentRequest) {
          setConditionOptions(conditions);
          setConditionOptionsError(null);
        }
      } catch (err) {
        if (isCurrentRequest) {
          setConditionOptionsError(
            err instanceof Error ? err.message : "Failed to load conditions",
          );
        }
      }
    }

    void loadConditionOptions();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  useEffect(() => {
    if (!loading && selectedCharacterId && characters.length > 0 && !selectedCharacter) {
      clearSelectedCharacterId(selectedCharacterId);
    }
  }, [characters.length, loading, selectedCharacter, selectedCharacterId]);

  const {
    activePanel,
    backgroundChoices,
    backgroundOptions,
    builderState,
    classOptions,
    closePanel,
    confirmSelection,
    featureChoices,
    applyHitPointConfiguration,
    applyCurrentHpAdjustment,
    handleRollAbility,
    handleRollAllAbilities,
    hitPointPreview,
    hitPointSettings,
    openPanel,
    pendingSelection,
    previewCharacter,
    selectedBackground,
    selectedClass,
    selectedPanelOption,
    selectedSpecies,
    speciesChoices,
    persistedSkillIndexes,
    setFeatureChoices,
    setTempHp,
    setSelection,
    speciesOptions,
    updateAbilityAssignment,
  } = useCharacterBuilder(character);
  const builderActionPreview = useMemo(
    () => ({
      classIndex: builderState?.classIndex ?? character?.classIndex,
      level: builderState?.level ?? character?.level,
      subspeciesIndex: getSelectedSpeciesHeritageIndex(selectedSpecies, speciesChoices),
      speciesIndex: builderState?.speciesIndex ?? character?.speciesIndex,
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
  const defenseSummary = useMemo(() => {
    const selectedHeritage = getSelectedSpeciesHeritage(selectedSpecies, speciesChoices);

    return selectedHeritage
      ? [
          {
            label: "Damage Resistance",
            value: selectedHeritage.damageType,
          },
        ]
      : [];
  }, [selectedSpecies, speciesChoices]);
  const {
    actions: normalizedActionsWithPreview,
    error: normalizedActionsErrorWithPreview,
    loading: normalizedActionsLoadingWithPreview,
  } = useCharacterActions(character?.id ?? null, builderActionPreview);
  const isSavingBuild = Boolean(character && savingCharacterId === character.id);

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
        featureChoices,
        speciesChoices,
        backgroundChoices,
      ),
    );

    if (updatedCharacter) {
      setSaveSuccessMessage("Build saved.");
    }
  }

  return (
    <AppLayout variant="wide-left">
      <section className="character-section">
        {loading && <p>Loading character...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && !character && <p>No characters found.</p>}
        {previewCharacter && builderState && (
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
                  onAbilityAssignmentChange={updateAbilityAssignment}
                  onApplyHitPointSettings={applyHitPointConfiguration}
                  onFeatureChoicesChange={setFeatureChoices}
                  onOpenPanel={openPanel}
                  onRollAbility={handleRollAbility}
                  onRollAllAbilities={handleRollAllAbilities}
                  selectedChoices={featureChoices}
                  species={selectedSpecies}
                  hitPointSettings={hitPointSettings}
                />
              </div>
            </div>

            <CharacterSheet
              activeTab={activeWorkspaceTab}
              character={previewCharacter}
              currentHp={builderState.currentHp}
              conditionOptions={conditionOptions}
              conditionOptionsError={conditionOptionsError}
              inventoryController={inventoryController}
              normalizedActions={normalizedActionsWithPreview}
              normalizedActionsError={normalizedActionsErrorWithPreview}
              normalizedActionsLoading={normalizedActionsLoadingWithPreview}
              onActiveTabChange={setActiveWorkspaceTab}
              onAddCondition={(conditionIndex) =>
                character ? addCondition(character.id, conditionIndex) : Promise.resolve(null)
              }
              defenseSummary={defenseSummary}
              tempHp={builderState.tempHp}
              onApplyCurrentHpAdjustment={applyCurrentHpAdjustment}
              onRemoveCondition={(conditionIndex) =>
                character ? removeCondition(character.id, conditionIndex) : Promise.resolve(null)
              }
              onSetTempHp={setTempHp}
            />

            <InventoryDetailsSidebar
              controller={inventoryController}
              isOpen={activeWorkspaceTab === "inventory"}
            />
          </div>
        )}
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
  featureChoices: FeatureChoiceSelections,
  speciesChoices: Record<string, string>,
  backgroundChoices: Record<string, string>,
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
    skillIndexes: persistedSkillIndexes,
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

export { CharacterDashboardPage };
