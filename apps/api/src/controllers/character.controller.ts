import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import {
  CharacterReferenceNotFoundError,
  createCharacterForUser,
  findAllCharacters,
  findCharacterById,
} from "../services/character.service.js";

const DEMO_USER_EMAIL = "demo@ddsimple.local";

type CreateCharacterRequestBody = {
  name?: unknown;
  speciesIndex?: unknown;
  classIndex?: unknown;
  backgroundIndex?: unknown;
  skillIndexes?: unknown;
};

type ValidCreateCharacterRequestBody = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  skillIndexes: string[];
};

function isCreateCharacterRequestBody(
  body: unknown,
): body is ValidCreateCharacterRequestBody {
  if (!body || typeof body !== "object") {
    return false;
  }

  const candidate = body as CreateCharacterRequestBody;

  return (
    typeof candidate.name === "string" &&
    candidate.name.trim().length > 0 &&
    typeof candidate.speciesIndex === "string" &&
    candidate.speciesIndex.trim().length > 0 &&
    typeof candidate.classIndex === "string" &&
    candidate.classIndex.trim().length > 0 &&
    typeof candidate.backgroundIndex === "string" &&
    candidate.backgroundIndex.trim().length > 0 &&
    Array.isArray(candidate.skillIndexes) &&
    candidate.skillIndexes.every((skillIndex) => typeof skillIndex === "string")
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

async function getCharacters(_req: Request, res: Response) {
  try {
    const characters = await findAllCharacters();

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

    const character = await findCharacterById(id);

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

    if (!isCreateCharacterRequestBody(body)) {
      res.status(400).json({
        error:
          "Request body must include name, speciesIndex, classIndex, backgroundIndex, and skillIndexes",
      });
      return;
    }

    const demoUser = await prisma.user.findUnique({
      where: {
        email: DEMO_USER_EMAIL,
      },
    });

    if (!demoUser) {
      res.status(404).json({
        error: "Demo user not found",
      });
      return;
    }

    const character = await createCharacterForUser(demoUser.id, {
      name: body.name.trim(),
      speciesIndex: body.speciesIndex.trim(),
      classIndex: body.classIndex.trim(),
      backgroundIndex: body.backgroundIndex.trim(),
      skillIndexes: body.skillIndexes,
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
        error: "A character with this name already exists for the demo user",
      });
      return;
    }

    console.error("Failed to create character:", error);

    res.status(500).json({
      error: "Failed to create character",
    });
  }
}

export { createCharacter, getCharacterById, getCharacters };
