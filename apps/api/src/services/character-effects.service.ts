import { prisma } from "../lib/prisma.js";

type ActionActivationType = "attack" | "action" | "bonus_action" | "reaction" | "other";

type CharacterFeatureSourceType = "class_feature" | "species_trait" | "subclass_feature";

type CharacterActionEntry = {
  activationType: ActionActivationType;
  description: string;
  id: string;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  title: string;
};

type CharacterDefenseKind =
  | "condition_immunity"
  | "immunity"
  | "resistance"
  | "vulnerability";

type CharacterDefenseEntry = {
  description: string;
  id: string;
  kind: CharacterDefenseKind;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  target: string;
  title: string;
};

type CharacterFeatureEffectsOverrides = {
  classIndex?: string;
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

type DerivedArmorClassMode = "base" | "barbarian_unarmored" | "monk_unarmored";

type CharacterDerivedStats = {
  armorClassBonus: number;
  armorClassMode: DerivedArmorClassMode;
  initiativeBonus: number;
  passiveInsightBonus: number;
  passiveInvestigationBonus: number;
  passivePerceptionBonus: number;
  proficiencyBonus: number;
  speedBonus: number;
};

type CharacterSpellEntry = {
  description: string;
  id: string;
  kind: "always_prepared" | "spell_feature" | "spellcasting";
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  title: string;
};

type DerivedCharacterState = {
  actions: CharacterActionEntry[];
  activeSources: ResolvedFeatureSource[];
  defenses: CharacterDefenseEntry[];
  selectedSubclassIndex: string | null;
  selectedSubspeciesIndex: string | null;
  spells: CharacterSpellEntry[];
  stats: CharacterDerivedStats;
};

type CharacterChoiceRecord = {
  choiceType: string;
  selectedIndex: string;
  selectedType: string;
  sourceIndex: string;
  sourceType: string;
};

type RuleDocumentRecord = {
  index: string;
  name: string | null;
  sourceJson: unknown;
};

type ClassSourceJson = {
  spellcasting?: {
    info?: Array<{
      desc?: unknown[];
      name?: unknown;
    }>;
    spellcasting_ability?: {
      name?: unknown;
    };
  };
  subclasses?: Array<{
    index?: unknown;
  }>;
};

type LevelSourceJson = {
  class?: {
    index?: unknown;
  };
  features?: Array<{
    index?: unknown;
  }>;
  level?: unknown;
};

type FeatureSourceJson = {
  class?: {
    index?: unknown;
  };
  desc?: unknown;
  description?: unknown;
  feature_specific?: {
    type?: unknown;
  };
  level?: unknown;
  name?: unknown;
};

type TraitSourceJson = {
  desc?: unknown;
  description?: unknown;
  level?: unknown;
  name?: unknown;
};

type FeatSourceJson = {
  desc?: unknown;
  description?: unknown;
  name?: unknown;
};

type SubclassSourceJson = {
  class?: {
    index?: unknown;
  };
  features?: Array<{
    description?: unknown;
    level?: unknown;
    name?: unknown;
  }>;
  name?: unknown;
};

type SubspeciesSourceJson = {
  species?: {
    index?: unknown;
  };
  traits?: Array<{
    index?: unknown;
  }>;
};

type ResolvedFeatureSource = {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: CharacterFeatureSourceType;
  title: string;
};

type PassiveEffect = {
  armorClassBonus?: number;
  armorClassMode?: DerivedArmorClassMode;
  initiativeBonus?: number;
  passiveInsightBonus?: number;
  passiveInvestigationBonus?: number;
  passivePerceptionBonus?: number;
  speedBonus?: number;
};

const CLASS_FEATURE_CHOICE_SOURCE_TYPE = "class-feature";
const SPECIES_CHOICE_SOURCE_TYPE = "species";
const SPECIES_HERITAGE_CHOICE_TYPE = "species-heritage-choice";
const SPECIES_HERITAGE_SELECTED_TYPE = "subspecies";

const passiveEffectRegistry: Record<string, PassiveEffect> = {
  "barbarian-unarmored-defense": {
    armorClassMode: "barbarian_unarmored",
  },
  "monk-unarmored-defense": {
    armorClassMode: "monk_unarmored",
  },
  "fast-movement": {
    speedBonus: 10,
  },
  "unarmored-movement": {
    speedBonus: 10,
  },
  "ranger-roving": {
    speedBonus: 10,
  },
  "fighting-style-defense": {
    armorClassBonus: 1,
  },
  "defense": {
    armorClassBonus: 1,
  },
  "feral-instinct": {
    initiativeBonus: 2,
  },
};

const damageTypes = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

const conditionTypes = [
  "blinded",
  "charmed",
  "deafened",
  "exhaustion",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
] as const;

async function findCharacterDerivedStateForUser(
  userId: string,
  characterId: string,
  overrides: CharacterFeatureEffectsOverrides = {},
): Promise<DerivedCharacterState | null> {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    select: {
      classIndex: true,
      level: true,
      speciesIndex: true,
      choices: {
        select: {
          choiceType: true,
          selectedIndex: true,
          selectedType: true,
          sourceIndex: true,
          sourceType: true,
        },
      },
    },
  });

  if (!character) {
    return null;
  }

  const effectiveClassIndex = overrides.classIndex ?? character.classIndex;
  const effectiveSpeciesIndex = overrides.speciesIndex ?? character.speciesIndex;
  const effectiveLevel = overrides.level ?? character.level;

  const [effectiveClass, effectiveSpecies, levelDocuments] = await Promise.all([
    prisma.refClass.findUnique({
      where: {
        index: effectiveClassIndex,
      },
      select: {
        index: true,
        sourceJson: true,
      },
    }),
    prisma.refSpecies.findUnique({
      where: {
        index: effectiveSpeciesIndex,
      },
      select: {
        index: true,
        traits: {
          select: {
            traitIndex: true,
          },
        },
      },
    }),
    prisma.refRuleDocument.findMany({
      where: {
        category: "levels",
      },
      select: {
        index: true,
        name: true,
        sourceJson: true,
      },
    }),
  ]);

  if (!effectiveClass || !effectiveSpecies) {
    return {
      actions: [],
      activeSources: [],
      defenses: [],
      selectedSubclassIndex: null,
      selectedSubspeciesIndex: null,
      spells: [],
      stats: createBaseDerivedStats(effectiveLevel),
    };
  }

  const classSourceJson = asClassSourceJson(effectiveClass.sourceJson);
  const classSubclassIndexes = new Set(
    (classSourceJson.subclasses ?? [])
      .map((entry) => stringValue(entry.index))
      .filter(isPresent),
  );

  const selectedSubclassIndex = resolveSelectedSubclassIndex(
    classSubclassIndexes,
    character.choices,
    overrides.subclassIndex,
  );

  const selectedSubspeciesIndex = resolveSelectedSubspeciesIndex(
    effectiveSpeciesIndex,
    character.choices,
    overrides.subspeciesIndex,
  );

  const [selectedSubclassDocument, selectedSubspeciesDocument] = await Promise.all([
    selectedSubclassIndex
      ? prisma.refRuleDocument.findUnique({
          where: {
            category_index: {
              category: "subclasses",
              index: selectedSubclassIndex,
            },
          },
          select: {
            index: true,
            name: true,
            sourceJson: true,
          },
        })
      : Promise.resolve(null),
    selectedSubspeciesIndex
      ? prisma.refRuleDocument.findUnique({
          where: {
            category_index: {
              category: "subspecies",
              index: selectedSubspeciesIndex,
            },
          },
          select: {
            index: true,
            name: true,
            sourceJson: true,
          },
        })
      : Promise.resolve(null),
  ]);

  const validatedSubclassDocument = isSubclassDocumentForClass(
    selectedSubclassDocument,
    effectiveClassIndex,
  )
    ? selectedSubclassDocument
    : null;
  const validatedSubspeciesDocument = isSubspeciesDocumentForSpecies(
    selectedSubspeciesDocument,
    effectiveSpeciesIndex,
  )
    ? selectedSubspeciesDocument
    : null;

  const activeClassFeatureIndexes = getActiveClassFeatureIndexes(
    levelDocuments,
    effectiveClassIndex,
    effectiveLevel,
  );
  const selectedFeatIndexes = getSelectedFeatIndexes(character.choices, classSubclassIndexes);
  const activeTraitIndexes = getActiveSpeciesTraitIndexes(
    effectiveSpecies.traits.map((trait: { traitIndex: string }) => trait.traitIndex),
    validatedSubspeciesDocument?.sourceJson,
  );

  const [featureDocuments, traitDocuments, featDocuments] = await Promise.all([
    activeClassFeatureIndexes.length > 0
      ? prisma.refRuleDocument.findMany({
          where: {
            category: "features",
            index: {
              in: activeClassFeatureIndexes,
            },
          },
          select: {
            index: true,
            name: true,
            sourceJson: true,
          },
        })
      : Promise.resolve([] as RuleDocumentRecord[]),
    activeTraitIndexes.length > 0
      ? prisma.refRuleDocument.findMany({
          where: {
            category: "traits",
            index: {
              in: activeTraitIndexes,
            },
          },
          select: {
            index: true,
            name: true,
            sourceJson: true,
          },
        })
      : Promise.resolve([] as RuleDocumentRecord[]),
    selectedFeatIndexes.length > 0
      ? prisma.refRuleDocument.findMany({
          where: {
            category: "feats",
            index: {
              in: selectedFeatIndexes,
            },
          },
          select: {
            index: true,
            name: true,
            sourceJson: true,
          },
        })
      : Promise.resolve([] as RuleDocumentRecord[]),
  ]);

  const activeSources = [
    ...resolveClassFeatureSources(
      activeClassFeatureIndexes,
      featureDocuments,
      effectiveClassIndex,
      effectiveLevel,
      validatedSubclassDocument,
    ),
    ...resolveFeatSources(selectedFeatIndexes, featDocuments),
    ...resolveSpeciesTraitSources(traitDocuments),
  ];

  return {
    actions: dedupeActions(activeSources.flatMap(inferActionEffects)).sort(compareActionEntries),
    activeSources,
    defenses: dedupeDefenses(activeSources.flatMap(inferDefenseEffects)).sort(
      compareDefenseEntries,
    ),
    selectedSubclassIndex: validatedSubclassDocument?.index ?? null,
    selectedSubspeciesIndex: validatedSubspeciesDocument?.index ?? null,
    spells: deriveSpellEntries(activeSources, classSourceJson).sort(compareSpellEntries),
    stats: deriveCharacterStats(activeSources, effectiveLevel),
  };
}

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

