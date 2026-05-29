import { Router } from "express";
import {
  createCharacter,
  deleteCharacter,
  getCharacterActions,
  getCharacterById,
  getCharacters,
  updateCharacter,
} from "../controllers/character.controller.js";
import { requireAuth } from "../middleware/auth.js";

const charactersRouter = Router();

charactersRouter.use(requireAuth);

charactersRouter.post("/characters", createCharacter);

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id/actions", getCharacterActions);

charactersRouter.get("/characters/:id", getCharacterById);

charactersRouter.patch("/characters/:id", updateCharacter);

charactersRouter.delete("/characters/:id", deleteCharacter);

export { charactersRouter };
