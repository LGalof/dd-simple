import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  addConditionToCharacterForUser,
  CharacterReferenceNotFoundError,
  createCharacterForUser,
  deleteCharacterForUser,
  findAllCharactersForUser,
  findCharacterByIdForUser,
  findCharacterInventoryForUser,
  findCharacterInventoryStateForUser,
  removeConditionFromCharacterForUser,
  replaceCharacterInventoryForUser,
  saveCharacterInventoryStateForUser,
  updateCharacterForUser,
  type CharacterInventoryMutationItem,
} from "../services/character.service.js";
import { findCharacterActionsForUser } from "../services/character-actions.service.js";
import { findCharacterDefensesForUser } from "../services/character-defenses.service.js";
import { findCharacterDerivedStateForUser } from "../services/character-effects.service.js";

const ABILITY_SCORE_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

type AbilityScoreKey = (typeof ABILITY_SCORE_KEYS)[number];
type AbilityScoreRequestBody = Record<AbilityScoreKey, number>;

type CharacterMutationRequestBody = {
  name?: unknown;
  speciesIndex?: unknown;
  classIndex?: unknown;
  subclassIndex?: unknown;
  backgroundIndex?: unknown;
  alignment?: unknown;
  level?: unknown;
  currentHp?: unknown;
  hitPointState?: unknown;
  skillIndexes?: unknown;
  choices?: unknown;
  featureChoices?: unknown;
  abilityScores?: unknown;
};

type CharacterChoiceRequestBody = {
  choiceType?: unknown;
  sourceType?: unknown;
  sourceIndex?: unknown;
  selectedType?: unknown;
  selectedIndex?: unknown;
};

type FeatureChoiceSelectionRequestBody = {
  sourceType?: unknown;
  sourceIndex?: unknown;
  classIndex?: unknown;
  subclassIndex?: unknown;
  level?: unknown;
  featureIndex?: unknown;
  choicePath?: unknown;
  choiceKey?: unknown;
  choiceLabel?: unknown;
  selectedOptionType?: unknown;
  selectedOptionIndex?: unknown;
  selectedOptionName?: unknown;
  selectedOptionUrl?: unknown;
  selectedRawJson?: unknown;
  grantsRawJson?: unknown;
};

type AddConditionRequestBody = {
  conditionIndex?: unknown;
};

type InventoryMutationRequestBody = {
  items?: unknown;
};

type InventoryStateRequestBody = {
  stateCode?: unknown;
};

type InventoryMutationItemRequestBody = {
  customName?: unknown;
  equipped?: unknown;
  equipmentIndex?: unknown;
  gridX?: unknown;
  gridY?: unknown;
  notes?: unknown;
  quantity?: unknown;
};

type HitPointStateRequestBody = {
  calculationMode?: unknown;
  bonusHp?: unknown;
  overrideMaxHp?: unknown;
  rolledHitPoints?: unknown;
  tempHp?: unknown;
};

type ValidHitPointStateRequestBody = {
  calculationMode: "fixed" | "rolled" | "override";
  bonusHp: number;
  overrideMaxHp: number | null;
  rolledHitPoints: number[];
  tempHp: number;
};

type ValidCharacterChoiceRequestBody = {
  choiceType: string;
  sourceType: string;
  sourceIndex: string;
  selectedType: string;
  selectedIndex: string;
};

type ValidFeatureChoiceSelectionRequestBody = {
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

type ValidCharacterMutationRequestBody = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  subclassIndex?: string | null;
  backgroundIndex: string;
  alignment?: string | null;
  level?: number;
  currentHp?: number;
  hitPointState?: ValidHitPointStateRequestBody;
  skillIndexes: string[];
  choices?: ValidCharacterChoiceRequestBody[];
  featureChoices?: ValidFeatureChoiceSelectionRequestBody[];
  abilityScores: AbilityScoreRequestBody;
};

type CharacterPreviewOverrides = {
  backgroundIndex?: string;
  classIndex?: string;
  featIndexes?: string[];
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

function isAbilityScoresBody(value: unknown): value is AbilityScoreRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<Record<AbilityScoreKey, unknown>>;

  return ABILITY_SCORE_KEYS.every((key) => {
    const score = candidate[key];

    return (
      typeof score === "number" &&
      Number.isInteger(score) &&
      score >= 3 &&
      score <= 20
    );
  });
}

