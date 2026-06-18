import { Router } from "express";
import {
  addCharacterCondition,
  createCharacter,
  deleteCharacter,
  getCharacterActions,
  getCharacterDerivedState,
  getCharacterDefenses,
  getCharacterById,
  getCharacterInventory,
  getCharacterInventoryState,
  getCharacters,
  removeCharacterCondition,
  updateCharacter,
  updateCharacterInventory,
  updateCharacterInventoryState,
} from "../controllers/character.controller.js";
import { requireAuth } from "../middleware/auth.js";

const charactersRouter = Router();

charactersRouter.use(requireAuth);

charactersRouter.post("/characters", createCharacter);

charactersRouter.get("/characters", getCharacters);

charactersRouter.get("/characters/:id/actions", getCharacterActions);
charactersRouter.get("/characters/:id/derived", getCharacterDerivedState);

charactersRouter.post("/characters/:id/conditions", addCharacterCondition);

charactersRouter.delete(
  "/characters/:id/conditions/:conditionIndex",
  removeCharacterCondition,
);
charactersRouter.get("/characters/:id/defenses", getCharacterDefenses);

charactersRouter.get("/characters/:id/inventory", getCharacterInventory);

charactersRouter.put("/characters/:id/inventory", updateCharacterInventory);

charactersRouter.get("/characters/:id/inventory/state", getCharacterInventoryState);

charactersRouter.put("/characters/:id/inventory/state", updateCharacterInventoryState);

charactersRouter.get("/characters/:id", getCharacterById);

charactersRouter.patch("/characters/:id", updateCharacter);

charactersRouter.delete("/characters/:id", deleteCharacter);

export { charactersRouter };
