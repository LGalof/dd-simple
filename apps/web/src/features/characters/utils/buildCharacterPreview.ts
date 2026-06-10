import type { Character } from "../../../types/character";
import type {
  BackgroundOption,
  CharacterBuilderState,
  ClassOption,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import { abilityModifier } from "./characterFormat";

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

  const nextAbilityScores = character.abilityScores.map((abilityScore) => ({
    ...abilityScore,
    score: assignedScores[abilityScore.abilityIndex] ?? abilityScore.score,
  }));

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
      toolProficiencies: background.toolProficiencies,
    } as Character["background"],
    abilityScores: nextAbilityScores,
    skills: character.skills.map((characterSkill) => ({
      ...characterSkill,
      isProficient:
        persistedSkillIndexSet.has(characterSkill.skillIndex) ||
        selectedSkillIndexSet.has(characterSkill.skillIndex),
    })),
    proficiencies: character.proficiencies,
  };
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
