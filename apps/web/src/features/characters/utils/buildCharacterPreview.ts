import type { Character } from "../../../types/character";
import type {
  BackgroundOption,
  CharacterBuilderState,
  ClassOption,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import { abilityModifier } from "./characterFormat";

const backgroundAbilityPlanTwoScores = "increase-two-scores-2-1";
const backgroundAbilityPlanThreeScores = "increase-all-three-by-1";
const abilityScoreIndexAliases: Record<string, string> = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

type BuildCharacterPreviewOptions = {
  background: BackgroundOption;
  character: Character;
  classOption: ClassOption;
  persistedSkillIndexes?: string[];
  selectedSkillIndexes?: string[];
  species: SpeciesOption;
  state: CharacterBuilderState;
};

type HitPointPreview = {
  averageHp: number;
  bonusHp: number;
  calculationMode: "fixed" | "rolled" | "override";
  constitutionBonus: number;
  fixedClassHp: number;
  hitDie: number;
  maxHp: number;
  overrideMaxHp: number | null;
  possibleHp: number;
  rolledClassHp: number;
  rolledHitPoints: number[];
  totalFixedHp: number;
  totalRolledHp: number;
};

type CalculateHitPointPreviewOptions = {
  constitutionScore: number;
  hitDie: number;
  level: number;
  settings: HitPointSettings;
};

function buildCharacterPreview({
  background,
  character,
  classOption,
  persistedSkillIndexes,
  selectedSkillIndexes = [],
  species,
  state,
}: BuildCharacterPreviewOptions): Character {
  const assignedScores = Object.fromEntries(
    state.abilityAssignments.map((assignment) => [assignment.abilityIndex, assignment.score]),
  );

  const backgroundAbilityBonuses = getBackgroundAbilityBonuses(
    state.backgroundChoices,
    background,
  );
  const nextAbilityScores = character.abilityScores.map((abilityScore) => {
    const baseScore =
      assignedScores[abilityScore.abilityIndex] ??
      abilityScore.baseScore ??
      abilityScore.score;

    return {
      ...abilityScore,
      baseScore,
      score: baseScore + (backgroundAbilityBonuses.get(abilityScore.abilityIndex) ?? 0),
    };
  });

  const dexterityScore =
    nextAbilityScores.find((abilityScore) => abilityScore.abilityIndex === "dex")?.score ?? 10;
  const constitutionScore =
    nextAbilityScores.find((abilityScore) => abilityScore.abilityIndex === "con")?.score ?? 10;

  const dexterityModifier = abilityModifier(dexterityScore);
  const hitPointPreview = calculateHitPointPreview({
    constitutionScore,
    hitDie: classOption.hitDie,
    level: state.level,
    settings: state.hitPointSettings,
  });
  const selectedSkillIndexSet = new Set(selectedSkillIndexes);
  const backgroundSkillIndexSet = new Set(
    background.skillProficiencies.map(canonicalSkillIndex).filter(Boolean),
  );
  const persistedSkillIndexSet = new Set(
    persistedSkillIndexes ??
      character.skills
        .filter((characterSkill) => characterSkill.isProficient)
        .map((characterSkill) => characterSkill.skillIndex),
  );

  return {
    ...character,
    level: state.level,
    maxHp: hitPointPreview.maxHp,
    currentHp: Math.max(0, Math.min(hitPointPreview.maxHp, state.currentHp)),
    armorClass: 10 + dexterityModifier,
    speed: species.speed,
    species: {
      name: species.name,
    },
    class: {
      name: classOption.name,
      proficiencies: classOption.proficiencies,
    } as Character["class"],
    background: {
      name: background.name,
      skillProficiencies: background.skillProficiencies,
      toolProficiencies: [
        ...background.toolProficiencies,
        ...getSelectedBackgroundToolProficiencies(state.backgroundChoices, background),
      ],
    } as Character["background"],
    abilityScores: nextAbilityScores,
    skills: character.skills.map((characterSkill) => ({
      ...characterSkill,
      isProficient:
        persistedSkillIndexSet.has(characterSkill.skillIndex) ||
        backgroundSkillIndexSet.has(canonicalSkillIndex(characterSkill.skillIndex)) ||
        selectedSkillIndexSet.has(characterSkill.skillIndex),
    })),
    featureChoices: filterActiveFeatureChoices(
      character.featureChoices,
      classOption.index,
      background.index,
    ),
    proficiencies: character.proficiencies,
  };
}

function filterActiveFeatureChoices(
  featureChoices: Character["featureChoices"],
  classIndex: string,
  backgroundIndex: string,
) {
  return (featureChoices ?? []).filter((choice) => {
    if (choice.sourceType === "BACKGROUND") {
      return choice.sourceIndex === backgroundIndex;
    }

    if (choice.sourceType === "CLASS") {
      return choice.classIndex === classIndex || choice.sourceIndex === classIndex;
    }

    if (choice.sourceType === "FEATURE") {
      return choice.classIndex === classIndex;
    }

    return true;
  });
}

function getSelectedBackgroundToolProficiencies(
  backgroundChoices: Record<string, string>,
  background: BackgroundOption,
) {
  const toolNames: string[] = [];

  for (const section of background.previewSections) {
    for (const field of section.choiceFields ?? []) {
      if (!field.sourceType || field.sourceType !== "BACKGROUND" || isEquipmentChoicePath(field.choicePath)) {
        continue;
      }

      const selectedValue = backgroundChoices[`${background.index}:${section.id}:${field.id}`];
      const selectedOption = field.options.find((option) => option.value === selectedValue);

      if (
        selectedOption?.selectedOptionUrl?.includes("/proficiencies/") &&
        isToolLikeProficiency(
          selectedOption.selectedOptionIndex ?? selectedOption.value,
          selectedOption.selectedOptionName ?? selectedOption.label,
        )
      ) {
        toolNames.push(stripReferencePrefix(selectedOption.selectedOptionName ?? selectedOption.label));
      }
    }
  }

  return uniqueValues(toolNames);
}

function getBackgroundAbilityBonuses(
  backgroundChoices: Record<string, string>,
  background: BackgroundOption,
) {
  const bonuses = new Map<string, number>();
  const selectedPlan =
    Object.entries(backgroundChoices).find(([choiceKey]) => choiceKey.endsWith(":score-plan"))
      ?.[1] ?? backgroundAbilityPlanTwoScores;

  if (selectedPlan === backgroundAbilityPlanThreeScores) {
    for (const abilityIndex of getSupportedBackgroundAbilityIndexes(background)) {
      const canonicalAbilityIndex = canonicalAbilityScoreIndex(abilityIndex);

      if (canonicalAbilityIndex && !bonuses.has(canonicalAbilityIndex)) {
        bonuses.set(canonicalAbilityIndex, 1);
      }
    }

    return bonuses;
  }

  const primaryAbility = getBackgroundChoiceValue(backgroundChoices, "score-a");
  const secondaryAbility = getBackgroundChoiceValue(backgroundChoices, "score-b");

  if (primaryAbility) {
    bonuses.set(primaryAbility, 2);
  }

  if (secondaryAbility && !bonuses.has(secondaryAbility)) {
    bonuses.set(secondaryAbility, 1);
  }

  return bonuses;
}

function getSupportedBackgroundAbilityIndexes(background: BackgroundOption) {
  const abilityScoreSection = background.previewSections.find((section) =>
    section.id.endsWith("ability-scores"),
  );
  const scoreField = abilityScoreSection?.choiceFields?.find((field) => field.id === "score-a");

  return scoreField?.options.map((option) => option.value) ?? [];
}

function getBackgroundChoiceValue(backgroundChoices: Record<string, string>, fieldId: string) {
  const selectedValue = Object.entries(backgroundChoices).find(([choiceKey]) =>
    choiceKey.endsWith(`:${fieldId}`),
  )?.[1];

  return canonicalAbilityScoreIndex(selectedValue);
}

function canonicalSkillIndex(value: string | undefined) {
  if (!value) {
    return "";
  }

  return stripReferencePrefix(value)
    .toLowerCase()
    .replace(/^skill-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function stripReferencePrefix(value: string) {
  return value.replace(/^Skill: /, "").replace(/^Tool: /, "").replace(/^Saving Throw: /, "");
}

function isEquipmentChoicePath(choicePath: string | undefined) {
  return choicePath?.toLowerCase().includes("equipment") ?? false;
}

function isToolLikeProficiency(index: string, name: string) {
  const normalizedIndex = index.toLowerCase();
  const normalizedName = name.toLowerCase();

  return [
    "bagpipes",
    "cards",
    "chess",
    "dice",
    "drum",
    "dulcimer",
    "flute",
    "horn",
    "lute",
    "lyre",
    "pan-flute",
    "shawm",
    "viol",
    "supplies",
    "tools",
    "utensils",
    "kit",
    "instrument",
    "vehicle",
  ].some(
    (keyword) =>
      normalizedIndex.includes(keyword) ||
      normalizedName.includes(keyword.replace(/-/g, " ")),
  );
}

function uniqueValues(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function canonicalAbilityScoreIndex(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .toLowerCase()
    .replace(/^ability-/, "")
    .replace(/-score$/, "");

  return abilityScoreIndexAliases[normalizedValue] ?? null;
}

function calculateHitPointPreview({
  constitutionScore,
  hitDie,
  level,
  settings,
}: CalculateHitPointPreviewOptions): HitPointPreview {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const normalizedHitDie = Math.max(1, Math.floor(hitDie));
  const fixedGainPerLevel = Math.floor(normalizedHitDie / 2) + 1;
  const constitutionBonus = abilityModifier(constitutionScore) * normalizedLevel;
  const fixedClassHp = normalizedHitDie + (normalizedLevel - 1) * fixedGainPerLevel;
  const rolledHitPoints = synchronizeHitPointRolls(
    normalizedLevel,
    normalizedHitDie,
    settings.rolledHitPoints,
  );
  const rolledClassHp = rolledHitPoints.reduce((total, dieValue) => total + dieValue, 0);
  const bonusHp = settings.bonusHp;
  const totalFixedHp = Math.max(1, fixedClassHp + constitutionBonus + bonusHp);
  const totalRolledHp = Math.max(1, rolledClassHp + constitutionBonus + bonusHp);
  const averageHp = Math.max(
    1,
    Math.floor(
      normalizedHitDie +
        (normalizedLevel - 1) * ((normalizedHitDie + 1) / 2) +
        constitutionBonus +
        bonusHp,
    ),
  );
  const possibleHp = Math.max(
    1,
    normalizedHitDie * normalizedLevel + constitutionBonus + bonusHp,
  );
  const overrideMaxHp =
    settings.overrideMaxHp === null ? null : Math.max(1, settings.overrideMaxHp);
  const calculationMode = settings.calculationMode;
  const baseMaxHp = calculationMode === "rolled" ? totalRolledHp : totalFixedHp;
  const maxHp = calculationMode === "override" && overrideMaxHp !== null ? overrideMaxHp : baseMaxHp;

  return {
    averageHp,
    bonusHp,
    calculationMode,
    constitutionBonus,
    fixedClassHp,
    hitDie: normalizedHitDie,
    maxHp,
    overrideMaxHp,
    possibleHp,
    rolledClassHp,
    rolledHitPoints,
    totalFixedHp,
    totalRolledHp,
  };
}

function synchronizeHitPointRolls(level: number, hitDie: number, rolls: number[]) {
  return Array.from({ length: level }, (_, index) => {
    const existingValue = rolls[index];

    if (Number.isFinite(existingValue) && existingValue >= 1 && existingValue <= hitDie) {
      return Math.floor(existingValue);
    }

    return rollHitDie(hitDie);
  });
}

function rollHitDie(hitDie: number) {
  return Math.floor(Math.random() * hitDie) + 1;
}

export { buildCharacterPreview, calculateHitPointPreview, rollHitDie, synchronizeHitPointRolls };
export type { HitPointPreview };
