import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  addConditionToCharacterForUser,
  CharacterReferenceNotFoundError,
  createCharacterForUser,
  deleteCharacterForUser,
  findAllCharactersForUser,
  findCharacterByIdForUser,
  removeConditionFromCharacterForUser,
  updateCharacterForUser,
} from "../services/character.service.js";
import { findCharacterActionsForUser } from "../services/character-actions.service.js";

const ABILITY_SCORE_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

type AbilityScoreKey = (typeof ABILITY_SCORE_KEYS)[number];
type AbilityScoreRequestBody = Record<AbilityScoreKey, number>;

type CharacterMutationRequestBody = {
  name?: unknown;
  speciesIndex?: unknown;
  classIndex?: unknown;
  backgroundIndex?: unknown;
  alignment?: unknown;
  level?: unknown;
  currentHp?: unknown;
  hitPointState?: unknown;
  skillIndexes?: unknown;
  choices?: unknown;
  abilityScores?: unknown;
};

type CharacterChoiceRequestBody = {
  choiceType?: unknown;
  sourceType?: unknown;
  sourceIndex?: unknown;
  selectedType?: unknown;
  selectedIndex?: unknown;
};

type AddConditionRequestBody = {
  conditionIndex?: unknown;
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

type ValidCharacterMutationRequestBody = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment?: string | null;
  level?: number;
  currentHp?: number;
  hitPointState?: ValidHitPointStateRequestBody;
  skillIndexes: string[];
  choices?: ValidCharacterChoiceRequestBody[];
  abilityScores: AbilityScoreRequestBody;
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

  return isClassSkillChoice || isSpeciesLanguageChoice || isSpeciesHeritageChoice;
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
    isAbilityScoresBody(candidate.abilityScores)
  );
}

function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
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

    const classIndex =
      typeof req.query.classIndex === "string" && req.query.classIndex.trim().length > 0
        ? req.query.classIndex.trim()
        : undefined;
    const speciesIndex =
      typeof req.query.speciesIndex === "string" && req.query.speciesIndex.trim().length > 0
        ? req.query.speciesIndex.trim()
        : undefined;
    const subspeciesIndex =
      typeof req.query.subspeciesIndex === "string" && req.query.subspeciesIndex.trim().length > 0
        ? req.query.subspeciesIndex.trim()
        : undefined;
    const level =
      typeof req.query.level === "string" &&
      Number.isInteger(Number(req.query.level)) &&
      Number(req.query.level) >= 1 &&
      Number(req.query.level) <= 20
        ? Number(req.query.level)
        : undefined;

    const actions = await findCharacterActionsForUser(getAuthenticatedUser(req).id, id, {
      classIndex,
      level,
      subspeciesIndex,
      speciesIndex,
    });

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
      backgroundIndex: body.backgroundIndex.trim(),
      alignment: body.alignment?.trim() || null,
      level: body.level,
      currentHp: body.currentHp,
      hitPointState: body.hitPointState,
      skillIndexes: body.skillIndexes,
      choices: body.choices,
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
        backgroundIndex: body.backgroundIndex.trim(),
        alignment: body.alignment?.trim() || null,
        level: body.level,
        currentHp: body.currentHp,
        hitPointState: body.hitPointState,
        skillIndexes: body.skillIndexes,
        choices: body.choices,
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
  getCharacterById,
  getCharacters,
  removeCharacterCondition,
  updateCharacter,
};
