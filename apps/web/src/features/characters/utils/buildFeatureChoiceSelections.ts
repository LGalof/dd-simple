import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  FeatureChoiceSelections,
} from "../types/characterBuilder";
import type { Character, CharacterFeatureChoiceSelection } from "../../../types/character";

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

function getVisibleChoiceFieldsForSelection(
  featureId: string,
  choiceFields: ClassFeature["choiceFields"],
  selectedChoices: FeatureChoiceSelections,
) {
  return (choiceFields ?? []).filter((field) =>
    isChoiceFieldVisible(featureId, field, selectedChoices),
  );
}

function isChoiceFieldVisible(
  featureId: string,
  field: NonNullable<ClassFeature["choiceFields"]>[number],
  selectedChoices: FeatureChoiceSelections,
) {
  if (!field.dependsOnFieldId || !field.dependsOnValues?.length) {
    return true;
  }

  const dependencyValue = selectedChoices[`${featureId}:${field.dependsOnFieldId}`];

  return Boolean(dependencyValue && field.dependsOnValues.includes(dependencyValue));
}

export {
  buildGenericBackgroundFeatureChoices,
  buildGenericClassFeatureChoices,
  getVisibleChoiceFieldsForSelection,
  mergeFeatureChoiceSelections,
};
