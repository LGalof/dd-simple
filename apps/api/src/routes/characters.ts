import { Router } from "express";
import {
  createCharacter,
  deleteCharacter,
  getCharacterById,
  getCharacters,
} from "../controllers/character.controller.js";

const charactersRouter = Router();

charactersRouter.post("/characters", createCharacter);

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id", getCharacterById);

charactersRouter.delete("/characters/:id", deleteCharacter);

export { charactersRouter };
