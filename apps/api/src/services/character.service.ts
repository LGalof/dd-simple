import { Prisma } from "@prisma/client";
import {
  buildFeatAbilityBonuses,
  getFeatAbilityChoiceFieldIds,
  getFeatAbilityRule,
} from "@dd-simple/shared";
import { prisma } from "../lib/prisma.js";
import {
  attachResourceStateToCharacter,
  attachResourceStateToCharacters,
  findResourceStateForCharacter,
  normalizeResourceStateInput,
  upsertCharacterResourceState,
  type ResourceStateInput,
  type ResourceStateModel,
} from "./character-resource-state.service.js";
import {
  attachSpellcastingStateToCharacter,
  attachSpellcastingStateToCharacters,
  findSpellcastingStateForCharacter,
  normalizeSpellcastingStateInput,
  upsertCharacterSpellcastingState,
  type SpellcastingStateInput,
  type SpellcastingStateModel,
} from "./character-spellcasting-state.service.js";

type ReferenceIndexRecord = {
  index: string;
};

type SubclassReferenceDocument = {
  index: string;
  sourceJson: unknown;
};

type ClassSourceJson = {
  saving_throws?: ReferenceIndexRecord[];
  subclasses?: ReferenceIndexRecord[];
};

type FeatureSourceJson = {
  class?: {
    index?: unknown;
  };
  feature_specific?: unknown;
  level?: unknown;
  subclass?: {
    index?: unknown;
  };
};

type SpeciesSourceJson = {
  languages?: ReferenceIndexRecord[];
};

type ClassProficiencyGrantIndex = {
  proficiencyIndex: string;
};

type BackgroundProficiencyGrantIndex = {
  proficiencyIndex: string;
};

type ReferenceIndexOnly = {
  index: string;
};

type ClassSkillChoiceWithOptions = {
  options: Array<{
    proficiencyIndex: string;
  }>;
};

type CharacterChoiceInput = {
  choiceType?: string;
  sourceType?: string;
  sourceIndex?: string;
  selectedType?: string;
  selectedIndex: string;
};

type CharacterFeatureChoiceSelectionInput = {
  sourceType: string;
  sourceIndex: string;
  classIndex?: string | null;
  subclassIndex?: string | null;
  level?: number | null;
  featureIndex?: string | null;
  choicePath: string;
  choiceKey?: string | null;
  choiceLabel?: string | null;
  selectedOptionType: string;
  selectedOptionIndex?: string | null;
  selectedOptionName?: string | null;
  selectedOptionUrl?: string | null;
  selectedRawJson: unknown;
  grantsRawJson?: unknown | null;
};

type HitPointCalculationMode = "fixed" | "rolled" | "override";

type HitPointStateInput = {
  calculationMode?: string;
  bonusHp?: number;
  overrideMaxHp?: number | null;
  rolledHitPoints?: unknown;
  tempHp?: number;
};

type CharacterMutationData = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  subclassIndex?: string | null;
  backgroundIndex: string;
  alignment: string | null;
  level?: number;
  currentHp?: number;
  hitPointState?: HitPointStateInput;
  spellcastingState?: SpellcastingStateInput;
  resourceState?: ResourceStateInput;
  skillIndexes: string[];
  choices?: CharacterChoiceInput[];
  featureChoices?: CharacterFeatureChoiceSelectionInput[];
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
};

type CreateCharacterData = CharacterMutationData;

type RuntimeStateCharacter<T extends { id: string }> = T & {
  resourceState: ResourceStateModel | null;
  spellcastingState: SpellcastingStateModel | null;
};

type CharacterInventoryMutationItem = {
  equipmentIndex: string;
  quantity: number;
  equipped: boolean;
  gridX?: number | null;
  gridY?: number | null;
  customName?: string | null;
  notes?: string | null;
};

type CharacterDiceRollInput = {
  formula: string;
  modifier?: number;
  reason?: string | null;
  rollMode?: string;
  rollType: string;
  rollValues: Prisma.InputJsonValue;
  targetIndex?: string | null;
  targetType?: string | null;
  total: number;
  visibility?: string;
};

const CLASS_CHOICE_SOURCE_TYPE = "class";
const CLASS_SKILL_CHOICE_TYPE = "class-skill-choice";
const CLASS_SKILL_CHOICE_SELECTED_TYPE = "skill";
const CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE = "class-choice";
const SPECIES_CHOICE_SOURCE_TYPE = "species";
const SPECIES_LANGUAGE_CHOICE_TYPE = "species-language-choice";
const SPECIES_LANGUAGE_SELECTED_TYPE = "language";
const SPECIES_HERITAGE_CHOICE_TYPE = "species-heritage-choice";
const SPECIES_HERITAGE_SELECTED_TYPE = "subspecies";
const BACKGROUND_CHOICE_SOURCE_TYPE = "background";
const BACKGROUND_ABILITY_PLAN_CHOICE_TYPE = "background-ability-plan";
const BACKGROUND_ABILITY_SCORE_CHOICE_TYPE = "background-ability-score-choice";
const BACKGROUND_ABILITY_PLAN_SELECTED_TYPE = "ability-plan";
const BACKGROUND_ABILITY_SCORE_SELECTED_TYPE = "ability-score";
const BACKGROUND_ABILITY_PLAN_TWO_SCORES = "increase-two-scores-2-1";
const BACKGROUND_ABILITY_PLAN_THREE_SCORES = "increase-all-three-by-1";
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

const fallbackSpeciesLanguageIndexes: Record<string, string[]> = {
  dragonborn: ["common", "draconic"],
  dwarf: ["common", "dwarvish"],
  elf: ["common", "elvish"],
  gnome: ["common", "gnomish"],
  goliath: ["common", "giant"],
  halfling: ["common", "halfling"],
  human: ["common"],
  orc: ["common", "orc"],
  tiefling: ["common", "infernal"],
};

const referenceLanguageNames: Record<string, string> = {
  abyssal: "Abyssal",
  celestial: "Celestial",
  common: "Common",
  "common-sign-language": "Common Sign Language",
  "deep-speech": "Deep Speech",
  draconic: "Draconic",
  druidic: "Druidic",
  dwarvish: "Dwarvish",
  elvish: "Elvish",
  giant: "Giant",
  gnomish: "Gnomish",
  goblin: "Goblin",
  halfling: "Halfling",
  infernal: "Infernal",
  orc: "Orc",
  primordial: "Primordial",
  sylvan: "Sylvan",
  "thieves-cant": "Thieves' Cant",
  undercommon: "Undercommon",
};

async function attachCharacterRuntimeState<T extends { id: string }>(
  executor: Prisma.TransactionClient | typeof prisma,
  character: T | null,
): Promise<RuntimeStateCharacter<T> | null> {
  const withSpellcastingState = await attachSpellcastingStateToCharacter(
    executor,
    character,
  );

  return attachResourceStateToCharacter(executor, withSpellcastingState);
}

async function attachCharacterRuntimeStates<T extends { id: string }>(
  executor: Prisma.TransactionClient | typeof prisma,
  characters: T[],
): Promise<Array<RuntimeStateCharacter<T>>> {
  const withSpellcastingStates = await attachSpellcastingStateToCharacters(
    executor,
    characters,
  );

  return attachResourceStateToCharacters(executor, withSpellcastingStates);
}

class CharacterReferenceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CharacterReferenceNotFoundError";
  }
}

const characterInclude = {
  user: true,
  species: {
    include: {
      traits: true,
      sizeOptions: true,
      subspecies: true,
    },
  },
  class: true,
  background: {
    include: {
      proficiencyGrants: {
        include: {
          proficiency: true,
        },
      },
      abilityOptions: {
        include: {
          abilityScore: true,
        },
      },
      featGrants: true,
    },
  },
  abilityScores: {
    include: {
      ability: true,
    },
  },
  skills: {
    orderBy: {
      skillIndex: "asc" as const,
    },
    include: {
      skill: {
        include: {
          ability: true,
        },
      },
    },
  },
  proficiencies: {
    include: {
      proficiency: true,
    },
  },
  inventory: {
    include: {
      equipment: true,
    },
  },
  choices: true,
  featureChoices: {
    orderBy: [
      {
        sourceType: "asc" as const,
      },
      {
        sourceIndex: "asc" as const,
      },
      {
        choicePath: "asc" as const,
      },
    ],
  },
  languages: {
    orderBy: {
      languageIndex: "asc" as const,
    },
    include: {
      language: true,
    },
  },
  conditions: {
    orderBy: {
      appliedAt: "asc" as const,
    },
    include: {
      condition: true,
    },
  },
  hitPointState: true,
  diceRolls: {
    orderBy: {
      rolledAt: "desc" as const,
    },
  },
};

function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function normalizeHitPointMode(value: string | undefined): HitPointCalculationMode {
  return value === "rolled" || value === "override" ? value : "fixed";
}

function normalizeInteger(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : fallback;
}

function normalizeHitPointRolls(level: number, hitDie: number, value: unknown) {
  const rolls = Array.isArray(value) ? value : [];

  return Array.from({ length: level }, (_, index) => {
    const roll = rolls[index];

    if (typeof roll === "number" && Number.isFinite(roll)) {
      return Math.max(1, Math.min(hitDie, Math.floor(roll)));
    }

    return hitDie;
  });
}

function calculateMaxHp({
  bonusHp,
  calculationMode,
  constitutionScore,
  hitDie,
  level,
  overrideMaxHp,
  rolledHitPoints,
}: {
  bonusHp: number;
  calculationMode: HitPointCalculationMode;
  constitutionScore: number;
  hitDie: number;
  level: number;
  overrideMaxHp: number | null;
  rolledHitPoints: number[];
}) {
  const normalizedLevel = Math.max(1, Math.min(20, Math.floor(level)));
  const normalizedHitDie = Math.max(1, Math.floor(hitDie));
  const constitutionBonus = getAbilityModifier(constitutionScore) * normalizedLevel;

  if (calculationMode === "override" && overrideMaxHp !== null) {
    return Math.max(1, Math.floor(overrideMaxHp));
  }

  if (calculationMode === "rolled") {
    return Math.max(
      1,
      rolledHitPoints.reduce((total, roll) => total + roll, 0) + constitutionBonus + bonusHp,
    );
  }

  const fixedGainPerLevel = Math.floor(normalizedHitDie / 2) + 1;
  const fixedClassHp = normalizedHitDie + (normalizedLevel - 1) * fixedGainPerLevel;

  return Math.max(1, fixedClassHp + constitutionBonus + bonusHp);
}

