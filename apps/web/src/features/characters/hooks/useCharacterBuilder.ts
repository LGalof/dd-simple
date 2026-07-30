import { useEffect, useMemo, useRef, useState } from "react";
import type { Character } from "../../../types/character";
import { applyHitPointAdjustment } from "@dd-simple/shared";
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
  FeatureChoiceOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import {
  buildCharacterPreview,
  calculateHitPointPreview,
  getFeatureChoiceHitPointBonus,
  synchronizeHitPointRolls,
} from "../utils/buildCharacterPreview";
import {
  buildGenericBackgroundFeatureChoices,
  buildGenericClassFeatureChoices,
} from "../utils/buildFeatureChoiceSelections";
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
const classChoiceSourceType = "class";
const classSkillChoiceType = "class-skill-choice";
const classSkillChoiceSelectedType = "skill";
const classChoiceProficiencySourceType = "class-choice";
const speciesChoiceSourceType = "species";
const speciesLanguageChoiceType = "species-language-choice";
const speciesLanguageSelectedType = "language";
const speciesHeritageChoiceType = "species-heritage-choice";
const speciesHeritageSelectedType = "subspecies";
const backgroundChoiceSourceType = "background";
const backgroundAbilityPlanChoiceType = "background-ability-plan";
const backgroundAbilityScoreChoiceType = "background-ability-score-choice";
const backgroundAbilityPlanSelectedType = "ability-plan";
const backgroundAbilityScoreSelectedType = "ability-score";
const abilityScoreIndexAliases: Record<string, string> = {
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
const characterBuilderDraftStoragePrefix = "dd-simple.characterBuilderDraft";

type PersistedCharacterBuilderDraft = {
  baseCharacterUpdatedAt: string | null;
  builderState: CharacterBuilderState;
  dirty: boolean;
  featureChoices: FeatureChoiceSelections;
  updatedAt: string;
  version: 2;
};

function createBuilderStateFromOptions(
  character: Character,
  options: {
    backgroundOptions: BackgroundOption[];
    classOptions: ClassOption[];
    speciesOptions: SpeciesOption[];
  },
): CharacterBuilderState {
  const initialClass =
    options.classOptions.find((classOption) => classOption.index === character.classIndex) ??
    options.classOptions.find((classOption) => classOption.name === character.class.name) ??
    options.classOptions[0];
  const initialSpeciesIndex =
    character.speciesIndex ??
    options.speciesOptions.find((species) => species.name === character.species.name)?.index ??
    options.speciesOptions[0].index;
  const initialBackgroundIndex =
    character.backgroundIndex ??
    options.backgroundOptions.find(
      (background) => background.name === character.background.name,
    )?.index ?? options.backgroundOptions[0].index;
  const initialClassIndex = character.classIndex ?? initialClass.index;
  const hitPointSettings = getSavedHitPointSettings(character, initialClass.hitDie);

  return {
    speciesIndex: initialSpeciesIndex,
    backgroundIndex: initialBackgroundIndex,
    classIndex: initialClassIndex,
    subclassIndex: getSavedSubclassIndex(character, initialClass),
    level: character.level,
    currentHp: character.currentHp,
    tempHp: character.hitPointState?.tempHp ?? 0,
    speciesChoices: {
      ...getSavedSpeciesChoices(character, {
        speciesIndex:
          initialSpeciesIndex,
        speciesOptions: options.speciesOptions,
      }),
      ...getSavedGenericSpeciesChoices(character, {
        speciesIndex:
          initialSpeciesIndex,
        speciesOptions: options.speciesOptions,
      }),
    },
    backgroundChoices: getSavedBackgroundAbilityChoices(character, {
      backgroundIndex: initialBackgroundIndex,
      backgroundOptions: options.backgroundOptions,
    }),
    hitPointSettings,
    abilityAssignments: [...character.abilityScores]
      .sort(
        (left, right) =>
          abilityOrder.indexOf(left.abilityIndex) - abilityOrder.indexOf(right.abilityIndex),
      )
      .map((abilityScore, index) => ({
        id: `slot-${index + 1}`,
        abilityIndex: abilityScore.abilityIndex,
        score: abilityScore.baseScore ?? abilityScore.score,
        dice: [],
      })),
  };
}

function getSavedSubclassIndex(character: Character, classOption: ClassOption) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (character.subclassIndex && subclassIndexes.has(character.subclassIndex)) {
    return character.subclassIndex;
  }

  for (const choice of character.featureChoices ?? []) {
    if (typeof choice.level === "number" && choice.level > character.level) {
      continue;
    }

    const fieldMatch = findGenericFeatureChoiceField(classOption, choice);

    if (!fieldMatch || fieldMatch.field.choiceKind !== "subclass") {
      continue;
    }

    const option = fieldMatch.field.options.find((candidate) =>
      savedFeatureChoiceOptionMatches(candidate, choice),
    );
    const selectedSubclassIndex = option?.selectedOptionIndex ?? option?.value;

    if (selectedSubclassIndex && subclassIndexes.has(selectedSubclassIndex)) {
      return selectedSubclassIndex;
    }
  }

  return null;
}

function getSavedBackgroundAbilityChoices(
  character: Character,
  options: {
    backgroundIndex: string;
    backgroundOptions: BackgroundOption[];
  },
) {
  const backgroundOption =
    options.backgroundOptions.find((background) => background.index === options.backgroundIndex) ??
    options.backgroundOptions[0];
  const backgroundChoices: Record<string, string> = {};

  for (const choice of character.choices ?? []) {
    if (
      choice.sourceType !== backgroundChoiceSourceType ||
      !choice.sourceIndex ||
      !choice.selectedIndex
    ) {
      continue;
    }

    const [, sectionId, fieldId] = choice.sourceIndex.split(":");

    if (!sectionId || !fieldId) {
      continue;
    }

    const choiceKey = `${options.backgroundIndex}:${sectionId}:${fieldId}`;

    if (isBackgroundAbilityChoice(choice)) {
      const fieldValue = getBackgroundAbilityChoiceFieldValue(
        backgroundOption,
        choiceKey,
        choice.selectedIndex,
      );

      backgroundChoices[choiceKey] = fieldValue ?? choice.selectedIndex;
    }
  }

  return {
    ...backgroundChoices,
    ...getSavedGenericBackgroundChoices(character, backgroundOption, options.backgroundIndex),
  };
}

function isBackgroundAbilityChoice(choice: NonNullable<Character["choices"]>[number]) {
  return (
    (choice.choiceType === backgroundAbilityPlanChoiceType &&
      choice.selectedType === backgroundAbilityPlanSelectedType) ||
    (choice.choiceType === backgroundAbilityScoreChoiceType &&
      choice.selectedType === backgroundAbilityScoreSelectedType)
  );
}

function getBackgroundAbilityChoiceFieldValue(
  backgroundOption: BackgroundOption,
  choiceKey: string,
  selectedIndex: string,
) {
  const [backgroundIndex, sectionId, fieldId] = choiceKey.split(":");

  if (backgroundIndex !== backgroundOption.index) {
    return null;
  }

  const section = backgroundOption.previewSections.find(
    (previewSection) => previewSection.id === sectionId,
  );
  const field = section?.choiceFields?.find((choiceField) => choiceField.id === fieldId);
  const syntheticThirdScoreField =
    fieldId === "score-c"
      ? section?.choiceFields?.find((choiceField) => choiceField.id === "score-a")
      : undefined;
  const matchingField = field ?? syntheticThirdScoreField;

  if (!matchingField) {
    return null;
  }

  const matchingOption = matchingField.options.find(
    (option) =>
      option.value === selectedIndex ||
      (fieldId.startsWith("score-") &&
        canonicalAbilityScoreIndex(option.value) === canonicalAbilityScoreIndex(selectedIndex)),
  );

  return matchingOption?.value ?? null;
}

