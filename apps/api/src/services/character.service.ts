import { prisma } from "../lib/prisma.js";

type CreateCharacterData = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment: string | null;
  skillIndexes: string[];
  abilityScores: {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
  };
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

function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

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
  const conModifier = getAbilityModifier(data.abilityScores.con);
  const dexModifier = getAbilityModifier(data.abilityScores.dex);

  return prisma.$transaction(async (tx) => {
    const [species, characterClass, background, skills, selectedProficiencies] =
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

    const maxHp = Math.max(1, characterClass.hitDie + conModifier);

    return tx.character.create({
      data: {
        userId,
        name: data.name,
        speciesIndex: data.speciesIndex,
        classIndex: data.classIndex,
        backgroundIndex: data.backgroundIndex,
        level: 1,
        experiencePoints: 0,
        alignment: data.alignment,
        maxHp,
        currentHp: maxHp,
        armorClass: 10 + dexModifier,
        speed: species.baseSpeed,
        abilityScores: {
          create: [
            {
              abilityIndex: "str",
              score: data.abilityScores.str,
            },
            {
              abilityIndex: "dex",
              score: data.abilityScores.dex,
            },
            {
              abilityIndex: "con",
              score: data.abilityScores.con,
            },
            {
              abilityIndex: "int",
              score: data.abilityScores.int,
            },
            {
              abilityIndex: "wis",
              score: data.abilityScores.wis,
            },
            {
              abilityIndex: "cha",
              score: data.abilityScores.cha,
            },
          ],
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

async function deleteCharacterForUser(userId: string, id: string) {
  const result = await prisma.character.deleteMany({
    where: {
      id,
      userId,
    },
  });

  return result.count > 0;
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
  deleteCharacterForUser,
  findAllCharacters,
  findCharacterById,
};
export type { CreateCharacterData };
