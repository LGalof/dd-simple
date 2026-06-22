import {
  asFeatureSourceJson,
  asFeatSourceJson,
  asLevelSourceJson,
  asSubclassSourceJson,
  asSubspeciesSourceJson,
  asTraitSourceJson,
  CLASS_FEATURE_CHOICE_SOURCE_TYPE,
  compareResolvedSources,
  getRuleDescription,
  humanizeIndex,
  isPresent,
  numberValue,
  slugify,
  SPECIES_CHOICE_SOURCE_TYPE,
  SPECIES_HERITAGE_CHOICE_TYPE,
  SPECIES_HERITAGE_SELECTED_TYPE,
  stringValue,
} from "./shared.js";
import type {
  CharacterChoiceRecord,
  CharacterFeatureChoiceRecord,
  FeatureSourceJson,
  ResolvedFeatureSource,
  RuleDocumentRecord,
} from "./types.js";

function resolveClassFeatureSources(
  activeFeatureIndexes: string[],
  featureDocuments: RuleDocumentRecord[],
  classIndex: string,
  characterLevel: number,
  selectedSubclassDocument: RuleDocumentRecord | null,
) {
  const featureDocumentMap = new Map(featureDocuments.map((document) => [document.index, document]));
  const resolvedSources: ResolvedFeatureSource[] = [];

  for (const featureIndex of activeFeatureIndexes) {
    const document = featureDocumentMap.get(featureIndex);

    if (!document) {
      continue;
    }

    const sourceJson = asFeatureSourceJson(document.sourceJson);

    if (stringValue(sourceJson.class?.index) !== classIndex) {
      continue;
    }

    if (isSubclassChoiceFeature(sourceJson) || isGenericSubclassFeature(document.index)) {
      continue;
    }

    resolvedSources.push({
      description: getRuleDescription(sourceJson.desc, sourceJson.description),
      level: numberValue(sourceJson.level),
      sourceIndex: document.index,
      sourceType: "class_feature",
      title:
        stringValue(sourceJson.name) ??
        stringValue(document.name) ??
        humanizeIndex(document.index),
    });
  }

  if (!selectedSubclassDocument) {
    return resolvedSources;
  }

  const subclassSourceJson = asSubclassSourceJson(selectedSubclassDocument.sourceJson);
  const subclassFeatures = Array.isArray(subclassSourceJson.features)
    ? subclassSourceJson.features
    : [];

  for (const feature of subclassFeatures) {
    const title = stringValue(feature.name);
    const description = stringValue(feature.description);
    const level = numberValue(feature.level);

    if (!title || !description || (level !== null && level > characterLevel)) {
      continue;
    }

    resolvedSources.push({
      description,
      level,
      sourceIndex: `${selectedSubclassDocument.index}:${slugify(title)}:${level ?? "na"}`,
      sourceType: "subclass_feature",
      title,
    });
  }

  return resolvedSources.sort(compareResolvedSources);
}

function resolveSpeciesTraitSources(traitDocuments: RuleDocumentRecord[]) {
  return traitDocuments
    .map((document) => {
      const sourceJson = asTraitSourceJson(document.sourceJson);

      return {
        description: getRuleDescription(sourceJson.desc, sourceJson.description),
        level: numberValue(sourceJson.level),
        sourceIndex: document.index,
        sourceType: "species_trait" as const,
        title:
          stringValue(sourceJson.name) ??
          stringValue(document.name) ??
          humanizeIndex(document.index),
      };
    })
    .sort(compareResolvedSources);
}

function resolveFeatSources(
  selectedFeatIndexes: string[],
  featDocuments: RuleDocumentRecord[],
  passiveEffectRegistryKeys: ReadonlySet<string>,
) {
  const featDocumentMap = new Map(featDocuments.map((document) => [document.index, document]));

  return selectedFeatIndexes
    .map((featIndex) => {
      const document = featDocumentMap.get(featIndex);

      if (!document) {
        if (!passiveEffectRegistryKeys.has(featIndex)) {
          return null;
        }

        return {
          description: "",
          level: null,
          sourceIndex: featIndex,
          sourceType: "class_feature" as const,
          title: humanizeIndex(featIndex),
        };
      }

      const sourceJson = asFeatSourceJson(document.sourceJson);

      return {
        description: getRuleDescription(sourceJson.desc, sourceJson.description),
        level: null,
        sourceIndex: document.index,
        sourceType: "class_feature" as const,
        title:
          stringValue(sourceJson.name) ??
          stringValue(document.name) ??
          humanizeIndex(document.index),
      };
    })
    .filter(isPresent)
    .sort(compareResolvedSources);
}

