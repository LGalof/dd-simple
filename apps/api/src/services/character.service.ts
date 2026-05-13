import type { Prisma, RefProficiency, RefSkill } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type CharacterMutationData = {
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

type CreateCharacterData = CharacterMutationData;

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

function abilityScoreRows(data: CharacterMutationData) {
  return [
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
  ];
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

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

    const existingSkillIndexes = new Set(
      skills.map((skill: RefSkill) => skill.index),
    );
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
          create: abilityScoreRows(data),
        },
        skills: {
          create: skills.map((skill: RefSkill) => ({
            skillIndex: skill.index,
            isProficient: selectedSkillIndexes.has(skill.index),
            customBonus: 0,
          })),
        },
        proficiencies: {
          create: selectedProficiencies.map((proficiency: RefProficiency) => ({
            proficiencyIndex: proficiency.index,
            sourceType: "manual",
          })),
        },
      },
      include: characterInclude,
    });
  });
}

async function updateCharacterForUser(
  userId: string,
  characterId: string,
  data: CharacterMutationData,
) {
  const selectedSkillIndexes = new Set(data.skillIndexes);
  const conModifier = getAbilityModifier(data.abilityScores.con);
  const dexModifier = getAbilityModifier(data.abilityScores.dex);

  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingCharacter = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
    });

    if (!existingCharacter) {
      return null;
    }

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

    const existingSkillIndexes = new Set(
      skills.map((skill: RefSkill) => skill.index),
    );
    const invalidSkillIndexes = data.skillIndexes.filter(
      (skillIndex) => !existingSkillIndexes.has(skillIndex),
    );

    if (invalidSkillIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Skill not found");
    }

    const maxHp = Math.max(1, characterClass.hitDie + conModifier);
    const currentHp =
      existingCharacter.currentHp === existingCharacter.maxHp
        ? maxHp
        : Math.min(existingCharacter.currentHp, maxHp);

    await tx.character.update({
      where: {
        id: characterId,
      },
      data: {
        name: data.name,
        speciesIndex: data.speciesIndex,
        classIndex: data.classIndex,
        backgroundIndex: data.backgroundIndex,
        alignment: data.alignment,
        maxHp,
        currentHp,
        armorClass: 10 + dexModifier,
        speed: species.baseSpeed,
      },
    });

    await Promise.all(
      abilityScoreRows(data).map((abilityScore) =>
        tx.characterAbilityScore.upsert({
          where: {
            characterId_abilityIndex: {
              characterId,
              abilityIndex: abilityScore.abilityIndex,
            },
          },
          update: {
            score: abilityScore.score,
          },
          create: {
            characterId,
            abilityIndex: abilityScore.abilityIndex,
            score: abilityScore.score,
          },
        }),
      ),
    );

    await Promise.all(
      skills.map((skill: RefSkill) =>
        tx.characterSkill.upsert({
          where: {
            characterId_skillIndex: {
              characterId,
              skillIndex: skill.index,
            },
          },
          update: {
            isProficient: selectedSkillIndexes.has(skill.index),
          },
          create: {
            characterId,
            skillIndex: skill.index,
            isProficient: selectedSkillIndexes.has(skill.index),
            customBonus: 0,
          },
        }),
      ),
    );

    await tx.characterProficiency.deleteMany({
      where: {
        characterId,
        sourceType: "manual",
        proficiencyIndex: {
          startsWith: "skill-",
        },
      },
    });

    if (selectedProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: selectedProficiencies.map((proficiency: RefProficiency) => ({
          characterId,
          proficiencyIndex: proficiency.index,
          sourceType: "manual",
        })),
        skipDuplicates: true,
      });
    }

    return tx.character.findUnique({
      where: {
        id: characterId,
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
  updateCharacterForUser,
};
export type { CharacterMutationData, CreateCharacterData };
