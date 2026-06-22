import { prisma } from "../lib/prisma.js";
import { deriveActionEntries } from "./character-effects/actions.js";
import { deriveDefenseEntries } from "./character-effects/defenses.js";
import {
  asClassSourceJson,
  createBaseDerivedStats,
  isPresent,
  passiveEffectRegistryKeys,
  stringValue,
} from "./character-effects/shared.js";
import {
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
} from "./character-effects/sources.js";
import { deriveSpellEntries } from "./character-effects/spells.js";
import { deriveCharacterStats } from "./character-effects/stats.js";
import type {
  CharacterFeatureEffectsOverrides,
  DerivedCharacterState,
  RuleDocumentRecord,
} from "./character-effects/types.js";

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
      backgroundIndex: true,
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
      featureChoices: {
        select: {
          choiceKey: true,
          choiceLabel: true,
          choicePath: true,
          selectedOptionIndex: true,
          selectedOptionName: true,
          selectedOptionType: true,
          selectedOptionUrl: true,
        },
      },
    },
  });

  if (!character) {
    return null;
  }

  const effectiveClassIndex = overrides.classIndex ?? character.classIndex;
  const effectiveBackgroundIndex = overrides.backgroundIndex ?? character.backgroundIndex;
  const effectiveSpeciesIndex = overrides.speciesIndex ?? character.speciesIndex;
  const effectiveLevel = overrides.level ?? character.level;

  const [effectiveBackground, effectiveClass, effectiveSpecies, levelDocuments] = await Promise.all([
    prisma.refBackground.findUnique({
      where: {
        index: effectiveBackgroundIndex,
      },
      select: {
        index: true,
        featGrants: {
          select: {
            featIndex: true,
          },
        },
      },
    }),
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

  if (!effectiveBackground || !effectiveClass || !effectiveSpecies) {
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
  const selectedFeatIndexes = getSelectedFeatIndexes(
    character.choices,
    character.featureChoices,
    classSubclassIndexes,
    effectiveBackground.featGrants.map((grant) => grant.featIndex),
    overrides.featIndexes ?? [],
  );
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
    ...resolveFeatSources(
      selectedFeatIndexes,
      featDocuments,
      passiveEffectRegistryKeys,
    ),
    ...resolveSpeciesTraitSources(traitDocuments),
  ];

  return {
    actions: deriveActionEntries(activeSources),
    activeSources,
    defenses: deriveDefenseEntries(activeSources),
    selectedSubclassIndex: validatedSubclassDocument?.index ?? null,
    selectedSubspeciesIndex: validatedSubspeciesDocument?.index ?? null,
    spells: deriveSpellEntries(activeSources, classSourceJson),
    stats: deriveCharacterStats(activeSources, effectiveLevel),
  };
}

export { findCharacterDerivedStateForUser };
export type {
  ActionActivationType,
  CharacterActionEntry,
  CharacterDefenseEntry,
  CharacterDefenseKind,
  CharacterFeatureEffectsOverrides,
  CharacterFeatureSourceType,
  CharacterSpellEntry,
  DerivedCharacterState,
  ResolvedFeatureSource,
} from "./character-effects/types.js";
