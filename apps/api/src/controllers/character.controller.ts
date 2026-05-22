import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  CharacterReferenceNotFoundError,
  createCharacterForUser,
  deleteCharacterForUser,
  findAllCharactersForUser,
  findCharacterByIdForUser,
  updateCharacterForUser,
} from "../services/character.service.js";

const ABILITY_SCORE_KEYS = ["str", "dex", "con", "int", "wis", "cha"] as const;

type AbilityScoreKey = (typeof ABILITY_SCORE_KEYS)[number];
type AbilityScoreRequestBody = Record<AbilityScoreKey, number>;

type CharacterMutationRequestBody = {
  name?: unknown;
  speciesIndex?: unknown;
  classIndex?: unknown;
  backgroundIndex?: unknown;
  alignment?: unknown;
  skillIndexes?: unknown;
  abilityScores?: unknown;
};

type ValidCharacterMutationRequestBody = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment?: string | null;
  skillIndexes: string[];
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
    Array.isArray(candidate.skillIndexes) &&
    candidate.skillIndexes.every((skillIndex) => typeof skillIndex === "string") &&
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
      skillIndexes: body.skillIndexes,
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
        skillIndexes: body.skillIndexes,
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
  createCharacter,
  deleteCharacter,
  getCharacterById,
  getCharacters,
  updateCharacter,
};
