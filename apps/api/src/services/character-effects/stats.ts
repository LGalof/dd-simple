import {
  chooseArmorClassMode,
  createBaseDerivedStats,
  getPassiveEffect,
} from "./shared.js";
import type {
  CharacterDerivedStats,
  PassiveEffectContext,
  ResolvedFeatureSource,
} from "./types.js";

function deriveCharacterStats(
  activeSources: ResolvedFeatureSource[],
  characterLevel: number,
  context: PassiveEffectContext = {},
): CharacterDerivedStats {
  const abilityScoresByIndex = context.abilityScoresByIndex ?? {};
  const charismaModifier = abilityModifier(abilityScoresByIndex.cha ?? 10);

  return activeSources.reduce(
    (stats, source) => {
      const passiveEffect = getLevelAwarePassiveEffect(
        source,
        characterLevel,
        context,
      );

      if (!passiveEffect) {
        return stats;
      }

      if (passiveEffect.armorClassMode) {
        stats.armorClassMode = chooseArmorClassMode(
          stats.armorClassMode,
          passiveEffect.armorClassMode,
        );
      }

      stats.armorClassBonus += passiveEffect.armorClassBonus ?? 0;
      if (passiveEffect.armorClassBase != null) {
        stats.armorClassBonus = Math.max(
          stats.armorClassBonus,
          passiveEffect.armorClassBase - 10,
        );
      }
      stats.initiativeBonus += passiveEffect.initiativeBonus ?? 0;
      stats.initiativeBonus +=
        (passiveEffect.initiativeProficiencyBonusMultiplier ?? 0) * stats.proficiencyBonus;
      stats.initiativeBonus +=
        Math.floor(
          (passiveEffect.initiativeHalfProficiencyBonusMultiplier ?? 0) * stats.proficiencyBonus,
        );
      stats.oneHandedMeleeDamageBonus += passiveEffect.oneHandedMeleeDamageBonus ?? 0;
      stats.passiveInsightBonus += passiveEffect.passiveInsightBonus ?? 0;
      stats.passiveInvestigationBonus += passiveEffect.passiveInvestigationBonus ?? 0;
      stats.passivePerceptionBonus += passiveEffect.passivePerceptionBonus ?? 0;
      stats.rangedAttackBonus += passiveEffect.rangedAttackBonus ?? 0;
      if (passiveEffect.savingThrowAbilityModifier === "cha") {
        stats.savingThrowBonus += charismaModifier;
      }
      stats.skillCheckHalfProficiencyBonusMultiplier = Math.max(
        stats.skillCheckHalfProficiencyBonusMultiplier,
        passiveEffect.skillCheckHalfProficiencyBonusMultiplier ?? 0,
      );
      stats.speedBonus += passiveEffect.speedBonus ?? 0;

      return stats;
    },
    createBaseDerivedStats(characterLevel),
  );
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function getLevelAwarePassiveEffect(
  source: ResolvedFeatureSource,
  characterLevel: number,
  context: PassiveEffectContext,
) {
  const passiveEffect = getPassiveEffect(source, context);

  if (!passiveEffect) {
    return null;
  }

  if (source.sourceIndex === "monk-unarmored-movement") {
    return {
      ...passiveEffect,
      speedBonus: getMonkUnarmoredMovementBonus(characterLevel),
    };
  }

  return passiveEffect;
}

function getMonkUnarmoredMovementBonus(level: number) {
  if (level >= 18) {
    return 30;
  }
  if (level >= 14) {
    return 25;
  }
  if (level >= 10) {
    return 20;
  }
  if (level >= 6) {
    return 15;
  }
  return 10;
}

export { deriveCharacterStats };
