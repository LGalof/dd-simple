import { Router } from "express";
import {
  addCharacterCondition,
  createCharacter,
  deleteCharacter,
  getCharacterActions,
  getCharacterDefenses,
  getCharacterById,
  getCharacters,
  removeCharacterCondition,
  updateCharacter,
} from "../controllers/character.controller.js";
import { requireAuth } from "../middleware/auth.js";

const charactersRouter = Router();

charactersRouter.use(requireAuth);

charactersRouter.post("/characters", createCharacter);

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id/actions", getCharacterActions);

charactersRouter.post("/characters/:id/conditions", addCharacterCondition);

charactersRouter.delete(
  "/characters/:id/conditions/:conditionIndex",
  removeCharacterCondition,
);
charactersRouter.get("/characters/:id/defenses", getCharacterDefenses);

charactersRouter.get("/characters/:id", getCharacterById);

charactersRouter.patch("/characters/:id", updateCharacter);

charactersRouter.delete("/characters/:id", deleteCharacter);

export { charactersRouter };
