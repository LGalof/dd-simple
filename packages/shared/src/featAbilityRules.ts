import type { AbilityScoreKey } from "./index.js";

type FeatAbilityRule = {
  fixedBonuses?: Partial<Record<AbilityScoreKey, number>>;
  selectableAbilities?: AbilityScoreKey[];
  selectableCount?: number;
};

const allAbilityScoreKeys: AbilityScoreKey[] = ["str", "dex", "con", "int", "wis", "cha"];
const mentalAbilityScoreKeys: AbilityScoreKey[] = ["int", "wis", "cha"];
const martialAbilityScoreKeys: AbilityScoreKey[] = ["str", "dex"];
const armoredAbilityScoreKeys: AbilityScoreKey[] = ["str", "dex"];
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
  "crossbow-expert": {
    fixedBonuses: { dex: 1 },
  },
  "defensive-duelist": {
    fixedBonuses: { dex: 1 },
  },
  "dual-wielder": {
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
  "elemental-adept": {
    selectableAbilities: mentalAbilityScoreKeys,
    selectableCount: 1,
  },
  grappler: {
    selectableAbilities: martialAbilityScoreKeys,
    selectableCount: 1,
  },
  "great-weapon-master": {
    fixedBonuses: { str: 1 },
  },
  "heavy-armor-master": {
    selectableAbilities: heartyAbilityScoreKeys,
    selectableCount: 1,
  },
  healer: {
    fixedBonuses: { wis: 1 },
  },
  "inspiring-leader": {
    selectableAbilities: ["wis", "cha"],
    selectableCount: 1,
  },
  "keen-mind": {
    selectableAbilities: mentalAbilityScoreKeys,
    selectableCount: 1,
  },
  "lightly-armored": {
    selectableAbilities: armoredAbilityScoreKeys,
    selectableCount: 1,
  },
  "mage-slayer": {
    selectableAbilities: martialAbilityScoreKeys,
    selectableCount: 1,
  },
  "medium-armor-master": {
    selectableAbilities: armoredAbilityScoreKeys,
    selectableCount: 1,
  },
  "moderately-armored": {
    selectableAbilities: armoredAbilityScoreKeys,
    selectableCount: 1,
  },
  observant: {
    selectableAbilities: ["int", "wis"],
    selectableCount: 1,
  },
  "polearm-master": {
    selectableAbilities: martialAbilityScoreKeys,
    selectableCount: 1,
  },
  resilient: {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "skill-expert": {
    selectableAbilities: allAbilityScoreKeys,
    selectableCount: 1,
  },
  "shield-master": {
    fixedBonuses: { str: 1 },
  },
  skulker: {
    fixedBonuses: { dex: 1 },
  },
  speedy: {
    selectableAbilities: ["dex", "con"],
    selectableCount: 1,
  },
  "spell-sniper": {
    selectableAbilities: mentalAbilityScoreKeys,
    selectableCount: 1,
  },
  "tavern-brawler": {
    selectableAbilities: heartyAbilityScoreKeys,
    selectableCount: 1,
  },
  "war-caster": {
    selectableAbilities: mentalAbilityScoreKeys,
    selectableCount: 1,
  },
  "weapon-master": {
    selectableAbilities: martialAbilityScoreKeys,
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