function isCharacterChoiceRequestBody(
  value: unknown,
): value is ValidCharacterChoiceRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as CharacterChoiceRequestBody;

  const isClassSkillChoice =
    candidate.choiceType === "class-skill-choice" &&
    candidate.sourceType === "class" &&
    typeof candidate.sourceIndex === "string" &&
    candidate.sourceIndex.trim().length > 0 &&
    candidate.selectedType === "skill" &&
    typeof candidate.selectedIndex === "string" &&
    candidate.selectedIndex.startsWith("skill-");
  const isSpeciesLanguageChoice =
    candidate.choiceType === "species-language-choice" &&
    candidate.sourceType === "species" &&
    typeof candidate.sourceIndex === "string" &&
    candidate.sourceIndex.trim().length > 0 &&
    candidate.selectedType === "language" &&
    typeof candidate.selectedIndex === "string" &&
    candidate.selectedIndex.trim().length > 0;
  const isSpeciesHeritageChoice =
    candidate.choiceType === "species-heritage-choice" &&
    candidate.sourceType === "species" &&
    typeof candidate.sourceIndex === "string" &&
    candidate.sourceIndex.trim().length > 0 &&
    candidate.selectedType === "subspecies" &&
    typeof candidate.selectedIndex === "string" &&
    candidate.selectedIndex.trim().length > 0;
  const isBackgroundAbilityPlanChoice =
    candidate.choiceType === "background-ability-plan" &&
    candidate.sourceType === "background" &&
    typeof candidate.sourceIndex === "string" &&
    candidate.sourceIndex.trim().length > 0 &&
    candidate.selectedType === "ability-plan" &&
    typeof candidate.selectedIndex === "string" &&
    candidate.selectedIndex.trim().length > 0;
  const isBackgroundAbilityScoreChoice =
    candidate.choiceType === "background-ability-score-choice" &&
    candidate.sourceType === "background" &&
    typeof candidate.sourceIndex === "string" &&
    candidate.sourceIndex.trim().length > 0 &&
    candidate.selectedType === "ability-score" &&
    typeof candidate.selectedIndex === "string" &&
    candidate.selectedIndex.trim().length > 0;

  return (
    isClassSkillChoice ||
    isSpeciesLanguageChoice ||
    isSpeciesHeritageChoice ||
    isBackgroundAbilityPlanChoice ||
    isBackgroundAbilityScoreChoice
  );
}

function isFeatureChoiceSelectionRequestBody(
  value: unknown,
): value is ValidFeatureChoiceSelectionRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as FeatureChoiceSelectionRequestBody;

  return (
    isNonEmptyString(candidate.sourceType) &&
    isNonEmptyString(candidate.sourceIndex) &&
    isOptionalString(candidate.classIndex) &&
    isOptionalString(candidate.subclassIndex) &&
    (candidate.level === undefined ||
      candidate.level === null ||
      (typeof candidate.level === "number" &&
        Number.isInteger(candidate.level) &&
        candidate.level >= 1 &&
        candidate.level <= 20)) &&
    isOptionalString(candidate.featureIndex) &&
    isNonEmptyString(candidate.choicePath) &&
    isOptionalString(candidate.choiceKey) &&
    isOptionalString(candidate.choiceLabel) &&
    isNonEmptyString(candidate.selectedOptionType) &&
    isOptionalString(candidate.selectedOptionIndex) &&
    isOptionalString(candidate.selectedOptionName) &&
    isOptionalString(candidate.selectedOptionUrl) &&
    "selectedRawJson" in candidate &&
    isJsonLikeValue(candidate.selectedRawJson) &&
    (candidate.grantsRawJson === undefined || isJsonLikeValue(candidate.grantsRawJson))
  );
}

function isValidFeatureChoiceSelectionArray(
  value: unknown,
): value is ValidFeatureChoiceSelectionRequestBody[] {
  if (!Array.isArray(value) || !value.every(isFeatureChoiceSelectionRequestBody)) {
    return false;
  }

  const logicalChoiceKeys = value.map((choice) =>
    [
      String(choice.sourceType).trim(),
      String(choice.sourceIndex).trim(),
      String(choice.choicePath).trim(),
    ].join("\u0000"),
  );

  return new Set(logicalChoiceKeys).size === logicalChoiceKeys.length;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function isJsonLikeValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (Array.isArray(value)) {
    return value.every(isJsonLikeValue);
  }

  if (typeof value === "object" && value !== null) {
    return Object.values(value).every(isJsonLikeValue);
  }

  return false;
}

