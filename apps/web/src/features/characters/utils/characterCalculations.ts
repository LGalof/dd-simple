type CalculateSkillBonusArgs = {
  abilityScore: number;
  characterLevel: number;
  customBonus: number;
  isProficient: boolean;
};

type CalculateSavingThrowBonusArgs = {
  abilityIndex: string;
  abilityScore: number;
  characterLevel: number;
  proficiencyIndexes: string[];
};

function calculateAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatSignedModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function calculateProficiencyBonus(level: number) {
  if (level >= 17) {
    return 6;
  }

  if (level >= 13) {
    return 5;
  }

  if (level >= 9) {
    return 4;
  }

  if (level >= 5) {
    return 3;
  }

  return 2;
}

function calculateInitiative(dexterityScore: number) {
  return calculateAbilityModifier(dexterityScore);
}

function calculateBasicArmorClass(dexterityScore: number) {
  return 10 + calculateAbilityModifier(dexterityScore);
}

function calculateBasicMaxHp(hitDie: number, constitutionScore: number) {
  return Math.max(1, hitDie + calculateAbilityModifier(constitutionScore));
}

function calculateSkillBonus({
  abilityScore,
  characterLevel,
  customBonus,
  isProficient,
}: CalculateSkillBonusArgs) {
  return (
    calculateAbilityModifier(abilityScore) +
    (isProficient ? calculateProficiencyBonus(characterLevel) : 0) +
    customBonus
  );
}

function calculatePassivePerception(args: CalculateSkillBonusArgs) {
  return 10 + calculateSkillBonus(args);
}

function calculateSavingThrowBonus({
  abilityIndex,
  abilityScore,
  characterLevel,
  proficiencyIndexes,
}: CalculateSavingThrowBonusArgs) {
  const isProficient = proficiencyIndexes.includes(`saving-throw-${abilityIndex}`);

  return (
    calculateAbilityModifier(abilityScore) +
    (isProficient ? calculateProficiencyBonus(characterLevel) : 0)
  );
}

export {
  calculateAbilityModifier,
  calculateBasicArmorClass,
  calculateBasicMaxHp,
  calculateInitiative,
  calculatePassivePerception,
  calculateProficiencyBonus,
  calculateSavingThrowBonus,
  calculateSkillBonus,
  formatSignedModifier,
};
export type { CalculateSavingThrowBonusArgs, CalculateSkillBonusArgs };
