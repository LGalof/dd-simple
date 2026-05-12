import { prisma } from "../lib/prisma.js";

async function findAllCharacters() {
  return prisma.character.findMany({
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
}

async function findCharacterById(id: string) {
  return prisma.character.findUnique({
    where: {
      id,
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
}

export { findAllCharacters, findCharacterById };