function isHitPointStateRequestBody(value: unknown): value is ValidHitPointStateRequestBody {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as HitPointStateRequestBody;
  const hasValidMode =
    candidate.calculationMode === "fixed" ||
    candidate.calculationMode === "rolled" ||
    candidate.calculationMode === "override";
  const hasValidBonusHp =
    typeof candidate.bonusHp === "number" &&
    Number.isInteger(candidate.bonusHp) &&
    candidate.bonusHp >= -999 &&
    candidate.bonusHp <= 999;
  const hasValidOverride =
    candidate.overrideMaxHp === null ||
    (typeof candidate.overrideMaxHp === "number" &&
      Number.isInteger(candidate.overrideMaxHp) &&
      candidate.overrideMaxHp >= 1 &&
      candidate.overrideMaxHp <= 999);
  const hasValidRolls =
    Array.isArray(candidate.rolledHitPoints) &&
    candidate.rolledHitPoints.every(
      (roll) => typeof roll === "number" && Number.isInteger(roll) && roll >= 1 && roll <= 100,
    );
  const hasValidTempHp =
    typeof candidate.tempHp === "number" &&
    Number.isInteger(candidate.tempHp) &&
    candidate.tempHp >= 0 &&
    candidate.tempHp <= 999;

  return hasValidMode && hasValidBonusHp && hasValidOverride && hasValidRolls && hasValidTempHp;
}

function isCharacterMutationRequestBody(
  body: unknown,
): body is ValidCharacterMutationRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as CharacterMutationRequestBody;

  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.speciesIndex === "string" &&
    candidate.speciesIndex.trim().length > 0 &&
    typeof candidate.classIndex === "string" &&
    candidate.classIndex.trim().length > 0 &&
    isOptionalString(candidate.subclassIndex) &&
    typeof candidate.backgroundIndex === "string" &&
    candidate.backgroundIndex.trim().length > 0 &&
    (candidate.alignment === undefined ||
      candidate.alignment === null ||
      typeof candidate.alignment === "string") &&
    (candidate.level === undefined ||
      (typeof candidate.level === "number" &&
        Number.isInteger(candidate.level) &&
        candidate.level >= 1 &&
        candidate.level <= 20)) &&
    (candidate.currentHp === undefined ||
      (typeof candidate.currentHp === "number" &&
        Number.isInteger(candidate.currentHp) &&
        candidate.currentHp >= 0 &&
        candidate.currentHp <= 999)) &&
    (candidate.hitPointState === undefined ||
      isHitPointStateRequestBody(candidate.hitPointState)) &&
    Array.isArray(candidate.skillIndexes) &&
    candidate.skillIndexes.every((skillIndex) => typeof skillIndex === "string") &&
    (candidate.choices === undefined ||
      (Array.isArray(candidate.choices) &&
        candidate.choices.every(isCharacterChoiceRequestBody))) &&
    (candidate.featureChoices === undefined ||
      isValidFeatureChoiceSelectionArray(candidate.featureChoices)) &&
    isAbilityScoresBody(candidate.abilityScores)
  );
}

function normalizeFeatureChoiceSelections(
  featureChoices: ValidFeatureChoiceSelectionRequestBody[] | undefined,
) {
  return featureChoices?.map((choice) => ({
    sourceType: choice.sourceType.trim(),
    sourceIndex: choice.sourceIndex.trim(),
    classIndex: normalizeOptionalString(choice.classIndex),
    subclassIndex: normalizeOptionalString(choice.subclassIndex),
    level: choice.level ?? null,
    featureIndex: normalizeOptionalString(choice.featureIndex),
    choicePath: choice.choicePath.trim(),
    choiceKey: normalizeOptionalString(choice.choiceKey),
    choiceLabel: normalizeOptionalString(choice.choiceLabel),
    selectedOptionType: choice.selectedOptionType.trim(),
    selectedOptionIndex: normalizeOptionalString(choice.selectedOptionIndex),
    selectedOptionName: normalizeOptionalString(choice.selectedOptionName),
    selectedOptionUrl: normalizeOptionalString(choice.selectedOptionUrl),
    selectedRawJson: choice.selectedRawJson,
    grantsRawJson: choice.grantsRawJson ?? null,
  }));
}

