import type {
  ClassFeature,
  FeatureChoiceField,
  FeatureChoiceOption,
} from "../types/characterBuilder";
import { findSpellLibraryRecordByName } from "./spellLibrary";

type DerivedFeatureChoiceSource = {
  description: string;
  level: number | null;
  sourceIndex: string;
  sourceType: "class_feature" | "species_trait" | "subclass_feature";
  title: string;
};

type FeatureChoiceGrants = {
  armorNames?: string[];
  derivedSources?: DerivedFeatureChoiceSource[];
  expertiseSkillIndexes?: string[];
  expertiseToolNames?: string[];
  languageNames?: string[];
  savingThrowProficiencyIndexes?: string[];
  skillAbilityModifierBonusByIndex?: Record<string, "str" | "dex" | "con" | "int" | "wis" | "cha">;
  skillProficiencyIndexes?: string[];
  toolNames?: string[];
  weaponNames?: string[];
};

const WEAPON_MASTERY_DESCRIPTIONS: Record<string, string> = {
  cleave: "If you hit a creature with this weapon, you can make a melee attack roll with it against a second creature within 5 feet of the first and within your reach.",
  graze: "If your attack roll misses a creature, you can still deal damage to that creature equal to the ability modifier used to make the attack roll.",
  nick: "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can still make only one extra attack from Light weapons each turn.",
  push: "If you hit a Large or smaller creature with this weapon, you can push it up to 10 feet straight away from yourself.",
  sap: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
  slow: "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn.",
  topple: "If you hit a Large or smaller creature with this weapon, you can force it to make a Constitution saving throw or have the Prone condition.",
  vex: "If you hit a creature with this weapon and deal damage to it, you have Advantage on your next attack roll against that creature before the end of your next turn.",
};

function buildFeatureChoiceGrants(
  feature: ClassFeature,
  field: FeatureChoiceField,
  selectedOption: FeatureChoiceOption,
): FeatureChoiceGrants | null {
  const selectedIndex = (selectedOption.selectedOptionIndex ?? selectedOption.value ?? "").toLowerCase();
  const selectedName = selectedOption.selectedOptionName ?? selectedOption.label;
  const selectedUrl = selectedOption.selectedOptionUrl ?? null;
  const sourceType = resolveDerivedSourceType(field);
  const level = field.level ?? feature.level ?? null;
  const choiceKind = field.choiceKind ?? "option";
  const explicitGrants = getExplicitFeatureChoiceGrants(selectedOption.selectedRawJson);

  if (explicitGrants) {
    return explicitGrants;
  }

  const directDescription =
    selectedOption.description?.trim() ||
    (choiceKind === "weapon-mastery"
        ? WEAPON_MASTERY_DESCRIPTIONS[selectedIndex]
        : null);

  if (directDescription) {
    return {
      derivedSources: [
        {
          description: directDescription,
          level,
          sourceIndex: selectedIndex || slugify(selectedName),
          sourceType,
          title: selectedName,
        },
      ],
    };
  }

  if (choiceKind === "scholar") {
    return {
      derivedSources: [
        {
          description: `You gain Expertise in ${stripReferencePrefix(selectedName)}.`,
          level,
          sourceIndex: `scholar-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Scholar: ${stripReferencePrefix(selectedName)}`,
        },
      ],
      expertiseSkillIndexes: [toSkillIndex(selectedName)],
    };
  }

  if (choiceKind === "expertise") {
    const normalizedName = stripReferencePrefix(selectedName);
    const skillIndex = toSkillIndex(selectedName);

    return {
      derivedSources: [
        {
          description: `${normalizedName} gains Expertise for this character.`,
          level,
          sourceIndex: `expertise-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Expertise: ${normalizedName}`,
        },
      ],
      ...(skillIndex
        ? { expertiseSkillIndexes: [skillIndex] }
        : { expertiseToolNames: [normalizedName] }),
    };
  }

  if (choiceKind === "skill-proficiency") {
    const skillIndex = toSkillIndex(selectedName);
    const normalizedName = stripReferencePrefix(selectedName);
    const isToolChoice = selectedName.toLowerCase().startsWith("tool:");

    return {
      derivedSources: [
        {
          description: `You gain proficiency with ${normalizedName}.`,
          level,
          sourceIndex: `proficiency-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Proficiency: ${normalizedName}`,
        },
      ],
      ...(!isToolChoice && skillIndex
        ? { skillProficiencyIndexes: [skillIndex] }
        : { toolNames: [normalizedName] }),
    };
  }

  if (field.id === "feat-ability-resilient") {
    const abilityIndex = selectedOption.value.toLowerCase();

    return {
      derivedSources: [
        {
          description: `You increase ${selectedName} by 1 and gain proficiency in ${selectedName} saving throws.`,
          level,
          sourceIndex: `resilient-${abilityIndex}`,
          sourceType,
          title: `Resilient: ${selectedName}`,
        },
      ],
      savingThrowProficiencyIndexes: [`saving-throw-${abilityIndex}`],
    };
  }

  if (choiceKind === "tool-proficiency") {
    const normalizedName = stripReferencePrefix(selectedName);

    return {
      derivedSources: [
        {
          description: `You gain proficiency with ${normalizedName}.`,
          level,
          sourceIndex: `tool-proficiency-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Tool Proficiency: ${normalizedName}`,
        },
      ],
      toolNames: [normalizedName],
    };
  }

  if (choiceKind === "language") {
    const normalizedName = stripReferencePrefix(selectedName);

    return {
      derivedSources: [
        {
          description: `You learn ${normalizedName}.`,
          level,
          sourceIndex: `language-${selectedIndex || slugify(selectedName)}`,
          sourceType,
          title: `Language: ${normalizedName}`,
        },
      ],
      languageNames: [normalizedName],
    };
  }

  if (shouldCreateSpellSource(field, selectedUrl, selectedName)) {
    return {
      derivedSources: [
        {
          description: buildSpellChoiceDescription(feature.title, selectedName, field.label),
          level,
          sourceIndex: selectedIndex || slugify(selectedName),
          sourceType,
          title: selectedName,
        },
      ],
    };
  }

  return null;
}