function normalizeHitPointStateInput({
  constitutionScore,
  data,
  featureBonusHp = 0,
  fallback,
  hitDie,
  level,
}: {
  constitutionScore: number;
  data?: HitPointStateInput;
  featureBonusHp?: number;
  fallback?: {
    bonusHp: number;
    calculationMode: string;
    overrideMaxHp: number | null;
    rolledHitPoints: unknown;
    tempHp: number;
  } | null;
  hitDie: number;
  level: number;
}) {
  const normalizedLevel = Math.max(1, Math.min(20, Math.floor(level)));
  const normalizedHitDie = Math.max(1, Math.floor(hitDie));
  const calculationMode = normalizeHitPointMode(data?.calculationMode ?? fallback?.calculationMode);
  // Persist only the user-entered HP modifier. Feature-derived bonuses are
  // recalculated from the current choices so autosaves cannot add them again.
  const bonusHp = normalizeInteger(data?.bonusHp, fallback?.bonusHp ?? 0);
  const totalBonusHp = bonusHp + featureBonusHp;
  const rawOverrideMaxHp =
    data?.overrideMaxHp === undefined ? fallback?.overrideMaxHp ?? null : data.overrideMaxHp;
  const overrideMaxHp =
    rawOverrideMaxHp === null || rawOverrideMaxHp === undefined
      ? null
      : Math.max(1, Math.floor(rawOverrideMaxHp));
  const rolledHitPoints = normalizeHitPointRolls(
    normalizedLevel,
    normalizedHitDie,
    data?.rolledHitPoints ?? fallback?.rolledHitPoints,
  );
  const tempHp = Math.max(0, normalizeInteger(data?.tempHp, fallback?.tempHp ?? 0));
  const maxHp = calculateMaxHp({
    bonusHp: totalBonusHp,
    calculationMode,
    constitutionScore,
    hitDie: normalizedHitDie,
    level: normalizedLevel,
    overrideMaxHp,
    rolledHitPoints,
  });

  return {
    calculationMode,
    bonusHp,
    overrideMaxHp,
    rolledHitPoints,
    tempHp,
    maxHp,
  };
}

function getFeatureChoiceHitPointBonus(
  featureChoices: CharacterFeatureChoiceSelectionInput[] | undefined,
  characterLevel: number,
) {
  const featIndexes = new Set<string>();

  for (const choice of featureChoices ?? []) {
    if (!isFeatFeatureChoiceSelection(choice)) {
      continue;
    }

    const featIndex = normalizeFeatureChoiceFeatIndex(choice);

    if (featIndex) {
      featIndexes.add(featIndex);
    }
  }

  return featIndexes.has("tough") ? Math.max(1, characterLevel) * 2 : 0;
}

function isFeatFeatureChoiceSelection(choice: CharacterFeatureChoiceSelectionInput) {
  if (choice.selectedOptionUrl?.includes("/feats/")) {
    return true;
  }

  const searchText = [
    choice.choiceKey,
    choice.choiceLabel,
    choice.choicePath,
    choice.selectedOptionType,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return searchText.includes("feat");
}

function normalizeFeatureChoiceFeatIndex(choice: CharacterFeatureChoiceSelectionInput) {
  const selectedOptionIndex = choice.selectedOptionIndex?.trim().toLowerCase();

  if (selectedOptionIndex) {
    return selectedOptionIndex;
  }

  const selectedOptionName = choice.selectedOptionName?.trim().toLowerCase();

  if (!selectedOptionName) {
    return null;
  }

  return selectedOptionName.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeBackgroundAbilityChoices(
  choices: CharacterChoiceInput[] | undefined,
  backgroundIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== BACKGROUND_CHOICE_SOURCE_TYPE ||
        !choice.sourceIndex ||
        !choice.selectedIndex
      ) {
        return false;
      }

      return (
        (choice.choiceType === BACKGROUND_ABILITY_PLAN_CHOICE_TYPE &&
          choice.selectedType === BACKGROUND_ABILITY_PLAN_SELECTED_TYPE) ||
        (choice.choiceType === BACKGROUND_ABILITY_SCORE_CHOICE_TYPE &&
          choice.selectedType === BACKGROUND_ABILITY_SCORE_SELECTED_TYPE)
      );
    })
    .map((choice) => ({
      choiceType: choice.choiceType ?? "",
      sourceType: BACKGROUND_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeBackgroundChoiceSourceIndex(choice.sourceIndex, backgroundIndex),
      selectedType: choice.selectedType ?? "",
      selectedIndex:
        choice.choiceType === BACKGROUND_ABILITY_SCORE_CHOICE_TYPE
          ? canonicalAbilityScoreIndex(choice.selectedIndex) ?? choice.selectedIndex
          : choice.selectedIndex,
    }));
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

function normalizeBackgroundChoiceSourceIndex(sourceIndex: string | undefined, backgroundIndex: string) {
  if (!sourceIndex) {
    return backgroundIndex;
  }

  const [, ...choiceKeyParts] = sourceIndex.split(":");
  const choiceKey = choiceKeyParts.join(":");

  return choiceKey ? `${backgroundIndex}:${choiceKey}` : backgroundIndex;
}

function getBackgroundAbilityChoiceFieldId(sourceIndex: string) {
  const parts = sourceIndex.split(":");

  return parts[parts.length - 1] ?? "";
}

async function validateBackgroundAbilityChoices(
  tx: Prisma.TransactionClient,
  backgroundIndex: string,
  choices: ReturnType<typeof normalizeBackgroundAbilityChoices>,
): Promise<string[]> {
  const invalidPlanChoices = choices.filter(
    (choice) =>
      choice.choiceType === BACKGROUND_ABILITY_PLAN_CHOICE_TYPE &&
      choice.selectedIndex !== BACKGROUND_ABILITY_PLAN_TWO_SCORES &&
      choice.selectedIndex !== BACKGROUND_ABILITY_PLAN_THREE_SCORES,
  );

  if (invalidPlanChoices.length > 0) {
    throw new CharacterReferenceNotFoundError("Background ability plan not found");
  }

  const allowedOptions = await tx.refBackgroundAbilityOption.findMany({
    where: {
      backgroundIndex,
    },
    select: {
      abilityScoreIndex: true,
    },
  });
  const allowedIndexes: Set<string> = new Set(
    allowedOptions.map((option: { abilityScoreIndex: string }) => option.abilityScoreIndex),
  );
  const selectedAbilityIndexes = choices
    .filter((choice) => choice.choiceType === BACKGROUND_ABILITY_SCORE_CHOICE_TYPE)
    .map((choice) => choice.selectedIndex);

  if (selectedAbilityIndexes.length === 0) {
    return Array.from(allowedIndexes);
  }

  const invalidIndexes = selectedAbilityIndexes.filter(
    (abilityIndex) => !allowedIndexes.has(abilityIndex),
  );

  if (invalidIndexes.length > 0) {
    throw new CharacterReferenceNotFoundError("Background ability choice not found");
  }

  const selectedPlan =
    choices.find((choice) => choice.choiceType === BACKGROUND_ABILITY_PLAN_CHOICE_TYPE)
      ?.selectedIndex ?? BACKGROUND_ABILITY_PLAN_TWO_SCORES;

  if (selectedPlan === BACKGROUND_ABILITY_PLAN_TWO_SCORES) {
    const scoreChoices = Object.fromEntries(
      choices
        .filter((choice) => choice.choiceType === BACKGROUND_ABILITY_SCORE_CHOICE_TYPE)
        .map((choice) => [
          getBackgroundAbilityChoiceFieldId(choice.sourceIndex),
          canonicalAbilityScoreIndex(choice.selectedIndex),
        ]),
    );

    if (
      scoreChoices["score-a"] &&
      scoreChoices["score-b"] &&
      scoreChoices["score-a"] === scoreChoices["score-b"]
    ) {
      throw new CharacterReferenceNotFoundError("Background ability choices must be different");
    }
  }

  return Array.from(allowedIndexes);
}

function getBackgroundAbilityBonuses(
  choices: ReturnType<typeof normalizeBackgroundAbilityChoices>,
  supportedAbilityIndexes: string[] = [],
) {
  const bonuses = new Map<string, number>();
  const selectedPlan =
    choices.find((choice) => choice.choiceType === BACKGROUND_ABILITY_PLAN_CHOICE_TYPE)
      ?.selectedIndex ?? BACKGROUND_ABILITY_PLAN_TWO_SCORES;
  const scoreChoices = Object.fromEntries(
    choices
      .filter((choice) => choice.choiceType === BACKGROUND_ABILITY_SCORE_CHOICE_TYPE)
      .map((choice) => [getBackgroundAbilityChoiceFieldId(choice.sourceIndex), choice.selectedIndex]),
  );

  if (selectedPlan === BACKGROUND_ABILITY_PLAN_THREE_SCORES) {
    for (const abilityIndex of supportedAbilityIndexes) {
      const canonicalAbilityIndex = canonicalAbilityScoreIndex(abilityIndex);

      if (canonicalAbilityIndex && !bonuses.has(canonicalAbilityIndex)) {
        bonuses.set(canonicalAbilityIndex, 1);
      }
    }

    return bonuses;
  }

  const primaryAbilityIndex = canonicalAbilityScoreIndex(scoreChoices["score-a"]);
  const secondaryAbilityIndex = canonicalAbilityScoreIndex(scoreChoices["score-b"]);

  if (primaryAbilityIndex) {
    bonuses.set(primaryAbilityIndex, 2);
  }

  if (secondaryAbilityIndex && !bonuses.has(secondaryAbilityIndex)) {
    bonuses.set(secondaryAbilityIndex, 1);
  }

  return bonuses;
}

async function replaceBackgroundAbilityChoices(
  tx: Prisma.TransactionClient,
  characterId: string,
  choices: ReturnType<typeof normalizeBackgroundAbilityChoices>,
) {
  await tx.characterChoice.deleteMany({
    where: {
      characterId,
      sourceType: BACKGROUND_CHOICE_SOURCE_TYPE,
      choiceType: {
        in: [BACKGROUND_ABILITY_PLAN_CHOICE_TYPE, BACKGROUND_ABILITY_SCORE_CHOICE_TYPE],
      },
    },
  });

  if (choices.length > 0) {
    await tx.characterChoice.createMany({
      data: choices.map((choice) => ({
        characterId,
        choiceType: choice.choiceType,
        sourceType: choice.sourceType,
        sourceIndex: choice.sourceIndex,
        selectedType: choice.selectedType,
        selectedIndex: choice.selectedIndex,
      })),
    });
  }
}

function toRequiredFeatureChoiceJson(
  value: unknown,
) {
  return value as never;
}

