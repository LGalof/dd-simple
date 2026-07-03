import type {
  ClassFeature,
  FeatureChoiceField,
  FeatureChoiceSelections,
} from "../types/characterBuilder";

function isFeatureChoiceFieldVisible(
  featureId: string,
  field: NonNullable<ClassFeature["choiceFields"]>[number],
  selectedChoices: FeatureChoiceSelections,
  choiceFields: ClassFeature["choiceFields"] = [],
) {
  if (!field.dependsOnFieldId || !field.dependsOnValues?.length) {
    return true;
  }

  const dependencyValue = selectedChoices[`${featureId}:${field.dependsOnFieldId}`];
  const dependencyField = (choiceFields ?? []).find(
    (choiceField) => choiceField.id === field.dependsOnFieldId,
  );
  const dependencyOption = dependencyField?.options.find(
    (option) => option.value === dependencyValue,
  );
  const dependencyCandidates = [
    dependencyValue,
    dependencyOption?.selectedOptionIndex ?? undefined,
    dependencyOption?.value ?? undefined,
  ].filter((value): value is string => Boolean(value));

  return dependencyCandidates.some((candidate) => field.dependsOnValues?.includes(candidate));
}

function getVisibleFeatureChoiceFields(
  featureId: string,
  choiceFields: ClassFeature["choiceFields"],
  selectedChoices: FeatureChoiceSelections,
) {
  return (choiceFields ?? []).filter((field) =>
    isFeatureChoiceFieldVisible(featureId, field, selectedChoices, choiceFields),
  );
}

function pruneHiddenFeatureChoices(
  featureId: string,
  choiceFields: ClassFeature["choiceFields"],
  selectedChoices: FeatureChoiceSelections,
) {
  // Visibility can cascade: clearing a parent choice can hide children, which can
  // in turn hide more fields. Re-run until the remaining selection set is stable.
  const nextChoices = { ...selectedChoices };
  let changed = true;

  while (changed) {
    changed = false;

    for (const field of choiceFields ?? []) {
      const choiceKey = `${featureId}:${field.id}`;

      if (!isFeatureChoiceFieldVisible(featureId, field, nextChoices, choiceFields) && choiceKey in nextChoices) {
        delete nextChoices[choiceKey];
        changed = true;
      }
    }
  }

  return nextChoices;
}

function isScopedChoiceFieldVisible(
  optionIndex: string,
  sectionId: string,
  field: FeatureChoiceField,
  selectedChoices: Record<string, string>,
  fields: FeatureChoiceField[] = [],
) {
  if (!field.dependsOnFieldId || !field.dependsOnValues?.length) {
    return true;
  }

  const dependencyValue = selectedChoices[`${optionIndex}:${sectionId}:${field.dependsOnFieldId}`];
  const dependencyField = fields.find((choiceField) => choiceField.id === field.dependsOnFieldId);
  const dependencyOption = dependencyField?.options.find((option) => option.value === dependencyValue);
  const dependencyCandidates = [
    dependencyValue,
    dependencyOption?.selectedOptionIndex ?? undefined,
    dependencyOption?.value ?? undefined,
  ].filter((value): value is string => Boolean(value));

  return dependencyCandidates.some((candidate) => field.dependsOnValues?.includes(candidate));
}

function getVisibleScopedChoiceFields(
  optionIndex: string,
  sectionId: string,
  fields: FeatureChoiceField[],
  selectedChoices: Record<string, string>,
) {
  return fields.filter((field) =>
    isScopedChoiceFieldVisible(optionIndex, sectionId, field, selectedChoices, fields),
  );
}

function pruneHiddenScopedChoices(
  optionIndex: string,
  sectionId: string,
  fields: FeatureChoiceField[],
  nextChoices: Record<string, string>,
  getVisibleFields: (
    optionIndex: string,
    sectionId: string,
    fields: FeatureChoiceField[],
    selectedChoices: Record<string, string>,
  ) => FeatureChoiceField[] = getVisibleScopedChoiceFields,
) {
  // Background/species sections use scoped keys, so we prune by reconstructed key
  // rather than by feature id like the class-feature helper above.
  const visibleFieldIds = new Set(
    getVisibleFields(optionIndex, sectionId, fields, nextChoices).map((field) => field.id),
  );
  const prunedChoices = { ...nextChoices };

  for (const field of fields) {
    if (visibleFieldIds.has(field.id)) {
      continue;
    }

    delete prunedChoices[`${optionIndex}:${sectionId}:${field.id}`];
  }

  return prunedChoices;
}

export {
  getVisibleFeatureChoiceFields,
  getVisibleScopedChoiceFields,
  isFeatureChoiceFieldVisible,
  isScopedChoiceFieldVisible,
  pruneHiddenFeatureChoices,
  pruneHiddenScopedChoices,
};
