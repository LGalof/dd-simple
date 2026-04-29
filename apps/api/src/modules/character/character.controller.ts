import type { Request, Response } from "express";
import {
  createCharacter,
  deleteCharacter,
  getAllCharacters,
  getCharacterById,
  isPrismaForeignKeyError,
  isPrismaNotFoundError,
  updateCharacter,
} from "./character.service.js";
import { validateCreateCharacterInput, validateUpdateCharacterInput } from "./character.types.js";

function getRouteId(value: string | string[] | undefined) {
  return typeof value === "string" ? value : null;
}

async function listCharacters(_req: Request, res: Response) {
  try {
    const characters = await getAllCharacters();
    res.json(characters);
  } catch {
    res.status(500).json({ message: "Failed to load characters." });
  }
}

async function getCharacter(req: Request, res: Response) {
  const id = getRouteId(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid character id." });
    return;
  }

  try {
    const character = await getCharacterById(id);

    if (!character) {
      res.status(404).json({ message: "Character not found." });
      return;
    }

    res.json(character);
  } catch {
    res.status(500).json({ message: "Failed to load character." });
  }
}

async function createCharacterHandler(req: Request, res: Response) {
  const validation = validateCreateCharacterInput(req.body);

  if (!validation.success) {
    res.status(400).json({ message: "Validation failed.", errors: validation.errors });
    return;
  }

  try {
    const character = await createCharacter(validation.data);
    res.status(201).json(character);
  } catch (error) {
    if (isPrismaForeignKeyError(error)) {
      res.status(400).json({ message: "The provided userId does not reference an existing user." });
      return;
    }

    res.status(500).json({ message: "Failed to create character." });
  }
}

async function updateCharacterHandler(req: Request, res: Response) {
  const id = getRouteId(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid character id." });
    return;
  }

  const validation = validateUpdateCharacterInput(req.body);

  if (!validation.success) {
    res.status(400).json({ message: "Validation failed.", errors: validation.errors });
    return;
  }

  try {
    const character = await updateCharacter(id, validation.data);
    res.json(character);
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Character not found." });
      return;
    }

    if (isPrismaForeignKeyError(error)) {
      res.status(400).json({ message: "The provided userId does not reference an existing user." });
      return;
    }

    res.status(500).json({ message: "Failed to update character." });
  }
}

async function deleteCharacterHandler(req: Request, res: Response) {
  const id = getRouteId(req.params.id);

  if (!id) {
    res.status(400).json({ message: "Invalid character id." });
    return;
  }

  try {
    await deleteCharacter(id);
    res.status(204).send();
  } catch (error) {
    if (isPrismaNotFoundError(error)) {
      res.status(404).json({ message: "Character not found." });
      return;
    }

    res.status(500).json({ message: "Failed to delete character." });
  }
}

export {
  createCharacterHandler,
  deleteCharacterHandler,
  getCharacter,
  listCharacters,
  updateCharacterHandler,
};