function toNullableFeatureChoiceJson(
  value: unknown | null | undefined,
) {
  return (value ?? null) as never;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

async function findAllowedSubclassIndexes(
  tx: Prisma.TransactionClient,
  classIndex: string,
  classSourceJson: unknown,
) {
  const classJson = isRecord(classSourceJson) ? classSourceJson as ClassSourceJson : {};
  const sourceSubclassIndexes = (classJson.subclasses ?? [])
    .map((subclass) => stringValue(subclass.index))
    .filter((subclassIndex): subclassIndex is string => Boolean(subclassIndex));
  const subclassDocuments = await tx.refRuleDocument.findMany({
    where: {
      category: "subclasses",
    },
    select: {
      index: true,
      sourceJson: true,
    },
  });
  const documentSubclassIndexes = subclassDocuments
    .filter((document: SubclassReferenceDocument) => {
      const sourceJson = isRecord(document.sourceJson) ? document.sourceJson : {};
      const sourceClass = isRecord(sourceJson.class) ? sourceJson.class : {};

      return stringValue(sourceClass.index) === classIndex;
    })
    .map((document: SubclassReferenceDocument) => document.index);

  return new Set([...sourceSubclassIndexes, ...documentSubclassIndexes]);
}

async function normalizeSubclassIndex(
  tx: Prisma.TransactionClient,
  classIndex: string,
  classSourceJson: unknown,
  subclassIndex: string | null | undefined,
) {
  if (!subclassIndex) {
    return null;
  }

  const allowedSubclassIndexes = await findAllowedSubclassIndexes(
    tx,
    classIndex,
    classSourceJson,
  );

  if (!allowedSubclassIndexes.has(subclassIndex)) {
    throw new CharacterReferenceNotFoundError("Subclass not found for class");
  }

  return subclassIndex;
}

async function validateFeatureChoiceSelections(
  tx: Prisma.TransactionClient,
  data: Pick<
    CharacterMutationData,
    "backgroundIndex" | "classIndex" | "featureChoices" | "speciesIndex"
  >,
  options: {
    backgroundSourceJson: unknown;
    characterLevel: number;
    classSourceJson: unknown;
    subclassIndex: string | null;
    speciesSourceJson: unknown;
  },
) {
  for (const choice of data.featureChoices ?? []) {
    if (typeof choice.level === "number" && choice.level > options.characterLevel) {
      throw new CharacterReferenceNotFoundError("Class feature choice is not available at this level");
    }

    const sourceType = choice.sourceType.toUpperCase();

    if (sourceType === "CLASS") {
      validateChoiceSourceScope(choice.sourceIndex, data.classIndex, "Class feature choice not found");
      validateChoicePathSelection(options.classSourceJson, choice, "Class feature choice not found");
      continue;
    }

    if (sourceType === "FEATURE") {
      await validateClassFeatureChoiceSelection(tx, choice, {
        characterLevel: options.characterLevel,
        classIndex: data.classIndex,
        subclassIndex: options.subclassIndex,
      });
      continue;
    }

    if (sourceType === "BACKGROUND") {
      validateChoiceSourceScope(
        choice.sourceIndex,
        data.backgroundIndex,
        "Background feature choice not found",
      );
      validateChoicePathSelection(
        options.backgroundSourceJson,
        choice,
        "Background feature choice not found",
      );
      continue;
    }

    if (sourceType === "SPECIES") {
      validateChoiceSourceScope(choice.sourceIndex, data.speciesIndex, "Species feature choice not found");
      validateChoicePathSelection(options.speciesSourceJson, choice, "Species feature choice not found");
      continue;
    }

    throw new CharacterReferenceNotFoundError("Feature choice source not found");
  }
}

function validateChoiceSourceScope(
  sourceIndex: string,
  expectedSourceIndex: string,
  message: string,
) {
  if (sourceIndex !== expectedSourceIndex) {
    throw new CharacterReferenceNotFoundError(message);
  }
}

async function validateClassFeatureChoiceSelection(
  tx: Prisma.TransactionClient,
  choice: CharacterFeatureChoiceSelectionInput,
  context: {
    characterLevel: number;
    classIndex: string;
    subclassIndex: string | null;
  },
) {
  if (choice.classIndex && choice.classIndex !== context.classIndex) {
    throw new CharacterReferenceNotFoundError("Class feature choice not found");
  }

  if (choice.subclassIndex) {
    if (!context.subclassIndex || choice.subclassIndex !== context.subclassIndex) {
      throw new CharacterReferenceNotFoundError("Subclass feature choice not found");
    }
  }

  const featureDocument = await tx.refRuleDocument.findFirst({
    where: {
      category: "features",
      index: choice.sourceIndex,
    },
    select: {
      sourceJson: true,
    },
  });

  if (!featureDocument) {
    throw new CharacterReferenceNotFoundError("Class feature choice not found");
  }

  const featureSourceJson = isRecord(featureDocument.sourceJson)
    ? featureDocument.sourceJson as FeatureSourceJson
    : {};
  const featureClass = isRecord(featureSourceJson.class) ? featureSourceJson.class : {};
  const featureClassIndex = stringValue(featureClass.index) ?? choice.classIndex;

  if (featureClassIndex !== context.classIndex) {
    throw new CharacterReferenceNotFoundError("Class feature choice not found");
  }

  const featureSubclass = isRecord(featureSourceJson.subclass) ? featureSourceJson.subclass : {};
  const featureSubclassIndex = stringValue(featureSubclass.index);

  if (featureSubclassIndex && featureSubclassIndex !== context.subclassIndex) {
    throw new CharacterReferenceNotFoundError("Subclass feature choice not found");
  }

  const featureLevel = numberValue(featureSourceJson.level);

  if (featureLevel !== null && featureLevel > context.characterLevel) {
    throw new CharacterReferenceNotFoundError("Class feature choice is not available at this level");
  }

  validateChoicePathSelection(
    featureDocument.sourceJson,
    choice,
    "Class feature choice not found",
  );
}

function validateChoicePathSelection(
  sourceJson: unknown,
  choice: CharacterFeatureChoiceSelectionInput,
  message: string,
) {
  const choiceNode = getValueAtChoicePath(sourceJson, stripChoiceSlot(choice.choicePath));

  if (!isRecord(choiceNode)) {
    if (isSyntheticFeatureChoiceSelection(choice)) {
      return;
    }

    throw new CharacterReferenceNotFoundError(message);
  }

  const options = getRawChoiceOptions(choiceNode);

  if (!options.some((option) => rawChoiceOptionMatchesSelection(option, choice))) {
    if (isSyntheticFeatureChoiceSelection(choice)) {
      return;
    }

    throw new CharacterReferenceNotFoundError(message);
  }
}

function isSyntheticFeatureChoiceSelection(choice: CharacterFeatureChoiceSelectionInput) {
  const normalizedChoiceKey = choice.choiceKey?.toLowerCase() ?? "";
  const selectedOptionIndex = choice.selectedOptionIndex ?? undefined;
  const selectedOptionName = choice.selectedOptionName ?? undefined;

  if (
    isAbilityScoreImprovementChoiceKey(choice.choiceKey, choice.choicePath) ||
    normalizedChoiceKey.startsWith("feat-ability-")
  ) {
    return Boolean(
      canonicalAbilityScoreIndex(selectedOptionIndex) ??
        canonicalAbilityScoreIndex(selectedOptionName),
    );
  }

  if (
    normalizedChoiceKey.startsWith("feat-magic-initiate-") ||
    normalizedChoiceKey.startsWith("feat-selection-") ||
    normalizedChoiceKey.startsWith("feat-tool-") ||
    normalizedChoiceKey.startsWith("feat-proficiency-")
  ) {
    return Boolean(selectedOptionIndex || selectedOptionName);
  }

  return false;
}

function stripChoiceSlot(choicePath: string) {
  return choicePath.replace(/\.slot\d+$/, "");
}

function getValueAtChoicePath(sourceJson: unknown, choicePath: string) {
  const pathSegments = parseChoicePath(choicePath);
  let currentValue = sourceJson;

  for (const segment of pathSegments) {
    if (typeof segment === "number") {
      if (!Array.isArray(currentValue)) {
        return null;
      }

      currentValue = currentValue[segment];
      continue;
    }

    if (!isRecord(currentValue)) {
      return null;
    }

    currentValue = currentValue[segment];
  }

  return currentValue;
}

function parseChoicePath(choicePath: string): Array<string | number> {
  return choicePath.split(".").flatMap((part) => {
    const segments: Array<string | number> = [];
    const propertyName = part.match(/^[^\[]+/)?.[0];

    if (propertyName) {
      segments.push(propertyName);
    }

    for (const match of part.matchAll(/\[(\d+)\]/g)) {
      segments.push(Number(match[1]));
    }

    return segments;
  });
}

function getRawChoiceOptions(choiceNode: Record<string, unknown>) {
  const from = isRecord(choiceNode.from) ? choiceNode.from : {};

  return Array.isArray(from.options) ? from.options : [];
}

function rawChoiceOptionMatchesSelection(
  option: unknown,
  choice: CharacterFeatureChoiceSelectionInput,
): boolean {
  if (stableJsonString(option) === stableJsonString(choice.selectedRawJson)) {
    return true;
  }

  const references = collectChoiceOptionReferences(option);

  return Boolean(
    (choice.selectedOptionIndex && references.indexes.has(choice.selectedOptionIndex)) ||
      (choice.selectedOptionUrl && references.urls.has(choice.selectedOptionUrl)) ||
      (choice.selectedOptionName && references.names.has(choice.selectedOptionName)),
  );
}

function collectChoiceOptionReferences(option: unknown): {
  indexes: Set<string>;
  names: Set<string>;
  urls: Set<string>;
} {
  const references = {
    indexes: new Set<string>(),
    names: new Set<string>(),
    urls: new Set<string>(),
  };

  collectChoiceOptionReferencesInto(option, references);

  return references;
}

function collectChoiceOptionReferencesInto(
  option: unknown,
  references: {
    indexes: Set<string>;
    names: Set<string>;
    urls: Set<string>;
  },
) {
  if (!isRecord(option)) {
    return;
  }

  for (const referenceKey of ["item", "of"] as const) {
    const reference = isRecord(option[referenceKey]) ? option[referenceKey] : null;
    const index = stringValue(reference?.index);
    const name = stringValue(reference?.name);
    const url = stringValue(reference?.url);

    if (index) {
      references.indexes.add(index);
    }

    if (name) {
      references.names.add(name);
    }

    if (url) {
      references.urls.add(url);
    }
  }

  if (isRecord(option.choice)) {
    const description = stringValue(option.choice.desc);

    if (description) {
      references.names.add(description);
    }
  }

  if (Array.isArray(option.items)) {
    option.items.forEach((item) => collectChoiceOptionReferencesInto(item, references));
  }
}

async function upsertSubmittedFeatureChoiceSelections(
  tx: Prisma.TransactionClient,
  characterId: string,
  featureChoices: CharacterFeatureChoiceSelectionInput[] | undefined,
) {
  if (!featureChoices?.length) {
    return;
  }

  await Promise.all(
    featureChoices.map((choice) => {
      const data = {
        sourceType: choice.sourceType,
        sourceIndex: choice.sourceIndex,
        classIndex: choice.classIndex ?? null,
        subclassIndex: choice.subclassIndex ?? null,
        level: choice.level ?? null,
        featureIndex: choice.featureIndex ?? null,
        choicePath: choice.choicePath,
        choiceKey: choice.choiceKey ?? null,
        choiceLabel: choice.choiceLabel ?? null,
        selectedOptionType: choice.selectedOptionType,
        selectedOptionIndex: choice.selectedOptionIndex ?? null,
        selectedOptionName: choice.selectedOptionName ?? null,
        selectedOptionUrl: choice.selectedOptionUrl ?? null,
        selectedRawJson: toRequiredFeatureChoiceJson(choice.selectedRawJson),
        grantsRawJson: toNullableFeatureChoiceJson(choice.grantsRawJson),
      };

      return tx.characterFeatureChoiceSelection.upsert({
        where: {
          characterId_sourceType_sourceIndex_choicePath: {
            characterId,
            sourceType: choice.sourceType,
            sourceIndex: choice.sourceIndex,
            choicePath: choice.choicePath,
          },
        },
        update: data,
        create: {
          characterId,
          ...data,
        },
      });
    }),
  );
}

async function deleteStaleFeatureChoiceSelections(
  tx: Prisma.TransactionClient,
  characterId: string,
  data: Pick<
    CharacterMutationData,
    "backgroundIndex" | "classIndex" | "speciesIndex"
  > & {
    level: number;
    subclassIndex: string | null;
  },
) {
  await tx.characterFeatureChoiceSelection.deleteMany({
    where: {
      characterId,
      OR: [
        {
          sourceType: "CLASS",
          sourceIndex: {
            not: data.classIndex,
          },
        },
        {
          sourceType: "FEATURE",
          OR: [
            {
              classIndex: {
                not: data.classIndex,
              },
            },
            {
              classIndex: null,
            },
          ],
        },
        {
          sourceType: "BACKGROUND",
          sourceIndex: {
            not: data.backgroundIndex,
          },
        },
        {
          sourceType: "SPECIES",
          sourceIndex: {
            not: data.speciesIndex,
          },
        },
        {
          level: {
            gt: data.level,
          },
        },
        data.subclassIndex
          ? {
              AND: [
                {
                  subclassIndex: {
                    not: null,
                  },
                },
                {
                  subclassIndex: {
                    not: data.subclassIndex,
                  },
                },
              ],
            }
          : {
              subclassIndex: {
                not: null,
              },
            },
      ],
    },
  });
}

function abilityScoreRows(
  data: CharacterMutationData,
  bonuses: Map<string, number> = new Map(),
) {
  const totalBonuses = mergeAbilityBonuses(
    bonuses,
    getFeatureChoiceAbilityBonuses(data.featureChoices),
    getClassFeatureAbilityBonuses(data.classIndex, data.level ?? 1),
  );
  const abilityMaximums = getClassFeatureAbilityMaximums(data.classIndex, data.level ?? 1);

  return [
    {
      abilityIndex: "str",
      baseScore: data.abilityScores.str,
      score: capAbilityScore("str", data.abilityScores.str + (totalBonuses.get("str") ?? 0), abilityMaximums),
    },
    {
      abilityIndex: "dex",
      baseScore: data.abilityScores.dex,
      score: capAbilityScore("dex", data.abilityScores.dex + (totalBonuses.get("dex") ?? 0), abilityMaximums),
    },
    {
      abilityIndex: "con",
      baseScore: data.abilityScores.con,
      score: capAbilityScore("con", data.abilityScores.con + (totalBonuses.get("con") ?? 0), abilityMaximums),
    },
    {
      abilityIndex: "int",
      baseScore: data.abilityScores.int,
      score: capAbilityScore("int", data.abilityScores.int + (totalBonuses.get("int") ?? 0), abilityMaximums),
    },
    {
      abilityIndex: "wis",
      baseScore: data.abilityScores.wis,
      score: capAbilityScore("wis", data.abilityScores.wis + (totalBonuses.get("wis") ?? 0), abilityMaximums),
    },
    {
      abilityIndex: "cha",
      baseScore: data.abilityScores.cha,
      score: capAbilityScore("cha", data.abilityScores.cha + (totalBonuses.get("cha") ?? 0), abilityMaximums),
    },
  ];
}

function getClassFeatureAbilityBonuses(classIndex: string, level: number) {
  const bonuses = new Map<string, number>();

  if (classIndex === "barbarian" && level >= 20) {
    bonuses.set("str", 4);
    bonuses.set("con", 4);
  }

  return bonuses;
}

function getClassFeatureAbilityMaximums(classIndex: string, level: number) {
  const maximums = new Map<string, number>();

  if (classIndex === "barbarian" && level >= 20) {
    maximums.set("str", 25);
    maximums.set("con", 25);
  }

  return maximums;
}

function capAbilityScore(
  abilityIndex: string,
  value: number,
  maximums: Map<string, number>,
) {
  return Math.min(maximums.get(abilityIndex) ?? 20, value);
}

function mergeAbilityBonuses(...bonusMaps: Array<Map<string, number>>) {
  const mergedBonuses = new Map<string, number>();

  for (const bonusMap of bonusMaps) {
    for (const [abilityIndex, bonusValue] of bonusMap.entries()) {
      mergedBonuses.set(abilityIndex, (mergedBonuses.get(abilityIndex) ?? 0) + bonusValue);
    }
  }

  return mergedBonuses;
}

function getFeatureChoiceAbilityBonuses(
  featureChoices: CharacterFeatureChoiceSelectionInput[] | undefined,
) {
  const bonuses = new Map<string, number>();
  const allChoices = featureChoices ?? [];

  for (const choice of allChoices) {
    if (!isAbilityScoreImprovementChoiceKey(choice.choiceKey, choice.choicePath)) {
      if (!isFeatSelectionChoice(choice)) {
        continue;
      }

      const featIndex = choice.selectedOptionIndex ?? undefined;
      const featRule = getFeatAbilityRule(featIndex);

      if (!featIndex || !featRule) {
        continue;
      }

      const siblingAbilityIndexes = getFeatAbilityChoiceFieldIds(
        featIndex,
        featRule.selectableCount ?? 1,
      )
        .map((fieldId) =>
          allChoices.find(
            (candidate) =>
              candidate.sourceType === choice.sourceType &&
              candidate.sourceIndex === choice.sourceIndex &&
              (candidate.choiceKey?.toLowerCase() ?? "") === fieldId,
          ),
        )
        .map((candidate) =>
          canonicalAbilityScoreIndex(candidate?.selectedOptionIndex ?? undefined) ??
          canonicalAbilityScoreIndex(candidate?.selectedOptionName ?? undefined),
        );
      const featBonuses = buildFeatAbilityBonuses(featIndex, siblingAbilityIndexes);

      for (const [abilityIndex, bonusValue] of Object.entries(featBonuses)) {
        if (!bonusValue) {
          continue;
        }

        bonuses.set(abilityIndex, (bonuses.get(abilityIndex) ?? 0) + bonusValue);
      }

      continue;
    }

    const abilityIndex =
      canonicalAbilityScoreIndex(choice.selectedOptionIndex ?? undefined) ??
      canonicalAbilityScoreIndex(choice.selectedOptionName ?? undefined);

    if (!abilityIndex) {
      continue;
    }

    bonuses.set(abilityIndex, (bonuses.get(abilityIndex) ?? 0) + 1);
  }

  return bonuses;
}

function isAbilityScoreImprovementChoiceKey(choiceKey: string | null | undefined, choicePath: string) {
  const normalizedChoiceKey = choiceKey?.toLowerCase() ?? "";
  const normalizedChoicePath = choicePath.toLowerCase();

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

function isFeatSelectionChoice(choice: CharacterFeatureChoiceSelectionInput) {
  const normalizedChoiceKey = choice.choiceKey?.toLowerCase() ?? "";
  const normalizedUrl = choice.selectedOptionUrl?.toLowerCase() ?? "";

  return (
    normalizedChoiceKey === "asi-feat" ||
    normalizedChoiceKey === "epic-boon" ||
    normalizedUrl.includes("/feats/")
  );
}

function getClassSavingThrowProficiencyIndexes(sourceJson: unknown) {
  if (!sourceJson || typeof sourceJson !== "object") {
    return [];
  }

  const classSourceJson = sourceJson as ClassSourceJson;

  return (classSourceJson.saving_throws ?? []).map(
    (savingThrow) => `saving-throw-${savingThrow.index}`,
  );
}

function isSkillProficiencyIndex(index: string) {
  return index.startsWith("skill-");
}

function skillIndexFromProficiencyIndex(index: string) {
  return isSkillProficiencyIndex(index) ? index.replace(/^skill-/, "") : null;
}

function normalizeClassSkillChoices(
  choices: CharacterChoiceInput[] | undefined,
  classIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== CLASS_CHOICE_SOURCE_TYPE ||
        choice.choiceType !== CLASS_SKILL_CHOICE_TYPE ||
        choice.selectedType !== CLASS_SKILL_CHOICE_SELECTED_TYPE ||
        !isSkillProficiencyIndex(choice.selectedIndex)
      ) {
        return false;
      }

      return Boolean(choice.sourceIndex);
    })
    .map((choice) => ({
      choiceType: CLASS_SKILL_CHOICE_TYPE,
      sourceType: CLASS_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeClassChoiceSourceIndex(choice.sourceIndex, classIndex),
      selectedType: CLASS_SKILL_CHOICE_SELECTED_TYPE,
      selectedIndex: choice.selectedIndex,
    }));
}

