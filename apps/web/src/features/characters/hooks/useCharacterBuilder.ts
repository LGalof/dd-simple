import { useEffect, useMemo, useRef, useState } from "react";
import type { Character } from "../../../types/character";
import {
  backgroundOptions,
  classOptions,
  speciesOptions,
} from "../data/builderReferenceData";
import {
  fetchBackgrounds,
  fetchClasses,
  fetchRuleDocuments,
  fetchSpecies,
} from "../../references/api/fetchReferences";
import type {
  BackgroundOption,
  BuilderSelectionKind,
  CharacterBuilderState,
  ClassOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import {
  buildCharacterPreview,
  calculateHitPointPreview,
  synchronizeHitPointRolls,
} from "../utils/buildCharacterPreview";
import {
  rerollAbilityAssignments,
  rollAbilitySet,
} from "../utils/rollAbilityScores";
import {
  mapBackgroundReferences,
  mapClassReferences,
  mapSpeciesReferences,
} from "../utils/mapBuilderReferenceOptions";

const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"];

function createInitialBuilderState(character: Character): CharacterBuilderState {
  return createBuilderStateFromOptions(character, {
    backgroundOptions,
    classOptions,
    speciesOptions,
  });
}

function createBuilderStateFromOptions(
  character: Character,
  options: {
    backgroundOptions: BackgroundOption[];
    classOptions: ClassOption[];
    speciesOptions: SpeciesOption[];
  },
): CharacterBuilderState {
  const initialClass =
    options.classOptions.find((classOption) => classOption.name === character.class.name) ??
    options.classOptions[0];
  const constitutionScore =
    character.abilityScores.find((abilityScore) => abilityScore.abilityIndex === "con")?.score ??
    10;
  const initialHitPointPreview = calculateHitPointPreview({
    constitutionScore,
    hitDie: initialClass.hitDie,
    level: character.level,
    settings: {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: synchronizeHitPointRolls(character.level, initialClass.hitDie, []),
    },
  });

  return {
    speciesIndex:
      options.speciesOptions.find((species) => species.name === character.species.name)?.index ??
      options.speciesOptions[0].index,
    backgroundIndex:
      options.backgroundOptions.find(
        (background) => background.name === character.background.name,
      )?.index ?? options.backgroundOptions[0].index,
    classIndex:
      options.classOptions.find((classOption) => classOption.name === character.class.name)?.index ??
      options.classOptions[0].index,
    level: character.level,
    currentHp: character.currentHp,
    tempHp: 0,
    hitPointSettings: {
      bonusHp: character.maxHp - initialHitPointPreview.totalFixedHp,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: synchronizeHitPointRolls(
        character.level,
        initialClass.hitDie,
        [],
      ),
    },
    abilityAssignments: [...character.abilityScores]
      .sort(
        (left, right) =>
          abilityOrder.indexOf(left.abilityIndex) - abilityOrder.indexOf(right.abilityIndex),
      )
      .map((abilityScore, index) => ({
        id: `slot-${index + 1}`,
        abilityIndex: abilityScore.abilityIndex,
        score: abilityScore.score,
        dice: [],
      })),
  };
}

function clampLevel(value: number) {
  return Math.max(1, Math.min(20, value));
}

function getSelectedSkillIndexes(featureChoices: FeatureChoiceSelections) {
  return [
    ...new Set(
      Object.values(featureChoices)
        .filter((selectedIndex) => selectedIndex.startsWith("skill-"))
        .map((selectedIndex) => selectedIndex.replace(/^skill-/, "")),
    ),
  ];
}

function getProficientSkillIndexes(character: Character) {
  return character.skills
    .filter((characterSkill) => characterSkill.isProficient)
    .map((characterSkill) => characterSkill.skillIndex);
}

function useCharacterBuilder(character: Character | undefined) {
  const previousCharacterIdRef = useRef<string | null>(null);
  const [builderState, setBuilderState] = useState<CharacterBuilderState | null>(null);
  const [activePanel, setActivePanel] = useState<BuilderSelectionKind | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);
  const [featureChoices, setFeatureChoices] = useState<FeatureChoiceSelections>({});
  const [persistedSkillIndexes, setPersistedSkillIndexes] = useState<string[]>([]);
  const [referenceOptions, setReferenceOptions] = useState({
    backgroundOptions,
    classOptions,
    speciesOptions,
  });

  useEffect(() => {
    if (!character) {
      setBuilderState(null);
      setActivePanel(null);
      setPendingSelection(null);
      setFeatureChoices({});
      setPersistedSkillIndexes([]);
      previousCharacterIdRef.current = null;
      return;
    }

    setBuilderState(createBuilderStateFromOptions(character, referenceOptions));
    if (previousCharacterIdRef.current !== character.id) {
      setFeatureChoices({});
      setPersistedSkillIndexes(getProficientSkillIndexes(character));
      previousCharacterIdRef.current = character.id;
    }
  }, [character?.id, referenceOptions]);

  useEffect(() => {
    let isCurrentRequest = true;

    async function loadReferenceOptions() {
      try {
        const [
          speciesReferences,
          backgroundReferences,
          classReferences,
          levelRuleDocuments,
          featureRuleDocuments,
        ] = await Promise.all([
          fetchSpecies(),
          fetchBackgrounds(),
          fetchClasses(),
          fetchRuleDocuments("levels").catch((error) => {
            console.warn("Class level reference data is unavailable.", error);
            return [];
          }),
          fetchRuleDocuments("features").catch((error) => {
            console.warn("Class feature reference data is unavailable.", error);
            return [];
          }),
        ]);

        if (!isCurrentRequest) {
          return;
        }

        const nextSpeciesOptions = mapSpeciesReferences(speciesReferences, speciesOptions);
        const nextBackgroundOptions = mapBackgroundReferences(backgroundReferences, backgroundOptions);
        const nextClassOptions = mapClassReferences(
          classReferences,
          classOptions,
          levelRuleDocuments,
          featureRuleDocuments,
        );

        if (
          nextSpeciesOptions.length > 0 &&
          nextBackgroundOptions.length > 0 &&
          nextClassOptions.length > 0
        ) {
          setReferenceOptions({
            backgroundOptions: nextBackgroundOptions,
            classOptions: nextClassOptions,
            speciesOptions: nextSpeciesOptions,
          });
        }
      } catch (error) {
        console.warn("Falling back to built-in builder reference data.", error);
      }
    }

    void loadReferenceOptions();

    return () => {
      isCurrentRequest = false;
    };
  }, []);

  const selectedSpecies = useMemo(
    () =>
      referenceOptions.speciesOptions.find((species) => species.index === builderState?.speciesIndex) ??
      referenceOptions.speciesOptions[0],
    [builderState?.speciesIndex, referenceOptions.speciesOptions],
  );
  const selectedBackground = useMemo(
    () =>
      referenceOptions.backgroundOptions.find(
        (background) => background.index === builderState?.backgroundIndex,
      ) ?? referenceOptions.backgroundOptions[0],
    [builderState?.backgroundIndex, referenceOptions.backgroundOptions],
  );
  const selectedClass = useMemo(
    () =>
      referenceOptions.classOptions.find((classOption) => classOption.index === builderState?.classIndex) ??
      referenceOptions.classOptions[0],
    [builderState?.classIndex, referenceOptions.classOptions],
  );
  const hitPointPreview = useMemo(() => {
    if (!builderState) {
      return null;
    }

    const constitutionScore = getAssignedAbilityScore(
      builderState.abilityAssignments,
      "con",
      10,
    );

    return calculateHitPointPreview({
      constitutionScore,
      hitDie: selectedClass.hitDie,
      level: builderState.level,
      settings: builderState.hitPointSettings,
    });
  }, [builderState, selectedClass.hitDie]);
  const selectedSkillIndexes = useMemo(
    () => getSelectedSkillIndexes(featureChoices),
    [featureChoices],
  );

  const previewCharacter = useMemo(() => {
    if (!character || !builderState) {
      return null;
    }

    return buildCharacterPreview({
      background: selectedBackground,
      character,
      classOption: selectedClass,
      persistedSkillIndexes,
      selectedSkillIndexes,
      species: selectedSpecies,
      state: builderState,
    });
  }, [
    builderState,
    character,
    selectedBackground,
    selectedClass,
    persistedSkillIndexes,
    selectedSkillIndexes,
    selectedSpecies,
  ]);

  function updateLevel(nextLevel: number) {
    if (!Number.isFinite(nextLevel)) {
      return;
    }

    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            level: clampLevel(nextLevel),
          }
        : currentState,
    );
  }

  function updateHitPointSettings(nextSettings: HitPointSettings) {
    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            hitPointSettings: {
              bonusHp: nextSettings.bonusHp,
              calculationMode: nextSettings.calculationMode,
              overrideMaxHp: nextSettings.overrideMaxHp,
              rolledHitPoints: synchronizeHitPointRolls(
                currentState.level,
                selectedClass.hitDie,
                nextSettings.rolledHitPoints,
              ),
            },
          }
        : currentState,
    );
  }

  function applyHitPointConfiguration(nextLevel: number, nextSettings: HitPointSettings) {
    const normalizedLevel = clampLevel(nextLevel);

    setBuilderState((currentState) =>
      currentState
        ? (() => {
            const normalizedSettings = {
              bonusHp: nextSettings.bonusHp,
              calculationMode: nextSettings.calculationMode,
              overrideMaxHp: nextSettings.overrideMaxHp,
              rolledHitPoints: synchronizeHitPointRolls(
                normalizedLevel,
                selectedClass.hitDie,
                nextSettings.rolledHitPoints,
              ),
            };
            const constitutionScore = getAssignedAbilityScore(
              currentState.abilityAssignments,
              "con",
              10,
            );
            const nextHitPointPreview = calculateHitPointPreview({
              constitutionScore,
              hitDie: selectedClass.hitDie,
              level: normalizedLevel,
              settings: normalizedSettings,
            });

            return {
              ...currentState,
              level: normalizedLevel,
              currentHp: Math.min(currentState.currentHp, nextHitPointPreview.maxHp),
              hitPointSettings: normalizedSettings,
            };
          })()
        : currentState,
    );
  }

  function applyCurrentHpAdjustment(mode: "heal" | "damage", amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    setBuilderState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const constitutionScore = getAssignedAbilityScore(
        currentState.abilityAssignments,
        "con",
        10,
      );
      const nextHitPointPreview = calculateHitPointPreview({
        constitutionScore,
        hitDie: selectedClass.hitDie,
        level: currentState.level,
        settings: currentState.hitPointSettings,
      });
      const currentHp = Math.max(0, Math.min(nextHitPointPreview.maxHp, currentState.currentHp));
      const nextCurrentHp =
        mode === "heal"
          ? Math.min(nextHitPointPreview.maxHp, currentHp + amount)
          : Math.max(0, currentHp - amount);

      return {
        ...currentState,
        currentHp: nextCurrentHp,
      };
    });
  }

  function setTempHp(amount: number) {
    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            tempHp: Math.max(0, Math.floor(Number.isFinite(amount) ? amount : 0)),
          }
        : currentState,
    );
  }

  function updateAbilityAssignment(slotId: string, nextAbilityIndex: string) {
    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            abilityAssignments: swapAbilityAssignments(
              currentState.abilityAssignments,
              slotId,
              nextAbilityIndex,
            ),
          }
        : currentState,
    );
  }

  function handleRollAllAbilities() {
    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            abilityAssignments: rerollAbilityAssignments(currentState.abilityAssignments),
          }
        : currentState,
    );
  }

  function handleRollAbility(slotId: string) {
    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            abilityAssignments: currentState.abilityAssignments.map((assignment) =>
              assignment.id === slotId
                ? {
                    ...assignment,
                    ...rollAbilitySet(),
                  }
                : assignment,
            ),
          }
        : currentState,
    );
  }

  function openPanel(kind: BuilderSelectionKind) {
    if (!builderState) {
      return;
    }

    setActivePanel(kind);

    switch (kind) {
      case "species":
        setPendingSelection(builderState.speciesIndex);
        break;
      case "background":
        setPendingSelection(builderState.backgroundIndex);
        break;
      case "class":
        setPendingSelection(builderState.classIndex);
        break;
    }
  }

  function closePanel() {
    setActivePanel(null);
    setPendingSelection(null);
  }

  function confirmSelection() {
    if (!builderState || !activePanel || !pendingSelection) {
      closePanel();
      return;
    }

    setBuilderState({
      ...builderState,
      ...(activePanel === "species" ? { speciesIndex: pendingSelection } : {}),
      ...(activePanel === "background" ? { backgroundIndex: pendingSelection } : {}),
      ...(activePanel === "class" ? { classIndex: pendingSelection } : {}),
    });

    if (activePanel === "class") {
      setFeatureChoices({});
    }

    closePanel();
  }

  function setSelection(nextSelection: string) {
    setPendingSelection(nextSelection);
  }

  const selectedPanelOption = useMemo(() => {
    if (!activePanel || !pendingSelection) {
      return null;
    }

    if (activePanel === "species") {
      return (
        referenceOptions.speciesOptions.find((species) => species.index === pendingSelection) ??
        referenceOptions.speciesOptions[0]
      );
    }

    if (activePanel === "background") {
      return (
        referenceOptions.backgroundOptions.find((background) => background.index === pendingSelection) ??
        referenceOptions.backgroundOptions[0]
      );
    }

    return (
      referenceOptions.classOptions.find((classOption) => classOption.index === pendingSelection) ??
      referenceOptions.classOptions[0]
    );
  }, [activePanel, pendingSelection, referenceOptions]);

  return {
    activePanel,
    builderState,
    closePanel,
    confirmSelection,
    featureChoices,
    openPanel,
    pendingSelection,
    previewCharacter,
    selectedBackground,
    selectedClass,
    selectedPanelOption,
    selectedSkillIndexes,
    selectedSpecies,
    persistedSkillIndexes,
    setSelection,
    setFeatureChoices,
    speciesOptions: referenceOptions.speciesOptions,
    backgroundOptions: referenceOptions.backgroundOptions,
    classOptions: referenceOptions.classOptions,
    handleRollAbility,
    hitPointPreview,
    hitPointSettings: builderState?.hitPointSettings ?? null,
    updateAbilityAssignment,
    applyHitPointConfiguration,
    applyCurrentHpAdjustment,
    setTempHp,
    updateHitPointSettings,
    updateLevel,
    handleRollAllAbilities,
  };
}

function swapAbilityAssignments(
  assignments: CharacterBuilderState["abilityAssignments"],
  slotId: string,
  nextAbilityIndex: string,
) {
  const activeAssignment = assignments.find((assignment) => assignment.id === slotId);

  if (!activeAssignment || activeAssignment.abilityIndex === nextAbilityIndex) {
    return assignments;
  }

  const conflictingAssignment = assignments.find(
    (assignment) => assignment.abilityIndex === nextAbilityIndex,
  );

  return assignments.map((assignment) => {
    if (assignment.id === slotId) {
      return {
        ...assignment,
        abilityIndex: nextAbilityIndex,
      };
    }

    if (conflictingAssignment && assignment.id === conflictingAssignment.id) {
      return {
        ...assignment,
        abilityIndex: activeAssignment.abilityIndex,
      };
    }

    return assignment;
  });
}

function getAssignedAbilityScore(
  assignments: CharacterBuilderState["abilityAssignments"],
  abilityIndex: string,
  fallbackScore: number,
) {
  return assignments.find((assignment) => assignment.abilityIndex === abilityIndex)?.score ??
    fallbackScore;
}

export { useCharacterBuilder };
