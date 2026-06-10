import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

type ReferenceIndexRecord = {
  index: string;
};

type ClassSourceJson = {
  saving_throws?: ReferenceIndexRecord[];
};

type SpeciesSourceJson = {
  languages?: ReferenceIndexRecord[];
};

type ClassProficiencyGrantIndex = {
  proficiencyIndex: string;
};

type CharacterChoiceInput = {
  choiceType?: string;
  sourceType?: string;
  sourceIndex?: string;
  selectedType?: string;
  selectedIndex: string;
};

type CharacterMutationData = {
  name: string;
  speciesIndex: string;
  classIndex: string;
  backgroundIndex: string;
  alignment: string | null;
  level?: number;
  skillIndexes: string[];
  choices?: CharacterChoiceInput[];
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

const CLASS_CHOICE_SOURCE_TYPE = "class";
const CLASS_SKILL_CHOICE_TYPE = "class-skill-choice";
const CLASS_SKILL_CHOICE_SELECTED_TYPE = "skill";
const CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE = "class-choice";
const SPECIES_CHOICE_SOURCE_TYPE = "species";
const SPECIES_LANGUAGE_CHOICE_TYPE = "species-language-choice";
const SPECIES_LANGUAGE_SELECTED_TYPE = "language";
const SPECIES_HERITAGE_CHOICE_TYPE = "species-heritage-choice";
const SPECIES_HERITAGE_SELECTED_TYPE = "subspecies";

const fallbackSpeciesLanguageIndexes: Record<string, string[]> = {
  dragonborn: ["common", "draconic"],
  dwarf: ["common", "dwarvish"],
  elf: ["common", "elvish"],
  gnome: ["common", "gnomish"],
  goliath: ["common", "giant"],
  halfling: ["common", "halfling"],
  human: ["common"],
  orc: ["common", "orc"],
  tiefling: ["common", "infernal"],
};

class CharacterReferenceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CharacterReferenceNotFoundError";
  }
}

const characterInclude = {
  user: true,
  species: {
    include: {
      traits: true,
      sizeOptions: true,
      subspecies: true,
    },
  },
  class: true,
  background: {
    include: {
      proficiencyGrants: {
        include: {
          proficiency: true,
        },
      },
      abilityOptions: {
        include: {
          abilityScore: true,
        },
      },
      featGrants: true,
    },
  },
  abilityScores: {
    include: {
      ability: true,
    },
  },
  skills: {
    orderBy: {
      skillIndex: "asc" as const,
    },
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
  languages: {
    orderBy: {
      languageIndex: "asc" as const,
    },
    include: {
      language: true,
    },
  },
  conditions: {
    orderBy: {
      appliedAt: "asc" as const,
    },
    include: {
      condition: true,
    },
  },
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

function getClassSavingThrowProficiencyIndexes(sourceJson: unknown) {
  if (!sourceJson || typeof sourceJson !== "object") {
    return [];
  }

  const classSourceJson = sourceJson as ClassSourceJson;

  return (classSourceJson.saving_throws ?? []).map(
    (savingThrow) => `saving-throw-${savingThrow.index}`,
  );
}

function isSkillProficiencyIndex(index: string) {
  return index.startsWith("skill-");
}

function skillIndexFromProficiencyIndex(index: string) {
  return isSkillProficiencyIndex(index) ? index.replace(/^skill-/, "") : null;
}

function normalizeClassSkillChoices(
  choices: CharacterChoiceInput[] | undefined,
  classIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== CLASS_CHOICE_SOURCE_TYPE ||
        choice.choiceType !== CLASS_SKILL_CHOICE_TYPE ||
        choice.selectedType !== CLASS_SKILL_CHOICE_SELECTED_TYPE ||
        !isSkillProficiencyIndex(choice.selectedIndex)
      ) {
        return false;
      }

      return Boolean(choice.sourceIndex);
    })
    .map((choice) => ({
      choiceType: CLASS_SKILL_CHOICE_TYPE,
      sourceType: CLASS_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeClassChoiceSourceIndex(choice.sourceIndex, classIndex),
      selectedType: CLASS_SKILL_CHOICE_SELECTED_TYPE,
      selectedIndex: choice.selectedIndex,
    }));
}

function normalizeClassChoiceSourceIndex(sourceIndex: string | undefined, classIndex: string) {
  if (!sourceIndex) {
    return classIndex;
  }

  const [, ...choiceKeyParts] = sourceIndex.split(":");
  const choiceKey = choiceKeyParts.join(":");

  return choiceKey ? `${classIndex}:${choiceKey}` : classIndex;
}

