import { Router } from "express";
import {
  getCharacterById,
  getCharacters,
} from "../controllers/character.controller.js";

const charactersRouter = Router();

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id", getCharacterById);

export { charactersRouter };
