import { Router } from "express";
import { prisma } from "../lib/prisma.js";

const charactersRouter = Router();

charactersRouter.get("/characters", async (_req, res) => {
  try {
    const characters = await prisma.character.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        species: true,
        class: true,
        background: true,
        abilityScores: {
          include: {
            ability: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: {
                ability: true,
              },
            },
          },
        },
        proficiencies: {
          include: {
            proficiency: true,
          },
        },
        inventory: {
          include: {
            equipment: true,
          },
        },
        diceRolls: {
          orderBy: {
            rolledAt: "desc",
          },
          take: 5,
        },
      },
    });

    res.json(characters);
  } catch (error) {
    console.error("Failed to fetch characters:", error);

    res.status(500).json({
      error: "Failed to fetch characters",
    });
  }
});

charactersRouter.get("/characters/:id", async (req, res) => {
  try {
    const character = await prisma.character.findUnique({
      where: {
        id: req.params.id,
      },
      include: {
        user: true,
        species: true,
        class: true,
        background: true,
        abilityScores: {
          include: {
            ability: true,
          },
        },
        skills: {
          include: {
            skill: {
              include: {
                ability: true,
              },
            },
          },
        },
        proficiencies: {
          include: {
            proficiency: true,
          },
        },
        inventory: {
          include: {
            equipment: true,
          },
        },
        choices: true,
        diceRolls: {
          orderBy: {
            rolledAt: "desc",
          },
        },
      },
    });

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    res.json(character);
  } catch (error) {
    console.error("Failed to fetch character:", error);

    res.status(500).json({
      error: "Failed to fetch character",
    });
  }
});

export { charactersRouter };