function getClassChoiceFeatureProficiencyIndexes(
  featureChoices: CharacterFeatureChoiceSelectionInput[] | undefined,
  classIndex: string,
) {
  return [
    ...new Set(
      [
        ...(featureChoices ?? [])
          .filter((choice) =>
            isClassChoiceFeatureProficiencySelection(choice, classIndex),
          )
          .map((choice) =>
            normalizeClassChoiceProficiencyIndex(
              choice.selectedOptionIndex ?? undefined,
              choice.selectedOptionName ?? undefined,
              choice.selectedOptionUrl ?? undefined,
            ),
          )
          .filter((proficiencyIndex): proficiencyIndex is string => Boolean(proficiencyIndex)),
        ...getFeatureChoiceGrantedProficiencyIndexes(featureChoices),
      ],
    ),
  ];
}

function getFeatureChoiceGrantedProficiencyIndexes(
  featureChoices: CharacterFeatureChoiceSelectionInput[] | undefined,
) {
  return (featureChoices ?? []).flatMap((choice) => {
    const grants = asFeatureChoiceGrantRecord(choice.grantsRawJson);
    const skillIndexes = Array.isArray(grants?.skillProficiencyIndexes)
      ? grants.skillProficiencyIndexes
      : [];
    const savingThrowIndexes = Array.isArray(grants?.savingThrowProficiencyIndexes)
      ? grants.savingThrowProficiencyIndexes
      : [];

    return [...skillIndexes, ...savingThrowIndexes]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map((proficiencyIndex) => normalizeChoiceGrantedProficiencyIndex(proficiencyIndex));
  });
}

function asFeatureChoiceGrantRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as {
        savingThrowProficiencyIndexes?: unknown;
        skillProficiencyIndexes?: unknown;
      }
    : null;
}

function normalizeChoiceGrantedProficiencyIndex(proficiencyIndex: string) {
  const normalizedIndex = proficiencyIndex.trim().toLowerCase();

  if (normalizedIndex.startsWith("saving-throw-")) {
    return normalizedIndex;
  }

  return normalizedIndex.startsWith("skill-")
    ? normalizedIndex
    : `skill-${normalizedIndex}`;
}

function isClassChoiceFeatureProficiencySelection(
  choice: CharacterFeatureChoiceSelectionInput,
  classIndex: string,
) {
  return (
    choice.sourceType.toUpperCase() === "CLASS" &&
    choice.sourceIndex === classIndex &&
    !isClassEquipmentChoicePath(choice.choicePath) &&
    Boolean(
      normalizeClassChoiceProficiencyIndex(
        choice.selectedOptionIndex ?? undefined,
        choice.selectedOptionName ?? undefined,
        choice.selectedOptionUrl ?? undefined,
      ),
    )
  );
}

function isClassEquipmentChoicePath(choicePath: string) {
  return choicePath.toLowerCase().includes("starting_equipment");
}

function normalizeClassChoiceProficiencyIndex(
  selectedOptionIndex: string | undefined,
  selectedOptionName: string | undefined,
  selectedOptionUrl: string | undefined,
) {
  const normalizedIndex = selectedOptionIndex?.trim().toLowerCase() ?? "";
  const normalizedUrl = selectedOptionUrl?.trim().toLowerCase() ?? "";
  const proficiencyUrlMatch = normalizedUrl.match(/\/proficiencies\/([^/?#]+)$/);

  if (proficiencyUrlMatch?.[1]) {
    return proficiencyUrlMatch[1];
  }

  if (
    normalizedIndex.startsWith("skill-") ||
    normalizedIndex.startsWith("tool-") ||
    normalizedIndex.endsWith("-tools") ||
    normalizedIndex.endsWith("-armor") ||
    normalizedIndex.endsWith("-weapons") ||
    normalizedIndex === "shields"
  ) {
    return normalizedIndex;
  }

  const normalizedName = selectedOptionName?.trim().toLowerCase() ?? "";

  if (normalizedName.startsWith("skill: ")) {
    return `skill-${normalizedName.replace(/^skill:\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  }

  if (normalizedName.startsWith("tool: ")) {
    return `tool-${normalizedName.replace(/^tool:\s*/, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;
  }

  return null;
}

function normalizeClassChoiceSourceIndex(sourceIndex: string | undefined, classIndex: string) {
  if (!sourceIndex) {
    return classIndex;
  }

  const [, ...choiceKeyParts] = sourceIndex.split(":");
  const choiceKey = choiceKeyParts.join(":");

  return choiceKey ? `${classIndex}:${choiceKey}` : classIndex;
}

function normalizeSpeciesLanguageChoices(
  choices: CharacterChoiceInput[] | undefined,
  speciesIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== SPECIES_CHOICE_SOURCE_TYPE ||
        choice.choiceType !== SPECIES_LANGUAGE_CHOICE_TYPE ||
        choice.selectedType !== SPECIES_LANGUAGE_SELECTED_TYPE ||
        !choice.selectedIndex ||
        !choice.sourceIndex
      ) {
        return false;
      }

      return true;
    })
    .map((choice) => ({
      choiceType: SPECIES_LANGUAGE_CHOICE_TYPE,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeSpeciesChoiceSourceIndex(choice.sourceIndex, speciesIndex),
      selectedType: SPECIES_LANGUAGE_SELECTED_TYPE,
      selectedIndex: choice.selectedIndex,
    }));
}

function normalizeSpeciesHeritageChoices(
  choices: CharacterChoiceInput[] | undefined,
  speciesIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== SPECIES_CHOICE_SOURCE_TYPE ||
        choice.choiceType !== SPECIES_HERITAGE_CHOICE_TYPE ||
        choice.selectedType !== SPECIES_HERITAGE_SELECTED_TYPE ||
        !choice.selectedIndex ||
        !choice.sourceIndex
      ) {
        return false;
      }

      return true;
    })
    .map((choice) => ({
      choiceType: SPECIES_HERITAGE_CHOICE_TYPE,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeSpeciesChoiceSourceIndex(choice.sourceIndex, speciesIndex),
      selectedType: SPECIES_HERITAGE_SELECTED_TYPE,
      selectedIndex: choice.selectedIndex,
    }));
}

function normalizeSpeciesChoiceSourceIndex(sourceIndex: string | undefined, speciesIndex: string) {
  if (!sourceIndex) {
    return speciesIndex;
  }

  const [, ...choiceKeyParts] = sourceIndex.split(":");
  const choiceKey = choiceKeyParts.join(":");

  return choiceKey ? `${speciesIndex}:${choiceKey}` : speciesIndex;
}

function getFixedSpeciesLanguageIndexes(speciesIndex: string, sourceJson: unknown) {
  if (sourceJson && typeof sourceJson === "object") {
    const speciesSourceJson = sourceJson as SpeciesSourceJson;
    const sourceLanguageIndexes = (speciesSourceJson.languages ?? [])
      .map((language) => language.index)
      .filter((languageIndex): languageIndex is string => Boolean(languageIndex));

    if (sourceLanguageIndexes.length > 0) {
      return [...new Set(sourceLanguageIndexes)];
    }
  }

  return fallbackSpeciesLanguageIndexes[speciesIndex] ?? [];
}

async function replaceSpeciesLanguageChoicesAndRows(
  tx: Prisma.TransactionClient,
  characterId: string,
  speciesIndex: string,
  speciesSourceJson: unknown,
  choices: CharacterChoiceInput[] | undefined,
) {
  const speciesLanguageChoices = normalizeSpeciesLanguageChoices(choices, speciesIndex);
  const fixedLanguageIndexes = getFixedSpeciesLanguageIndexes(speciesIndex, speciesSourceJson);
  const selectedLanguageIndexes = speciesLanguageChoices.map((choice) => choice.selectedIndex);
  const languageIndexes = [...new Set([...fixedLanguageIndexes, ...selectedLanguageIndexes])];

  if (languageIndexes.length > 0) {
    const languages = await tx.refLanguage.findMany({
      where: {
        index: {
          in: languageIndexes,
        },
      },
      select: {
        index: true,
      },
    });
    const existingLanguageIndexes = new Set(
      languages.map((language: ReferenceIndexOnly) => language.index),
    );
    const missingLanguageIndexes = languageIndexes.filter(
      (languageIndex) => !existingLanguageIndexes.has(languageIndex),
    );

    if (missingLanguageIndexes.length > 0) {
      const unsupportedLanguageIndexes = missingLanguageIndexes.filter(
        (languageIndex) => !referenceLanguageNames[languageIndex],
      );

      if (unsupportedLanguageIndexes.length > 0) {
        throw new CharacterReferenceNotFoundError("Language not found");
      }

      // Reference data is normally created by the seed script. Restore any
      // known language rows here as a safeguard for databases deployed before
      // the language-reference migration was added.
      for (const languageIndex of missingLanguageIndexes) {
        await tx.refLanguage.upsert({
          where: {
            index: languageIndex,
          },
          update: {},
          create: {
            index: languageIndex,
            name: referenceLanguageNames[languageIndex],
          },
        });
      }
    }
  }

  await tx.characterChoice.deleteMany({
    where: {
      characterId,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      choiceType: SPECIES_LANGUAGE_CHOICE_TYPE,
    },
  });

  if (speciesLanguageChoices.length > 0) {
    await tx.characterChoice.createMany({
      data: speciesLanguageChoices.map((choice) => ({
        characterId,
        choiceType: choice.choiceType,
        sourceType: choice.sourceType,
        sourceIndex: choice.sourceIndex,
        selectedType: choice.selectedType,
        selectedIndex: choice.selectedIndex,
      })),
    });
  }

  await tx.characterLanguage.deleteMany({
    where: {
      characterId,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
    },
  });

  const fixedLanguageIndexSet = new Set(fixedLanguageIndexes);
  const selectedLanguageRows = speciesLanguageChoices
    .filter((choice) => !fixedLanguageIndexSet.has(choice.selectedIndex))
    .map((choice) => ({
      characterId,
      languageIndex: choice.selectedIndex,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: choice.sourceIndex,
    }));
  const languageRows = [
    ...fixedLanguageIndexes.map((languageIndex) => ({
      characterId,
      languageIndex,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: `${speciesIndex}:fixed:${languageIndex}`,
    })),
    ...selectedLanguageRows,
  ];

  if (languageRows.length > 0) {
    await tx.characterLanguage.createMany({
      data: languageRows,
      skipDuplicates: true,
    });
  }
}

async function replaceSpeciesHeritageChoices(
  tx: Prisma.TransactionClient,
  characterId: string,
  speciesIndex: string,
  choices: CharacterChoiceInput[] | undefined,
) {
  const speciesHeritageChoices = normalizeSpeciesHeritageChoices(choices, speciesIndex);
  const selectedSubspeciesIndexes = [
    ...new Set(speciesHeritageChoices.map((choice) => choice.selectedIndex)),
  ];

  if (selectedSubspeciesIndexes.length > 0) {
    const subspecies = await tx.refSubspecies.findMany({
      where: {
        index: {
          in: selectedSubspeciesIndexes,
        },
        speciesIndex,
      },
      select: {
        index: true,
      },
    });
    const existingSubspeciesIndexes = new Set(
      subspecies.map((subspeciesOption: ReferenceIndexOnly) => subspeciesOption.index),
    );
    const missingSubspeciesIndexes = selectedSubspeciesIndexes.filter(
      (subspeciesIndex) => !existingSubspeciesIndexes.has(subspeciesIndex),
    );

    if (missingSubspeciesIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Species heritage not found");
    }
  }

  await tx.characterChoice.deleteMany({
    where: {
      characterId,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      choiceType: SPECIES_HERITAGE_CHOICE_TYPE,
    },
  });

  if (speciesHeritageChoices.length > 0) {
    await tx.characterChoice.createMany({
      data: speciesHeritageChoices.map((choice) => ({
        characterId,
        choiceType: choice.choiceType,
        sourceType: choice.sourceType,
        sourceIndex: choice.sourceIndex,
        selectedType: choice.selectedType,
        selectedIndex: choice.selectedIndex,
      })),
    });
  }
}

