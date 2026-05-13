function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function formatAlignment(alignment?: string | null) {
  if (!alignment?.trim()) {
    return "Not selected";
  }

  return alignment
    .split("-")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function proficiencyBonus(level: number) {
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

function calculateSkillBonus({
  abilityScore,
  characterLevel,
  customBonus,
  isProficient,
}: {
  abilityScore: number;
  characterLevel: number;
  customBonus: number;
  isProficient: boolean;
}) {
  return (
    abilityModifier(abilityScore) +
    (isProficient ? proficiencyBonus(characterLevel) : 0) +
    customBonus
  );
}

export {
  abilityModifier,
  calculateSkillBonus,
  formatAlignment,
  formatModifier,
  proficiencyBonus,
};
