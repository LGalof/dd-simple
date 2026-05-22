import { useEffect, useMemo, useState } from "react";
import type { Character } from "../../../types/character";
import {
  backgroundOptions,
  classOptions,
  speciesOptions,
} from "../data/builderReferenceData";
import type {
  BackgroundOption,
  BuilderSelectionKind,
  CharacterBuilderState,
  ClassOption,
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

const abilityOrder = ["str", "dex", "con", "int", "wis", "cha"];

function createInitialBuilderState(character: Character): CharacterBuilderState {
  const initialClass =
    classOptions.find((classOption) => classOption.name === character.class.name) ??
    classOptions[0];
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
      speciesOptions.find((species) => species.name === character.species.name)?.index ??
      speciesOptions[0].index,
    backgroundIndex:
      backgroundOptions.find(
        (background) => background.name === character.background.name,
      )?.index ?? backgroundOptions[0].index,
    classIndex:
      classOptions.find((classOption) => classOption.name === character.class.name)?.index ??
      classOptions[0].index,
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

function useCharacterBuilder(character: Character | undefined) {
  const [builderState, setBuilderState] = useState<CharacterBuilderState | null>(null);
  const [activePanel, setActivePanel] = useState<BuilderSelectionKind | null>(null);
  const [pendingSelection, setPendingSelection] = useState<string | null>(null);

  useEffect(() => {
    if (!character) {
      setBuilderState(null);
      setActivePanel(null);
      setPendingSelection(null);
      return;
    }

    setBuilderState(createInitialBuilderState(character));
  }, [character?.id]);

  const selectedSpecies = useMemo(
    () =>
      speciesOptions.find((species) => species.index === builderState?.speciesIndex) ??
      speciesOptions[0],
    [builderState?.speciesIndex],
  );
  const selectedBackground = useMemo(
    () =>
      backgroundOptions.find(
        (background) => background.index === builderState?.backgroundIndex,
      ) ?? backgroundOptions[0],
    [builderState?.backgroundIndex],
  );
  const selectedClass = useMemo(
    () =>
      classOptions.find((classOption) => classOption.index === builderState?.classIndex) ??
      classOptions[0],
    [builderState?.classIndex],
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

  const previewCharacter = useMemo(() => {
    if (!character || !builderState) {
      return null;
    }

    return buildCharacterPreview({
      background: selectedBackground,
      character,
      classOption: selectedClass,
      species: selectedSpecies,
      state: builderState,
    });
  }, [builderState, character, selectedBackground, selectedClass, selectedSpecies]);

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
        speciesOptions.find((species) => species.index === pendingSelection) ?? speciesOptions[0]
      );
    }

    if (activePanel === "background") {
      return (
        backgroundOptions.find((background) => background.index === pendingSelection) ??
        backgroundOptions[0]
      );
    }

    return (
      classOptions.find((classOption) => classOption.index === pendingSelection) ??
      classOptions[0]
    );
  }, [activePanel, pendingSelection]);

  return {
    activePanel,
    builderState,
    closePanel,
    confirmSelection,
    openPanel,
    pendingSelection,
    previewCharacter,
    selectedBackground,
    selectedClass,
    selectedPanelOption,
    selectedSpecies,
    setSelection,
    speciesOptions,
    backgroundOptions,
    classOptions,
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