function getSavedGenericBackgroundChoices(
  character: Character,
  backgroundOption: BackgroundOption,
  backgroundIndex: string,
) {
  const backgroundChoices: Record<string, string> = {};

  for (const choice of character.featureChoices ?? []) {
    if (choice.sourceType.toUpperCase() !== "BACKGROUND" || choice.sourceIndex !== backgroundIndex) {
      continue;
    }

    const fieldMatch = findSavedBackgroundChoiceField(backgroundOption, choice);

    if (fieldMatch) {
      backgroundChoices[`${backgroundIndex}:${fieldMatch.sectionId}:${fieldMatch.field.id}`] =
        fieldMatch.option.value;
    }
  }

  return backgroundChoices;
}

function findSavedBackgroundChoiceField(
  backgroundOption: BackgroundOption,
  choice: NonNullable<Character["featureChoices"]>[number],
) {
  let fallbackMatch:
    | {
        field: NonNullable<BackgroundOption["previewSections"][number]["choiceFields"]>[number];
        option: FeatureChoiceOption;
        sectionId: string;
      }
    | null = null;

  for (const section of backgroundOption.previewSections) {
    for (const field of section.choiceFields ?? []) {
      if (
        field.sourceType?.toUpperCase() !== choice.sourceType.toUpperCase() ||
        field.sourceIndex !== choice.sourceIndex
      ) {
        continue;
      }

      const option = field.options.find((candidate) =>
        savedFeatureChoiceOptionMatches(candidate, choice),
      );

      if (!option) {
        continue;
      }

      if (field.choicePath === choice.choicePath) {
        return {
          field,
          option,
          sectionId: section.id,
        };
      }

      const savedChoiceKey = choice.choiceKey?.toLowerCase();
      const fieldChoiceKeys = [field.choiceKey, field.id]
        .filter((value): value is string => Boolean(value))
        .map((value) => value.toLowerCase());

      if (savedChoiceKey && fieldChoiceKeys.includes(savedChoiceKey)) {
        fallbackMatch = {
          field,
          option,
          sectionId: section.id,
        };
      }
    }
  }

  return fallbackMatch;
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

function getSavedHitPointSettings(character: Character, hitDie: number): HitPointSettings {
  const savedState = character.hitPointState;

  if (!savedState) {
    return {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: synchronizeHitPointRolls(character.level, hitDie, []),
    };
  }

  return {
    bonusHp: savedState.bonusHp,
    calculationMode: savedState.calculationMode,
    overrideMaxHp: savedState.overrideMaxHp,
    rolledHitPoints: synchronizeHitPointRolls(
      character.level,
      hitDie,
      savedState.rolledHitPoints,
    ),
  };
}

function getSavedSpeciesChoices(
  character: Character,
  options: {
    speciesIndex: string;
    speciesOptions: SpeciesOption[];
  },
) {
  const speciesOption =
    options.speciesOptions.find((species) => species.index === options.speciesIndex) ??
    options.speciesOptions[0];
  const speciesChoices: Record<string, string> = {};

  for (const choice of character.choices ?? []) {
    if (
      choice.sourceType !== speciesChoiceSourceType ||
      !choice.sourceIndex ||
      !choice.selectedIndex
    ) {
      continue;
    }

    const [, sectionId, fieldId] = choice.sourceIndex.split(":");

    if (!sectionId || !fieldId) {
      continue;
    }

    const choiceKey = `${options.speciesIndex}:${sectionId}:${fieldId}`;

    if (isSpeciesLanguageChoice(choice)) {
      if (hasSpeciesLanguageChoiceFieldValue(speciesOption, choiceKey, choice.selectedIndex)) {
        speciesChoices[choiceKey] = choice.selectedIndex;
        continue;
      }

      const remappedChoiceKey = findAvailableSpeciesLanguageChoiceKey(
        speciesOption,
        speciesChoices,
        choice.selectedIndex,
      );

      if (remappedChoiceKey) {
        speciesChoices[remappedChoiceKey] = choice.selectedIndex;
        continue;
      }

      speciesChoices[choiceKey] = choice.selectedIndex;

      continue;
    }

    if (!isSpeciesHeritageChoice(choice)) {
      continue;
    }

    if (hasSpeciesHeritageChoiceFieldValue(speciesOption, choiceKey, choice.selectedIndex)) {
      speciesChoices[choiceKey] = choice.selectedIndex;
      continue;
    }

    const remappedChoiceKey = findAvailableSpeciesHeritageChoiceKey(
      speciesOption,
      speciesChoices,
      choice.selectedIndex,
    );

    if (remappedChoiceKey) {
      speciesChoices[remappedChoiceKey] = choice.selectedIndex;
      continue;
    }

    speciesChoices[choiceKey] = choice.selectedIndex;
  }

  return speciesChoices;
}

function getSavedGenericSpeciesChoices(
  character: Character,
  options: {
    speciesIndex: string;
    speciesOptions: SpeciesOption[];
  },
) {
  const speciesOption =
    options.speciesOptions.find((species) => species.index === options.speciesIndex) ??
    options.speciesOptions[0];
  const speciesChoices: Record<string, string> = {};

  if (!speciesOption) {
    return speciesChoices;
  }

  for (const choice of character.featureChoices ?? []) {
    if (choice.sourceType.toUpperCase() !== "SPECIES" || choice.sourceIndex !== options.speciesIndex) {
      continue;
    }

    for (const section of speciesOption.previewSections) {
      const field = section.choiceFields?.find(
        (choiceField) =>
          choiceField.sourceType === choice.sourceType &&
          choiceField.sourceIndex === choice.sourceIndex &&
          choiceField.choicePath === choice.choicePath,
      );
      const option = field?.options.find((candidate) =>
        savedFeatureChoiceOptionMatches(candidate, choice),
      );

      if (!field || !option) {
        continue;
      }

      speciesChoices[`${options.speciesIndex}:${section.id}:${field.id}`] = option.value;
    }
  }

  return speciesChoices;
}

function isSpeciesLanguageChoice(choice: NonNullable<Character["choices"]>[number]) {
  return (
    choice.choiceType === speciesLanguageChoiceType &&
    choice.selectedType === speciesLanguageSelectedType
  );
}

function isSpeciesHeritageChoice(choice: NonNullable<Character["choices"]>[number]) {
  return (
    choice.choiceType === speciesHeritageChoiceType &&
    choice.selectedType === speciesHeritageSelectedType
  );
}

function hasSpeciesLanguageChoiceFieldValue(
  speciesOption: SpeciesOption,
  choiceKey: string,
  selectedIndex: string,
) {
  const [speciesIndex, sectionId, fieldId] = choiceKey.split(":");

  if (speciesIndex !== speciesOption.index) {
    return false;
  }

  const section = speciesOption.previewSections.find(
    (previewSection) => previewSection.id === sectionId,
  );
  const field = section?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return Boolean(
    field?.id === "language" &&
      field.options.some((option) => option.value === selectedIndex),
  );
}

function findAvailableSpeciesLanguageChoiceKey(
  speciesOption: SpeciesOption,
  currentChoices: Record<string, string>,
  selectedIndex: string,
) {
  for (const section of speciesOption.previewSections) {
    for (const field of section.choiceFields ?? []) {
      const choiceKey = `${speciesOption.index}:${section.id}:${field.id}`;

      if (
        field.id === "language" &&
        !currentChoices[choiceKey] &&
        field.options.some((option) => option.value === selectedIndex)
      ) {
        return choiceKey;
      }
    }
  }

  return null;
}

function hasSpeciesHeritageChoiceFieldValue(
  speciesOption: SpeciesOption,
  choiceKey: string,
  selectedIndex: string,
) {
  const [speciesIndex, sectionId, fieldId] = choiceKey.split(":");

  if (speciesIndex !== speciesOption.index) {
    return false;
  }

  const section = speciesOption.previewSections.find(
    (previewSection) => previewSection.id === sectionId,
  );
  const field = section?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return Boolean(
    field?.id === "heritage" &&
      field.options.some((option) => option.value === selectedIndex),
  );
}

function findAvailableSpeciesHeritageChoiceKey(
  speciesOption: SpeciesOption,
  currentChoices: Record<string, string>,
  selectedIndex: string,
) {
  for (const section of speciesOption.previewSections) {
    for (const field of section.choiceFields ?? []) {
      const choiceKey = `${speciesOption.index}:${section.id}:${field.id}`;

      if (
        field.id === "heritage" &&
        !currentChoices[choiceKey] &&
        field.options.some((option) => option.value === selectedIndex)
      ) {
        return choiceKey;
      }
    }
  }

  return null;
}

function clampLevel(value: number) {
  return Math.max(1, Math.min(20, value));
}

function getSelectedSkillIndexes(
  featureChoices: FeatureChoiceSelections,
  classOption: ClassOption,
) {
  return [
    ...new Set(
      Object.entries(featureChoices)
        .filter(
          ([choiceKey, selectedIndex]) =>
            selectedIndex.startsWith("skill-") &&
            isClassSkillChoiceFieldByKey(classOption, choiceKey),
        )
        .map(([, selectedIndex]) => selectedIndex)
        .map((selectedIndex) => selectedIndex.replace(/^skill-/, "")),
    ),
  ];
}

function getClassOptionForCharacter(
  character: Character,
  options: ClassOption[],
) {
  return (
    options.find((classOption) => classOption.index === character.classIndex) ??
    options.find((classOption) => classOption.name === character.class.name) ??
    options[0]
  );
}

function getClassSkillChoiceSignature(character: Character | undefined) {
  return (character?.choices ?? [])
    .filter(
      (choice) =>
        choice.sourceType === classChoiceSourceType &&
        choice.choiceType === classSkillChoiceType,
    )
    .map(
      (choice) =>
        `${choice.sourceIndex ?? ""}:${choice.selectedType ?? ""}:${choice.selectedIndex}`,
    )
    .sort()
    .join("|");
}

function getFeatureChoiceSelectionSignature(character: Character | undefined) {
  return (character?.featureChoices ?? [])
    .map(
      (choice) =>
        `${choice.sourceType}:${choice.sourceIndex}:${choice.choicePath}:${choice.selectedOptionType}:${choice.selectedOptionIndex ?? ""}:${choice.selectedOptionName ?? ""}:${choice.selectedOptionUrl ?? ""}`,
    )
    .sort()
    .join("|");
}

function getCharacterBuilderHydrationSignature(character: Character | undefined) {
  if (!character) {
    return "";
  }

  return stableJsonString({
    abilityScores: [...character.abilityScores]
      .sort((left, right) => left.abilityIndex.localeCompare(right.abilityIndex))
      .map((abilityScore) => ({
        abilityIndex: abilityScore.abilityIndex,
        baseScore: abilityScore.baseScore,
        score: abilityScore.score,
      })),
    backgroundIndex: character.backgroundIndex,
    backgroundName: character.background.name,
    choices: (character.choices ?? [])
      .map(
        (choice) =>
          `${choice.sourceType ?? ""}:${choice.sourceIndex ?? ""}:${choice.choiceType ?? ""}:${choice.selectedType ?? ""}:${choice.selectedIndex ?? ""}`,
      )
      .sort(),
    classIndex: character.classIndex,
    className: character.class.name,
    currentHp: character.currentHp,
    featureChoices: getFeatureChoiceSelectionSignature(character),
    hitPointState: character.hitPointState ?? null,
    id: character.id,
    level: character.level,
    speciesIndex: character.speciesIndex,
    speciesName: character.species.name,
    subclassIndex: character.subclassIndex,
    updatedAt: getCharacterUpdatedAtRevision(character),
  });
}

function getSavedClassSkillFeatureChoices(
  character: Character,
  classOption: ClassOption,
): {
  featureChoices: FeatureChoiceSelections;
  hydratedCount: number;
  savedCount: number;
} {
  const featureChoices: FeatureChoiceSelections = {};
  let hydratedCount = 0;
  let savedCount = 0;

  for (const choice of character.choices ?? []) {
    if (
      choice.sourceType !== classChoiceSourceType ||
      choice.choiceType !== classSkillChoiceType ||
      choice.selectedType !== classSkillChoiceSelectedType ||
      !choice.sourceIndex ||
      !choice.selectedIndex
    ) {
      continue;
    }

    savedCount += 1;
    const [, featureId, fieldId] = choice.sourceIndex.split(":");

    if (!featureId || !fieldId) {
      continue;
    }

    const sourceChoiceKey = `${featureId}:${fieldId}`;

    if (hasClassSkillChoiceFieldValue(classOption, sourceChoiceKey, choice.selectedIndex)) {
      featureChoices[sourceChoiceKey] = choice.selectedIndex;
      hydratedCount += 1;
      continue;
    }

    const remappedChoiceKey = findAvailableClassSkillChoiceKey(
      classOption,
      featureChoices,
      choice.selectedIndex,
    );

    if (remappedChoiceKey) {
      featureChoices[remappedChoiceKey] = choice.selectedIndex;
      hydratedCount += 1;
    }
  }

  return {
    featureChoices,
    hydratedCount,
    savedCount,
  };
}

function hasClassSkillChoiceFieldValue(
  classOption: ClassOption,
  choiceKey: string,
  selectedIndex: string,
) {
  const [featureId, fieldId] = choiceKey.split(":");
  const feature = classOption.features.find((classFeature) => classFeature.id === featureId);
  const field = feature?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return Boolean(
    field?.choiceGroupId === classSkillChoiceType &&
      field.options.some((option) => option.value === selectedIndex),
  );
}

function findAvailableClassSkillChoiceKey(
  classOption: ClassOption,
  currentChoices: FeatureChoiceSelections,
  selectedIndex: string,
) {
  for (const feature of classOption.features) {
    for (const field of feature.choiceFields ?? []) {
      const choiceKey = `${feature.id}:${field.id}`;

      if (
        field.choiceGroupId === classSkillChoiceType &&
        !currentChoices[choiceKey] &&
        field.options.some((option) => option.value === selectedIndex)
      ) {
        return choiceKey;
      }
    }
  }

  return null;
}

function hasMatchingClassSkillFeatureChoices(
  featureChoices: FeatureChoiceSelections,
  classOption: ClassOption,
) {
  return Object.entries(featureChoices)
    .filter(([choiceKey]) => isClassSkillChoiceFieldByKey(classOption, choiceKey))
    .every(([choiceKey, selectedIndex]) =>
      hasClassSkillChoiceFieldValue(classOption, choiceKey, selectedIndex),
    );
}

function classSkillFeatureChoiceCount(
  featureChoices: FeatureChoiceSelections,
  classOption: ClassOption,
) {
  return Object.keys(featureChoices).filter((choiceKey) =>
    isClassSkillChoiceFieldByKey(classOption, choiceKey),
  ).length;
}

function isClassSkillChoiceFieldByKey(
  classOption: ClassOption,
  choiceKey: string,
) {
  const [featureId, fieldId] = choiceKey.split(":");
  const feature = classOption.features.find((classFeature) => classFeature.id === featureId);
  const field = feature?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return field?.choiceGroupId === classSkillChoiceType;
}

function getSavedGenericFeatureChoices(
  character: Character,
  classOption: ClassOption,
): {
  featureChoices: FeatureChoiceSelections;
  hydratedCount: number;
  savedCount: number;
} {
  const featureChoices: FeatureChoiceSelections = {};
  let hydratedCount = 0;
  let savedCount = 0;

  for (const choice of character.featureChoices ?? []) {
    if (
      typeof choice.level === "number" &&
      choice.level > character.level
    ) {
      continue;
    }

    savedCount += 1;

    const fieldMatch = findGenericFeatureChoiceField(classOption, choice);

    if (!fieldMatch) {
      continue;
    }

    const option = fieldMatch.field.options.find((candidate) =>
      savedFeatureChoiceOptionMatches(candidate, choice),
    );

    if (!option) {
      continue;
    }

    featureChoices[`${fieldMatch.featureId}:${fieldMatch.field.id}`] = option.value;
    hydratedCount += 1;
  }

  if (hydrateSavedSubclassChoice(character, classOption, featureChoices)) {
    savedCount += 1;
    hydratedCount += 1;
  }

  return {
    featureChoices,
    hydratedCount,
    savedCount,
  };
}

function hydrateSavedSubclassChoice(
  character: Character,
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
) {
  const subclassIndex = character.subclassIndex;

  if (!subclassIndex) {
    return false;
  }

  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (!subclassIndexes.has(subclassIndex)) {
    return false;
  }

  for (const feature of classOption.features) {
    for (const field of feature.choiceFields ?? []) {
      if (field.choiceKind !== "subclass" && !feature.id.includes("subclass")) {
        continue;
      }

      const choiceKey = `${feature.id}:${field.id}`;

      if (featureChoices[choiceKey]) {
        return false;
      }

      const option = field.options.find((candidate) =>
        subclassOptionMatches(candidate, subclassIndex),
      );

      if (!option) {
        continue;
      }

      featureChoices[choiceKey] = option.value;
      return true;
    }
  }

  return false;
}

function subclassOptionMatches(option: FeatureChoiceOption, subclassIndex: string) {
  return option.value === subclassIndex || option.selectedOptionIndex === subclassIndex;
}

function findGenericFeatureChoiceField(
  classOption: ClassOption,
  choice: NonNullable<Character["featureChoices"]>[number],
) {
  let abilityScoreImprovementFallback:
    | {
        featureId: string;
        field: NonNullable<ClassOption["features"][number]["choiceFields"]>[number];
      }
    | null = null;

  for (const feature of classOption.features) {
    for (const field of feature.choiceFields ?? []) {
      if (
        field.sourceType === choice.sourceType &&
        field.sourceIndex === choice.sourceIndex &&
        field.choicePath === choice.choicePath
      ) {
        return {
          featureId: feature.id,
          field,
        };
      }

      if (
        !abilityScoreImprovementFallback &&
        field.sourceType === choice.sourceType &&
        field.sourceIndex === choice.sourceIndex &&
        isAbilityScoreImprovementChoice(choice) &&
        abilityScoreImprovementFieldMatchesSavedChoice(field, choice)
      ) {
        abilityScoreImprovementFallback = {
          featureId: feature.id,
          field,
        };
      }
    }
  }

  return abilityScoreImprovementFallback;
}

function savedFeatureChoiceOptionMatches(
  option: FeatureChoiceOption,
  choice: NonNullable<Character["featureChoices"]>[number],
) {
  if (choice.selectedOptionIndex && option.selectedOptionIndex === choice.selectedOptionIndex) {
    return true;
  }

  if (choice.selectedOptionUrl && option.selectedOptionUrl === choice.selectedOptionUrl) {
    return true;
  }

  if (choice.selectedOptionName && option.selectedOptionName === choice.selectedOptionName) {
    return true;
  }

  if (choice.selectedOptionIndex && option.value === choice.selectedOptionIndex) {
    return true;
  }

  const optionAbilityIndex =
    canonicalAbilityScoreIndex(option.value) ??
    canonicalAbilityScoreIndex(option.selectedOptionIndex ?? undefined) ??
    canonicalAbilityScoreIndex(option.selectedOptionName ?? undefined);
  const selectedAbilityIndex =
    canonicalAbilityScoreIndex(choice.selectedOptionIndex ?? undefined) ??
    canonicalAbilityScoreIndex(choice.selectedOptionName ?? undefined);

  if (optionAbilityIndex && selectedAbilityIndex && optionAbilityIndex === selectedAbilityIndex) {
    return true;
  }

  return stableJsonString(option.selectedRawJson) === stableJsonString(choice.selectedRawJson);
}

function isAbilityScoreImprovementChoice(
  choice: NonNullable<Character["featureChoices"]>[number],
) {
  const normalizedChoiceKey = choice.choiceKey?.toLowerCase() ?? "";
  const normalizedChoicePath = choice.choicePath.toLowerCase();

  return (
    normalizedChoiceKey === "asi-score" ||
    normalizedChoiceKey === "asi-score-1" ||
    normalizedChoiceKey === "asi-score-2" ||
    normalizedChoicePath.endsWith("asi-score-1") ||
    normalizedChoicePath.endsWith("asi-score-2") ||
    normalizedChoicePath.endsWith("ability_scores.slot1") ||
    normalizedChoicePath.endsWith("ability_scores.slot2")
  );
}

function abilityScoreImprovementFieldMatchesSavedChoice(
  field: NonNullable<ClassOption["features"][number]["choiceFields"]>[number],
  choice: NonNullable<Character["featureChoices"]>[number],
) {
  const savedChoiceKey = choice.choiceKey?.toLowerCase() ?? "";
  const fieldChoiceKeys = new Set(
    [field.choiceKey, field.id]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase()),
  );

  if (savedChoiceKey && fieldChoiceKeys.has(savedChoiceKey)) {
    return true;
  }

  const savedPathChoiceKey = choice.choicePath.toLowerCase().match(/(?:^|\.)(asi-score-[12])$/)?.[1];

  if (savedPathChoiceKey && fieldChoiceKeys.has(savedPathChoiceKey)) {
    return true;
  }

  const savedSlot = choice.choicePath.toLowerCase().match(/\.slot([12])$/)?.[1];

  return Boolean(savedSlot && fieldChoiceKeys.has(`asi-score-${savedSlot}`));
}