function resolveFeatSources(selectedFeatIndexes: string[], featDocuments: RuleDocumentRecord[]) {
  const featDocumentMap = new Map(featDocuments.map((document) => [document.index, document]));

  return selectedFeatIndexes
    .map((featIndex) => {
      const document = featDocumentMap.get(featIndex);

      if (!document) {
        if (!(featIndex in passiveEffectRegistry)) {
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

function inferActionEffects(source: ResolvedFeatureSource): CharacterActionEntry[] {
  const activationType = inferActivationType(source.description);

  if (activationType === null) {
    return [];
  }

  return [
    {
      activationType,
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:action:${activationType}`,
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    },
  ];
}

function inferDefenseEffects(source: ResolvedFeatureSource) {
  const entries: CharacterDefenseEntry[] = [];
  const seen = new Set<string>();

  addDamageDefenseEntries(entries, seen, source, "resistance", /resistance to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "immunity", /immunity to ([^.]+?) damage/gi);
  addDamageDefenseEntries(entries, seen, source, "vulnerability", /vulnerability to ([^.]+?) damage/gi);
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /immunity to (?:the )?([^.]+?) condition/gi,
  );
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /immune to being ([^.]+?)(?: while| when|\.|,)/gi,
  );
  addConditionDefenseEntries(
    entries,
    seen,
    source,
    /can't be ([^.]+?)(?: while| when|\.|,)/gi,
  );

  return entries;
}

function deriveCharacterStats(
  activeSources: ResolvedFeatureSource[],
  characterLevel: number,
): CharacterDerivedStats {
  return activeSources.reduce(
    (stats, source) => {
      const passiveEffect = getPassiveEffect(source);

      if (!passiveEffect) {
        return stats;
      }

      if (passiveEffect.armorClassMode) {
        stats.armorClassMode = chooseArmorClassMode(
          stats.armorClassMode,
          passiveEffect.armorClassMode,
        );
      }

      stats.armorClassBonus += passiveEffect.armorClassBonus ?? 0;
      stats.initiativeBonus += passiveEffect.initiativeBonus ?? 0;
      stats.passiveInsightBonus += passiveEffect.passiveInsightBonus ?? 0;
      stats.passiveInvestigationBonus += passiveEffect.passiveInvestigationBonus ?? 0;
      stats.passivePerceptionBonus += passiveEffect.passivePerceptionBonus ?? 0;
      stats.speedBonus += passiveEffect.speedBonus ?? 0;

      return stats;
    },
    createBaseDerivedStats(characterLevel),
  );
}

function deriveSpellEntries(
  activeSources: ResolvedFeatureSource[],
  classSourceJson: ClassSourceJson,
) {
  const spellEntries: CharacterSpellEntry[] = [];
  const classSpellcastingEntry = createClassSpellcastingEntry(classSourceJson);

  if (classSpellcastingEntry) {
    spellEntries.push(classSpellcastingEntry);
  }

  for (const source of activeSources) {
    const spellEntry = inferSpellEntry(source);

    if (spellEntry) {
      spellEntries.push(spellEntry);
    }
  }

  return dedupeSpellEntries(spellEntries);
}

function createClassSpellcastingEntry(classSourceJson: ClassSourceJson) {
  const spellcastingInfo = classSourceJson.spellcasting?.info ?? [];
  const descriptions = spellcastingInfo
    .flatMap((entry) => getRuleDescription(entry.desc))
    .filter((description) => description.length > 0);

  if (descriptions.length === 0) {
    return null;
  }

  return {
    description: descriptions.join(" "),
    id: "class-spellcasting",
    kind: "spellcasting" as const,
    level: 1,
    sourceIndex: "class-spellcasting",
    sourceType: "class_feature" as const,
    title: "Spellcasting",
  };
}

function inferSpellEntry(source: ResolvedFeatureSource): CharacterSpellEntry | null {
  const normalizedTitle = source.title.toLowerCase();
  const normalizedDescription = source.description.toLowerCase();

  if (normalizedTitle.includes("spellcasting")) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      kind: "spellcasting",
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    };
  }

  if (
    normalizedDescription.includes("always have") &&
    normalizedDescription.includes("spells prepared")
  ) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      kind: "always_prepared",
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    };
  }

  if (
    /\b(cantrip|spell|spells)\b/.test(normalizedTitle) ||
    /\b(cantrip|spellcasting focus|cast spells|learn .* spells|prepared spells?)\b/.test(
      normalizedDescription,
    )
  ) {
    return {
      description: source.description,
      id: `${source.sourceType}:${source.sourceIndex}:spell`,
      kind: "spell_feature",
      level: source.level,
      sourceIndex: source.sourceIndex,
      sourceType: source.sourceType,
      title: source.title,
    };
  }

  return null;
}

function addDamageDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
  kind: Extract<CharacterDefenseKind, "immunity" | "resistance" | "vulnerability">,
  pattern: RegExp,
) {
  const matches = [...source.description.matchAll(pattern)];

  matches.forEach((match) => {
    const targets = extractDamageTargets(match[1] ?? "");

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, {
        description: source.description,
        kind,
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        target,
        title: source.title,
      });
    });
  });
}

function addConditionDefenseEntries(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  source: ResolvedFeatureSource,
  pattern: RegExp,
) {
  const matches = [...source.description.matchAll(pattern)];

  matches.forEach((match) => {
    const targets = extractConditionTargets(match[1] ?? "");

    targets.forEach((target) => {
      pushDefenseEntry(entries, seen, {
        description: source.description,
        kind: "condition_immunity",
        level: source.level,
        sourceIndex: source.sourceIndex,
        sourceType: source.sourceType,
        target,
        title: source.title,
      });
    });
  });
}

function pushDefenseEntry(
  entries: CharacterDefenseEntry[],
  seen: Set<string>,
  entry: Omit<CharacterDefenseEntry, "id">,
) {
  const key = `${entry.sourceType}:${entry.sourceIndex}:${entry.kind}:${entry.target}`;

  if (seen.has(key)) {
    return;
  }

  seen.add(key);
  entries.push({
    ...entry,
    id: key,
  });
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
  classSubclassIndexes: Set<string>,
) {
  return [
    ...new Set(
      choices
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
    ),
  ];
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

function inferActivationType(description: string): ActionActivationType | null {
  const normalized = description.toLowerCase();

  if (/\bbonus action\b/.test(normalized)) {
    return "bonus_action";
  }

  if (/\breaction\b/.test(normalized)) {
    return "reaction";
  }

  if (
    /\battack action\b/.test(normalized) ||
    /\bmelee weapon attack\b/.test(normalized) ||
    /\branged weapon attack\b/.test(normalized) ||
    /\bmake an attack roll\b/.test(normalized) ||
    /\breplace one of your attacks\b/.test(normalized)
  ) {
    return "attack";
  }

  if (
    /\bas an action\b/.test(normalized) ||
    /\btake the .* action\b/.test(normalized) ||
    /\bmagic action\b/.test(normalized) ||
    /\butilize action\b/.test(normalized) ||
    /\buse an object action\b/.test(normalized)
  ) {
    return "action";
  }

  return null;
}

function getRuleDescription(...values: unknown[]) {
  const parts: string[] = [];

  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      parts.push(value.trim());
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === "string" && item.trim().length > 0) {
          parts.push(item.trim());
        }
      }
    }
  }

  return parts.join(" ");
}

function extractDamageTargets(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.includes("all")) {
    return ["All Damage"];
  }

  return damageTypes
    .filter((damageType) => new RegExp(`\\b${damageType}\\b`, "i").test(value))
    .map(toTitleCase);
}

function extractConditionTargets(value: string) {
  return conditionTypes
    .filter((conditionType) => new RegExp(`\\b${conditionType}\\b`, "i").test(value))
    .map(toTitleCase);
}

function dedupeActions(entries: CharacterActionEntry[]) {
  const seenIds = new Set<string>();

  return entries.filter((entry) => {
    if (seenIds.has(entry.id)) {
      return false;
    }

    seenIds.add(entry.id);
    return true;
  });
}

function dedupeSpellEntries(entries: CharacterSpellEntry[]) {
  const seenIds = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.kind}:${entry.title}:${entry.sourceIndex}`;

    if (seenIds.has(key)) {
      return false;
    }

    seenIds.add(key);
    return true;
  });
}

function dedupeDefenses(entries: CharacterDefenseEntry[]) {
  const seen = new Set<string>();

  return entries.filter((entry) => {
    const key = `${entry.kind}:${entry.target}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function compareActionEntries(left: CharacterActionEntry, right: CharacterActionEntry) {
  const leftPriority = activationPriority(left.activationType);
  const rightPriority = activationPriority(right.activationType);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftLevel = left.level ?? Number.POSITIVE_INFINITY;
  const rightLevel = right.level ?? Number.POSITIVE_INFINITY;

  if (leftLevel !== rightLevel) {
    return leftLevel - rightLevel;
  }

  return left.title.localeCompare(right.title);
}

function compareDefenseEntries(left: CharacterDefenseEntry, right: CharacterDefenseEntry) {
  const kindDifference = defenseKindPriority(left.kind) - defenseKindPriority(right.kind);

  if (kindDifference !== 0) {
    return kindDifference;
  }

  return left.target.localeCompare(right.target);
}

function compareSpellEntries(left: CharacterSpellEntry, right: CharacterSpellEntry) {
  const leftPriority = spellKindPriority(left.kind);
  const rightPriority = spellKindPriority(right.kind);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  const leftLevel = left.level ?? Number.POSITIVE_INFINITY;
  const rightLevel = right.level ?? Number.POSITIVE_INFINITY;

  if (leftLevel !== rightLevel) {
    return leftLevel - rightLevel;
  }

  return left.title.localeCompare(right.title);
}

function compareResolvedSources(left: ResolvedFeatureSource, right: ResolvedFeatureSource) {
  const leftLevel = left.level ?? Number.POSITIVE_INFINITY;
  const rightLevel = right.level ?? Number.POSITIVE_INFINITY;

  if (leftLevel !== rightLevel) {
    return leftLevel - rightLevel;
  }

  if (left.sourceType !== right.sourceType) {
    return resolvedSourcePriority(left.sourceType) - resolvedSourcePriority(right.sourceType);
  }

  return left.title.localeCompare(right.title);
}

function activationPriority(activationType: ActionActivationType) {
  switch (activationType) {
    case "attack":
      return 0;
    case "action":
      return 1;
    case "bonus_action":
      return 2;
    case "reaction":
      return 3;
    case "other":
    default:
      return 4;
  }
}

function spellKindPriority(kind: CharacterSpellEntry["kind"]) {
  switch (kind) {
    case "spellcasting":
      return 0;
    case "always_prepared":
      return 1;
    case "spell_feature":
    default:
      return 2;
  }
}

function defenseKindPriority(kind: CharacterDefenseKind) {
  switch (kind) {
    case "resistance":
      return 0;
    case "immunity":
      return 1;
    case "vulnerability":
      return 2;
    case "condition_immunity":
    default:
      return 3;
  }
}

function resolvedSourcePriority(sourceType: CharacterFeatureSourceType) {
  switch (sourceType) {
    case "class_feature":
      return 0;
    case "subclass_feature":
      return 1;
    case "species_trait":
    default:
      return 2;
  }
}

function createBaseDerivedStats(characterLevel: number): CharacterDerivedStats {
  return {
    armorClassBonus: 0,
    armorClassMode: "base",
    initiativeBonus: 0,
    passiveInsightBonus: 0,
    passiveInvestigationBonus: 0,
    passivePerceptionBonus: 0,
    proficiencyBonus: getProficiencyBonus(characterLevel),
    speedBonus: 0,
  };
}

function getPassiveEffect(source: ResolvedFeatureSource) {
  const normalizedTitle = source.title.toLowerCase();

  if (source.sourceIndex in passiveEffectRegistry) {
    return passiveEffectRegistry[source.sourceIndex];
  }

  const titleKey = slugify(normalizedTitle);

  return passiveEffectRegistry[titleKey] ?? null;
}

function chooseArmorClassMode(
  currentMode: DerivedArmorClassMode,
  nextMode: DerivedArmorClassMode,
): DerivedArmorClassMode {
  if (currentMode === "monk_unarmored" || nextMode === "monk_unarmored") {
    return nextMode;
  }

  if (currentMode === "barbarian_unarmored" || nextMode === "barbarian_unarmored") {
    return nextMode;
  }

  return "base";
}

function getProficiencyBonus(level: number) {
  if (level <= 4) {
    return 2;
  }

  if (level <= 8) {
    return 3;
  }

  if (level <= 12) {
    return 4;
  }

  if (level <= 16) {
    return 5;
  }

  return 6;
}

function asClassSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as ClassSourceJson) : {};
}

function asLevelSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as LevelSourceJson) : {};
}

function asFeatureSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as FeatureSourceJson) : {};
}

function asTraitSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as TraitSourceJson) : {};
}

function asFeatSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as FeatSourceJson) : {};
}

function asSubclassSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as SubclassSourceJson) : {};
}

function asSubspeciesSourceJson(value: unknown) {
  return typeof value === "object" && value !== null ? (value as SubspeciesSourceJson) : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function humanizeIndex(index: string) {
  return index
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

export { findCharacterDerivedStateForUser };
export type {
  ActionActivationType,
  CharacterActionEntry,
  CharacterDefenseEntry,
  CharacterDefenseKind,
  CharacterFeatureEffectsOverrides,
  CharacterFeatureSourceType,
  DerivedCharacterState,
  ResolvedFeatureSource,
};
