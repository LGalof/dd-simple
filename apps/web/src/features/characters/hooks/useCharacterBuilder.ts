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
  FeatureChoiceOption,
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
    options.classOptions.find((classOption) => classOption.index === character.classIndex) ??
    options.classOptions.find((classOption) => classOption.name === character.class.name) ??
    options.classOptions[0];
  const initialSpeciesIndex =
    options.speciesOptions.find((species) => species.name === character.species.name)?.index ??
    options.speciesOptions[0].index;
  const initialBackgroundIndex =
    options.backgroundOptions.find(
      (background) => background.name === character.background.name,
    )?.index ?? options.backgroundOptions[0].index;
  const hitPointSettings = getSavedHitPointSettings(character, initialClass.hitDie);

  return {
    speciesIndex: initialSpeciesIndex,
    backgroundIndex: initialBackgroundIndex,
    classIndex: initialClass.index,
    subclassIndex: getSavedSubclassIndex(character, initialClass),
    level: character.level,
    currentHp: character.currentHp,
    tempHp: character.hitPointState?.tempHp ?? 0,
    speciesChoices: getSavedSpeciesChoices(character, {
      speciesIndex:
        initialSpeciesIndex,
      speciesOptions: options.speciesOptions,
    }),
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

      if (fieldValue) {
        backgroundChoices[choiceKey] = fieldValue;
      }
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
    if (choice.sourceType !== "BACKGROUND" || choice.sourceIndex !== backgroundIndex) {
      continue;
    }

    for (const section of backgroundOption.previewSections) {
      for (const field of section.choiceFields ?? []) {
        if (
          field.sourceType !== choice.sourceType ||
          field.sourceIndex !== choice.sourceIndex ||
          field.choicePath !== choice.choicePath
        ) {
          continue;
        }

        const option = field.options.find((candidate) =>
          savedFeatureChoiceOptionMatches(candidate, choice),
        );

        if (option) {
          backgroundChoices[`${backgroundIndex}:${section.id}:${field.id}`] = option.value;
        }
      }
    }
  }

  return backgroundChoices;
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
      }

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

  return {
    featureChoices,
    hydratedCount,
    savedCount,
  };
}

function findGenericFeatureChoiceField(
  classOption: ClassOption,
  choice: NonNullable<Character["featureChoices"]>[number],
) {
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
    }
  }

  return null;
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

  return stableJsonString(option.selectedRawJson) === stableJsonString(choice.selectedRawJson);
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

function useCharacterBuilder(character: Character | undefined) {
  const previousCharacterIdRef = useRef<string | null>(null);
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
      previousClassSkillChoiceSignatureRef.current = "";
      previousFeatureChoiceSignatureRef.current = "";
      return;
    }

    const selectedClassOption = getClassOptionForCharacter(
      character,
      referenceOptions.classOptions,
    );
    const classSkillChoiceSignature = getClassSkillChoiceSignature(character);
    const persistedFeatureChoices = getPersistedFeatureChoices(character);
    const featureChoiceSignature = getFeatureChoiceSelectionSignature(character);
    const classSkillHydration = getSavedClassSkillFeatureChoices(character, selectedClassOption);
    const genericHydration = getSavedGenericFeatureChoices(character, selectedClassOption);
    const hydratedFeatureChoices = {
      ...persistedFeatureChoices,
      ...genericHydration.featureChoices,
      ...classSkillHydration.featureChoices,
    };
    const savedCount = classSkillHydration.savedCount + genericHydration.savedCount;
    const hydratedCount = classSkillHydration.hydratedCount + genericHydration.hydratedCount;
    const canMarkSavedChoicesProcessed =
      savedCount === 0 || hydratedCount === savedCount;
    const savedChoicesChanged =
      previousCharacterIdRef.current !== character.id ||
      previousClassSkillChoiceSignatureRef.current !== classSkillChoiceSignature ||
      previousFeatureChoiceSignatureRef.current !== featureChoiceSignature;

    setBuilderState(createBuilderStateFromOptions(character, referenceOptions));
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

      if (hydratedCount > 0 || savedCount === 0) {
        return hydratedFeatureChoices;
      }

      return currentChoices;
    });

    if (previousCharacterIdRef.current !== character.id) {
      setPersistedSkillIndexes(getPersistedSkillIndexes(character));
    }

    previousCharacterIdRef.current = character.id;
    if (canMarkSavedChoicesProcessed) {
      previousClassSkillChoiceSignatureRef.current = classSkillChoiceSignature;
      previousFeatureChoiceSignatureRef.current = featureChoiceSignature;
    }
  }, [
    character?.id,
    getClassSkillChoiceSignature(character),
    getFeatureChoiceSelectionSignature(character),
    referenceOptions,
  ]);

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
    () => getSelectedSkillIndexes(featureChoices, selectedClass),
    [featureChoices, selectedClass],
  );

  const previewCharacter = useMemo(() => {
    if (!character || !builderState) {
      return null;
    }

    return buildCharacterPreview({
      background: selectedBackground,
      character,
      classOption: selectedClass,
      featureChoices,
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
    featureChoices,
    persistedSkillIndexes,
    selectedSkillIndexes,
    selectedSpecies,
  ]);

  function updateLevel(nextLevel: number) {
    if (!Number.isFinite(nextLevel)) {
      return;
    }

    const normalizedLevel = clampLevel(nextLevel);

    setBuilderState((currentState) =>
      currentState
        ? {
            ...currentState,
            level: normalizedLevel,
            subclassIndex: shouldClearSubclassForLevel(
              selectedClass,
              currentState.subclassIndex,
              normalizedLevel,
            )
              ? null
              : currentState.subclassIndex,
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
              subclassIndex: shouldClearSubclassForLevel(
                selectedClass,
                currentState.subclassIndex,
                normalizedLevel,
              )
                ? null
                : currentState.subclassIndex,
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