function normalizeOptionalString(value: string | null | undefined) {
  if (value === undefined || value === null) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseCharacterPreviewOverrides(query: Request["query"]): CharacterPreviewOverrides {
  const backgroundIndex =
    typeof query.backgroundIndex === "string" && query.backgroundIndex.trim().length > 0
      ? query.backgroundIndex.trim()
      : undefined;
  const classIndex =
    typeof query.classIndex === "string" && query.classIndex.trim().length > 0
      ? query.classIndex.trim()
      : undefined;
  const featIndexes = parsePreviewFeatIndexes(query.featIndex);
  const speciesIndex =
    typeof query.speciesIndex === "string" && query.speciesIndex.trim().length > 0
      ? query.speciesIndex.trim()
      : undefined;
  const subspeciesIndex =
    typeof query.subspeciesIndex === "string" && query.subspeciesIndex.trim().length > 0
      ? query.subspeciesIndex.trim()
      : undefined;
  const subclassIndex =
    typeof query.subclassIndex === "string" && query.subclassIndex.trim().length > 0
      ? query.subclassIndex.trim()
      : undefined;
  const level =
    typeof query.level === "string" &&
    Number.isInteger(Number(query.level)) &&
    Number(query.level) >= 1 &&
    Number(query.level) <= 20
      ? Number(query.level)
      : undefined;

  return {
    backgroundIndex,
    classIndex,
    featIndexes,
    level,
    speciesIndex,
    subclassIndex,
    subspeciesIndex,
  };
}

function parsePreviewFeatIndexes(value: Request["query"][string]) {
  const rawValues = (
    Array.isArray(value) ? value : typeof value === "string" ? [value] : []
  ).filter((entry): entry is string => typeof entry === "string");

  return rawValues
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter((entry, index, collection) => entry.length > 0 && collection.indexOf(entry) === index);
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

function isNullableString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isNullableGridCoordinate(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 99)
  );
}

function normalizeGridCoordinate(value: unknown) {
  return typeof value === "number" ? value : null;
}

function parseInventoryMutationBody(body: unknown): CharacterInventoryMutationItem[] | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as InventoryMutationRequestBody;

  if (!Array.isArray(candidate.items) || candidate.items.length > 200) {
    return null;
  }

  const parsedItems: CharacterInventoryMutationItem[] = [];

  for (const item of candidate.items) {
    if (!item || typeof item !== "object") {
      return null;
    }

    const candidateItem = item as InventoryMutationItemRequestBody;

    if (
      typeof candidateItem.equipmentIndex !== "string" ||
      candidateItem.equipmentIndex.trim().length === 0 ||
      typeof candidateItem.quantity !== "number" ||
      !Number.isInteger(candidateItem.quantity) ||
      candidateItem.quantity < 1 ||
      candidateItem.quantity > 999 ||
      typeof candidateItem.equipped !== "boolean" ||
      !isNullableGridCoordinate(candidateItem.gridX) ||
      !isNullableGridCoordinate(candidateItem.gridY) ||
      !isNullableString(candidateItem.customName) ||
      !isNullableString(candidateItem.notes)
    ) {
      return null;
    }

    parsedItems.push({
      customName: candidateItem.customName ?? null,
      equipped: candidateItem.equipped,
      equipmentIndex: candidateItem.equipmentIndex.trim(),
      gridX: normalizeGridCoordinate(candidateItem.gridX),
      gridY: normalizeGridCoordinate(candidateItem.gridY),
      notes: candidateItem.notes ?? null,
      quantity: candidateItem.quantity,
    });
  }

  return parsedItems;
}

function parseInventoryStateBody(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const candidate = body as InventoryStateRequestBody;

  if (
    typeof candidate.stateCode !== "string" ||
    candidate.stateCode.trim().length === 0 ||
    candidate.stateCode.length > 1_000_000
  ) {
    return null;
  }

  return candidate.stateCode.trim();
}

async function getCharacters(req: Request, res: Response) {
  try {
    const characters = await findAllCharactersForUser(getAuthenticatedUser(req).id);

    res.json(characters);
  } catch (error) {
    console.error("Failed to fetch characters:", error);

    res.status(500).json({
      error: "Failed to fetch characters",
    });
  }
}

async function getCharacterById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const character = await findCharacterByIdForUser(
      getAuthenticatedUser(req).id,
      id,
    );

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(character);
  } catch (error) {
    console.error("Failed to fetch character:", error);

    res.status(500).json({
      error: "Failed to fetch character",
    });
  }
}

