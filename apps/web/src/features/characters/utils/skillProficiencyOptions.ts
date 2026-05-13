import type {
  ReferenceBackground,
  ReferenceClass,
  ReferenceSkill,
} from "../../../types/reference";

type SkillChoiceOption = {
  skillIndex: string;
  name: string;
};

type ClassSkillChoice = {
  choose: number;
  description: string;
  options: SkillChoiceOption[];
};

type ReferenceItem = {
  index?: unknown;
  name?: unknown;
};

type ReferenceOption = {
  item?: ReferenceItem;
};

type ProficiencyChoice = {
  choose?: unknown;
  desc?: unknown;
  from?: {
    options?: ReferenceOption[];
  };
  type?: unknown;
};

type ProficiencySourceJson = {
  proficiencies?: ReferenceItem[];
  proficiency_choices?: ProficiencyChoice[];
};

function skillIndexFromProficiencyIndex(index: string) {
  return index.startsWith("skill-") ? index.replace("skill-", "") : null;
}

function skillNameFromProficiencyName(name: string, fallback: string) {
  return name.startsWith("Skill: ") ? name.replace("Skill: ", "") : fallback;
}

function isProficiencySourceJson(value: unknown): value is ProficiencySourceJson {
  return Boolean(value && typeof value === "object");
}

function getClassSkillChoice(characterClass?: ReferenceClass | null): ClassSkillChoice | null {
  if (!isProficiencySourceJson(characterClass?.sourceJson)) {
    return null;
  }

  const skillChoice = characterClass.sourceJson.proficiency_choices?.find((choice) => {
    const options = choice.from?.options ?? [];

    return options.some((option) => {
      const index = option.item?.index;

      return typeof index === "string" && index.startsWith("skill-");
    });
  });

  if (!skillChoice) {
    return null;
  }

  const options = (skillChoice.from?.options ?? []).flatMap((option) => {
    const proficiencyIndex = option.item?.index;

    if (typeof proficiencyIndex !== "string") {
      return [];
    }

    const skillIndex = skillIndexFromProficiencyIndex(proficiencyIndex);

    if (!skillIndex) {
      return [];
    }

    const proficiencyName =
      typeof option.item?.name === "string" ? option.item.name : skillIndex;

    return [
      {
        skillIndex,
        name: skillNameFromProficiencyName(proficiencyName, skillIndex),
      },
    ];
  });

  if (options.length === 0 || typeof skillChoice.choose !== "number") {
    return null;
  }

  return {
    choose: skillChoice.choose,
    description:
      typeof skillChoice.desc === "string"
        ? skillChoice.desc
        : `Choose ${skillChoice.choose} skill proficiencies`,
    options,
  };
}

function getBackgroundSkillIndexes(background?: ReferenceBackground | null) {
  if (!isProficiencySourceJson(background?.sourceJson)) {
    return [];
  }

  return (background.sourceJson.proficiencies ?? []).flatMap((proficiency) => {
    const proficiencyIndex = proficiency.index;

    if (typeof proficiencyIndex !== "string") {
      return [];
    }

    const skillIndex = skillIndexFromProficiencyIndex(proficiencyIndex);

    return skillIndex ? [skillIndex] : [];
  });
}

function getSkillName(skillIndex: string, skills: ReferenceSkill[]) {
  return skills.find((skill) => skill.index === skillIndex)?.name ?? skillIndex;
}

export {
  getBackgroundSkillIndexes,
  getClassSkillChoice,
  getSkillName,
};
export type { ClassSkillChoice, SkillChoiceOption };
