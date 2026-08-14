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

type DerivedFeatureChoiceSourceRecord = {
  description?: unknown;
  level?: unknown;
  sourceIndex?: unknown;
  sourceType?: unknown;
  title?: unknown;
};

const SPECIES_CHOICE_TRAIT_INDEXES: Record<string, ReadonlySet<string>> = {
  dragonborn: new Set([
    "draconic-breath-weapon-acid",
    "draconic-breath-weapon-cold",
    "draconic-breath-weapon-fire",
    "draconic-breath-weapon-lightning",
    "draconic-breath-weapon-poison",
    "draconic-damage-resistance-acid",
    "draconic-damage-resistance-cold",
    "draconic-damage-resistance-fire",
    "draconic-damage-resistance-lightning",
    "draconic-damage-resistance-poison",
  ]),
  elf: new Set([
    "elven-lineage",
    "darkvision-120",
    "high-elf-cantrip-versatility",
    "lineage-spell-dancing-lights",
    "lineage-spell-darkness",
    "lineage-spell-detect-magic",
    "lineage-spell-druidcraft",
    "lineage-spell-faerie-fire",
    "lineage-spell-longstrider",
    "lineage-spell-misty-step",
    "lineage-spell-pass-without-trace",
    "wood-elf-speed-increase",
  ]),
  gnome: new Set([
    "gnomish-lineage",
    "gnomish-lineage-forest-gnome",
    "gnomish-lineage-rock-gnome",
  ]),
  goliath: new Set(["giant-ancestry"]),
  tiefling: new Set([
    "fiendish-legacy",
    "fiendish-legacy-abyssal",
    "fiendish-legacy-chthonic",
    "fiendish-legacy-infernal",
    "fiendish-spell-darkness",
    "fiendish-spell-false-life",
    "fiendish-spell-hellish-rebuke",
    "fiendish-spell-hold-person",
    "fiendish-spell-ray-of-enfeeblement",
    "fiendish-spell-ray-of-sickness",
  ]),
};