async function getCharacterActions(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const actions = await findCharacterActionsForUser(
      getAuthenticatedUser(req).id,
      id,
      parseCharacterPreviewOverrides(req.query),
    );

    if (!actions) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(actions);
  } catch (error) {
    console.error("Failed to fetch character actions:", error);

    res.status(500).json({
      error: "Failed to fetch character actions",
    });
  }
}

async function getCharacterDerivedState(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const derivedState = await findCharacterDerivedStateForUser(
      getAuthenticatedUser(req).id,
      id,
      parseCharacterPreviewOverrides(req.query),
    );

    if (!derivedState) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json({
      actions: derivedState.actions,
      activeSources: derivedState.activeSources,
      defenses: derivedState.defenses,
      selectedSubclassIndex: derivedState.selectedSubclassIndex,
      selectedSubspeciesIndex: derivedState.selectedSubspeciesIndex,
      spells: derivedState.spells,
      stats: derivedState.stats,
    });
  } catch (error) {
    console.error("Failed to fetch character derived state:", error);

    res.status(500).json({
      error: "Failed to fetch character derived state",
    });
  }
}

async function getCharacterDefenses(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const defenses = await findCharacterDefensesForUser(
      getAuthenticatedUser(req).id,
      id,
      parseCharacterPreviewOverrides(req.query),
    );

    if (!defenses) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(defenses);
  } catch (error) {
    console.error("Failed to fetch character defenses:", error);

    res.status(500).json({
      error: "Failed to fetch character defenses",
    });
  }
}

async function getCharacterInventory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const inventory = await findCharacterInventoryForUser(getAuthenticatedUser(req).id, id);

    if (!inventory) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json({ items: inventory });
  } catch (error) {
    console.error("Failed to fetch character inventory:", error);

    res.status(500).json({
      error: "Failed to fetch character inventory",
    });
  }
}

async function updateCharacterInventory(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const inventoryItems = parseInventoryMutationBody(req.body);

    if (!inventoryItems) {
      res.status(400).json({
        error: "Request body must include an items array with equipmentIndex, quantity, and equipped",
      });
      return;
    }

    const inventory = await replaceCharacterInventoryForUser(
      getAuthenticatedUser(req).id,
      id,
      inventoryItems,
    );

    if (!inventory) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json({ items: inventory });
  } catch (error) {
    if (error instanceof CharacterReferenceNotFoundError) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    console.error("Failed to update character inventory:", error);

    res.status(500).json({
      error: "Failed to update character inventory",
    });
  }
}

async function getCharacterInventoryState(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const inventoryState = await findCharacterInventoryStateForUser(
      getAuthenticatedUser(req).id,
      id,
    );

    if (inventoryState === null) {
      const character = await findCharacterByIdForUser(getAuthenticatedUser(req).id, id);

      if (!character) {
        res.status(404).json({
          error: "Character not found",
        });
        return;
      }
    }

    res.json({
      stateCode: inventoryState?.stateCode ?? null,
      updatedAt: inventoryState?.updatedAt ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch character inventory state:", error);

    res.status(500).json({
      error: "Failed to fetch character inventory state",
    });
  }
}

async function updateCharacterInventoryState(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const stateCode = parseInventoryStateBody(req.body);

    if (!stateCode) {
      res.status(400).json({
        error: "Request body must include a non-empty stateCode string",
      });
      return;
    }

    const inventoryState = await saveCharacterInventoryStateForUser(
      getAuthenticatedUser(req).id,
      id,
      stateCode,
    );

    if (!inventoryState) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json({
      stateCode: inventoryState.stateCode,
      updatedAt: inventoryState.updatedAt,
    });
  } catch (error) {
    console.error("Failed to update character inventory state:", error);

    res.status(500).json({
      error: "Failed to update character inventory state",
    });
  }
}