function hasMatchingGenericFeatureChoices(
  featureChoices: FeatureChoiceSelections,
  classOption: ClassOption,
) {
  return Object.entries(featureChoices)
    .filter(([choiceKey]) => Boolean(getGenericFeatureChoiceFieldByKey(classOption, choiceKey)))
    .every(([choiceKey, selectedIndex]) => {
      const field = getGenericFeatureChoiceFieldByKey(classOption, choiceKey);

      return Boolean(field?.options.some((option) => option.value === selectedIndex));
    });
}

function genericFeatureChoiceCount(
  featureChoices: FeatureChoiceSelections,
  classOption: ClassOption,
) {
  return Object.keys(featureChoices).filter((choiceKey) =>
    Boolean(getGenericFeatureChoiceFieldByKey(classOption, choiceKey)),
  ).length;
}

function getGenericFeatureChoiceFieldByKey(
  classOption: ClassOption,
  choiceKey: string,
) {
  const [featureId, fieldId] = choiceKey.split(":");
  const feature = classOption.features.find((classFeature) => classFeature.id === featureId);
  const field = feature?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return field?.sourceType && field.sourceIndex && field.choicePath ? field : null;
}

function shouldClearSubclassForLevel(
  classOption: ClassOption,
  subclassIndex: string | null,
  level: number,
) {
  if (!subclassIndex) {
    return false;
  }

  const subclassChoiceLevel = getSubclassChoiceLevel(classOption, subclassIndex);

  return subclassChoiceLevel !== null && level < subclassChoiceLevel;
}

