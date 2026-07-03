import { slugify } from "./shared.js";
import type {
  CharacterResourceEntry,
  ResolvedFeatureSource,
} from "./types.js";

function deriveResourceEntries(
  activeSources: ResolvedFeatureSource[],
  characterLevel: number,
) {
  const resources = activeSources
    .map((source) => inferResourceEntry(source, characterLevel))
    .filter((resource): resource is CharacterResourceEntry => Boolean(resource));
  const byName = new Map<string, CharacterResourceEntry>();

  for (const resource of resources) {
    const existing = byName.get(resource.name);

    if (!existing || (existing.level ?? 0) <= (resource.level ?? 0)) {
      byName.set(resource.name, resource);
    }
  }

  return [...byName.values()].sort(
    (left, right) =>
      (left.level ?? Number.POSITIVE_INFINITY) -
        (right.level ?? Number.POSITIVE_INFINITY) ||
      left.name.localeCompare(right.name),
  );
}

function inferResourceEntry(
  source: ResolvedFeatureSource,
  characterLevel: number,
): CharacterResourceEntry | null {
  const key = `${source.sourceIndex} ${source.title}`.toLowerCase();
  const giantAncestryResource = getGiantAncestryResource(source);
  const base = {
    id: `resource:${source.sourceType}:${source.sourceIndex}`,
    level: source.level,
    resourceKey: slugify(source.sourceIndex || source.title),
    sourceFeature: source.title,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
  };

  if (key.includes("adrenaline-rush")) {
    return {
      ...base,
      automationNote: "Track Adrenaline Rush uses; Dash and temporary Hit Points are applied manually for now.",
      category: "bonus action",
      maxUses: "Uses equal Proficiency Bonus",
      maxUsesValue: getProficiencyBonus(characterLevel),
      name: "Adrenaline Rush",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("breath-weapon")) {
    return {
      ...base,
      automationNote: "Track Breath Weapon uses. Damage type, save DC, and damage dice come from the selected Draconic Ancestry.",
      category: "action",
      maxUses: "Uses equal Proficiency Bonus",
      maxUsesValue: getProficiencyBonus(characterLevel),
      name: source.title.startsWith("Breath Weapon")
        ? source.title
        : "Breath Weapon",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("draconic-flight")) {
    return {
      ...base,
      automationNote: "Track Draconic Flight use; fly speed and duration are shown from the trait text.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Draconic Flight",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (giantAncestryResource) {
    return {
      ...base,
      automationNote: "Track the selected Giant Ancestry benefit uses.",
      category: giantAncestryResource.category,
      maxUses: "Uses equal Proficiency Bonus",
      maxUsesValue: getProficiencyBonus(characterLevel),
      name: giantAncestryResource.name,
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("travel-along-the-tree")) {
    return {
      ...base,
      automationNote: "Track the once-per-Rage extended teleport to 150 feet with up to six willing creatures.",
      category: "bonus action",
      maxUses: "1 extended teleport per Rage",
      maxUsesValue: 1,
      name: "Travel Along the Tree: Extended Teleport",
      recharge: "Rage",
      trackingMode: "uses",
    };
  }

  if (key.includes("intimidating-presence")) {
    return {
      ...base,
      automationNote: "Track the free use. You can restore the use by expending a Rage use.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Intimidating Presence",
      recharge: "Long Rest / expend Rage",
      trackingMode: "uses",
    };
  }

  if (key.includes("healing-hands")) {
    return {
      ...base,
      automationNote: "Track Healing Hands use; healing amount is applied manually for now.",
      category: "action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Healing Hands",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("celestial-revelation")) {
    return {
      ...base,
      automationNote: "Track Celestial Revelation use; transformation details are shown from the trait text.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Celestial Revelation",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("rage")) {
    return {
      ...base,
      automationNote: "Track uses and active state. When active, Rage applies physical damage resistance and Strength melee damage automatically.",
      category: "bonus action",
      maxUses: "Uses follow class progression",
      maxUsesValue: getRageUseCount(characterLevel),
      name: "Rage",
      recharge: "Short Rest (1 use) / Long Rest (all uses)",
      trackingMode: "uses",
    };
  }

  if (key.includes("bardic-inspiration")) {
    return {
      ...base,
      automationNote: "Track inspiration uses. Die size and target ownership are handled manually for now.",
      category: "bonus action",
      maxUses: "Uses equal Proficiency Bonus",
      maxUsesValue: getProficiencyBonus(characterLevel),
      name: "Bardic Inspiration",
      recharge: "Long Rest / feature-based recovery",
      trackingMode: "uses",
    };
  }

  if (key.includes("lucky")) {
    return {
      ...base,
      automationNote: "Track Luck Points for Advantage and Disadvantage uses.",
      category: "resource",
      maxUses: "Uses equal Proficiency Bonus",
      maxUsesValue: getProficiencyBonus(characterLevel),
      name: "Luck Points",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("channel-divinity")) {
    return {
      ...base,
      automationNote: "Track Channel Divinity uses; individual subclass options appear as actions when their text provides activation rules.",
      category: "resource",
      maxUses: "Uses follow class progression",
      maxUsesValue: getChannelDivinityUses(characterLevel),
      name: "Channel Divinity",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("wild-shape")) {
    return {
      ...base,
      automationNote: "Track Wild Shape uses. Form stat replacement is still handled manually.",
      category: "resource",
      maxUses: "2 uses",
      maxUsesValue: 2,
      name: "Wild Shape",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("second-wind")) {
    return {
      ...base,
      automationNote: "Track Second Wind uses; roll and healing application are still manual.",
      category: "bonus action",
      maxUses: "2 uses",
      maxUsesValue: 2,
      name: "Second Wind",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("action-surge")) {
    return {
      ...base,
      automationNote: "Track Action Surge uses.",
      category: "resource",
      maxUses: characterLevel >= 17 ? "2 uses" : "1 use",
      maxUsesValue: characterLevel >= 17 ? 2 : 1,
      name: "Action Surge",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("indomitable")) {
    return {
      ...base,
      automationNote: "Track Indomitable uses; save reroll timing is still manual.",
      category: "resource",
      maxUses: "Uses follow class progression",
      maxUsesValue: characterLevel >= 17 ? 3 : characterLevel >= 13 ? 2 : 1,
      name: "Indomitable",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("superiority-dice")) {
    return {
      ...base,
      automationNote: "Track superiority dice. Maneuver-specific effects are displayed from selected feature text.",
      category: "resource",
      maxUses: "Uses follow class progression",
      maxUsesValue: characterLevel >= 15 ? 6 : characterLevel >= 7 ? 5 : 4,
      name: "Superiority Dice",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("monks-focus") || key.includes("monk's focus")) {
    return {
      ...base,
      automationNote: "Track Focus Points. Individual Focus spenders remain separate actions/features.",
      category: "resource",
      maxUses: `${characterLevel} Focus Points`,
      maxUsesValue: characterLevel,
      name: "Monk's Focus",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("lay-on-hands")) {
    return {
      ...base,
      automationNote: "Track Lay on Hands healing pool.",
      category: "bonus action",
      maxUses: `${characterLevel * 5} HP pool`,
      maxUsesValue: characterLevel * 5,
      name: "Lay on Hands",
      recharge: "Long Rest",
      trackingMode: "pool",
    };
  }

  if (key.includes("cunning-action")) {
    return {
      ...base,
      automationNote: "Action economy reminder.",
      category: "bonus action",
      maxUses: "At will",
      name: "Cunning Action",
      trackingMode: "none",
    };
  }

  if (key.includes("cunning-strike")) {
    return {
      ...base,
      automationNote: "Sneak Attack tradeoff reminder.",
      category: "passive",
      name: key.includes("improved") ? "Improved Cunning Strike" : "Cunning Strike",
      trackingMode: "none",
    };
  }

  if (key.includes("font-of-magic")) {
    return {
      ...base,
      automationNote: "Track Sorcery Points.",
      category: "resource",
      maxUses: `${characterLevel} Sorcery Points`,
      maxUsesValue: characterLevel,
      name: "Font of Magic",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("pact-magic")) {
    return {
      ...base,
      automationNote: "Pact slots are tracked in the Spells tab.",
      category: "resource",
      name: "Pact Magic",
      recharge: "Short or Long Rest",
      trackingMode: "none",
    };
  }

  if (key.includes("mystic-arcanum")) {
    return {
      ...base,
      automationNote: "Track Mystic Arcanum use.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Mystic Arcanum",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("arcane-recovery")) {
    return {
      ...base,
      automationNote: "Track Arcane Recovery use; recovered slot selection is manual.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Arcane Recovery",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("divine-intervention")) {
    return {
      ...base,
      automationNote: "Track Divine Intervention use.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Divine Intervention",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("stroke-of-luck")) {
    return {
      ...base,
      automationNote: "Track Stroke of Luck use.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Stroke of Luck",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("arcane-shot")) {
    return {
      ...base,
      automationNote: "Track Arcane Shot uses.",
      category: "resource",
      maxUses: "2 uses",
      maxUsesValue: 2,
      name: "Arcane Shot",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  return null;
}

function getGiantAncestryResource(source: ResolvedFeatureSource): {
  category: CharacterResourceEntry["category"];
  name: string;
} | null {
  const key = `${source.sourceIndex} ${source.title}`.toLowerCase();

  if (!key.includes("giant-ancestry")) {
    return null;
  }

  if (key.includes("cloud") || key.includes("jaunt")) {
    return { category: "bonus action", name: "Giant Ancestry: Cloud's Jaunt" };
  }
  if (key.includes("fire") || key.includes("burn")) {
    return { category: "resource", name: "Giant Ancestry: Fire's Burn" };
  }
  if (key.includes("frost") || key.includes("chill")) {
    return { category: "resource", name: "Giant Ancestry: Frost's Chill" };
  }
  if (key.includes("hill") || key.includes("tumble")) {
    return { category: "resource", name: "Giant Ancestry: Hill's Tumble" };
  }
  if (key.includes("stone") || key.includes("endurance")) {
    return { category: "reaction", name: "Giant Ancestry: Stone's Endurance" };
  }
  if (key.includes("storm") || key.includes("thunder")) {
    return { category: "reaction", name: "Giant Ancestry: Storm's Thunder" };
  }

  return null;
}

function getRageUseCount(level: number) {
  if (level >= 17) {
    return 6;
  }
  if (level >= 12) {
    return 5;
  }
  if (level >= 6) {
    return 4;
  }
  if (level >= 3) {
    return 3;
  }
  return 2;
}

function getChannelDivinityUses(level: number) {
  if (level >= 18) {
    return 3;
  }
  if (level >= 6) {
    return 2;
  }
  return 1;
}

function getProficiencyBonus(level: number) {
  if (level <= 4) {
    return 2;
  }
  if (level <= 8) {
    return 3;
  }
  if (level <= 12) {
    return 4;
  }
  if (level <= 16) {
    return 5;
  }
  return 6;
}

export { deriveResourceEntries };
