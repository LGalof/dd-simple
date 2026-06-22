import type { Character, CharacterFeatureChoiceSelection } from "../../../types/character";
import {
  buildFeatAbilityBonuses,
  getFeatAbilityChoiceFieldIds,
  getFeatAbilityRule,
} from "@dd-simple/shared";
import type {
  BackgroundOption,
  CharacterBuilderState,
  ClassOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import { abilityModifier } from "./characterFormat";
import { mergeFeatureChoiceSelections } from "./buildFeatureChoiceSelections";

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
  featureChoices?: FeatureChoiceSelections;
  previewFeatureSelections?: CharacterFeatureChoiceSelection[];
  previewSubclassIndex?: string | null;
  persistedSkillIndexes?: string[];
  selectedSkillIndexes?: string[];
  species: SpeciesOption;
  state: CharacterBuilderState;
};

const ABILITY_CHOICE_TO_INDEX: Record<string, string> = {
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
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
  featureBonusHp?: number;
  hitDie: number;
  level: number;
  settings: HitPointSettings;
};

function buildCharacterPreview({
  background,
  character,
  classOption,
  featureChoices = {},
  previewFeatureSelections = [],
  previewSubclassIndex,
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
  const nextAbilityScores = applyAbilityScoreImprovements(
    character.abilityScores.map((abilityScore) => {
      const baseScore =
        assignedScores[abilityScore.abilityIndex] ??
        abilityScore.baseScore ??
        abilityScore.score;

      return {
        ...abilityScore,
        baseScore,
        score: baseScore + (backgroundAbilityBonuses.get(abilityScore.abilityIndex) ?? 0),
      };
    }),
    classOption,
    featureChoices,
    state.level,
  );

  const dexterityScore =
    nextAbilityScores.find((abilityScore) => abilityScore.abilityIndex === "dex")?.score ?? 10;
  const constitutionScore =
    nextAbilityScores.find((abilityScore) => abilityScore.abilityIndex === "con")?.score ?? 10;
  const featureBonusHp = getFeatureChoiceHitPointBonus(
    classOption,
    featureChoices,
    state.level,
  );

  const dexterityModifier = abilityModifier(dexterityScore);
  const hitPointPreview = calculateHitPointPreview({
    constitutionScore,
    featureBonusHp,
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
    subclassIndex: previewSubclassIndex ?? state.subclassIndex,
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
    featureChoices: mergeFeatureChoiceSelections(
      filterActiveFeatureChoices(
        character.featureChoices,
        classOption.index,
        background.index,
      ),
      previewFeatureSelections,
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
  featureBonusHp = 0,
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
  const bonusHp = settings.bonusHp + featureBonusHp;
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

function isAbilityScoreImprovementFeature(feature: ClassOption["features"][number]) {
  const choiceFieldIds = new Set((feature.choiceFields ?? []).map((field) => field.id));

  return (
    choiceFieldIds.has("asi-mode") &&
    (choiceFieldIds.has("asi-score-1") || choiceFieldIds.has("asi-score"))
  );
}

function applyAbilityScoreImprovements(
  abilityScores: Character["abilityScores"],
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
  _level: number,
) {
  const increases = new Map<string, number>();

  for (const feature of classOption.features) {
    if (isAbilityScoreImprovementFeature(feature)) {
      const selectedMode = featureChoices[`${feature.id}:asi-mode`];

      if (selectedMode === "ability-score-improvement") {
        for (const fieldId of ["asi-score-1", "asi-score-2"]) {
          const selectedAbility = featureChoices[`${feature.id}:${fieldId}`];
          const abilityIndex = selectedAbility ? ABILITY_CHOICE_TO_INDEX[selectedAbility] : undefined;

          if (!abilityIndex) {
            continue;
          }

          increases.set(abilityIndex, (increases.get(abilityIndex) ?? 0) + 1);
        }
      }
    }

    for (const field of feature.choiceFields ?? []) {
      if (field.choiceKind !== "asi-feat" && field.choiceKind !== "epic-boon") {
        continue;
      }

      const selectedFeatIndex = featureChoices[`${feature.id}:${field.id}`];
      const featRule = getFeatAbilityRule(selectedFeatIndex);

      if (!selectedFeatIndex || !featRule) {
        continue;
      }

      const selectedFeatAbilityIndexes = getFeatAbilityChoiceFieldIds(
        selectedFeatIndex,
        featRule.selectableCount ?? 1,
      )
        .map((fieldId) => featureChoices[`${feature.id}:${fieldId}`])
        .map((value) => ABILITY_CHOICE_TO_INDEX[value ?? ""] ?? null);
      const featBonuses = buildFeatAbilityBonuses(
        selectedFeatIndex,
        selectedFeatAbilityIndexes,
      );

      for (const [abilityIndex, bonus] of Object.entries(featBonuses)) {
        if (!bonus) {
          continue;
        }

        increases.set(abilityIndex, (increases.get(abilityIndex) ?? 0) + bonus);
      }
    }
  }

  if (!increases.size) {
    return abilityScores;
  }

  return abilityScores.map((abilityScore) => ({
    ...abilityScore,
    score: abilityScore.score + (increases.get(abilityScore.abilityIndex) ?? 0),
  }));
}

function getSelectedFeatIndexesForPreview(
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
  characterLevel: number,
) {
  const featIndexes = new Set<string>();

  for (const feature of classOption.features) {
    if (feature.level > characterLevel) {
      continue;
    }

    for (const field of feature.choiceFields ?? []) {
      const selectedValue = featureChoices[`${feature.id}:${field.id}`];

      if (!selectedValue) {
        continue;
      }

      const selectedOption = field.options.find((option) => option.value === selectedValue);
      const selectedOptionUrl = selectedOption?.selectedOptionUrl?.toLowerCase() ?? "";
      const selectedOptionIndex = selectedOption?.selectedOptionIndex?.toLowerCase() ?? "";
      const searchText = [
        field.choiceKind,
        field.choiceGroupId,
        field.choiceGroupLabel,
        field.choiceKey,
        field.choiceLabel,
        field.label,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();
      const isSpecificFeatReference =
        selectedOptionUrl.includes("/feats/") ||
        (searchText.includes("feat") && selectedOptionIndex !== "feat");

      if (!isSpecificFeatReference) {
        continue;
      }
      const featIndex = selectedOption?.selectedOptionIndex ?? selectedOption?.value;

      if (featIndex) {
        featIndexes.add(featIndex);
      }
    }
  }

  return [...featIndexes];
}

function getFeatureChoiceHitPointBonus(
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
  characterLevel: number,
) {
  const selectedFeatIndexes = getSelectedFeatIndexesForPreview(
    classOption,
    featureChoices,
    characterLevel,
  );

  return selectedFeatIndexes.includes("tough") ? characterLevel * 2 : 0;
}

export {
  buildCharacterPreview,
  calculateHitPointPreview,
  getFeatureChoiceHitPointBonus,
  getSelectedFeatIndexesForPreview,
  rollHitDie,
  synchronizeHitPointRolls,
};
export type { HitPointPreview };