function getSubclassChoiceLevel(classOption: ClassOption, subclassIndex: string) {
  for (const feature of classOption.features) {
    for (const field of feature.choiceFields ?? []) {
      if (
        field.choiceKind === "subclass" &&
        field.options.some(
          (option) =>
            option.value === subclassIndex || option.selectedOptionIndex === subclassIndex,
        )
      ) {
        return feature.level;
      }
    }
  }

  return null;
}

function stableJsonString(value: unknown) {
  if (value === undefined) {
    return "";
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function getCharacterBuilderDraftStorageKey(characterId: string) {
  return `${characterBuilderDraftStoragePrefix}:${characterId}`;
}

function loadCharacterBuilderDraft(characterId: string) {
  try {
    const rawDraft = window.localStorage.getItem(getCharacterBuilderDraftStorageKey(characterId));

    if (!rawDraft) {
      return null;
    }

    const parsedDraft = JSON.parse(rawDraft) as PersistedCharacterBuilderDraft;

    if (
      !parsedDraft ||
      parsedDraft.version !== 2 ||
      typeof parsedDraft.dirty !== "boolean" ||
      !isNullableNonEmptyString(parsedDraft.baseCharacterUpdatedAt) ||
      typeof parsedDraft.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsedDraft.updatedAt)) ||
      !parsedDraft.builderState ||
      !parsedDraft.featureChoices
    ) {
      return null;
    }

    return parsedDraft;
  } catch {
    return null;
  }
}