async function findAllowedClassSkillChoiceProficiencyIndexes(
  tx: Prisma.TransactionClient,
  classIndex: string,
) {
  const choices = await tx.refClassSkillChoice.findMany({
    where: {
      classIndex,
    },
    include: {
      options: {
        select: {
          proficiencyIndex: true,
        },
      },
    },
  });

  return new Set(
    choices.flatMap((choice: ClassSkillChoiceWithOptions) =>
      choice.options.map((option: ClassSkillChoiceWithOptions["options"][number]) =>
        option.proficiencyIndex,
      ),
    ),
  );
}

function getSkillIndexesFromProficiencyIndexes(proficiencyIndexes: string[]) {
  return proficiencyIndexes
    .map(skillIndexFromProficiencyIndex)
    .filter((skillIndex): skillIndex is string => Boolean(skillIndex));
}

async function getClassProficiencyGrantIndexes(
  tx: Prisma.TransactionClient,
  classIndex: string,
  sourceJson: unknown,
) {
  const classProficiencyGrants: ClassProficiencyGrantIndex[] = await tx.refClassProficiencyGrant.findMany({
    where: {
      classIndex,
    },
    select: {
      proficiencyIndex: true,
    },
  });

  if (classProficiencyGrants.length > 0) {
    return [...new Set(classProficiencyGrants.map((grant: ClassProficiencyGrantIndex) => grant.proficiencyIndex))];
  }

  return getClassSavingThrowProficiencyIndexes(sourceJson);
}

async function getBackgroundProficiencyGrantIndexes(
  tx: Prisma.TransactionClient,
  backgroundIndex: string,
) {
  const backgroundProficiencyGrants: BackgroundProficiencyGrantIndex[] =
    await tx.refBackgroundProficiencyGrant.findMany({
      where: {
        backgroundIndex,
      },
      select: {
        proficiencyIndex: true,
      },
    });

  return [
    ...new Set(
      backgroundProficiencyGrants.map(
        (grant: BackgroundProficiencyGrantIndex) => grant.proficiencyIndex,
      ),
    ),
  ];
}

async function findAllCharactersForUser(userId: string) {
  const characters = await prisma.character.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      species: {
        include: {
          traits: true,
          sizeOptions: true,
          subspecies: true,
        },
      },
      class: true,
      background: {
        include: {
          proficiencyGrants: {
            include: {
              proficiency: true,
            },
          },
          abilityOptions: {
            include: {
              abilityScore: true,
            },
          },
          featGrants: true,
        },
      },
      abilityScores: {
        include: {
          ability: true,
        },
      },
      skills: {
        orderBy: {
          skillIndex: "asc",
        },
        include: {
          skill: {
            include: {
              ability: true,
            },
          },
        },
      },
      proficiencies: {
        include: {
          proficiency: true,
        },
      },
      inventory: {
        include: {
          equipment: true,
        },
      },
      choices: true,
      featureChoices: {
        orderBy: [
          {
            sourceType: "asc",
          },
          {
            sourceIndex: "asc",
          },
          {
            choicePath: "asc",
          },
        ],
      },
      languages: {
        orderBy: {
          languageIndex: "asc",
        },
        include: {
          language: true,
        },
      },
      conditions: {
        orderBy: {
          appliedAt: "asc",
        },
        include: {
          condition: true,
        },
      },
      hitPointState: true,
      diceRolls: {
        orderBy: {
          rolledAt: "desc",
        },
        take: 5,
      },
    },
  });

  return attachCharacterRuntimeStates(prisma, characters);
}

async function createCharacterForUser(userId: string, data: CreateCharacterData) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [species, characterClass, background, skills, selectedProficiencies] =
      await Promise.all([
        tx.refSpecies.findUnique({
          where: {
            index: data.speciesIndex,
          },
        }),
        tx.refClass.findUnique({
          where: {
            index: data.classIndex,
          },
        }),
        tx.refBackground.findUnique({
          where: {
            index: data.backgroundIndex,
          },
        }),
        tx.refSkill.findMany(),
        tx.refProficiency.findMany({
          where: {
            index: {
              in: data.skillIndexes.map((skillIndex) => `skill-${skillIndex}`),
            },
          },
        }),
      ]);

    if (!species) {
      throw new CharacterReferenceNotFoundError("Species not found");
    }

    if (!characterClass) {
      throw new CharacterReferenceNotFoundError("Class not found");
    }

    if (!background) {
      throw new CharacterReferenceNotFoundError("Background not found");
    }

    const existingSkillIndexes = new Set(
      skills.map((skill: ReferenceIndexRecord) => skill.index),
    );
    const invalidSkillIndexes = data.skillIndexes.filter(
      (skillIndex) => !existingSkillIndexes.has(skillIndex),
    );

    if (invalidSkillIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Skill not found");
    }

    const classSkillChoices = normalizeClassSkillChoices(data.choices, characterClass.index);
    const classChoiceFeatureProficiencyIndexes = getClassChoiceFeatureProficiencyIndexes(
      data.featureChoices,
      characterClass.index,
    );
    const allowedClassSkillChoiceProficiencyIndexes =
      await findAllowedClassSkillChoiceProficiencyIndexes(tx, characterClass.index);
    const invalidClassSkillChoices = classSkillChoices.filter(
      (choice) => !allowedClassSkillChoiceProficiencyIndexes.has(choice.selectedIndex),
    );

    if (invalidClassSkillChoices.length > 0) {
      throw new CharacterReferenceNotFoundError("Class skill choice not found");
    }

    const classSkillChoiceProficiencyIndexes = [
      ...new Set([
        ...classSkillChoices.map((choice) => choice.selectedIndex),
        ...classChoiceFeatureProficiencyIndexes,
      ]),
    ];
    const classSkillChoiceProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classSkillChoiceProficiencyIndexes,
        },
      },
    });
    const backgroundAbilityChoices = normalizeBackgroundAbilityChoices(
      data.choices,
      background.index,
    );
    const supportedBackgroundAbilityIndexes = await validateBackgroundAbilityChoices(
      tx,
      background.index,
      backgroundAbilityChoices,
    );
    const backgroundAbilityBonuses = getBackgroundAbilityBonuses(
      backgroundAbilityChoices,
      supportedBackgroundAbilityIndexes,
    );
    const abilityScores = abilityScoreRows(data, backgroundAbilityBonuses);
    const abilityScoreByIndex = new Map(
      abilityScores.map((abilityScore) => [abilityScore.abilityIndex, abilityScore.score]),
    );
    const dexModifier = getAbilityModifier(abilityScoreByIndex.get("dex") ?? data.abilityScores.dex);
    const constitutionScore = abilityScoreByIndex.get("con") ?? data.abilityScores.con;
    const classProficiencyGrantIndexes = await getClassProficiencyGrantIndexes(
      tx,
      characterClass.index,
      characterClass.sourceJson,
    );
    const classGrantedProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classProficiencyGrantIndexes,
        },
      },
    });
    const backgroundProficiencyGrantIndexes = await getBackgroundProficiencyGrantIndexes(
      tx,
      background.index,
    );
    const backgroundGrantedProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: backgroundProficiencyGrantIndexes,
        },
      },
    });
    const selectedManualProficiencies = selectedProficiencies.filter(
      (proficiency: ReferenceIndexRecord) =>
        !classSkillChoiceProficiencyIndexes.includes(proficiency.index),
    );
    const finalSkillIndexes = new Set([
      ...data.skillIndexes,
      ...getSkillIndexesFromProficiencyIndexes(backgroundProficiencyGrantIndexes),
      ...getSkillIndexesFromProficiencyIndexes(classProficiencyGrantIndexes),
      ...getSkillIndexesFromProficiencyIndexes(classSkillChoiceProficiencyIndexes),
    ]);
    const level = data.level ?? 1;
    const subclassIndex = await normalizeSubclassIndex(
      tx,
      characterClass.index,
      characterClass.sourceJson,
      data.subclassIndex,
    );
    const featureBonusHp = getFeatureChoiceHitPointBonus(data.featureChoices, level);
    const hitPointState = normalizeHitPointStateInput({
      constitutionScore,
      data: data.hitPointState,
      featureBonusHp,
      hitDie: characterClass.hitDie,
      level,
    });
    const spellcastingState = normalizeSpellcastingStateInput({
      data: data.spellcastingState,
    });
    const resourceState = normalizeResourceStateInput({
      data: data.resourceState,
    });
    const currentHp =
      data.currentHp === undefined
        ? hitPointState.maxHp
        : Math.max(0, Math.min(hitPointState.maxHp, Math.floor(data.currentHp)));

    const character = await tx.character.create({
      data: {
        userId,
        name: data.name,
        speciesIndex: data.speciesIndex,
        classIndex: data.classIndex,
        subclassIndex,
        backgroundIndex: data.backgroundIndex,
        level,
        experiencePoints: 0,
        alignment: data.alignment,
        maxHp: hitPointState.maxHp,
        currentHp,
        armorClass: 10 + dexModifier,
        speed: species.baseSpeed,
        hitPointState: {
          create: {
            calculationMode: hitPointState.calculationMode,
            bonusHp: hitPointState.bonusHp,
            overrideMaxHp: hitPointState.overrideMaxHp,
            rolledHitPoints: hitPointState.rolledHitPoints,
            tempHp: hitPointState.tempHp,
          },
        },
        abilityScores: {
          create: abilityScores,
        },
        skills: {
          create: skills.map((skill: ReferenceIndexRecord) => ({
            skillIndex: skill.index,
            isProficient: finalSkillIndexes.has(skill.index),
            customBonus: 0,
          })),
        },
        proficiencies: {
          create: [
            ...selectedManualProficiencies.map((proficiency: ReferenceIndexRecord) => ({
              proficiencyIndex: proficiency.index,
              sourceType: "manual",
            })),
            ...classGrantedProficiencies.map(
              (proficiency: ReferenceIndexRecord) => ({
                proficiencyIndex: proficiency.index,
                sourceType: "class",
              }),
            ),
            ...backgroundGrantedProficiencies.map(
              (proficiency: ReferenceIndexRecord) => ({
                proficiencyIndex: proficiency.index,
                sourceType: "background",
              }),
            ),
            ...classSkillChoiceProficiencies.map(
              (proficiency: ReferenceIndexRecord) => ({
                proficiencyIndex: proficiency.index,
                sourceType: CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE,
              }),
            ),
          ],
        },
        choices: {
          create: classSkillChoices.map((choice) => ({
            choiceType: choice.choiceType,
            sourceType: choice.sourceType,
            sourceIndex: choice.sourceIndex,
            selectedType: choice.selectedType,
            selectedIndex: choice.selectedIndex,
          })),
        },
      },
    });

    await upsertCharacterSpellcastingState(tx, character.id, spellcastingState);
    await upsertCharacterResourceState(tx, character.id, resourceState);

    await replaceSpeciesLanguageChoicesAndRows(
      tx,
      character.id,
      species.index,
      species.sourceJson,
      data.choices,
    );
    await replaceSpeciesHeritageChoices(
      tx,
      character.id,
      species.index,
      data.choices,
    );
    await replaceBackgroundAbilityChoices(
      tx,
      character.id,
      backgroundAbilityChoices,
    );
    await validateFeatureChoiceSelections(tx, data, {
      backgroundSourceJson: background.sourceJson,
      characterLevel: level,
      classSourceJson: characterClass.sourceJson,
      subclassIndex,
      speciesSourceJson: species.sourceJson,
    });
    await deleteStaleFeatureChoiceSelections(tx, character.id, {
      ...data,
      level,
      subclassIndex,
    });
    await upsertSubmittedFeatureChoiceSelections(
      tx,
      character.id,
      data.featureChoices,
    );

    const savedCharacter = await tx.character.findUnique({
      where: {
        id: character.id,
      },
      include: characterInclude,
    });

    return attachCharacterRuntimeState(tx, savedCharacter);
  });
}

