import type { AbilityScoreKey } from "./index.js";

type FeatAbilityRule = {
  fixedBonuses?: Partial<Record<AbilityScoreKey, number>>;
  selectableAbilities?: AbilityScoreKey[];
  selectableCount?: number;
};

const allAbilityScoreKeys: AbilityScoreKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const martialAbilityScoreKeys: AbilityScoreKey[] = ["str", "dex"];
const heartyAbilityScoreKeys: AbilityScoreKey[] = ["str", "con"];

const featAbilityRules: Record<string, FeatAbilityRule> = {
  actor: {
    fixedBonuses: { cha: 1 },
  },
  athlete: {
    selectableAbilities: martialAbilityScoreKeys,
    selectableCount: 1,
  },
  charger: {
    selectableAbilities: martialAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-combat-prowess": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-dimensional-travel": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-fate": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-irresistible-offense": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-spell-recall": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-the-night-spirit": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "boon-of-truesight": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  durable: {
    fixedBonuses: { con: 1 },
  },
  "heavy-armor-master": {
    selectableAbilities: heartyAbilityScoreKeys,
    selectableCount: 1,
  },
  "lightly-armored": {
    selectableAbilities: martialAbilityScoreKeys,
    selectableCount: 1,
  },
  resilient: {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
};

function getFeatAbilityRule(featIndex: string | null | undefined) {
  if (!featIndex) {
    return null;
  }

  return featAbilityRules[featIndex.toLowerCase()] ?? null;
}

function getFeatAbilityChoiceFieldIds(featIndex: string, selectableCount = 1) {
  const normalizedIndex = featIndex.toLowerCase();

  if (selectableCount <= 1) {
    return [`feat-ability-${normalizedIndex}`];
  }

  return Array.from(
    { length: selectableCount },
    (_, index) => `feat-ability-${normalizedIndex}-${index + 1}`,
  );
}

function buildFeatAbilityBonuses(
  featIndex: string | null | undefined,
  selectedAbilityIndexes: Array<string | null | undefined> = [],
) {
  const rule = getFeatAbilityRule(featIndex);
  const bonuses: Partial<Record<AbilityScoreKey, number>> = {};

  if (!rule) {
    return bonuses;
  }

  for (const [abilityIndex, bonusValue] of Object.entries(rule.fixedBonuses ?? {})) {
    if (!bonusValue) {
      continue;
    }

    bonuses[abilityIndex as AbilityScoreKey] =
      (bonuses[abilityIndex as AbilityScoreKey] ?? 0) + bonusValue;
  }

  const allowedAbilities = new Set(rule.selectableAbilities ?? []);

  for (const abilityIndex of selectedAbilityIndexes) {
    if (!abilityIndex || !allowedAbilities.has(abilityIndex as AbilityScoreKey)) {
      continue;
    }

    bonuses[abilityIndex as AbilityScoreKey] =
      (bonuses[abilityIndex as AbilityScoreKey] ?? 0) + 1;
  }

  return bonuses;
}

export {
  allAbilityScoreKeys,
  buildFeatAbilityBonuses,
  getFeatAbilityChoiceFieldIds,
  getFeatAbilityRule,
};
export type { FeatAbilityRule };