function saveCharacterBuilderDraft(
  character: Character,
  builderState: CharacterBuilderState,
  featureChoices: FeatureChoiceSelections,
  options: {
    backgroundOptions: BackgroundOption[];
    classOptions: ClassOption[];
    speciesOptions: SpeciesOption[];
  },
  baseCharacterUpdatedAt: string | null,
) {
  try {
    const hydratedBuilderState = createBuilderStateFromOptions(character, options);
    const hydratedFeatureChoices = getHydratedFeatureChoiceState(
      character,
      getClassOptionForCharacter(character, options.classOptions),
    ).featureChoices;
    const draft: PersistedCharacterBuilderDraft = {
      baseCharacterUpdatedAt,
      builderState,
      dirty:
        !areBuilderStatesEquivalent(builderState, hydratedBuilderState) ||
        !areStringRecordsEquivalent(featureChoices, hydratedFeatureChoices),
      featureChoices,
      updatedAt: createDraftUpdatedAt(baseCharacterUpdatedAt),
      version: 2,
    };

    window.localStorage.setItem(
      getCharacterBuilderDraftStorageKey(character.id),
      JSON.stringify(draft),
    );
  } catch {
    // Ignore storage failures so the live builder remains usable.
  }
}

function isNullableNonEmptyString(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && value.trim().length > 0);
}

function getCharacterUpdatedAtRevision(character: Character) {
  return typeof character.updatedAt === "string" && character.updatedAt.trim().length > 0
    ? character.updatedAt
    : null;
}

function getCharacterUpdatedAtTime(character: Character) {
  const revision = getCharacterUpdatedAtRevision(character);

  if (!revision) {
    return null;
  }

  const timestamp = Date.parse(revision);

  return Number.isNaN(timestamp) ? null : timestamp;
}

function createDraftUpdatedAt(baseCharacterUpdatedAt: string | null) {
  const baseTimestamp =
    typeof baseCharacterUpdatedAt === "string" ? Date.parse(baseCharacterUpdatedAt) : Number.NaN;
  const timestamp = Number.isNaN(baseTimestamp)
    ? Date.now()
    : Math.max(Date.now(), baseTimestamp + 1);

  return new Date(timestamp).toISOString();
}

function shouldRestoreCharacterBuilderDraft({
  character,
  draft,
  hydratedBuilderState,
  hydratedFeatureChoices,
  options,
}: {
  character: Character;
  draft: PersistedCharacterBuilderDraft | null;
  hydratedBuilderState: CharacterBuilderState;
  hydratedFeatureChoices: FeatureChoiceSelections;
  options: {
    backgroundOptions: BackgroundOption[];
    classOptions: ClassOption[];
    speciesOptions: SpeciesOption[];
  };
}) {
  const draftUpdatedAtTime = draft ? Date.parse(draft.updatedAt) : Number.NaN;
  const characterUpdatedAtTime = getCharacterUpdatedAtTime(character);

  if (
    !draft?.dirty ||
    draft.baseCharacterUpdatedAt !== getCharacterUpdatedAtRevision(character) ||
    Number.isNaN(draftUpdatedAtTime) ||
    (characterUpdatedAtTime !== null && draftUpdatedAtTime <= characterUpdatedAtTime)
  ) {
    return null;
  }

  const builderState = normalizePersistedBuilderState(
    draft.builderState,
    hydratedBuilderState,
    options,
  );
  const featureChoices = normalizePersistedFeatureChoices(draft.featureChoices);

  if (
    areBuilderStatesEquivalent(builderState, hydratedBuilderState) &&
    areStringRecordsEquivalent(featureChoices, hydratedFeatureChoices)
  ) {
    return null;
  }

  return {
    builderState,
    featureChoices,
  };
}

function normalizePersistedFeatureChoices(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as FeatureChoiceSelections;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entryValue]) =>
      typeof key === "string" && typeof entryValue === "string"
        ? [[key, entryValue] as const]
        : [],
    ),
  ) as FeatureChoiceSelections;
}