async function updateCharacterForUser(
  userId: string,
  characterId: string,
  data: CharacterMutationData,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingCharacter = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      include: {
        hitPointState: true,
      },
    });

    if (!existingCharacter) {
      return null;
    }

    const existingSpellcastingState = await findSpellcastingStateForCharacter(tx, characterId);
    const existingResourceState = await findResourceStateForCharacter(tx, characterId);

    const [
      species,
      characterClass,
      background,
      skills,
      selectedProficiencies,
    ] =
      await Promise.all([
        tx.refSpecies.findUnique({
          where: {
            index: data.speciesIndex,
          },
        }),
        tx.refClass.findUnique({
          where: {
            index: data.classIndex,
          },
        }),
        tx.refBackground.findUnique({
          where: {
            index: data.backgroundIndex,
          },
        }),
        tx.refSkill.findMany(),
        tx.refProficiency.findMany({
          where: {
            index: {
              in: data.skillIndexes.map((skillIndex) => `skill-${skillIndex}`),
            },
          },
        }),
      ]);

    if (!species) {
      throw new CharacterReferenceNotFoundError("Species not found");
    }

    if (!characterClass) {
      throw new CharacterReferenceNotFoundError("Class not found");
    }

    if (!background) {
      throw new CharacterReferenceNotFoundError("Background not found");
    }

    const existingSkillIndexes = new Set(
      skills.map((skill: ReferenceIndexRecord) => skill.index),
    );
    const invalidSkillIndexes = data.skillIndexes.filter(
      (skillIndex) => !existingSkillIndexes.has(skillIndex),
    );

    if (invalidSkillIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Skill not found");
    }

    const backgroundAbilityChoices = normalizeBackgroundAbilityChoices(
      data.choices,
      background.index,
    );
    const supportedBackgroundAbilityIndexes = await validateBackgroundAbilityChoices(
      tx,
      background.index,
      backgroundAbilityChoices,
    );
    const backgroundAbilityBonuses = getBackgroundAbilityBonuses(
      backgroundAbilityChoices,
      supportedBackgroundAbilityIndexes,
    );
    const abilityScores = abilityScoreRows(data, backgroundAbilityBonuses);
    const abilityScoreByIndex = new Map(
      abilityScores.map((abilityScore) => [abilityScore.abilityIndex, abilityScore.score]),
    );
    const dexModifier = getAbilityModifier(abilityScoreByIndex.get("dex") ?? data.abilityScores.dex);
    const constitutionScore = abilityScoreByIndex.get("con") ?? data.abilityScores.con;
    const classSkillChoices = normalizeClassSkillChoices(data.choices, characterClass.index);
    const classChoiceFeatureProficiencyIndexes = getClassChoiceFeatureProficiencyIndexes(
      data.featureChoices,
      characterClass.index,
    );
    const allowedClassSkillChoiceProficiencyIndexes =
      await findAllowedClassSkillChoiceProficiencyIndexes(tx, characterClass.index);
    const invalidClassSkillChoices = classSkillChoices.filter(
      (choice) => !allowedClassSkillChoiceProficiencyIndexes.has(choice.selectedIndex),
    );

    if (invalidClassSkillChoices.length > 0) {
      throw new CharacterReferenceNotFoundError("Class skill choice not found");
    }

    const classSkillChoiceProficiencyIndexes = [
      ...new Set([
        ...classSkillChoices.map((choice) => choice.selectedIndex),
        ...classChoiceFeatureProficiencyIndexes,
      ]),
    ];
    const classSkillChoiceProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classSkillChoiceProficiencyIndexes,
        },
      },
    });
    const classProficiencyGrantIndexes = await getClassProficiencyGrantIndexes(
      tx,
      characterClass.index,
      characterClass.sourceJson,
    );
    const classGrantedProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classProficiencyGrantIndexes,
        },
      },
    });
    const backgroundProficiencyGrantIndexes = await getBackgroundProficiencyGrantIndexes(
      tx,
      background.index,
    );
    const backgroundGrantedProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: backgroundProficiencyGrantIndexes,
        },
      },
    });
    const finalSkillIndexes = new Set([
      ...data.skillIndexes,
      ...getSkillIndexesFromProficiencyIndexes(backgroundProficiencyGrantIndexes),
      ...getSkillIndexesFromProficiencyIndexes(classProficiencyGrantIndexes),
      ...getSkillIndexesFromProficiencyIndexes(classSkillChoiceProficiencyIndexes),
    ]);
    const level = data.level ?? existingCharacter.level;
    const requestedSubclassIndex =
      data.subclassIndex === undefined && existingCharacter.classIndex === data.classIndex
        ? existingCharacter.subclassIndex
        : data.subclassIndex ?? null;
    const subclassIndex = await normalizeSubclassIndex(
      tx,
      characterClass.index,
      characterClass.sourceJson,
      requestedSubclassIndex,
    );
    const featureBonusHp = getFeatureChoiceHitPointBonus(data.featureChoices, level);
    const hitPointState = normalizeHitPointStateInput({
      constitutionScore,
      data: data.hitPointState,
      featureBonusHp,
      fallback: existingCharacter.hitPointState,
      hitDie: characterClass.hitDie,
      level,
    });
    const spellcastingState = normalizeSpellcastingStateInput({
      data: data.spellcastingState,
      fallback: existingSpellcastingState,
    });
    const resourceState = normalizeResourceStateInput({
      data: data.resourceState,
      fallback: existingResourceState,
    });
    const requestedCurrentHp = data.currentHp ?? existingCharacter.currentHp;
    const currentHp = Math.max(
      0,
      Math.min(hitPointState.maxHp, Math.floor(requestedCurrentHp)),
    );

    await tx.character.update({
      where: {
        id: characterId,
      },
      data: {
        name: data.name,
        speciesIndex: data.speciesIndex,
        classIndex: data.classIndex,
        subclassIndex,
        backgroundIndex: data.backgroundIndex,
        level,
        alignment: data.alignment,
        maxHp: hitPointState.maxHp,
        currentHp,
        armorClass: 10 + dexModifier,
        speed: species.baseSpeed,
      },
    });

    await tx.characterHitPointState.upsert({
      where: {
        characterId,
      },
      update: {
        calculationMode: hitPointState.calculationMode,
        bonusHp: hitPointState.bonusHp,
        overrideMaxHp: hitPointState.overrideMaxHp,
        rolledHitPoints: hitPointState.rolledHitPoints,
        tempHp: hitPointState.tempHp,
      },
      create: {
        characterId,
        calculationMode: hitPointState.calculationMode,
        bonusHp: hitPointState.bonusHp,
        overrideMaxHp: hitPointState.overrideMaxHp,
        rolledHitPoints: hitPointState.rolledHitPoints,
        tempHp: hitPointState.tempHp,
      },
    });

    await upsertCharacterSpellcastingState(tx, characterId, spellcastingState);
    await upsertCharacterResourceState(tx, characterId, resourceState);

    await Promise.all(
      abilityScores.map((abilityScore) =>
        tx.characterAbilityScore.upsert({
          where: {
            characterId_abilityIndex: {
              characterId,
              abilityIndex: abilityScore.abilityIndex,
            },
          },
          update: {
            baseScore: abilityScore.baseScore,
            score: abilityScore.score,
          },
          create: {
            characterId,
            abilityIndex: abilityScore.abilityIndex,
            baseScore: abilityScore.baseScore,
            score: abilityScore.score,
          },
        }),
      ),
    );

    await Promise.all(
      skills.map((skill: ReferenceIndexRecord) =>
        tx.characterSkill.upsert({
          where: {
            characterId_skillIndex: {
              characterId,
              skillIndex: skill.index,
            },
          },
          update: {
            isProficient: finalSkillIndexes.has(skill.index),
          },
          create: {
            characterId,
            skillIndex: skill.index,
            isProficient: finalSkillIndexes.has(skill.index),
            customBonus: 0,
          },
        }),
      ),
    );

    await tx.characterChoice.deleteMany({
      where: {
        characterId,
        sourceType: CLASS_CHOICE_SOURCE_TYPE,
        choiceType: CLASS_SKILL_CHOICE_TYPE,
      },
    });

    if (classSkillChoices.length > 0) {
      await tx.characterChoice.createMany({
        data: classSkillChoices.map((choice) => ({
          characterId,
          choiceType: choice.choiceType,
          sourceType: choice.sourceType,
          sourceIndex: choice.sourceIndex,
          selectedType: choice.selectedType,
          selectedIndex: choice.selectedIndex,
        })),
      });
    }

    await replaceSpeciesLanguageChoicesAndRows(
      tx,
      characterId,
      species.index,
      species.sourceJson,
      data.choices,
    );
    await replaceSpeciesHeritageChoices(
      tx,
      characterId,
      species.index,
      data.choices,
    );
    await replaceBackgroundAbilityChoices(
      tx,
      characterId,
      backgroundAbilityChoices,
    );
    await validateFeatureChoiceSelections(tx, data, {
      backgroundSourceJson: background.sourceJson,
      characterLevel: level,
      classSourceJson: characterClass.sourceJson,
      subclassIndex,
      speciesSourceJson: species.sourceJson,
    });
    await deleteStaleFeatureChoiceSelections(tx, characterId, {
      ...data,
      level,
      subclassIndex,
    });
    await upsertSubmittedFeatureChoiceSelections(
      tx,
      characterId,
      data.featureChoices,
    );

    await tx.characterProficiency.deleteMany({
      where: {
        characterId,
        OR: [
          {
            sourceType: "class",
          },
          {
            sourceType: "background",
          },
          {
            sourceType: CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE,
          },
          {
            sourceType: "manual",
            proficiencyIndex: {
              startsWith: "skill-",
            },
          },
        ],
      },
    });

    if (selectedProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: selectedProficiencies.map((proficiency: ReferenceIndexRecord) => ({
          characterId,
          proficiencyIndex: proficiency.index,
          sourceType: "manual",
        })),
        skipDuplicates: true,
      });
    }

    if (classSkillChoiceProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: classSkillChoiceProficiencies.map(
          (proficiency: ReferenceIndexRecord) => ({
            characterId,
            proficiencyIndex: proficiency.index,
            sourceType: CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE,
          }),
        ),
        skipDuplicates: true,
      });
    }

    if (classGrantedProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: classGrantedProficiencies.map(
          (proficiency: ReferenceIndexRecord) => ({
            characterId,
            proficiencyIndex: proficiency.index,
            sourceType: "class",
          }),
        ),
        skipDuplicates: true,
      });
    }

    if (backgroundGrantedProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: backgroundGrantedProficiencies.map(
          (proficiency: ReferenceIndexRecord) => ({
            characterId,
            proficiencyIndex: proficiency.index,
            sourceType: "background",
          }),
        ),
        skipDuplicates: true,
      });
    }

    await tx.characterChoice.deleteMany({
      where: {
        characterId,
        sourceType: "class-feature",
      },
    });

    const updatedCharacter = await tx.character.findUnique({
      where: {
        id: characterId,
      },
      include: characterInclude,
    });

    return attachCharacterRuntimeState(tx, updatedCharacter);
  });
}

