import { prisma } from "../lib/prisma.js";

type CreateCharacterData = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  skillIndexes: string[];
};

class CharacterReferenceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CharacterReferenceNotFoundError";
  }
}

const characterInclude = {
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
      rolledAt: "desc" as const,
    },
  },
};

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

async function createCharacterForUser(userId: string, data: CreateCharacterData) {
  const selectedSkillIndexes = new Set(data.skillIndexes);

  return prisma.$transaction(async (tx) => {
    const [species, characterClass, background, abilityScores, skills, selectedProficiencies] =
      await Promise.all([
        tx.refSpecies.findUnique({
          where: {
            index: data.speciesIndex,
          },
        }),
        tx.refClass.findUnique({
          where: {
            index: data.classIndex,
          },
        }),
        tx.refBackground.findUnique({
          where: {
            index: data.backgroundIndex,
          },
        }),
        tx.refAbilityScore.findMany(),
        tx.refSkill.findMany(),
        tx.refProficiency.findMany({
          where: {
            index: {
              in: data.skillIndexes.map((skillIndex) => `skill-${skillIndex}`),
            },
          },
        }),
      ]);

    if (!species) {
      throw new CharacterReferenceNotFoundError("Species not found");
    }

    if (!characterClass) {
      throw new CharacterReferenceNotFoundError("Class not found");
    }

    if (!background) {
      throw new CharacterReferenceNotFoundError("Background not found");
    }

    const existingSkillIndexes = new Set(skills.map((skill) => skill.index));
    const invalidSkillIndexes = data.skillIndexes.filter(
      (skillIndex) => !existingSkillIndexes.has(skillIndex),
    );

    if (invalidSkillIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Skill not found");
    }

    return tx.character.create({
      data: {
        userId,
        name: data.name,
        speciesIndex: data.speciesIndex,
        classIndex: data.classIndex,
        backgroundIndex: data.backgroundIndex,
        level: 1,
        experiencePoints: 0,
        alignment: null,
        maxHp: characterClass.hitDie,
        currentHp: characterClass.hitDie,
        armorClass: 10,
        speed: species.baseSpeed,
        abilityScores: {
          create: abilityScores.map((abilityScore) => ({
            abilityIndex: abilityScore.index,
            score: 10,
          })),
        },
        skills: {
          create: skills.map((skill) => ({
            skillIndex: skill.index,
            isProficient: selectedSkillIndexes.has(skill.index),
            customBonus: 0,
          })),
        },
        proficiencies: {
          create: selectedProficiencies.map((proficiency) => ({
            proficiencyIndex: proficiency.index,
            sourceType: "manual",
          })),
        },
      },
      include: characterInclude,
    });
  });
}

async function findCharacterById(id: string) {
  return prisma.character.findUnique({
    where: {
      id,
    },
    include: characterInclude,
  });
}

export {
  CharacterReferenceNotFoundError,
  createCharacterForUser,
  findAllCharacters,
  findCharacterById,
};
export type { CreateCharacterData };