function normalizePersistedBuilderState(
  value: unknown,
  baseState: CharacterBuilderState,
  options: {
    backgroundOptions: BackgroundOption[];
    classOptions: ClassOption[];
    speciesOptions: SpeciesOption[];
  },
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return baseState;
  }

  const draftState = value as Partial<CharacterBuilderState>;
  const speciesIndexes = new Set(options.speciesOptions.map((species) => species.index));
  const backgroundIndexes = new Set(options.backgroundOptions.map((background) => background.index));
  const classIndexes = new Set(options.classOptions.map((classOption) => classOption.index));
  const normalizedLevel = clampLevel(
    typeof draftState.level === "number" ? draftState.level : baseState.level,
  );
  const normalizedCurrentHp = Math.max(
    0,
    Math.floor(
      typeof draftState.currentHp === "number" ? draftState.currentHp : baseState.currentHp,
    ),
  );
  const normalizedTempHp = Math.max(
    0,
    Math.floor(typeof draftState.tempHp === "number" ? draftState.tempHp : baseState.tempHp),
  );
  const normalizedAbilityAssignments = Array.isArray(draftState.abilityAssignments)
    ? baseState.abilityAssignments.map((baseAssignment) => {
        const matchingDraftAssignment = draftState.abilityAssignments?.find(
          (assignment) =>
            assignment &&
            typeof assignment === "object" &&
            "id" in assignment &&
            assignment.id === baseAssignment.id,
        );

        if (!matchingDraftAssignment || typeof matchingDraftAssignment !== "object") {
          return baseAssignment;
        }

        const nextAbilityIndex =
          typeof matchingDraftAssignment.abilityIndex === "string" &&
          abilityOrder.includes(matchingDraftAssignment.abilityIndex)
            ? matchingDraftAssignment.abilityIndex
            : baseAssignment.abilityIndex;
        const nextScore =
          typeof matchingDraftAssignment.score === "number" &&
          Number.isFinite(matchingDraftAssignment.score)
            ? Math.max(1, Math.floor(matchingDraftAssignment.score))
            : baseAssignment.score;
        const nextDice = Array.isArray(matchingDraftAssignment.dice)
          ? matchingDraftAssignment.dice
              .filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
              .map((entry) => Math.max(1, Math.floor(entry)))
          : baseAssignment.dice;

        return {
          ...baseAssignment,
          abilityIndex: nextAbilityIndex,
          dice: nextDice,
          score: nextScore,
        };
      })
    : baseState.abilityAssignments;
  const normalizedHitPointSettings =
    draftState.hitPointSettings &&
    typeof draftState.hitPointSettings === "object" &&
    !Array.isArray(draftState.hitPointSettings)
      ? {
          bonusHp:
            typeof draftState.hitPointSettings.bonusHp === "number" &&
            Number.isFinite(draftState.hitPointSettings.bonusHp)
              ? Math.floor(draftState.hitPointSettings.bonusHp)
              : baseState.hitPointSettings.bonusHp,
          calculationMode:
            draftState.hitPointSettings.calculationMode === "rolled" ||
            draftState.hitPointSettings.calculationMode === "override" ||
            draftState.hitPointSettings.calculationMode === "fixed"
              ? draftState.hitPointSettings.calculationMode
              : baseState.hitPointSettings.calculationMode,
          overrideMaxHp:
            typeof draftState.hitPointSettings.overrideMaxHp === "number" &&
            Number.isFinite(draftState.hitPointSettings.overrideMaxHp)
              ? Math.max(1, Math.floor(draftState.hitPointSettings.overrideMaxHp))
              : draftState.hitPointSettings.overrideMaxHp === null
                ? null
                : baseState.hitPointSettings.overrideMaxHp,
          rolledHitPoints: synchronizeHitPointRolls(
            normalizedLevel,
            getClassOptionByIndex(
              typeof draftState.classIndex === "string" &&
                classIndexes.has(draftState.classIndex)
                ? draftState.classIndex
                : baseState.classIndex,
              options.classOptions,
            ).hitDie,
            Array.isArray(draftState.hitPointSettings.rolledHitPoints)
              ? draftState.hitPointSettings.rolledHitPoints
                  .filter((entry): entry is number => typeof entry === "number" && Number.isFinite(entry))
                  .map((entry) => Math.max(1, Math.floor(entry)))
              : baseState.hitPointSettings.rolledHitPoints,
          ),
        }
      : baseState.hitPointSettings;

  return {
    ...baseState,
    abilityAssignments: normalizedAbilityAssignments,
    backgroundChoices: normalizeStringRecord(draftState.backgroundChoices, baseState.backgroundChoices),
    backgroundIndex:
      typeof draftState.backgroundIndex === "string" &&
      backgroundIndexes.has(draftState.backgroundIndex)
        ? draftState.backgroundIndex
        : baseState.backgroundIndex,
    classIndex:
      typeof draftState.classIndex === "string" && classIndexes.has(draftState.classIndex)
        ? draftState.classIndex
        : baseState.classIndex,
    currentHp: normalizedCurrentHp,
    hitPointSettings: normalizedHitPointSettings,
    level: normalizedLevel,
    speciesChoices: normalizeStringRecord(draftState.speciesChoices, baseState.speciesChoices),
    speciesIndex:
      typeof draftState.speciesIndex === "string" && speciesIndexes.has(draftState.speciesIndex)
        ? draftState.speciesIndex
        : baseState.speciesIndex,
    subclassIndex:
      typeof draftState.subclassIndex === "string" || draftState.subclassIndex === null
        ? draftState.subclassIndex
        : baseState.subclassIndex,
    tempHp: normalizedTempHp,
  };
}

function normalizeStringRecord(
  value: unknown,
  fallback: Record<string, string>,
) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fallback;
  }

  const normalized = Object.fromEntries(
    Object.entries(value).flatMap(([key, entryValue]) =>
      typeof key === "string" && typeof entryValue === "string"
        ? [[key, entryValue] as const]
        : [],
    ),
  );

  // Early autosave drafts can be empty while reference data is still loading.
  // Keep server-hydrated choices unless the draft has a matching replacement.
  return {
    ...fallback,
    ...normalized,
  };
}

function getClassOptionByIndex(classIndex: string, options: ClassOption[]) {
  return options.find((classOption) => classOption.index === classIndex) ?? options[0];
}

function getPersistedSkillIndexes(character: Character) {
  if (character.proficiencies?.length) {
    return [
      ...new Set(
        character.proficiencies
          .filter((proficiency) => {
            if (proficiency.sourceType === classChoiceProficiencySourceType) {
              return false;
            }

            if (proficiency.sourceType === "background") {
              return false;
            }

            return proficiency.proficiencyIndex.startsWith("skill-");
          })
          .map((proficiency) => proficiency.proficiencyIndex.replace(/^skill-/, "")),
      ),
    ];
  }

  return character.skills
    .filter((characterSkill) => characterSkill.isProficient)
    .map((characterSkill) => characterSkill.skillIndex);
}

function getPersistedFeatureChoices(character: Character) {
  return Object.fromEntries(
    (character.choices ?? [])
      .filter(
        (choice) =>
          choice.sourceType === "class-feature" &&
          typeof choice.sourceIndex === "string" &&
          choice.sourceIndex.length > 0 &&
          typeof choice.selectedIndex === "string" &&
          choice.selectedIndex.length > 0,
      )
      .map((choice) => [
        `${choice.sourceIndex}:${choice.choiceType ?? "selection"}`,
        choice.selectedIndex,
      ]),
  );
}

function getHydratedFeatureChoiceState(character: Character, classOption: ClassOption) {
  const persistedFeatureChoices = getPersistedFeatureChoices(character);
  const classSkillHydration = getSavedClassSkillFeatureChoices(character, classOption);
  const genericHydration = getSavedGenericFeatureChoices(character, classOption);

  return {
    classSkillHydration,
    featureChoices: {
      ...persistedFeatureChoices,
      ...genericHydration.featureChoices,
      ...classSkillHydration.featureChoices,
    },
    genericHydration,
  };
}