async function deleteCharacterForUser(userId: string, id: string) {
  const result = await prisma.character.deleteMany({
    where: {
      id,
      userId,
    },
  });

  return result.count > 0;
}

async function findCharacterByIdForUser(userId: string, characterId: string) {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    include: characterInclude,
  });

  return attachCharacterRuntimeState(prisma, character);
}

async function createDiceRollForCharacterForUser(
  userId: string,
  characterId: string,
  data: CharacterDiceRollInput,
) {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!character) {
    return null;
  }

  return prisma.diceRoll.create({
    data: {
      characterId: character.id,
      formula: data.formula,
      modifier: data.modifier ?? 0,
      reason: data.reason ?? null,
      rolledByUserId: userId,
      rollMode: data.rollMode ?? "normal",
      rollType: data.rollType,
      rollValues: data.rollValues,
      targetIndex: data.targetIndex ?? null,
      targetType: data.targetType ?? null,
      total: data.total,
      visibility: data.visibility ?? "private",
    },
  });
}

async function addConditionToCharacterForUser(
  userId: string,
  characterId: string,
  conditionIndex: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [character, condition] = await Promise.all([
      tx.character.findFirst({
        where: {
          id: characterId,
          userId,
        },
        select: {
          id: true,
        },
      }),
      tx.refCondition.findUnique({
        where: {
          index: conditionIndex,
        },
        select: {
          index: true,
        },
      }),
    ]);

    if (!character) {
      return null;
    }

    if (!condition) {
      throw new CharacterReferenceNotFoundError("Condition not found");
    }

    await tx.characterCondition.upsert({
      where: {
        characterId_conditionIndex: {
          characterId,
          conditionIndex,
        },
      },
      update: {},
      create: {
        characterId,
        conditionIndex,
      },
    });

    const updatedCharacter = await tx.character.findUnique({
      where: {
        id: characterId,
      },
      include: characterInclude,
    });

    return attachCharacterRuntimeState(tx, updatedCharacter);
  });
}

async function removeConditionFromCharacterForUser(
  userId: string,
  characterId: string,
  conditionIndex: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const character = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!character) {
      return null;
    }

    await tx.characterCondition.deleteMany({
      where: {
        characterId,
        conditionIndex,
      },
    });

    const updatedCharacter = await tx.character.findUnique({
      where: {
        id: characterId,
      },
      include: characterInclude,
    });

    return attachCharacterRuntimeState(tx, updatedCharacter);
  });
}

async function findCharacterInventoryForUser(userId: string, characterId: string) {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    select: {
      id: true,
      inventory: {
        include: {
          equipment: true,
        },
      },
    },
  });

  return character?.inventory ?? null;
}

async function replaceCharacterInventoryForUser(
  userId: string,
  characterId: string,
  inventoryItems: CharacterInventoryMutationItem[],
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const character = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!character) {
      return null;
    }

    const equipmentIndexes = [...new Set(inventoryItems.map((item) => item.equipmentIndex))];
    const existingEquipment = await tx.refEquipment.findMany({
      where: {
        index: {
          in: equipmentIndexes,
        },
      },
      select: {
        index: true,
      },
    });
    const existingEquipmentIndexes = new Set(existingEquipment.map((equipment) => equipment.index));
    const missingEquipmentIndex = equipmentIndexes.find(
      (equipmentIndex) => !existingEquipmentIndexes.has(equipmentIndex),
    );

    if (missingEquipmentIndex) {
      throw new CharacterReferenceNotFoundError(`Equipment not found: ${missingEquipmentIndex}`);
    }

    await tx.characterInventory.deleteMany({
      where: {
        characterId,
      },
    });

    if (inventoryItems.length > 0) {
      await tx.characterInventory.createMany({
        data: inventoryItems.map((item) => ({
          characterId,
          customName: item.customName?.trim() || null,
          equipped: item.equipped,
          equipmentIndex: item.equipmentIndex,
          gridX: item.gridX ?? null,
          gridY: item.gridY ?? null,
          notes: item.notes?.trim() || null,
          quantity: item.quantity,
        })),
      });
    }

    return tx.characterInventory.findMany({
      where: {
        characterId,
      },
      include: {
        equipment: true,
      },
    });
  });
}

async function replaceCharacterInventoryAndStateForUser(
  userId: string,
  characterId: string,
  inventoryItems: CharacterInventoryMutationItem[],
  stateCode: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const character = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!character) {
      return null;
    }

    const equipmentIndexes = [...new Set(inventoryItems.map((item) => item.equipmentIndex))];
    const existingEquipment = await tx.refEquipment.findMany({
      where: {
        index: {
          in: equipmentIndexes,
        },
      },
      select: {
        index: true,
      },
    });
    const existingEquipmentIndexes = new Set(existingEquipment.map((equipment) => equipment.index));
    const missingEquipmentIndex = equipmentIndexes.find(
      (equipmentIndex) => !existingEquipmentIndexes.has(equipmentIndex),
    );

    if (missingEquipmentIndex) {
      throw new CharacterReferenceNotFoundError(`Equipment not found: ${missingEquipmentIndex}`);
    }

    await tx.characterInventory.deleteMany({
      where: {
        characterId,
      },
    });

    if (inventoryItems.length > 0) {
      await tx.characterInventory.createMany({
        data: inventoryItems.map((item) => ({
          characterId,
          customName: item.customName?.trim() || null,
          equipped: item.equipped,
          equipmentIndex: item.equipmentIndex,
          gridX: item.gridX ?? null,
          gridY: item.gridY ?? null,
          notes: item.notes?.trim() || null,
          quantity: item.quantity,
        })),
      });
    }

    const inventoryState = await tx.characterInventoryState.upsert({
      where: {
        characterId,
      },
      update: {
        stateCode,
      },
      create: {
        characterId,
        stateCode,
      },
    });
    const inventory = await tx.characterInventory.findMany({
      where: {
        characterId,
      },
      include: {
        equipment: true,
      },
    });

    return {
      inventory,
      inventoryState,
    };
  });
}

async function findCharacterInventoryStateForUser(userId: string, characterId: string) {
  const character = await prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    select: {
      id: true,
      inventoryState: true,
    },
  });

  if (!character) {
    return null;
  }

  return character.inventoryState;
}

async function saveCharacterInventoryStateForUser(
  userId: string,
  characterId: string,
  stateCode: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const character = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!character) {
      return null;
    }

    return tx.characterInventoryState.upsert({
      where: {
        characterId,
      },
      update: {
        stateCode,
      },
      create: {
        characterId,
        stateCode,
      },
    });
  });
}

export {
  addConditionToCharacterForUser,
  abilityScoreRows,
  calculateMaxHp,
  canonicalAbilityScoreIndex,
  CharacterReferenceNotFoundError,
  collectChoiceOptionReferences,
  createCharacterForUser,
  createDiceRollForCharacterForUser,
  deleteCharacterForUser,
  findAllCharactersForUser,
  findCharacterByIdForUser,
  findCharacterInventoryForUser,
  findCharacterInventoryStateForUser,
  getAbilityModifier,
  getBackgroundAbilityBonuses,
  getClassFeatureAbilityBonuses,
  getClassFeatureAbilityMaximums,
  getClassChoiceFeatureProficiencyIndexes,
  getClassSavingThrowProficiencyIndexes,
  getFeatureChoiceGrantedProficiencyIndexes,
  getFeatureChoiceAbilityBonuses,
  getFeatureChoiceHitPointBonus,
  getFixedSpeciesLanguageIndexes,
  getValueAtChoicePath,
  isAbilityScoreImprovementChoiceKey,
  isFeatFeatureChoiceSelection,
  mergeAbilityBonuses,
  normalizeBackgroundAbilityChoices,
  normalizeClassSkillChoices,
  normalizeChoiceGrantedProficiencyIndex,
  normalizeFeatureChoiceFeatIndex,
  normalizeHitPointMode,
  normalizeHitPointRolls,
  normalizeHitPointStateInput,
  normalizeInteger,
  normalizeSpeciesHeritageChoices,
  normalizeSpeciesLanguageChoices,
  rawChoiceOptionMatchesSelection,
  removeConditionFromCharacterForUser,
  replaceCharacterInventoryForUser,
  replaceCharacterInventoryAndStateForUser,
  saveCharacterInventoryStateForUser,
  updateCharacterForUser,
  validateBackgroundAbilityChoices,
  validateChoicePathSelection,
  validateFeatureChoiceSelections,
};
export type {
  CharacterChoiceInput,
  CharacterFeatureChoiceSelectionInput,
  CharacterInventoryMutationItem,
  CharacterMutationData,
  CreateCharacterData,
};