function getActiveClassFeatureIndexes(
  levelDocuments: RuleDocumentRecord[],
  classIndex: string,
  characterLevel: number,
) {
  const orderedFeatureIndexes = levelDocuments
    .map((document) => ({
      sourceJson: asLevelSourceJson(document.sourceJson),
    }))
    .filter(({ sourceJson }) => {
      const level = numberValue(sourceJson.level);

      return (
        stringValue(sourceJson.class?.index) === classIndex &&
        level !== null &&
        level <= characterLevel
      );
    })
    .sort((left, right) => {
      const leftLevel = numberValue(left.sourceJson.level) ?? 0;
      const rightLevel = numberValue(right.sourceJson.level) ?? 0;

      return leftLevel - rightLevel;
    })
    .flatMap(({ sourceJson }) =>
      (sourceJson.features ?? [])
        .map((feature) => stringValue(feature.index))
        .filter(isPresent),
    );

  return [...new Set(orderedFeatureIndexes)];
}

function getActiveSpeciesTraitIndexes(
  baseTraitIndexes: string[],
  selectedSubspeciesSourceJson: unknown,
) {
  const subspeciesSourceJson = asSubspeciesSourceJson(selectedSubspeciesSourceJson);
  const subspeciesTraitIndexes = (subspeciesSourceJson.traits ?? [])
    .map((trait) => stringValue(trait.index))
    .filter(isPresent);

  return [...new Set([...baseTraitIndexes, ...subspeciesTraitIndexes])];
}

function getSelectedFeatIndexes(
  choices: CharacterChoiceRecord[],
  featureChoices: CharacterFeatureChoiceRecord[],
  classSubclassIndexes: Set<string>,
  backgroundFeatIndexes: string[] = [],
  overrideFeatIndexes: string[] = [],
) {
  return [
    ...new Set(
      [
        ...backgroundFeatIndexes,
        ...overrideFeatIndexes,
        ...choices
          .filter((choice) => {
            if (
              choice.sourceType !== CLASS_FEATURE_CHOICE_SOURCE_TYPE ||
            choice.selectedType !== "reference" ||
            classSubclassIndexes.has(choice.selectedIndex)
          ) {
            return false;
          }

            return true;
          })
          .map((choice) => choice.selectedIndex),
        ...featureChoices
          .filter(isFeatFeatureChoiceRecord)
          .map(
            (choice) =>
              choice.selectedOptionIndex ??
              (choice.selectedOptionName ? slugify(choice.selectedOptionName) : null),
          )
          .filter(isPresent),
      ],
    ),
  ];
}

function isFeatFeatureChoiceRecord(choice: CharacterFeatureChoiceRecord) {
  if (choice.selectedOptionUrl?.includes("/feats/")) {
    return true;
  }

  const searchText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
    choice.selectedOptionType,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  return searchText.includes("feat");
}

function resolveSelectedSubclassIndex(
  validSubclassIndexes: Set<string>,
  choices: CharacterChoiceRecord[],
  overrideSubclassIndex: string | undefined,
) {
  if (overrideSubclassIndex && validSubclassIndexes.has(overrideSubclassIndex)) {
    return overrideSubclassIndex;
  }

  const matchingChoice = choices.find(
    (choice) =>
      choice.sourceType === CLASS_FEATURE_CHOICE_SOURCE_TYPE &&
      validSubclassIndexes.has(choice.selectedIndex),
  );

  return matchingChoice?.selectedIndex ?? null;
}

function resolveSelectedSubspeciesIndex(
  speciesIndex: string,
  choices: CharacterChoiceRecord[],
  overrideSubspeciesIndex: string | undefined,
) {
  if (overrideSubspeciesIndex) {
    return overrideSubspeciesIndex;
  }

  const matchingChoice = choices.find((choice) => {
    if (
      choice.sourceType !== SPECIES_CHOICE_SOURCE_TYPE ||
      choice.choiceType !== SPECIES_HERITAGE_CHOICE_TYPE ||
      choice.selectedType !== SPECIES_HERITAGE_SELECTED_TYPE
    ) {
      return false;
    }

    const choiceSpeciesIndex = choice.sourceIndex.split(":")[0];

    return choiceSpeciesIndex === speciesIndex;
  });

  return matchingChoice?.selectedIndex ?? null;
}

function isSubclassChoiceFeature(sourceJson: FeatureSourceJson) {
  return stringValue(sourceJson.feature_specific?.type) === "subclass";
}

function isGenericSubclassFeature(index: string) {
  return /-subclass-feature-\d+$/i.test(index);
}

function isSubclassDocumentForClass(
  document: RuleDocumentRecord | null,
  classIndex: string,
): document is RuleDocumentRecord {
  return Boolean(
    document && stringValue(asSubclassSourceJson(document.sourceJson).class?.index) === classIndex,
  );
}

function isSubspeciesDocumentForSpecies(
  document: RuleDocumentRecord | null,
  speciesIndex: string,
): document is RuleDocumentRecord {
  return Boolean(
    document &&
      stringValue(asSubspeciesSourceJson(document.sourceJson).species?.index) === speciesIndex,
  );
}

export {
  getActiveClassFeatureIndexes,
  getActiveSpeciesTraitIndexes,
  getSelectedFeatIndexes,
  isSubclassDocumentForClass,
  isSubspeciesDocumentForSpecies,
  resolveClassFeatureSources,
  resolveFeatSources,
  resolveSelectedSubclassIndex,
  resolveSelectedSubspeciesIndex,
  resolveSpeciesTraitSources,
};
