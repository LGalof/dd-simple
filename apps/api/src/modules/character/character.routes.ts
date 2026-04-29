import { Router } from "express";
import {
  createCharacterHandler,
  deleteCharacterHandler,
  getCharacter,
  listCharacters,
  updateCharacterHandler,
} from "./character.controller.js";

const characterRouter = Router();

characterRouter.get("/", listCharacters);
characterRouter.get("/:id", getCharacter);
characterRouter.post("/", createCharacterHandler);
characterRouter.patch("/:id", updateCharacterHandler);
characterRouter.delete("/:id", deleteCharacterHandler);

export { characterRouter };
