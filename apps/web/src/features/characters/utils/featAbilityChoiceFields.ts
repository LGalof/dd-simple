import {
  allAbilityScoreKeys,
  getFeatAbilityChoiceFieldIds,
  getFeatAbilityRule,
} from "@dd-simple/shared";
import type {
  FeatureChoiceField,
  FeatureChoiceOption,
} from "../types/characterBuilder";

type FeatChoiceOption = {
  label: string;
  value: string;
};

type FeatAbilityChoiceFieldConfig = {
  choiceGroupId: string;
  choiceGroupLabel: string;
  choiceGroupLimit: number;
  choiceKind?: FeatureChoiceField["choiceKind"];
  dependsOnFieldId: string;
  dependsOnValues: string[];
  id: string;
  label: string;
  options: FeatureChoiceOption[];
};

const abilityScoreLabels: Record<(typeof allAbilityScoreKeys)[number], string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
};
const skillLabels = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];
const weaponOptions = [
  { index: "weapon-battleaxe", label: "Battleaxe" },
  { index: "weapon-blowgun", label: "Blowgun" },
  { index: "weapon-club", label: "Club" },
  { index: "weapon-dagger", label: "Dagger" },
  { index: "weapon-dart", label: "Dart" },
  { index: "weapon-flail", label: "Flail" },
  { index: "weapon-glaive", label: "Glaive" },
  { index: "weapon-greataxe", label: "Greataxe" },
  { index: "weapon-greatclub", label: "Greatclub" },
  { index: "weapon-greatsword", label: "Greatsword" },
  { index: "weapon-halberd", label: "Halberd" },
  { index: "weapon-hand-crossbow", label: "Hand Crossbow" },
  { index: "weapon-handaxe", label: "Handaxe" },
  { index: "weapon-heavy-crossbow", label: "Heavy Crossbow" },
  { index: "weapon-javelin", label: "Javelin" },
  { index: "weapon-lance", label: "Lance" },
  { index: "weapon-light-crossbow", label: "Light Crossbow" },
  { index: "weapon-light-hammer", label: "Light Hammer" },
  { index: "weapon-longbow", label: "Longbow" },
  { index: "weapon-longsword", label: "Longsword" },
  { index: "weapon-mace", label: "Mace" },
  { index: "weapon-maul", label: "Maul" },
  { index: "weapon-morningstar", label: "Morningstar" },
  { index: "weapon-pike", label: "Pike" },
  { index: "weapon-quarterstaff", label: "Quarterstaff" },
  { index: "weapon-rapier", label: "Rapier" },
  { index: "weapon-scimitar", label: "Scimitar" },
  { index: "weapon-shortbow", label: "Shortbow" },
  { index: "weapon-shortsword", label: "Shortsword" },
  { index: "weapon-sickle", label: "Sickle" },
  { index: "weapon-sling", label: "Sling" },
  { index: "weapon-spear", label: "Spear" },
  { index: "weapon-trident", label: "Trident" },
  { index: "weapon-war-pick", label: "War Pick" },
  { index: "weapon-warhammer", label: "Warhammer" },
  { index: "weapon-whip", label: "Whip" },
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function createReferenceOption({
  index,
  label,
  name,
  type,
  url = `/api/2024/proficiencies/${index}`,
  value,
}: {
  index: string;
  label: string;
  name: string;
  type: string;
  url?: string;
  value?: string;
}): FeatureChoiceOption {
  return {
    label,
    selectedOptionIndex: index,
    selectedOptionName: name,
    selectedOptionType: type,
    selectedOptionUrl: url,
    selectedRawJson: {
      item: {
        index,
        name,
        url,
      },
    },
    value: value ?? index,
  };
}

function buildSavingThrowOptions() {
  return allAbilityScoreKeys.map((abilityIndex) => {
    const label = abilityScoreLabels[abilityIndex];

    return createReferenceOption({
      index: `saving-throw-${abilityIndex}`,
      label,
      name: `Saving Throw: ${label}`,
      type: "proficiency reference",
      value: abilityIndex,
    });
  });
}

function buildSkillReferenceOptions(type: "expertise modifier" | "proficiency reference") {
  return skillLabels.map((label) => {
    const normalizedSkill = slugify(label);

    return createReferenceOption({
      index: `skill-${normalizedSkill}`,
      label,
      name: `Skill: ${label}`,
      type,
      value: normalizedSkill,
    });
  });
}

function buildWeaponReferenceOptions() {
  return weaponOptions.map((weapon) =>
    createReferenceOption({
      index: weapon.index,
      label: weapon.label,
      name: `Weapon: ${weapon.label}`,
      type: "proficiency reference",
      value: slugify(weapon.label),
    }),
  );
}

function getFeatAbilityChoiceFieldConfigs(
  featFieldId: string,
  featOptions: FeatChoiceOption[],
) {
  const fieldConfigs: FeatAbilityChoiceFieldConfig[] = [];

  for (const featOption of featOptions) {
    const rule = getFeatAbilityRule(featOption.value);

    if (!rule?.selectableAbilities?.length) {
      continue;
    }

    const selectableAbilities = rule.selectableAbilities;

    const fieldIds = getFeatAbilityChoiceFieldIds(
      featOption.value,
      rule.selectableCount ?? 1,
    );

      fieldIds.forEach((fieldId, index) => {
      fieldConfigs.push({
        choiceGroupId: `feat-ability-${featOption.value}`,
        choiceGroupLabel:
          (rule.selectableCount ?? 1) > 1
            ? `Choose ${(rule.selectableCount ?? 1)} ability scores for ${featOption.label}`
            : `Choose 1 ability score for ${featOption.label}`,
        choiceGroupLimit: rule.selectableCount ?? 1,
        choiceKind: "option",
        dependsOnFieldId: featFieldId,
        dependsOnValues: [featOption.value],
        id: fieldId,
        label:
          (rule.selectableCount ?? 1) > 1
            ? `Ability Score ${index + 1}`
            : "Ability Score",
        options: selectableAbilities.map((abilityIndex) => ({
          label: abilityScoreLabels[abilityIndex] ?? abilityIndex.toUpperCase(),
          value: abilityIndex,
        })),
      });
    });
  }

  if (featOptions.some((featOption) => featOption.value === "resilient")) {
    fieldConfigs.push({
      choiceGroupId: "feat-save-resilient",
      choiceGroupLabel: "Choose 1 saving throw proficiency for Resilient",
      choiceGroupLimit: 1,
      choiceKind: "option",
      dependsOnFieldId: featFieldId,
      dependsOnValues: ["resilient"],
      id: "feat-save-resilient",
      label: "Saving Throw",
      options: buildSavingThrowOptions(),
    });
  }

  if (featOptions.some((featOption) => featOption.value === "skill-expert")) {
    fieldConfigs.push(
      {
        choiceGroupId: "feat-skill-skill-expert",
        choiceGroupLabel: "Choose 1 skill proficiency for Skill Expert",
        choiceGroupLimit: 1,
        choiceKind: "skill-proficiency",
        dependsOnFieldId: featFieldId,
        dependsOnValues: ["skill-expert"],
        id: "feat-skill-skill-expert",
        label: "Skill Proficiency",
        options: buildSkillReferenceOptions("proficiency reference"),
      },
      {
        choiceGroupId: "feat-expertise-skill-expert",
        choiceGroupLabel: "Choose 1 expertise skill for Skill Expert",
        choiceGroupLimit: 1,
        choiceKind: "expertise",
        dependsOnFieldId: featFieldId,
        dependsOnValues: ["skill-expert"],
        id: "feat-expertise-skill-expert",
        label: "Expertise Skill",
        options: buildSkillReferenceOptions("expertise modifier"),
      },
    );
  }

  if (featOptions.some((featOption) => featOption.value === "weapon-master")) {
    fieldConfigs.push({
      choiceGroupId: "feat-weapon-weapon-master",
      choiceGroupLabel: "Choose 1 weapon proficiency for Weapon Master",
      choiceGroupLimit: 1,
      choiceKind: "weapon-proficiency",
      dependsOnFieldId: featFieldId,
      dependsOnValues: ["weapon-master"],
      id: "feat-weapon-weapon-master",
      label: "Weapon Proficiency",
      options: buildWeaponReferenceOptions(),
    });
  }

  return fieldConfigs;
}

export { getFeatAbilityChoiceFieldConfigs };
