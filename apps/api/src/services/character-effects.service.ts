import { prisma } from "../lib/prisma.js";
import { findResourceStateForCharacter } from "./character-resource-state.service.js";
import { deriveActionEntries } from "./character-effects/actions.js";
import { deriveDefenseEntries } from "./character-effects/defenses.js";
import {
  decodeInventoryAttunementState,
  deriveEquippedItemEffects,
} from "./character-effects/items.js";
import {
  asClassSourceJson,
  compareActionEntries,
  createBaseDerivedStats,
  compareDefenseEntries,
  dedupeActions,
  dedupeDefenses,
  isPresent,
  passiveEffectRegistryKeys,
  stringValue,
} from "./character-effects/shared.js";
import {
  getActiveClassFeatureIndexes,
  getActiveFeatureChoiceSources,
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
} from "./character-effects/sources.js";
import { deriveSpellEntries } from "./character-effects/spells.js";
import { deriveCharacterStats } from "./character-effects/stats.js";
import { deriveResourceEntries } from "./character-effects/resources.js";
import { deriveWeaponActionEntries } from "./character-effects/weapon-actions.js";
import type {
  CharacterFeatureEffectsOverrides,
  DerivedCharacterState,
  ResolvedFeatureSource,
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
      abilityScores: {
        select: {
          abilityIndex: true,
          score: true,
        },
      },
      backgroundIndex: true,
      classIndex: true,
      level: true,
      proficiencies: {
        select: {
          proficiency: {
            select: {
              index: true,
              name: true,
            },
          },
        },
      },
      speciesIndex: true,
      subclassIndex: true,
      inventory: {
        where: {
          equipped: true,
        },
        select: {
          equipmentIndex: true,
          customName: true,
          notes: true,
          equipment: {
            select: {
              description: true,
              index: true,
              itemType: true,
              name: true,
              sourceJson: true,
            },
          },
        },
      },
      inventoryState: {
        select: {
          stateCode: true,
        },
      },
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
          classIndex: true,
          choiceKey: true,
          choiceLabel: true,
          choicePath: true,
          featureIndex: true,
          grantsRawJson: true,
          level: true,
          selectedOptionIndex: true,
          selectedOptionName: true,
          selectedOptionType: true,
          selectedOptionUrl: true,
          selectedRawJson: true,
          sourceIndex: true,
          sourceType: true,
          subclassIndex: true,
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
      resources: [],
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
    overrides.subclassIndex ?? character.subclassIndex ?? undefined,
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
  // Derived state is assembled from three layers:
  // 1. rule documents unlocked by class/species/level,
  // 2. persisted feature-choice selections,
  // 3. preview overrides coming from the builder before save.
  const mergedFeatureChoices = mergeFeatureChoiceRecords(
    character.featureChoices,
    overrides.featureChoices ?? [],
  );
  const selectedFeatIndexes = getSelectedFeatIndexes(
    character.choices,
    mergedFeatureChoices,
    classSubclassIndexes,
    effectiveBackground.featGrants.map((grant) => grant.featIndex),
    overrides.featIndexes ?? [],
  );
  const activeTraitIndexes = getActiveSpeciesTraitIndexes(
    effectiveSpecies.traits.map((trait: { traitIndex: string }) => trait.traitIndex),
    validatedSubspeciesDocument?.sourceJson,
    effectiveSpeciesIndex,
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

  const attunedStateBySignature = decodeInventoryAttunementState(
    character.inventoryState?.stateCode,
  );
  const equippedItemEffects = deriveEquippedItemEffects(
    character.inventory,
    attunedStateBySignature,
  );
  const persistedResourceState = overrides.resourceState
    ? null
    : await findResourceStateForCharacter(prisma, characterId);
  const effectiveResourceState = overrides.resourceState ?? persistedResourceState ?? {
    activeByResourceKey: {},
  };
  const baseActiveSources = [
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
    ...getActiveFeatureChoiceSources(
      mergedFeatureChoices,
      effectiveLevel,
    ),
    ...resolveSpeciesTraitSources(traitDocuments, effectiveLevel),
    ...equippedItemEffects.activeSources,
  ];
  const activeSources = [
    ...baseActiveSources,
    ...deriveActiveResourceSources(baseActiveSources, effectiveResourceState.activeByResourceKey ?? {}),
  ];
  const effectiveAbilityScores = character.abilityScores.map((abilityScore) => ({
    ...abilityScore,
    score: overrides.abilityScores?.[abilityScore.abilityIndex as keyof NonNullable<typeof overrides.abilityScores>] ??
      abilityScore.score,
  }));
  const abilityScoresByIndex = Object.fromEntries(
    effectiveAbilityScores.map((abilityScore) => [
      abilityScore.abilityIndex,
      abilityScore.score,
    ]),
  );
  const derivedStats = deriveCharacterStats(activeSources, effectiveLevel, {
    abilityScoresByIndex,
    hasArmorEquipped: hasArmorEquipped(character.inventory),
    hasHeavyArmorEquipped: hasHeavyArmorEquipped(character.inventory),
  });
  derivedStats.armorClassBonus += equippedItemEffects.armorClassBonus;
  derivedStats.savingThrowBonus += equippedItemEffects.savingThrowBonus;
  if (equippedItemEffects.strengthMinimum !== null) {
    derivedStats.strengthMinimum = Math.max(
      derivedStats.strengthMinimum ?? 0,
      equippedItemEffects.strengthMinimum,
    );
  }
  const combinedDefenses = dedupeDefenses([
    ...deriveDefenseEntries(activeSources),
    ...equippedItemEffects.defenses,
  ]).sort(compareDefenseEntries);
  const combinedActions = dedupeActions([
    ...deriveWeaponActionEntries({
      abilityScores: effectiveAbilityScores,
      activeSources,
      characterLevel: effectiveLevel,
      inventory: character.inventory,
      proficiencies: character.proficiencies,
      stats: derivedStats,
    }),
    ...deriveActionEntries(activeSources),
  ]).sort(compareActionEntries);

  return {
    actions: combinedActions,
    activeSources,
    defenses: combinedDefenses,
    resources: deriveResourceEntries(activeSources, effectiveLevel, {
      abilityScoresByIndex,
    }),
    selectedSubclassIndex: validatedSubclassDocument?.index ?? null,
    selectedSubspeciesIndex: validatedSubspeciesDocument?.index ?? null,
    spells: deriveSpellEntries(activeSources, classSourceJson, effectiveLevel),
    stats: derivedStats,
  };
}

function deriveActiveResourceSources(
  activeSources: ResolvedFeatureSource[],
  activeByResourceKey: Record<string, boolean>,
) {
  const activeResourceKeys = new Set(
    Object.entries(activeByResourceKey)
      .filter(([, isActive]) => isActive)
      .map(([key]) => key.toLowerCase()),
  );
  const activeSourcesFromResources: ResolvedFeatureSource[] = [];

  if (activeResourceKeys.has("large-form")) {
    const largeFormSource = activeSources.find((source) =>
      `${source.sourceIndex} ${source.title}`.toLowerCase().includes("large-form"),
    );

    if (largeFormSource) {
      activeSourcesFromResources.push({
        description:
          "While Large Form is active, your Speed increases by 10 feet.",
        level: largeFormSource.level,
        sourceIndex: "large-form-active",
        sourceType: "species_trait" as const,
        title: "Large Form (Active)",
      });
    }
  }

  if (activeResourceKeys.has("rage")) {
    const rageSource = activeSources.find((source) =>
      `${source.sourceIndex} ${source.title}`.toLowerCase().includes("rage"),
    );

    if (rageSource) {
      activeSourcesFromResources.push({
        description:
          "While Rage is active, you have resistance to bludgeoning, piercing, and slashing damage.",
        level: rageSource.level,
        sourceIndex: "rage-active",
        sourceType: "class_feature" as const,
        title: "Rage (Active)",
      });
    }
  }

  return activeSourcesFromResources;
}

function hasArmorEquipped(
  items: Array<{
    equipment: {
      itemType?: string | null;
      name: string;
    };
  }>,
) {
  return items.some((item) => {
    const normalizedItemType = item.equipment.itemType?.trim().toLowerCase() ?? "";
    const normalizedName = item.equipment.name.trim().toLowerCase();

    return (
      normalizedItemType.includes("armor") ||
      ["armor", "mail", "breastplate", "plate", "hide", "leather", "chain shirt", "chainmail"].some(
        (keyword) => normalizedName.includes(keyword),
      )
    );
  });
}

function hasHeavyArmorEquipped(
  items: Array<{
    equipment: {
      itemType?: string | null;
      name: string;
    };
  }>,
) {
  return items.some((item) => {
    const normalizedItemType = item.equipment.itemType?.trim().toLowerCase() ?? "";
    const normalizedName = item.equipment.name.trim().toLowerCase();

    return (
      normalizedItemType.includes("heavy armor") ||
      normalizedName.includes("ring mail") ||
      normalizedName.includes("chain mail") ||
      normalizedName.includes("chainmail") ||
      normalizedName.includes("splint") ||
      normalizedName === "plate" ||
      normalizedName.includes("plate armor")
    );
  });
}

export { findCharacterDerivedStateForUser };
export type {
  ActionActivationType,
  CharacterActionEntry,
  CharacterDefenseEntry,
  CharacterDefenseKind,
  CharacterFeatureEffectsOverrides,
  CharacterFeatureSourceType,
  CharacterResourceEntry,
  CharacterSpellEntry,
  DerivedCharacterState,
  ResolvedFeatureSource,
} from "./character-effects/types.js";
