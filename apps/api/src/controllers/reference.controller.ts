import type { Request, Response } from "express";
import {
  findAbilityScores,
  findBackgrounds,
  findClasses,
  findEquipment,
  findProficiencies,
  findRuleDocumentByCategoryAndIndex,
  findRuleDocumentsByCategory,
  findSkills,
  findSpecies,
} from "../services/reference.service.js";

async function getAbilityScores(_req: Request, res: Response) {
  try {
    const abilityScores = await findAbilityScores();

    res.json(abilityScores);
  } catch (error) {
    console.error("Failed to fetch ability scores:", error);

    res.status(500).json({
      error: "Failed to fetch ability scores",
    });
  }
}

async function getSkills(_req: Request, res: Response) {
  try {
    const skills = await findSkills();

    res.json(skills);
  } catch (error) {
    console.error("Failed to fetch skills:", error);

    res.status(500).json({
      error: "Failed to fetch skills",
    });
  }
}

async function getSpecies(_req: Request, res: Response) {
  try {
    const species = await findSpecies();

    res.json(species);
  } catch (error) {
    console.error("Failed to fetch species:", error);

    res.status(500).json({
      error: "Failed to fetch species",
    });
  }
}

async function getClasses(_req: Request, res: Response) {
  try {
    const classes = await findClasses();

    res.json(classes);
  } catch (error) {
    console.error("Failed to fetch classes:", error);

    res.status(500).json({
      error: "Failed to fetch classes",
    });
  }
}

async function getBackgrounds(_req: Request, res: Response) {
  try {
    const backgrounds = await findBackgrounds();

    res.json(backgrounds);
  } catch (error) {
    console.error("Failed to fetch backgrounds:", error);

    res.status(500).json({
      error: "Failed to fetch backgrounds",
    });
  }
}

async function getProficiencies(_req: Request, res: Response) {
  try {
    const proficiencies = await findProficiencies();

    res.json(proficiencies);
  } catch (error) {
    console.error("Failed to fetch proficiencies:", error);

    res.status(500).json({
      error: "Failed to fetch proficiencies",
    });
  }
}

async function getEquipment(_req: Request, res: Response) {
  try {
    const equipment = await findEquipment();

    res.json(equipment);
  } catch (error) {
    console.error("Failed to fetch equipment:", error);

    res.status(500).json({
      error: "Failed to fetch equipment",
    });
  }
}

async function getRuleDocumentsByCategory(req: Request, res: Response) {
  try {
    const { category } = req.params;

    if (!category || Array.isArray(category)) {
      res.status(400).json({
        error: "Invalid rule category",
      });
      return;
    }

    const documents = await findRuleDocumentsByCategory(category);

    res.json(documents);
  } catch (error) {
    console.error("Failed to fetch rule documents:", error);

    res.status(500).json({
      error: "Failed to fetch rule documents",
    });
  }
}

async function getRuleDocumentByCategoryAndIndex(req: Request, res: Response) {
  try {
    const { category, index } = req.params;

    if (!category || !index || Array.isArray(category) || Array.isArray(index)) {
      res.status(400).json({
        error: "Invalid rule category or index",
      });
      return;
    }

    const document = await findRuleDocumentByCategoryAndIndex(category, index);

    if (!document) {
      res.status(404).json({
        error: "Rule document not found",
      });
      return;
    }

    res.json(document);
  } catch (error) {
    console.error("Failed to fetch rule document:", error);

    res.status(500).json({
      error: "Failed to fetch rule document",
    });
  }
}

export {
  getAbilityScores,
  getBackgrounds,
  getClasses,
  getEquipment,
  getProficiencies,
  getRuleDocumentByCategoryAndIndex,
  getRuleDocumentsByCategory,
  getSkills,
  getSpecies,
};