async function createCharacter(req: Request, res: Response) {
  try {
    const body = req.body;

    if (!isCharacterMutationRequestBody(body)) {
      res.status(400).json({
        error:
          "Request body must include name, speciesIndex, classIndex, backgroundIndex, skillIndexes, and abilityScores from 3 to 20",
      });
      return;
    }

    const character = await createCharacterForUser(getAuthenticatedUser(req).id, {
      name: body.name.trim(),
      speciesIndex: body.speciesIndex.trim(),
      classIndex: body.classIndex.trim(),
      subclassIndex:
        "subclassIndex" in body ? normalizeOptionalString(body.subclassIndex) : undefined,
      backgroundIndex: body.backgroundIndex.trim(),
      alignment: body.alignment?.trim() || null,
      level: body.level,
      currentHp: body.currentHp,
      hitPointState: body.hitPointState,
      skillIndexes: body.skillIndexes,
      choices: body.choices,
      featureChoices: normalizeFeatureChoiceSelections(body.featureChoices),
      abilityScores: body.abilityScores,
    });

    res.status(201).json(character);
  } catch (error) {
    if (error instanceof CharacterReferenceNotFoundError) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    if (isUniqueConstraintError(error)) {
      res.status(400).json({
        error: "A character with this name already exists for your account",
      });
      return;
    }

    console.error("Failed to create character:", error);

    res.status(500).json({
      error: "Failed to create character",
    });
  }
}

async function updateCharacter(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const body = req.body;

    if (!isCharacterMutationRequestBody(body)) {
      res.status(400).json({
        error:
          "Request body must include name, speciesIndex, classIndex, backgroundIndex, skillIndexes, and abilityScores from 3 to 20",
      });
      return;
    }

    const character = await updateCharacterForUser(
      getAuthenticatedUser(req).id,
      id,
      {
        name: body.name.trim(),
        speciesIndex: body.speciesIndex.trim(),
        classIndex: body.classIndex.trim(),
        subclassIndex:
          "subclassIndex" in body ? normalizeOptionalString(body.subclassIndex) : undefined,
        backgroundIndex: body.backgroundIndex.trim(),
        alignment: body.alignment?.trim() || null,
        level: body.level,
        currentHp: body.currentHp,
        hitPointState: body.hitPointState,
        skillIndexes: body.skillIndexes,
        choices: body.choices,
        featureChoices: normalizeFeatureChoiceSelections(body.featureChoices),
        abilityScores: body.abilityScores,
      },
    );

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(character);
  } catch (error) {
    if (error instanceof CharacterReferenceNotFoundError) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    if (isUniqueConstraintError(error)) {
      res.status(400).json({
        error: "A character with this name already exists for your account",
      });
      return;
    }

    console.error("Failed to update character:", error);

    res.status(500).json({
      error: "Failed to update character",
    });
  }
}

async function addCharacterCondition(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const body = req.body as AddConditionRequestBody;

    if (typeof body.conditionIndex !== "string" || body.conditionIndex.trim().length === 0) {
      res.status(400).json({
        error: "Request body must include conditionIndex",
      });
      return;
    }

    const character = await addConditionToCharacterForUser(
      getAuthenticatedUser(req).id,
      id,
      body.conditionIndex.trim(),
    );

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(character);
  } catch (error) {
    if (error instanceof CharacterReferenceNotFoundError) {
      res.status(404).json({
        error: error.message,
      });
      return;
    }

    console.error("Failed to add character condition:", error);

    res.status(500).json({
      error: "Failed to add character condition",
    });
  }
}

async function removeCharacterCondition(req: Request, res: Response) {
  try {
    const { conditionIndex, id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    if (!conditionIndex || Array.isArray(conditionIndex)) {
      res.status(400).json({
        error: "Invalid condition index",
      });
      return;
    }

    const character = await removeConditionFromCharacterForUser(
      getAuthenticatedUser(req).id,
      id,
      conditionIndex,
    );

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(character);
  } catch (error) {
    console.error("Failed to remove character condition:", error);

    res.status(500).json({
      error: "Failed to remove character condition",
    });
  }
}

async function deleteCharacter(req: Request, res: Response) {
  try {
    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      res.status(400).json({
        error: "Invalid character id",
      });
      return;
    }

    const deleted = await deleteCharacterForUser(getAuthenticatedUser(req).id, id);

    if (!deleted) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("Failed to delete character:", error);

    res.status(500).json({
      error: "Failed to delete character",
    });
  }
}

export {
  addCharacterCondition,
  createCharacter,
  deleteCharacter,
  getCharacterActions,
  getCharacterDerivedState,
  getCharacterDefenses,
  getCharacterById,
  getCharacterInventory,
  getCharacterInventoryState,
  getCharacters,
  removeCharacterCondition,
  updateCharacter,
  updateCharacterInventory,
  updateCharacterInventoryState,
};
