import {
  chooseArmorClassMode,
  createBaseDerivedStats,
  getPassiveEffect,
} from "./shared.js";
import type { CharacterDerivedStats, ResolvedFeatureSource } from "./types.js";

function deriveCharacterStats(
  activeSources: ResolvedFeatureSource[],
  characterLevel: number,
): CharacterDerivedStats {
  return activeSources.reduce(
    (stats, source) => {
      const passiveEffect = getPassiveEffect(source);

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
      stats.initiativeBonus += passiveEffect.initiativeBonus ?? 0;
      stats.initiativeBonus +=
        (passiveEffect.initiativeProficiencyBonusMultiplier ?? 0) * stats.proficiencyBonus;
      stats.passiveInsightBonus += passiveEffect.passiveInsightBonus ?? 0;
      stats.passiveInvestigationBonus += passiveEffect.passiveInvestigationBonus ?? 0;
      stats.passivePerceptionBonus += passiveEffect.passivePerceptionBonus ?? 0;
      stats.speedBonus += passiveEffect.speedBonus ?? 0;

      return stats;
    },
    createBaseDerivedStats(characterLevel),
  );
}

export { deriveCharacterStats };
