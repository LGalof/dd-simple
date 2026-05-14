import { Router } from "express";
import {
  getAbilityScores,
  getBackgrounds,
  getClasses,
  getEquipment,
  getProficiencies,
  getRuleDocumentByCategoryAndIndex,
  getRuleDocumentsByCategory,
  getSkills,
  getSpecies,
} from "../controllers/reference.controller.js";

const referencesRouter = Router();

referencesRouter.get("/references/ability-scores", getAbilityScores);
referencesRouter.get("/references/skills", getSkills);
referencesRouter.get("/references/species", getSpecies);
referencesRouter.get("/references/classes", getClasses);
referencesRouter.get("/references/backgrounds", getBackgrounds);
referencesRouter.get("/references/proficiencies", getProficiencies);
referencesRouter.get("/references/equipment", getEquipment);

referencesRouter.get("/references/rules/:category", getRuleDocumentsByCategory);
referencesRouter.get(
  "/references/rules/:category/:index",
  getRuleDocumentByCategoryAndIndex,
);

export { referencesRouter };