function normalizeSpeciesLanguageChoices(
  choices: CharacterChoiceInput[] | undefined,
  speciesIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== SPECIES_CHOICE_SOURCE_TYPE ||
        choice.choiceType !== SPECIES_LANGUAGE_CHOICE_TYPE ||
        choice.selectedType !== SPECIES_LANGUAGE_SELECTED_TYPE ||
        !choice.selectedIndex ||
        !choice.sourceIndex
      ) {
        return false;
      }

      return true;
    })
    .map((choice) => ({
      choiceType: SPECIES_LANGUAGE_CHOICE_TYPE,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeSpeciesChoiceSourceIndex(choice.sourceIndex, speciesIndex),
      selectedType: SPECIES_LANGUAGE_SELECTED_TYPE,
      selectedIndex: choice.selectedIndex,
    }));
}

function normalizeSpeciesHeritageChoices(
  choices: CharacterChoiceInput[] | undefined,
  speciesIndex: string,
) {
  return (choices ?? [])
    .filter((choice) => {
      if (
        choice.sourceType !== SPECIES_CHOICE_SOURCE_TYPE ||
        choice.choiceType !== SPECIES_HERITAGE_CHOICE_TYPE ||
        choice.selectedType !== SPECIES_HERITAGE_SELECTED_TYPE ||
        !choice.selectedIndex ||
        !choice.sourceIndex
      ) {
        return false;
      }

      return true;
    })
    .map((choice) => ({
      choiceType: SPECIES_HERITAGE_CHOICE_TYPE,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: normalizeSpeciesChoiceSourceIndex(choice.sourceIndex, speciesIndex),
      selectedType: SPECIES_HERITAGE_SELECTED_TYPE,
      selectedIndex: choice.selectedIndex,
    }));
}

function normalizeSpeciesChoiceSourceIndex(sourceIndex: string | undefined, speciesIndex: string) {
  if (!sourceIndex) {
    return speciesIndex;
  }

  const [, ...choiceKeyParts] = sourceIndex.split(":");
  const choiceKey = choiceKeyParts.join(":");

  return choiceKey ? `${speciesIndex}:${choiceKey}` : speciesIndex;
}

function getFixedSpeciesLanguageIndexes(speciesIndex: string, sourceJson: unknown) {
  if (sourceJson && typeof sourceJson === "object") {
    const speciesSourceJson = sourceJson as SpeciesSourceJson;
    const sourceLanguageIndexes = (speciesSourceJson.languages ?? [])
      .map((language) => language.index)
      .filter((languageIndex): languageIndex is string => Boolean(languageIndex));

    if (sourceLanguageIndexes.length > 0) {
      return [...new Set(sourceLanguageIndexes)];
    }
  }

  return fallbackSpeciesLanguageIndexes[speciesIndex] ?? [];
}

async function replaceSpeciesLanguageChoicesAndRows(
  tx: Prisma.TransactionClient,
  characterId: string,
  speciesIndex: string,
  speciesSourceJson: unknown,
  choices: CharacterChoiceInput[] | undefined,
) {
  const speciesLanguageChoices = normalizeSpeciesLanguageChoices(choices, speciesIndex);
  const fixedLanguageIndexes = getFixedSpeciesLanguageIndexes(speciesIndex, speciesSourceJson);
  const selectedLanguageIndexes = speciesLanguageChoices.map((choice) => choice.selectedIndex);
  const languageIndexes = [...new Set([...fixedLanguageIndexes, ...selectedLanguageIndexes])];

  if (languageIndexes.length > 0) {
    const languages = await tx.refLanguage.findMany({
      where: {
        index: {
          in: languageIndexes,
        },
      },
      select: {
        index: true,
      },
    });
    const existingLanguageIndexes = new Set(languages.map((language) => language.index));
    const missingLanguageIndexes = languageIndexes.filter(
      (languageIndex) => !existingLanguageIndexes.has(languageIndex),
    );

    if (missingLanguageIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Language not found");
    }
  }

  await tx.characterChoice.deleteMany({
    where: {
      characterId,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      choiceType: SPECIES_LANGUAGE_CHOICE_TYPE,
    },
  });

  if (speciesLanguageChoices.length > 0) {
    await tx.characterChoice.createMany({
      data: speciesLanguageChoices.map((choice) => ({
        characterId,
        choiceType: choice.choiceType,
        sourceType: choice.sourceType,
        sourceIndex: choice.sourceIndex,
        selectedType: choice.selectedType,
        selectedIndex: choice.selectedIndex,
      })),
    });
  }

  await tx.characterLanguage.deleteMany({
    where: {
      characterId,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
    },
  });

  const fixedLanguageIndexSet = new Set(fixedLanguageIndexes);
  const selectedLanguageRows = speciesLanguageChoices
    .filter((choice) => !fixedLanguageIndexSet.has(choice.selectedIndex))
    .map((choice) => ({
      characterId,
      languageIndex: choice.selectedIndex,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: choice.sourceIndex,
    }));
  const languageRows = [
    ...fixedLanguageIndexes.map((languageIndex) => ({
      characterId,
      languageIndex,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      sourceIndex: `${speciesIndex}:fixed:${languageIndex}`,
    })),
    ...selectedLanguageRows,
  ];

  if (languageRows.length > 0) {
    await tx.characterLanguage.createMany({
      data: languageRows,
      skipDuplicates: true,
    });
  }
}

