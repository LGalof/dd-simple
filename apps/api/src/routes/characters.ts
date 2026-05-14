import { Router } from "express";
import {
  createCharacter,
  deleteCharacter,
  getCharacterById,
  getCharacters,
  updateCharacter,
} from "../controllers/character.controller.js";

const charactersRouter = Router();

charactersRouter.post("/characters", createCharacter);

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id", getCharacterById);

charactersRouter.patch("/characters/:id", updateCharacter);

charactersRouter.delete("/characters/:id", deleteCharacter);

export { charactersRouter };