function getExplicitFeatureChoiceGrants(selectedRawJson: unknown): FeatureChoiceGrants | null {
  if (!isRecord(selectedRawJson) || !isRecord(selectedRawJson.grants)) {
    return null;
  }

  return selectedRawJson.grants as FeatureChoiceGrants;
}

function shouldCreateSpellSource(
  field: FeatureChoiceField,
  selectedUrl: string | null,
  selectedName: string,
) {
  if (selectedUrl?.toLowerCase().includes("/spells/")) {
    return true;
  }

  const searchableText = [
    field.choiceKind,
    field.choiceGroupId,
    field.choiceGroupLabel,
    field.choiceKey,
    field.choiceLabel,
    field.label,
    selectedUrl,
    selectedName,
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return (
    searchableText.includes(" cantrip") ||
    searchableText.includes("level 1 spell") ||
    searchableText.includes("prepared spell") ||
    searchableText.includes("mystic arcanum") ||
    searchableText.includes("ritual")
  );
}

function buildSpellChoiceDescription(
  featureTitle: string,
  selectedName: string,
  fieldLabel: string,
) {
  const normalizedField = fieldLabel.toLowerCase();
  const normalizedFeatureTitle = featureTitle.toLowerCase();
  const spellRecord = findSpellLibraryRecordByName(selectedName);

  if (normalizedFeatureTitle.includes("magical discoveries")) {
    if (spellRecord?.level === 0) {
      return `You learn the cantrip ${selectedName} through ${featureTitle}.`;
    }

    if (typeof spellRecord?.level === "number") {
      return `You add the level ${spellRecord.level} spell ${selectedName} to the spells prepared through ${featureTitle}.`;
    }

    return `You add the spell ${selectedName} to the spells prepared through ${featureTitle}.`;
  }

  if (
    normalizedFeatureTitle.includes("spell mastery") ||
    normalizedFeatureTitle.includes("signature spells")
  ) {
    if (typeof spellRecord?.level === "number") {
      return `You add the level ${spellRecord.level} spell ${selectedName} to the spells prepared through ${featureTitle}.`;
    }

    return `You add the spell ${selectedName} to the spells prepared through ${featureTitle}.`;
  }

  if (normalizedFeatureTitle.includes("magic initiate")) {
    if (spellRecord?.level === 0) {
      return `You learn the cantrip ${selectedName} through ${featureTitle}.`;
    }

    if (typeof spellRecord?.level === "number") {
      return `You learn the level ${spellRecord.level} spell ${selectedName} through ${featureTitle}.`;
    }
  }

  if (normalizedField.includes("cantrip")) {
    return `You learn the cantrip ${selectedName} through ${featureTitle}.`;
  }

  if (typeof spellRecord?.level === "number") {
    return `You learn the level ${spellRecord.level} spell ${selectedName} through ${featureTitle}.`;
  }

  if (normalizedField.includes("prepared")) {
    return `You add ${selectedName} to the spells prepared through ${featureTitle}.`;
  }

  if (normalizedField.includes("spellbook")) {
    return `You add the spell ${selectedName} to your spellbook through ${featureTitle}.`;
  }

  if (normalizedField.includes("ritual")) {
    return `You add the ritual spell ${selectedName} through ${featureTitle}.`;
  }

  if (featureTitle.toLowerCase().includes("mystic arcanum")) {
    return `You can cast the spell ${selectedName} through ${featureTitle}.`;
  }

  return `You learn or gain access to the spell ${selectedName} through ${featureTitle}.`;
}

function resolveDerivedSourceType(
  field: FeatureChoiceField,
): DerivedFeatureChoiceSource["sourceType"] {
  if (field.sourceType === "SPECIES") {
    return "species_trait";
  }

  if (field.subclassIndex) {
    return "subclass_feature";
  }

  return "class_feature";
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stripReferencePrefix(value: string) {
  return value
    .replace(/^Skill: /, "")
    .replace(/^Tool: /, "")
    .replace(/^Saving Throw: /, "");
}

function toSkillIndex(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/^skill:\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return normalized.length > 0 && !normalized.includes("tool") ? normalized : "";
}

export { buildFeatureChoiceGrants };