async function replaceSpeciesHeritageChoices(
  tx: Prisma.TransactionClient,
  characterId: string,
  speciesIndex: string,
  choices: CharacterChoiceInput[] | undefined,
) {
  const speciesHeritageChoices = normalizeSpeciesHeritageChoices(choices, speciesIndex);
  const selectedSubspeciesIndexes = [
    ...new Set(speciesHeritageChoices.map((choice) => choice.selectedIndex)),
  ];

  if (selectedSubspeciesIndexes.length > 0) {
    const subspecies = await tx.refSubspecies.findMany({
      where: {
        index: {
          in: selectedSubspeciesIndexes,
        },
        speciesIndex,
      },
      select: {
        index: true,
      },
    });
    const existingSubspeciesIndexes = new Set(
      subspecies.map((subspeciesOption) => subspeciesOption.index),
    );
    const missingSubspeciesIndexes = selectedSubspeciesIndexes.filter(
      (subspeciesIndex) => !existingSubspeciesIndexes.has(subspeciesIndex),
    );

    if (missingSubspeciesIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Species heritage not found");
    }
  }

  await tx.characterChoice.deleteMany({
    where: {
      characterId,
      sourceType: SPECIES_CHOICE_SOURCE_TYPE,
      choiceType: SPECIES_HERITAGE_CHOICE_TYPE,
    },
  });

  if (speciesHeritageChoices.length > 0) {
    await tx.characterChoice.createMany({
      data: speciesHeritageChoices.map((choice) => ({
        characterId,
        choiceType: choice.choiceType,
        sourceType: choice.sourceType,
        sourceIndex: choice.sourceIndex,
        selectedType: choice.selectedType,
        selectedIndex: choice.selectedIndex,
      })),
    });
  }
}

async function findAllowedClassSkillChoiceProficiencyIndexes(
  tx: Prisma.TransactionClient,
  classIndex: string,
) {
  const choices = await tx.refClassSkillChoice.findMany({
    where: {
      classIndex,
    },
    include: {
      options: {
        select: {
          proficiencyIndex: true,
        },
      },
    },
  });

  return new Set(
    choices.flatMap((choice) =>
      choice.options.map((option) => option.proficiencyIndex),
    ),
  );
}

function getSkillIndexesFromProficiencyIndexes(proficiencyIndexes: string[]) {
  return proficiencyIndexes
    .map(skillIndexFromProficiencyIndex)
    .filter((skillIndex): skillIndex is string => Boolean(skillIndex));
}

async function getClassProficiencyGrantIndexes(
  tx: Prisma.TransactionClient,
  classIndex: string,
  sourceJson: unknown,
) {
  const classProficiencyGrants: ClassProficiencyGrantIndex[] = await tx.refClassProficiencyGrant.findMany({
    where: {
      classIndex,
    },
    select: {
      proficiencyIndex: true,
    },
  });

  if (classProficiencyGrants.length > 0) {
    return [...new Set(classProficiencyGrants.map((grant: ClassProficiencyGrantIndex) => grant.proficiencyIndex))];
  }

  return getClassSavingThrowProficiencyIndexes(sourceJson);
}