function useCharacterBuilder(character: Character | undefined) {
  const previousCharacterIdRef = useRef<string | null>(null);
  const previousHydratedBuilderStateRef = useRef<CharacterBuilderState | null>(null);
  const draftBaseCharacterUpdatedAtRef = useRef<string | null>(null);
  const previousClassSkillChoiceSignatureRef = useRef("");
  const previousFeatureChoiceSignatureRef = useRef("");
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
      previousHydratedBuilderStateRef.current = null;
      draftBaseCharacterUpdatedAtRef.current = null;
      previousClassSkillChoiceSignatureRef.current = "";
      previousFeatureChoiceSignatureRef.current = "";
      return;
    }

    const isNewCharacter = previousCharacterIdRef.current !== character.id;
    const characterUpdatedAtRevision = getCharacterUpdatedAtRevision(character);
    const nextHydratedBuilderState = createBuilderStateFromOptions(character, referenceOptions);
    const selectedClassOption = getClassOptionForCharacter(
      character,
      referenceOptions.classOptions,
    );
    const classSkillChoiceSignature = getClassSkillChoiceSignature(character);
    const featureChoiceSignature = getFeatureChoiceSelectionSignature(character);
    const {
      classSkillHydration,
      featureChoices: hydratedFeatureChoices,
      genericHydration,
    } = getHydratedFeatureChoiceState(character, selectedClassOption);
    const savedCount = classSkillHydration.savedCount + genericHydration.savedCount;
    const hydratedCount = classSkillHydration.hydratedCount + genericHydration.hydratedCount;
    const canMarkSavedChoicesProcessed =
      savedCount === 0 || hydratedCount === savedCount;
    const savedChoicesChanged =
      isNewCharacter ||
      previousClassSkillChoiceSignatureRef.current !== classSkillChoiceSignature ||
      previousFeatureChoiceSignatureRef.current !== featureChoiceSignature;
    const previousHydratedBuilderState = previousHydratedBuilderStateRef.current;
    const shouldAcceptHydratedBuilderState =
      isNewCharacter ||
      !builderState ||
      Boolean(
        previousHydratedBuilderState &&
          areBuilderStatesEquivalent(builderState, previousHydratedBuilderState),
      ) ||
      areBuilderStatesEquivalent(builderState, nextHydratedBuilderState);

    const persistedDraft = loadCharacterBuilderDraft(character.id);
    const restoredDraft = shouldRestoreCharacterBuilderDraft({
      character,
      draft: persistedDraft,
      hydratedBuilderState: nextHydratedBuilderState,
      hydratedFeatureChoices,
      options: referenceOptions,
    });
    const nextBuilderState = restoredDraft?.builderState ?? nextHydratedBuilderState;

    setBuilderState((currentState) => {
      if (isNewCharacter || !currentState) {
        return nextBuilderState;
      }

      if (
        previousHydratedBuilderState &&
        areBuilderStatesEquivalent(currentState, previousHydratedBuilderState)
      ) {
        return nextBuilderState;
      }

      return currentState;
    });
    setFeatureChoices((currentChoices) => {
      const hasCurrentClassSkillChoices =
        classSkillFeatureChoiceCount(currentChoices, selectedClassOption) > 0;
      const hasCurrentGenericFeatureChoices =
        genericFeatureChoiceCount(currentChoices, selectedClassOption) > 0;
      const shouldRetryHydration =
        savedCount > 0 &&
        ((!hasCurrentClassSkillChoices &&
          classSkillHydration.savedCount > 0) ||
          (!hasCurrentGenericFeatureChoices &&
            genericHydration.savedCount > 0) ||
          !hasMatchingClassSkillFeatureChoices(currentChoices, selectedClassOption) ||
          !hasMatchingGenericFeatureChoices(currentChoices, selectedClassOption));

      if (!savedChoicesChanged && !shouldRetryHydration) {
        return currentChoices;
      }

      if (restoredDraft) {
        return {
          ...hydratedFeatureChoices,
          ...restoredDraft.featureChoices,
        };
      }

      if (hydratedCount > 0 || savedCount === 0) {
        return hydratedFeatureChoices;
      }

      return currentChoices;
    });

    if (isNewCharacter) {
      setPersistedSkillIndexes(getPersistedSkillIndexes(character));
    }

    previousCharacterIdRef.current = character.id;
    if (shouldAcceptHydratedBuilderState) {
      previousHydratedBuilderStateRef.current = nextHydratedBuilderState;
    }
    draftBaseCharacterUpdatedAtRef.current =
      shouldAcceptHydratedBuilderState &&
      areStringRecordsEquivalent(featureChoices, hydratedFeatureChoices)
        ? characterUpdatedAtRevision
        : draftBaseCharacterUpdatedAtRef.current ?? characterUpdatedAtRevision;
    if (canMarkSavedChoicesProcessed) {
      previousClassSkillChoiceSignatureRef.current = classSkillChoiceSignature;
      previousFeatureChoiceSignatureRef.current = featureChoiceSignature;
    }
  }, [
    getCharacterBuilderHydrationSignature(character),
    referenceOptions,
  ]);

  useEffect(() => {
    if (!character || !builderState) {
      return;
    }

    saveCharacterBuilderDraft(
      character,
      builderState,
      featureChoices,
      referenceOptions,
      draftBaseCharacterUpdatedAtRef.current ?? getCharacterUpdatedAtRevision(character),
    );
  }, [builderState, character?.id, character?.updatedAt, featureChoices]);

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
          subclassRuleDocuments,
          subspeciesRuleDocuments,
          featRuleDocuments,
          traitRuleDocuments,
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
          fetchRuleDocuments("subclasses").catch((error) => {
            console.warn("Subclass reference data is unavailable.", error);
            return [];
          }),
          fetchRuleDocuments("subspecies").catch((error) => {
            console.warn("Species heritage reference data is unavailable.", error);
            return [];
          }),
          fetchRuleDocuments("feats").catch((error) => {
            console.warn("Background feat reference data is unavailable.", error);
            return [];
          }),
          fetchRuleDocuments("traits").catch((error) => {
            console.warn("Species trait reference data is unavailable.", error);
            return [];
          }),
        ]);

        if (!isCurrentRequest) {
          return;
        }

        const nextSpeciesOptions = mapSpeciesReferences(
          speciesReferences,
          subspeciesRuleDocuments,
          speciesOptions,
          traitRuleDocuments,
        );
        const nextBackgroundOptions = mapBackgroundReferences(
          backgroundReferences,
          featRuleDocuments,
          backgroundOptions,
        );
        const nextClassOptions = mapClassReferences(
          classReferences,
          classOptions,
          levelRuleDocuments,
          featureRuleDocuments,
          subclassRuleDocuments,
          featRuleDocuments,
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
    const featureBonusHp = getFeatureChoiceHitPointBonus(
      selectedClass,
      featureChoices,
      builderState.level,
    );

    return calculateHitPointPreview({
      constitutionScore,
      featureBonusHp,
      hitDie: selectedClass.hitDie,
      level: builderState.level,
      settings: builderState.hitPointSettings,
    });
  }, [builderState, featureChoices, selectedClass]);
  const selectedSkillIndexes = useMemo(
    () => getSelectedSkillIndexes(featureChoices, selectedClass),
    [featureChoices, selectedClass],
  );
  const resolvedPreviewSubclassIndex = useMemo(
    () =>
      getResolvedSubclassIndex(
        selectedClass,
        featureChoices,
        builderState?.subclassIndex ?? null,
        builderState?.level ?? 1,
      ),
    [builderState?.level, builderState?.subclassIndex, featureChoices, selectedClass],
  );

  const previewCharacter = useMemo(() => {
    if (!character || !builderState) {
      return null;
    }

    const previewFeatureSelections = buildGenericClassFeatureChoices(
      builderState.classIndex,
      selectedClass,
      builderState.level,
      featureChoices,
      resolvedPreviewSubclassIndex,
    ).concat(
      buildGenericBackgroundFeatureChoices(
        selectedBackground,
        builderState.backgroundChoices,
      ),
    );

    return buildCharacterPreview({
      background: selectedBackground,
      character,
      classOption: selectedClass,
      featureChoices,
      previewFeatureSelections,
      previewSubclassIndex: resolvedPreviewSubclassIndex,
      selectedSkillIndexes,
      species: selectedSpecies,
      state: builderState,
    });
  }, [
    builderState,
    character,
    selectedBackground,
    selectedClass,
    featureChoices,
    resolvedPreviewSubclassIndex,
    selectedSkillIndexes,
    selectedSpecies,
  ]);

  function updateLevel(nextLevel: number) {
    if (!Number.isFinite(nextLevel)) {
      return;
    }

    const normalizedLevel = clampLevel(nextLevel);
    setFeatureChoices((currentChoices) =>
      pruneFeatureChoicesToLevel(selectedClass, currentChoices, normalizedLevel),
    );

    setBuilderState((currentState) =>
      currentState
        ? (() => {
            const normalizedHitPointSettings = {
              ...currentState.hitPointSettings,
              rolledHitPoints: synchronizeHitPointRolls(
                normalizedLevel,
                selectedClass.hitDie,
                currentState.hitPointSettings.rolledHitPoints,
              ),
            };
            const constitutionScore = getAssignedAbilityScore(
              currentState.abilityAssignments,
              "con",
              10,
            );
            const nextHitPointPreview = calculateHitPointPreview({
              constitutionScore,
              featureBonusHp: getFeatureChoiceHitPointBonus(
                selectedClass,
                pruneFeatureChoicesToLevel(selectedClass, featureChoices, normalizedLevel),
                normalizedLevel,
              ),
              hitDie: selectedClass.hitDie,
              level: normalizedLevel,
              settings: normalizedHitPointSettings,
            });

            return {
              ...currentState,
              level: normalizedLevel,
              currentHp: Math.min(currentState.currentHp, nextHitPointPreview.maxHp),
              hitPointSettings: normalizedHitPointSettings,
              subclassIndex: shouldClearSubclassForLevel(
                selectedClass,
                currentState.subclassIndex,
                normalizedLevel,
              )
                ? null
                : currentState.subclassIndex,
            };
          })()
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

  function applyHitPointConfiguration(nextSettings: HitPointSettings) {
    setBuilderState((currentState) =>
      currentState
        ? (() => {
            const normalizedSettings = {
              bonusHp: nextSettings.bonusHp,
              calculationMode: nextSettings.calculationMode,
              overrideMaxHp: nextSettings.overrideMaxHp,
              rolledHitPoints: synchronizeHitPointRolls(
                currentState.level,
                selectedClass.hitDie,
                nextSettings.rolledHitPoints,
              ),
            };
            const constitutionScore = getAssignedAbilityScore(
              currentState.abilityAssignments,
              "con",
              10,
            );
            const featureBonusHp = getFeatureChoiceHitPointBonus(
              selectedClass,
              featureChoices,
              currentState.level,
            );
            const nextHitPointPreview = calculateHitPointPreview({
              constitutionScore,
              featureBonusHp,
              hitDie: selectedClass.hitDie,
              level: currentState.level,
              settings: normalizedSettings,
            });

            return {
              ...currentState,
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
      const featureBonusHp = getFeatureChoiceHitPointBonus(
        selectedClass,
        featureChoices,
        currentState.level,
      );
      const nextHitPointPreview = calculateHitPointPreview({
        constitutionScore,
        featureBonusHp,
        hitDie: selectedClass.hitDie,
        level: currentState.level,
        settings: currentState.hitPointSettings,
      });
      const nextHitPoints = applyHitPointAdjustment({
        amount,
        currentHp: currentState.currentHp,
        maxHp: nextHitPointPreview.maxHp,
        mode,
        tempHp: currentState.tempHp,
      });

      return {
        ...currentState,
        currentHp: nextHitPoints.currentHp,
        tempHp: nextHitPoints.tempHp,
      };
    });
  }

  function applyLongRest() {
    setBuilderState((currentState) => {
      if (!currentState) {
        return currentState;
      }

      const constitutionScore = getAssignedAbilityScore(
        currentState.abilityAssignments,
        "con",
        10,
      );
      const featureBonusHp = getFeatureChoiceHitPointBonus(
        selectedClass,
        featureChoices,
        currentState.level,
      );
      const nextHitPointPreview = calculateHitPointPreview({
        constitutionScore,
        featureBonusHp,
        hitDie: selectedClass.hitDie,
        level: currentState.level,
        settings: currentState.hitPointSettings,
      });

      return {
        ...currentState,
        currentHp: nextHitPointPreview.maxHp,
        tempHp: 0,
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

  function confirmSelection(nextOptions?: {
    backgroundChoices?: Record<string, string>;
    speciesChoices?: Record<string, string>;
  }) {
    if (!builderState || !activePanel || !pendingSelection) {
      closePanel();
      return;
    }

    const nextSpeciesChoices =
      activePanel === "species"
        ? Object.fromEntries(
            Object.entries(nextOptions?.speciesChoices ?? {}).filter(([key]) =>
              key.startsWith(`${pendingSelection}:`),
            ),
          )
        : builderState.speciesChoices;
    const nextBackgroundChoices =
      activePanel === "background"
        ? Object.fromEntries(
            Object.entries(nextOptions?.backgroundChoices ?? {}).filter(([key]) =>
              key.startsWith(`${pendingSelection}:`),
            ),
          )
        : builderState.backgroundChoices;

    setBuilderState({
      ...builderState,
      ...(activePanel === "species" ? { speciesIndex: pendingSelection } : {}),
      ...(activePanel === "background" ? { backgroundIndex: pendingSelection } : {}),
      ...(activePanel === "class" ? { classIndex: pendingSelection } : {}),
      ...(activePanel === "class" ? { subclassIndex: null } : {}),
      ...(activePanel === "species" ? { speciesChoices: nextSpeciesChoices } : {}),
      ...(activePanel === "background" ? { backgroundChoices: nextBackgroundChoices } : {}),
    });

    if (activePanel === "class") {
      setFeatureChoices({});
    }

    closePanel();
  }

  function setSelection(nextSelection: string) {
    setPendingSelection(nextSelection);
  }

  function setSubclassIndex(nextSubclassIndex: string | null) {
    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            subclassIndex: nextSubclassIndex,
          }
        : currentState,
    );
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
    speciesChoices: builderState?.speciesChoices ?? {},
    backgroundChoices: builderState?.backgroundChoices ?? {},
    persistedSkillIndexes,
    setSelection,
    setSubclassIndex,
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
    applyLongRest,
    setTempHp,
    updateHitPointSettings,
    updateLevel,
    handleRollAllAbilities,
  };
}

function areBuilderStatesEquivalent(
  left: CharacterBuilderState,
  right: CharacterBuilderState,
) {
  return stableJsonString(left) === stableJsonString(right);
}

function areStringRecordsEquivalent(left: Record<string, string>, right: Record<string, string>) {
  const leftEntries = Object.entries(left).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );
  const rightEntries = Object.entries(right).sort(([leftKey], [rightKey]) =>
    leftKey.localeCompare(rightKey),
  );

  return stableJsonString(leftEntries) === stableJsonString(rightEntries);
}

function getResolvedSubclassIndex(
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
  persistedSubclassIndex: string | null,
  characterLevel: number,
) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (
    persistedSubclassIndex &&
    subclassIndexes.has(persistedSubclassIndex) &&
    !shouldClearSubclassForLevel(classOption, persistedSubclassIndex, characterLevel)
  ) {
    return persistedSubclassIndex;
  }

  for (const feature of classOption.features) {
    if (feature.level > characterLevel) {
      continue;
    }

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

function pruneFeatureChoicesToLevel(
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
  characterLevel: number,
) {
  return Object.fromEntries(
    Object.entries(featureChoices).filter(([choiceKey]) => {
      const [featureId] = choiceKey.split(":");
      const feature = classOption.features.find((classFeature) => classFeature.id === featureId);

      return !feature || feature.level <= characterLevel;
    }),
  );
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
