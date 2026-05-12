import { Router } from "express";
import {
  createCharacter,
  getCharacterById,
  getCharacters,
} from "../controllers/character.controller.js";

const charactersRouter = Router();

charactersRouter.post("/characters", createCharacter);

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id", getCharacterById);

export { charactersRouter };