function resolveClassFeatureSources(
  activeFeatureIndexes: string[],
  featureDocuments: RuleDocumentRecord[],
  classIndex: string,
  characterLevel: number,
  selectedSubclassDocument: RuleDocumentRecord | null,
) {
  // Level documents tell us which feature indexes are unlocked; this step turns
  // those indexes into normalized dashboard-friendly source records.
  const featureDocumentMap = new Map(featureDocuments.map((document) => [document.index, document]));
  const subclassFeatureDocumentMap = createSubclassFeatureDocumentMap(featureDocuments);
  const resolvedSubclassFeatureKeys = new Set<string>();
  const resolvedSources: ResolvedFeatureSource[] = [];

  for (const featureIndex of activeFeatureIndexes) {
    const document = featureDocumentMap.get(featureIndex);

    if (!document) {
      continue;
    }

    const sourceJson = asFeatureSourceJson(document.sourceJson);
    const featureSubclassIndex = stringValue(sourceJson.subclass?.index);
    const featureClassIndex = stringValue(sourceJson.class?.index);

    if (
      featureClassIndex !== classIndex &&
      featureSubclassIndex !== selectedSubclassDocument?.index
    ) {
      continue;
    }

    if (
      featureSubclassIndex &&
      featureSubclassIndex !== selectedSubclassDocument?.index
    ) {
      continue;
    }

    if (isSubclassChoiceFeature(sourceJson) || isGenericSubclassFeature(document.index)) {
      continue;
    }

    if (featureSubclassIndex) {
      const featureLevel = numberValue(sourceJson.level);
      const featureName =
        stringValue(sourceJson.name) ??
        stringValue(document.name) ??
        humanizeIndex(document.index);

      if (featureLevel !== null) {
        resolvedSubclassFeatureKeys.add(
          subclassFeatureDocumentKey(featureSubclassIndex, featureLevel, featureName),
        );
      }
    }

    resolvedSources.push({
      description: getRuleDescription(sourceJson.desc, sourceJson.description),
      level: numberValue(sourceJson.level),
      sourceIndex: document.index,
      sourceType: featureSubclassIndex ? "subclass_feature" : "class_feature",
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
    const level = numberValue(feature.level);

    if (!title || level === null || level > characterLevel) {
      continue;
    }

    const featureKey = subclassFeatureDocumentKey(
      selectedSubclassDocument.index,
      level,
      title,
    );

    if (resolvedSubclassFeatureKeys.has(featureKey)) {
      continue;
    }

    const featureDocument = subclassFeatureDocumentMap.get(featureKey);
    const featureSourceJson = featureDocument
      ? asFeatureSourceJson(featureDocument.sourceJson)
      : null;
    const description =
      featureSourceJson
        ? getRuleDescription(featureSourceJson.desc, featureSourceJson.description)
        : stringValue(feature.description) ?? "";

    if (!description) {
      continue;
    }

    resolvedSources.push({
      description,
      level,
      sourceIndex:
        featureDocument?.index ??
        `${selectedSubclassDocument.index}:${slugify(title)}:${level}`,
      sourceType: "subclass_feature",
      title:
        stringValue(featureSourceJson?.name) ??
        stringValue(featureDocument?.name) ??
        title,
    });
  }

  return resolvedSources.sort(compareResolvedSources);
}

function createSubclassFeatureDocumentMap(featureDocuments: RuleDocumentRecord[]) {
  const featureMap = new Map<string, RuleDocumentRecord>();

  for (const featureDocument of featureDocuments) {
    const sourceJson = asFeatureSourceJson(featureDocument.sourceJson);
    const subclassIndex = stringValue(sourceJson.subclass?.index);
    const level = numberValue(sourceJson.level);
    const name =
      stringValue(sourceJson.name) ??
      stringValue(featureDocument.name) ??
      humanizeIndex(featureDocument.index);

    if (!subclassIndex || level === null || !name) {
      continue;
    }

    featureMap.set(subclassFeatureDocumentKey(subclassIndex, level, name), featureDocument);
  }

  return featureMap;
}

function subclassFeatureDocumentKey(subclassIndex: string, level: number, name: string) {
  return `${subclassIndex}:${level}:${slugify(name)}`;
}

function resolveSpeciesTraitSources(
  traitDocuments: RuleDocumentRecord[],
  characterLevel: number,
) {
  return traitDocuments
    .map((document) => {
      const sourceJson = asTraitSourceJson(document.sourceJson);
      const description = getRuleDescription(sourceJson.desc, sourceJson.description);
      const inferredLevel = inferFeatureLevel(
        numberValue(sourceJson.level),
        description,
      );

      if (inferredLevel !== null && inferredLevel > characterLevel) {
        return null;
      }

      return {
        description,
        level: inferredLevel,
        sourceIndex: document.index,
        sourceType: "species_trait" as const,
        title:
          stringValue(sourceJson.name) ??
          stringValue(document.name) ??
          humanizeIndex(document.index),
      };
    })
    .filter(isPresent)
    .sort(compareResolvedSources);
}

function inferFeatureLevel(
  explicitLevel: number | null,
  description: string,
) {
  if (explicitLevel !== null) {
    return explicitLevel;
  }

  const characterLevelMatch = description.match(
    /\bwhen you reach character level (\d+)\b/i,
  );

  if (characterLevelMatch) {
    return Number.parseInt(characterLevelMatch[1] ?? "", 10);
  }

  return null;
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
  speciesIndex: string,
) {
  const subspeciesSourceJson = asSubspeciesSourceJson(selectedSubspeciesSourceJson);
  const subspeciesTraitIndexes = (subspeciesSourceJson.traits ?? [])
    .map((trait) => stringValue(trait.index))
    .filter(isPresent);
  const choiceTraitIndexes = SPECIES_CHOICE_TRAIT_INDEXES[speciesIndex] ?? new Set<string>();
  const baseNonHeritageTraitIndexes = baseTraitIndexes.filter(
    (traitIndex) => !choiceTraitIndexes.has(traitIndex),
  );

  return [...new Set([...baseNonHeritageTraitIndexes, ...subspeciesTraitIndexes])];
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

function mergeFeatureChoiceRecords(
  persistedChoices: CharacterFeatureChoiceRecord[],
  previewChoices: CharacterFeatureChoiceRecord[],
) {
  const mergedChoices = new Map<string, CharacterFeatureChoiceRecord>();

  for (const choice of persistedChoices) {
    mergedChoices.set(getFeatureChoiceRecordKey(choice), choice);
  }

  for (const choice of previewChoices) {
    mergedChoices.set(getFeatureChoiceRecordKey(choice), choice);
  }

  return [...mergedChoices.values()];
}

function getFeatureChoiceRecordKey(choice: CharacterFeatureChoiceRecord) {
  return `${choice.sourceType}:${choice.sourceIndex}:${choice.choicePath}`;
}

function getActiveFeatureChoiceSources(
  featureChoices: CharacterFeatureChoiceRecord[],
  characterLevel: number,
) {
  // Choice records can inject extra passive/action/spell sources even when there
  // is no standalone rule document for the selected option.
  return featureChoices
    .flatMap((choice) => {
      if (typeof choice.level === "number" && choice.level > characterLevel) {
        return [];
      }

      if (
        choice.selectedOptionUrl?.toLowerCase().includes("/feats/") ||
        isAbilityScoreImprovementChoice(choice)
      ) {
        return [];
      }

      const grantSources = getDerivedSourcesFromGrants(choice.grantsRawJson, choice);

      if (grantSources.length > 0) {
        return grantSources;
      }

      const fallbackSource = createFallbackFeatureChoiceSource(choice);

      return fallbackSource ? [fallbackSource] : [];
    })
    .sort(compareResolvedSources);
}

function getDerivedSourcesFromGrants(
  grantsRawJson: unknown,
  choice: CharacterFeatureChoiceRecord,
) {
  if (!grantsRawJson || typeof grantsRawJson !== "object") {
    return [];
  }

  const grants = grantsRawJson as { derivedSources?: unknown };
  const derivedSources = Array.isArray(grants.derivedSources)
    ? grants.derivedSources
    : [];

  return derivedSources
    .map((entry) => normalizeDerivedFeatureChoiceSource(entry, choice))
    .filter(isPresent);
}

function normalizeDerivedFeatureChoiceSource(
  value: unknown,
  choice: CharacterFeatureChoiceRecord,
): ResolvedFeatureSource | null {
  const source = (typeof value === "object" && value !== null
    ? value as DerivedFeatureChoiceSourceRecord
    : null);

  if (!source) {
    return null;
  }

  const title = stringValue(source.title) ?? choice.selectedOptionName ?? choice.selectedOptionIndex;
  const description =
    stringValue(source.description) ??
    getSelectedOptionDescription(choice.selectedRawJson);
  const sourceIndex =
    stringValue(source.sourceIndex) ??
    choice.selectedOptionIndex ??
    choice.selectedOptionName ??
    choice.choiceKey;

  if (!title || !description || !sourceIndex) {
    return null;
  }

  const sourceType = normalizeChoiceDerivedSourceType(
    stringValue(source.sourceType),
    choice,
  );
  const resolvedSourceIndex = isMagicInitiateLevelOneSpellChoice(choice)
    ? `magic-initiate-free-cast:${sourceIndex}`
    : sourceIndex;

  return {
    description,
    level: numberValue(source.level) ?? choice.level ?? null,
    sourceIndex: resolvedSourceIndex,
    sourceType,
    title,
  };
}

function createFallbackFeatureChoiceSource(choice: CharacterFeatureChoiceRecord) {
  const selectedName = choice.selectedOptionName ?? choice.selectedOptionIndex;
  const selectedDescription = getSelectedOptionDescription(choice.selectedRawJson);

  if (!selectedName) {
    return null;
  }

  const choiceKind = inferFeatureChoiceKind(choice);

  if (!choiceKind) {
    return null;
  }

  if (choiceKind === "spell") {
    const selectedSpellIndex = choice.selectedOptionIndex ?? slugify(selectedName);

    return {
      description:
        selectedDescription ??
        `You learn or gain access to the spell ${selectedName}.`,
      level: choice.level ?? null,
      sourceIndex: isMagicInitiateLevelOneSpellChoice(choice)
        ? `magic-initiate-free-cast:${selectedSpellIndex}`
        : selectedSpellIndex,
      sourceType: normalizeChoiceDerivedSourceType(null, choice),
      title: selectedName,
    };
  }

  if (choiceKind === "scholar") {
    return {
      description:
        selectedDescription ??
        `You gain Expertise in ${selectedName.replace(/^Skill:\s*/i, "")}.`,
      level: choice.level ?? null,
      sourceIndex: `scholar-${choice.selectedOptionIndex ?? slugify(selectedName)}`,
      sourceType: normalizeChoiceDerivedSourceType(null, choice),
      title: `Scholar: ${selectedName.replace(/^Skill:\s*/i, "")}`,
    };
  }

  if (choiceKind === "expertise") {
    return {
      description:
        selectedDescription ??
        `${selectedName.replace(/^Skill:\s*/i, "")} gains Expertise for this character.`,
      level: choice.level ?? null,
      sourceIndex: `expertise-${choice.selectedOptionIndex ?? slugify(selectedName)}`,
      sourceType: normalizeChoiceDerivedSourceType(null, choice),
      title: `Expertise: ${selectedName.replace(/^Skill:\s*/i, "")}`,
    };
  }

  return {
    description:
      selectedDescription ??
      `${selectedName} is selected for ${choice.choiceLabel ?? choice.choiceKey ?? choice.featureIndex ?? "this feature"}.`,
    level: choice.level ?? null,
    sourceIndex: choice.selectedOptionIndex ?? slugify(selectedName),
    sourceType: normalizeChoiceDerivedSourceType(null, choice),
    title: selectedName,
  };
}

function isMagicInitiateLevelOneSpellChoice(choice: CharacterFeatureChoiceRecord) {
  const searchText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
    choice.featureIndex,
    choice.sourceIndex,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  if (!searchText.includes("magic-initiate")) {
    return false;
  }

  return (
    /(?:level|lvl)[ -]?1[^a-z]*spell/.test(searchText) ||
    /spell[^a-z]*(?:level|lvl)[ -]?1/.test(searchText) ||
    /spell-1(?:\b|$)/.test(searchText)
  );
}

function getSelectedOptionDescription(selectedRawJson: unknown) {
  if (!selectedRawJson || typeof selectedRawJson !== "object" || Array.isArray(selectedRawJson)) {
    return null;
  }

  return stringValue((selectedRawJson as { description?: unknown }).description);
}

function inferFeatureChoiceKind(choice: CharacterFeatureChoiceRecord) {
  const searchText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
    choice.featureIndex,
    choice.sourceIndex,
    choice.selectedOptionUrl,
    choice.selectedOptionName,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  if (
    searchText.includes("/spells/") ||
    searchText.includes(" cantrip") ||
    searchText.includes(" spell") ||
    searchText.includes("ritual")
  ) {
    return "spell";
  }

  if (searchText.includes("scholar")) {
    return "scholar";
  }

  if (searchText.includes("expertise")) {
    return "expertise";
  }

  if (
    searchText.includes("fighting style") ||
    searchText.includes("weapon mastery") ||
    searchText.includes("metamagic") ||
    searchText.includes("pact boon") ||
    searchText.includes("eldritch invocation") ||
    searchText.includes("mystic arcanum") ||
    searchText.includes("elemental fury")
  ) {
    return "feature";
  }

  return null;
}

function normalizeChoiceDerivedSourceType(
  sourceType: string | null,
  choice: CharacterFeatureChoiceRecord,
): ResolvedFeatureSource["sourceType"] {
  if (sourceType === "species_trait" || sourceType === "subclass_feature" || sourceType === "class_feature") {
    return sourceType;
  }

  if (choice.sourceType.toUpperCase() === "SPECIES") {
    return "species_trait";
  }

  if (choice.subclassIndex) {
    return "subclass_feature";
  }

  return "class_feature";
}

function isAbilityScoreImprovementChoice(choice: CharacterFeatureChoiceRecord) {
  const searchText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
  ]
    .filter(isPresent)
    .join(" ")
    .toLowerCase();

  return searchText.includes("asi-score") || searchText.includes("feat-ability-");
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
  getActiveFeatureChoiceSources,
  getActiveClassFeatureIndexes,
  getActiveSpeciesTraitIndexes,
  getSelectedFeatIndexes,
  isSubclassDocumentForClass,
  isSubspeciesDocumentForSpecies,
  mergeFeatureChoiceRecords,
  resolveClassFeatureSources,
  resolveFeatSources,
  resolveSelectedSubclassIndex,
  resolveSelectedSubspeciesIndex,
  resolveSpeciesTraitSources,
};