async function findAllCharactersForUser(userId: string) {
  return prisma.character.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      species: {
        include: {
          traits: true,
          sizeOptions: true,
          subspecies: true,
        },
      },
      class: true,
      background: {
        include: {
          proficiencyGrants: {
            include: {
              proficiency: true,
            },
          },
          abilityOptions: {
            include: {
              abilityScore: true,
            },
          },
          featGrants: true,
        },
      },
      abilityScores: {
        include: {
          ability: true,
        },
      },
      skills: {
        orderBy: {
          skillIndex: "asc",
        },
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
      languages: {
        orderBy: {
          languageIndex: "asc",
        },
        include: {
          language: true,
        },
      },
      conditions: {
        orderBy: {
          appliedAt: "asc",
        },
        include: {
          condition: true,
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
      skills.map((skill: ReferenceIndexRecord) => skill.index),
    );
    const invalidSkillIndexes = data.skillIndexes.filter(
      (skillIndex) => !existingSkillIndexes.has(skillIndex),
    );

    if (invalidSkillIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Skill not found");
    }

    const classProficiencyGrantIndexes = await getClassProficiencyGrantIndexes(
      tx,
      characterClass.index,
      characterClass.sourceJson,
    );
    const classGrantedProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classProficiencyGrantIndexes,
        },
      },
    });
    const maxHp = Math.max(1, characterClass.hitDie + conModifier);

    const character = await tx.character.create({
      data: {
        userId,
        name: data.name,
        speciesIndex: data.speciesIndex,
        classIndex: data.classIndex,
        backgroundIndex: data.backgroundIndex,
        level: data.level ?? 1,
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
          create: skills.map((skill: ReferenceIndexRecord) => ({
            skillIndex: skill.index,
            isProficient: selectedSkillIndexes.has(skill.index),
            customBonus: 0,
          })),
        },
        proficiencies: {
          create: [
            ...selectedProficiencies.map((proficiency: ReferenceIndexRecord) => ({
              proficiencyIndex: proficiency.index,
              sourceType: "manual",
            })),
            ...classGrantedProficiencies.map(
              (proficiency: ReferenceIndexRecord) => ({
                proficiencyIndex: proficiency.index,
                sourceType: "class",
              }),
            ),
          ],
        },
      },
    });

    await replaceSpeciesLanguageChoicesAndRows(
      tx,
      character.id,
      species.index,
      species.sourceJson,
      data.choices,
    );
    await replaceSpeciesHeritageChoices(
      tx,
      character.id,
      species.index,
      data.choices,
    );

    return tx.character.findUnique({
      where: {
        id: character.id,
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

    const [
      species,
      characterClass,
      background,
      skills,
      selectedProficiencies,
      existingProficiencies,
    ] =
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
        tx.characterProficiency.findMany({
          where: {
            characterId,
          },
          select: {
            proficiencyIndex: true,
            sourceType: true,
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
      skills.map((skill: ReferenceIndexRecord) => skill.index),
    );
    const invalidSkillIndexes = data.skillIndexes.filter(
      (skillIndex) => !existingSkillIndexes.has(skillIndex),
    );

    if (invalidSkillIndexes.length > 0) {
      throw new CharacterReferenceNotFoundError("Skill not found");
    }

    const classSkillChoices = normalizeClassSkillChoices(data.choices, characterClass.index);
    const allowedClassSkillChoiceProficiencyIndexes =
      await findAllowedClassSkillChoiceProficiencyIndexes(tx, characterClass.index);
    const invalidClassSkillChoices = classSkillChoices.filter(
      (choice) => !allowedClassSkillChoiceProficiencyIndexes.has(choice.selectedIndex),
    );

    if (invalidClassSkillChoices.length > 0) {
      throw new CharacterReferenceNotFoundError("Class skill choice not found");
    }

    const classSkillChoiceProficiencyIndexes = [
      ...new Set(classSkillChoices.map((choice) => choice.selectedIndex)),
    ];
    const classSkillChoiceProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classSkillChoiceProficiencyIndexes,
        },
      },
    });
    const classProficiencyGrantIndexes = await getClassProficiencyGrantIndexes(
      tx,
      characterClass.index,
      characterClass.sourceJson,
    );
    const classGrantedProficiencies = await tx.refProficiency.findMany({
      where: {
        index: {
          in: classProficiencyGrantIndexes,
        },
      },
    });
    const preservedExistingSkillProficiencyIndexes = existingProficiencies
      .filter((proficiency) => {
        if (
          proficiency.sourceType === "class" ||
          proficiency.sourceType === CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE
        ) {
          return false;
        }

        return isSkillProficiencyIndex(proficiency.proficiencyIndex);
      })
      .map((proficiency) => proficiency.proficiencyIndex);
    const finalSkillIndexes = new Set([
      ...data.skillIndexes,
      ...getSkillIndexesFromProficiencyIndexes(preservedExistingSkillProficiencyIndexes),
      ...getSkillIndexesFromProficiencyIndexes(classProficiencyGrantIndexes),
      ...getSkillIndexesFromProficiencyIndexes(classSkillChoiceProficiencyIndexes),
    ]);
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
        level: data.level ?? existingCharacter.level,
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
      skills.map((skill: ReferenceIndexRecord) =>
        tx.characterSkill.upsert({
          where: {
            characterId_skillIndex: {
              characterId,
              skillIndex: skill.index,
            },
          },
          update: {
            isProficient: finalSkillIndexes.has(skill.index),
          },
          create: {
            characterId,
            skillIndex: skill.index,
            isProficient: finalSkillIndexes.has(skill.index),
            customBonus: 0,
          },
        }),
      ),
    );

    await tx.characterChoice.deleteMany({
      where: {
        characterId,
        sourceType: CLASS_CHOICE_SOURCE_TYPE,
        choiceType: CLASS_SKILL_CHOICE_TYPE,
      },
    });

    if (classSkillChoices.length > 0) {
      await tx.characterChoice.createMany({
        data: classSkillChoices.map((choice) => ({
          characterId,
          choiceType: choice.choiceType,
          sourceType: choice.sourceType,
          sourceIndex: choice.sourceIndex,
          selectedType: choice.selectedType,
          selectedIndex: choice.selectedIndex,
        })),
      });
    }

    await replaceSpeciesLanguageChoicesAndRows(
      tx,
      characterId,
      species.index,
      species.sourceJson,
      data.choices,
    );
    await replaceSpeciesHeritageChoices(
      tx,
      characterId,
      species.index,
      data.choices,
    );

    await tx.characterProficiency.deleteMany({
      where: {
        characterId,
        OR: [
          {
            sourceType: "class",
          },
          {
            sourceType: CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE,
          },
        ],
      },
    });

    if (selectedProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: selectedProficiencies.map((proficiency: ReferenceIndexRecord) => ({
          characterId,
          proficiencyIndex: proficiency.index,
          sourceType: "manual",
        })),
        skipDuplicates: true,
      });
    }

    if (classSkillChoiceProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: classSkillChoiceProficiencies.map(
          (proficiency: ReferenceIndexRecord) => ({
            characterId,
            proficiencyIndex: proficiency.index,
            sourceType: CLASS_CHOICE_PROFICIENCY_SOURCE_TYPE,
          }),
        ),
        skipDuplicates: true,
      });
    }

    if (classGrantedProficiencies.length > 0) {
      await tx.characterProficiency.createMany({
        data: classGrantedProficiencies.map(
          (proficiency: ReferenceIndexRecord) => ({
            characterId,
            proficiencyIndex: proficiency.index,
            sourceType: "class",
          }),
        ),
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

async function findCharacterByIdForUser(userId: string, characterId: string) {
  return prisma.character.findFirst({
    where: {
      id: characterId,
      userId,
    },
    include: characterInclude,
  });
}

async function addConditionToCharacterForUser(
  userId: string,
  characterId: string,
  conditionIndex: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const [character, condition] = await Promise.all([
      tx.character.findFirst({
        where: {
          id: characterId,
          userId,
        },
        select: {
          id: true,
        },
      }),
      tx.refCondition.findUnique({
        where: {
          index: conditionIndex,
        },
        select: {
          index: true,
        },
      }),
    ]);

    if (!character) {
      return null;
    }

    if (!condition) {
      throw new CharacterReferenceNotFoundError("Condition not found");
    }

    await tx.characterCondition.upsert({
      where: {
        characterId_conditionIndex: {
          characterId,
          conditionIndex,
        },
      },
      update: {},
      create: {
        characterId,
        conditionIndex,
      },
    });

    return tx.character.findUnique({
      where: {
        id: characterId,
      },
      include: characterInclude,
    });
  });
}

async function removeConditionFromCharacterForUser(
  userId: string,
  characterId: string,
  conditionIndex: string,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const character = await tx.character.findFirst({
      where: {
        id: characterId,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!character) {
      return null;
    }

    await tx.characterCondition.deleteMany({
      where: {
        characterId,
        conditionIndex,
      },
    });

    return tx.character.findUnique({
      where: {
        id: characterId,
      },
      include: characterInclude,
    });
  });
}

export {
  addConditionToCharacterForUser,
  CharacterReferenceNotFoundError,
  createCharacterForUser,
  deleteCharacterForUser,
  findAllCharactersForUser,
  findCharacterByIdForUser,
  removeConditionFromCharacterForUser,
  updateCharacterForUser,
};
export type { CharacterMutationData, CreateCharacterData };
