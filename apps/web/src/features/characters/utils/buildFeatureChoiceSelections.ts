import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  ClassSubclassFeature,
  FeatureChoiceOption,
  FeatureChoiceSelections,
  SpeciesOption,
} from "../types/characterBuilder";
import type { Character, CharacterFeatureChoiceSelection } from "../../../types/character";
import { getVisibleFeatureChoiceFields } from "./featureChoiceVisibility";
import { buildFeatureChoiceGrants } from "./featureChoiceGrants";

function buildGenericClassFeatureChoices(
  classIndex: string,
  classOption: ClassOption,
  characterLevel: number,
  featureChoices: FeatureChoiceSelections,
  selectedSubclassIndex: string | null = null,
): CharacterFeatureChoiceSelection[] {
  const selections: CharacterFeatureChoiceSelection[] = [];

  for (const feature of [
    ...classOption.features,
    ...createSelectedSubclassChoiceFeatures(
      classOption,
      characterLevel,
      selectedSubclassIndex,
    ),
  ]) {
    if (feature.level > characterLevel) {
      continue;
    }

    for (const field of getVisibleChoiceFieldsForSelection(feature.id, feature.choiceFields, featureChoices)) {
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
        selectedRawJson: mergeSelectedOptionRawJson(selectedOption),
        grantsRawJson: buildFeatureChoiceGrants(feature, field, selectedOption),
      });
    }
  }

  return selections;
}

function createSelectedSubclassChoiceFeatures(
  classOption: ClassOption,
  characterLevel: number,
  selectedSubclassIndex: string | null,
): ClassFeature[] {
  if (!selectedSubclassIndex) {
    return [];
  }

  const selectedSubclass = classOption.subclasses?.find(
    (subclass) => subclass.index === selectedSubclassIndex,
  );

  if (!selectedSubclass) {
    return [];
  }

  return selectedSubclass.features
    .filter((subclassFeature) => subclassFeature.level <= characterLevel)
    .filter((subclassFeature) => (subclassFeature.choiceFields?.length ?? 0) > 0)
    .map((subclassFeature) =>
      createSubclassChoiceFeature(classOption, subclassFeature),
    )
    .filter((feature): feature is ClassFeature => Boolean(feature));
}

function createSubclassChoiceFeature(
  classOption: ClassOption,
  subclassFeature: ClassSubclassFeature,
): ClassFeature | null {
  const subclassFeaturePlaceholder = classOption.features.find(
    (feature) =>
      feature.level === subclassFeature.level &&
      feature.id.includes("subclass-feature"),
  );

  if (!subclassFeaturePlaceholder) {
    return null;
  }

  return {
    choiceFields: subclassFeature.choiceFields,
    id: `${subclassFeaturePlaceholder.id}:${slugifyFeatureName(subclassFeature.name)}`,
    level: subclassFeature.level,
    summary: subclassFeature.description,
    title: subclassFeature.name,
  };
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
        selectedRawJson: mergeSelectedOptionRawJson(selectedOption),
        grantsRawJson: buildFeatureChoiceGrants(
          {
            id: section.id,
            level: 1,
            summary: section.details.join("\n"),
            title: section.title,
          },
          field,
          selectedOption,
        ),
      });
    }
  }

  return selections;
}

function buildGenericSpeciesFeatureChoices(
  speciesOption: SpeciesOption,
  speciesChoices: Record<string, string>,
): CharacterFeatureChoiceSelection[] {
  const selections: CharacterFeatureChoiceSelection[] = [];

  for (const section of speciesOption.previewSections) {
    for (const field of section.choiceFields ?? []) {
      if (!field.sourceType || !field.sourceIndex || !field.choicePath) {
        continue;
      }

      const selectedValue = speciesChoices[`${speciesOption.index}:${section.id}:${field.id}`];

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
        level: field.level ?? 1,
        featureIndex: field.featureIndex ?? section.id,
        choicePath: field.choicePath,
        choiceKey: field.choiceKey ?? field.id,
        choiceLabel: field.choiceLabel ?? field.choiceGroupLabel ?? field.label,
        selectedOptionType: selectedOption.selectedOptionType ?? "string",
        selectedOptionIndex: selectedOption.selectedOptionIndex ?? selectedOption.value,
        selectedOptionName: selectedOption.selectedOptionName ?? selectedOption.label,
        selectedOptionUrl: selectedOption.selectedOptionUrl ?? null,
        selectedRawJson: mergeSelectedOptionRawJson(selectedOption),
        grantsRawJson: buildFeatureChoiceGrants(
          {
            id: section.id,
            level: 1,
            summary: section.details.join("\n"),
            title: section.title,
          },
          field,
          selectedOption,
        ),
      });
    }
  }

  return selections;
}

function mergeFeatureChoiceSelections(
  persistedSelections: Character["featureChoices"] | undefined,
  previewSelections: CharacterFeatureChoiceSelection[],
) {
  const mergedSelections = new Map<string, CharacterFeatureChoiceSelection>();

  for (const selection of persistedSelections ?? []) {
    mergedSelections.set(getFeatureChoiceSelectionKey(selection), selection);
  }

  for (const selection of previewSelections) {
    mergedSelections.set(getFeatureChoiceSelectionKey(selection), selection);
  }

  return [...mergedSelections.values()];
}

function getFeatureChoiceSelectionKey(
  selection: Pick<CharacterFeatureChoiceSelection, "choicePath" | "sourceIndex" | "sourceType">,
) {
  return `${selection.sourceType}:${selection.sourceIndex}:${selection.choicePath}`;
}

function slugifyFeatureName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getVisibleChoiceFieldsForSelection(
  featureId: string,
  choiceFields: ClassFeature["choiceFields"],
  selectedChoices: FeatureChoiceSelections,
) {
  return getVisibleFeatureChoiceFields(featureId, choiceFields, selectedChoices);
}

function mergeSelectedOptionRawJson(selectedOption: FeatureChoiceOption) {
  const baseRawJson =
    selectedOption.selectedRawJson &&
    typeof selectedOption.selectedRawJson === "object" &&
    !Array.isArray(selectedOption.selectedRawJson)
      ? selectedOption.selectedRawJson
      : {
          label: selectedOption.label,
          value: selectedOption.value,
        };

  return {
    ...baseRawJson,
    description: selectedOption.description ?? null,
    label: selectedOption.label,
    value: selectedOption.value,
  };
}

export {
  buildGenericBackgroundFeatureChoices,
  buildGenericClassFeatureChoices,
  buildGenericSpeciesFeatureChoices,
  getVisibleChoiceFieldsForSelection,
  mergeFeatureChoiceSelections,
};
