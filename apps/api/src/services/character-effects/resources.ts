import { slugify } from "./shared.js";
import type {
  CharacterResourceEntry,
  ResolvedFeatureSource,
} from "./types.js";

function deriveResourceEntries(
  activeSources: ResolvedFeatureSource[],
  characterLevel: number,
  context: {
    abilityScoresByIndex?: Record<string, number>;
  } = {},
) {
  const resources = activeSources
    .flatMap((source) => inferResourceEntries(source, characterLevel, context));
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

function inferResourceEntries(
  source: ResolvedFeatureSource,
  characterLevel: number,
  context: {
    abilityScoresByIndex?: Record<string, number>;
  },
): CharacterResourceEntry[] {
  const key = `${source.sourceIndex} ${source.title}`.toLowerCase();
  const base = getResourceBase(source);

  if (key.includes("phantasmal-creatures")) {
    return ["Summon Beast", "Summon Fey"].map((spellName) => ({
      ...base,
      automationNote: `Track the once-per-Long-Rest slot-free Illusion version of ${spellName}.`,
      category: "resource",
      id: `${base.id}:${slugify(spellName)}`,
      maxUses: "1 free cast",
      maxUsesValue: 1,
      name: `${spellName} (Phantasmal Creatures)`,
      recharge: "Long Rest",
      resourceKey: `${base.resourceKey}-${slugify(spellName)}`,
      trackingMode: "uses",
    }));
  }

  if (key.includes("the-third-eye")) {
    return [
      {
        ...base,
        automationNote: "Track The Third Eye use; the selected perception benefit lasts until your next Short or Long Rest.",
        category: "bonus action",
        maxUses: "1 use",
        maxUsesValue: 1,
        name: "The Third Eye",
        recharge: "Short or Long Rest",
        trackingMode: "uses",
      },
    ];
  }

  const signatureSpellName = getSignatureSpellName(source);

  if (signatureSpellName) {
    return [
      {
        ...base,
        automationNote: `Track the free level 3 cast of ${signatureSpellName} from Signature Spells.`,
        category: "resource",
        id: `${base.id}:signature:${slugify(signatureSpellName)}`,
        maxUses: "1 free cast",
        maxUsesValue: 1,
        name: `Signature Spell: ${signatureSpellName}`,
        recharge: "Short or Long Rest",
        resourceKey: `signature-spell-${slugify(signatureSpellName)}`,
        trackingMode: "uses",
      },
    ];
  }

  const resource = inferResourceEntry(source, characterLevel, context);
  return resource ? [resource] : [];
}

function getResourceBase(source: ResolvedFeatureSource) {
  return {
    id: `resource:${source.sourceType}:${source.sourceIndex}`,
    level: source.level,
    resourceKey: slugify(source.sourceIndex || source.title),
    sourceFeature: source.title,
    sourceIndex: source.sourceIndex,
    sourceType: source.sourceType,
  };
}

function getSignatureSpellName(source: ResolvedFeatureSource) {
  const key = `${source.sourceIndex} ${source.title} ${source.description}`.toLowerCase();

  if (key.includes("wizard-signature-spells") || key.includes("signature spells")) {
    const directSpellMatch = source.description.match(
      /(?:learn or gain access to|gain access to|add|choose) (?:the )?(?:level 3 )?spell ([^.]+?)(?: through|\.|$)/i,
    );
    const matchedSpellName = directSpellMatch?.[1]?.trim().replace(/\.$/, "");

    if (matchedSpellName) {
      return matchedSpellName;
    }

    if (source.title.toLowerCase() !== "signature spells") {
      return source.title;
    }
  }

  return null;
}

function inferResourceEntry(
  source: ResolvedFeatureSource,
  characterLevel: number,
  context: {
    abilityScoresByIndex?: Record<string, number>;
  },
): CharacterResourceEntry | null {
  const key = `${source.sourceIndex} ${source.title}`.toLowerCase();
  const giantAncestryResource = getGiantAncestryResource(source);
  const base = getResourceBase(source);

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

  if (key.includes("large-form")) {
    return {
      ...base,
      automationNote: "Track Large Form use and active state. While active, walking Speed increases by 10 feet.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Large Form",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("relentless-endurance")) {
    return {
      ...base,
      automationNote: "Track the once-per-Long-Rest use that lets you drop to 1 Hit Point instead of 0.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Relentless Endurance",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("boon-of-fate")) {
    return {
      ...base,
      automationNote: "Track Improve Fate use. It refreshes when you roll Initiative or finish a Short or Long Rest.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Boon of Fate",
      recharge: "Initiative / Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("gnomish-lineage-forest-gnome")) {
    return {
      ...base,
      automationNote:
        "Track slot-free Speak with Animals casts from Forest Gnome lineage. You can also cast the spell with spell slots.",
      category: "resource",
      maxUses: "Uses equal Proficiency Bonus",
      maxUsesValue: getProficiencyBonus(characterLevel),
      name: "Speak with Animals",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  const fiendishLegacySpellResource = getFiendishLegacySpellResource(source);

  if (fiendishLegacySpellResource) {
    return {
      ...base,
      automationNote: `Track the slot-free ${fiendishLegacySpellResource.name} cast from Fiendish Legacy. You can also cast it with spell slots.`,
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: fiendishLegacySpellResource.name,
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

  if (key.includes("rage-of-the-gods")) {
    return {
      ...base,
      automationNote: "Track Rage of the Gods transformation use. While active, its flight, resistance, and revivification rules are shown from the feature text.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Rage of the Gods",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("persistent-rage")) {
    return {
      ...base,
      automationNote: "Track the once-per-Long-Rest initiative trigger that restores all expended Rage uses.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Persistent Rage",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("warrior-of-the-gods")) {
    const diceCount = getWarriorOfTheGodsDice(characterLevel);

    return {
      ...base,
      automationNote: "Track d12 healing dice from Warrior of the Gods. Spend any number as a Bonus Action and regain all expended dice on a Long Rest.",
      category: "bonus action",
      maxUses: `${diceCount}d12 pool`,
      maxUsesValue: diceCount,
      name: "Warrior of the Gods",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("psionic-power")) {
    const psionicEnergyDice = getSoulknifeEnergyDice(characterLevel);

    return {
      ...base,
      automationNote: "Track Psionic Energy Dice for Psi-Bolstered Knack, Psychic Whispers, Soul Blades, Psychic Veil restoration, and Rend Mind restoration.",
      category: "resource",
      maxUses: `${psionicEnergyDice.count} ${psionicEnergyDice.die} dice`,
      maxUsesValue: psionicEnergyDice.count,
      name: `Psionic Energy Dice (${psionicEnergyDice.die})`,
      recharge: "Short Rest (1 die) / Long Rest (all dice)",
      trackingMode: "uses",
    };
  }

  if (key.includes("psychic-veil")) {
    return {
      ...base,
      automationNote: "Track the free Psychic Veil use. You can restore the use by expending a Psionic Energy Die.",
      category: "action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Psychic Veil",
      recharge: "Long Rest / expend Psionic Energy Die",
      trackingMode: "uses",
    };
  }

  if (key.includes("rend-mind")) {
    return {
      ...base,
      automationNote: "Track the free Rend Mind use. You can restore the use by expending three Psionic Energy Dice.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Rend Mind",
      recharge: "Long Rest / expend 3 Psionic Energy Dice",
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

  if (key.includes("mantle-of-majesty")) {
    return {
      ...base,
      automationNote:
        "Track the Mantle of Majesty use. While active, Command can be cast as a Bonus Action without expending a spell slot.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Mantle of Majesty",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("beguiling-magic")) {
    return {
      ...base,
      automationNote:
        "Track the free Beguiling Magic use after casting an Enchantment or Illusion spell with a spell slot. You can restore it by expending Bardic Inspiration.",
      category: "resource",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Beguiling Magic",
      recharge: "Long Rest / expend Bardic Inspiration",
      trackingMode: "uses",
    };
  }

  if (key.includes("unbreakable-majesty")) {
    return {
      ...base,
      automationNote:
        "Track Unbreakable Majesty use; the saving throw and miss effect are shown from the feature text.",
      category: "bonus action",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Unbreakable Majesty",
      recharge: "Short or Long Rest",
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

  if (key.includes("warding-flare")) {
    const hasImprovedRecovery = key.includes("improved-warding-flare");
    const wisdomUses = getWisdomModifierUseCount(context);

    return {
      ...base,
      automationNote: hasImprovedRecovery
        ? "Track Warding Flare uses. Improved Warding Flare also grants temporary Hit Points to the triggering target."
        : "Track Warding Flare uses for imposing Disadvantage on a visible attack.",
      category: "reaction",
      maxUses: "Uses equal Wisdom modifier (minimum 1)",
      maxUsesValue: wisdomUses,
      name: "Warding Flare",
      recharge: hasImprovedRecovery ? "Short or Long Rest" : "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("corona-of-light")) {
    const wisdomUses = getWisdomModifierUseCount(context);

    return {
      ...base,
      automationNote: "Track Corona of Light uses; aura effects are shown from the feature text.",
      category: "action",
      maxUses: "Uses equal Wisdom modifier (minimum 1)",
      maxUsesValue: wisdomUses,
      name: "Corona of Light",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("war-priest")) {
    const wisdomUses = getWisdomModifierUseCount(context);

    return {
      ...base,
      automationNote: "Track War Priest bonus action attacks.",
      category: "bonus action",
      maxUses: "Uses equal Wisdom modifier (minimum 1)",
      maxUsesValue: wisdomUses,
      name: "War Priest",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
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

  if (key.includes("arcane-ward")) {
    return {
      ...base,
      automationNote: "Track Arcane Ward creation/ward pool manually. Maximum ward HP equals twice your Wizard level plus your Intelligence modifier.",
      category: "resource",
      maxUses: "Ward HP = 2 x Wizard level + Intelligence modifier",
      maxUsesValue: null,
      name: "Arcane Ward",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("illusory-self")) {
    return {
      ...base,
      automationNote: "Track the free Illusory Self reaction. You can also restore it by expending a level 2+ spell slot.",
      category: "reaction",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Illusory Self",
      recharge: "Short or Long Rest / expend level 2+ spell slot",
      trackingMode: "uses",
    };
  }

  if (key.includes("spell-thief")) {
    return {
      ...base,
      automationNote: "Track Spell Thief after you negate and steal a spell.",
      category: "reaction",
      maxUses: "1 use",
      maxUsesValue: 1,
      name: "Spell Thief",
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

function getFiendishLegacySpellResource(source: ResolvedFeatureSource) {
  const resourcesBySourceIndex: Record<string, { name: string }> = {
    "fiendish-spell-darkness": { name: "Darkness" },
    "fiendish-spell-false-life": { name: "False Life" },
    "fiendish-spell-hellish-rebuke": { name: "Hellish Rebuke" },
    "fiendish-spell-hold-person": { name: "Hold Person" },
    "fiendish-spell-ray-of-enfeeblement": { name: "Ray of Enfeeblement" },
    "fiendish-spell-ray-of-sickness": { name: "Ray of Sickness" },
  };

  return resourcesBySourceIndex[source.sourceIndex.toLowerCase()] ?? null;
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

function getSoulknifeEnergyDice(level: number) {
  if (level >= 17) {
    return { count: 12, die: "d12" };
  }
  if (level >= 13) {
    return { count: 10, die: "d10" };
  }
  if (level >= 11) {
    return { count: 8, die: "d10" };
  }
  if (level >= 9) {
    return { count: 8, die: "d8" };
  }
  if (level >= 5) {
    return { count: 6, die: "d8" };
  }
  return { count: 4, die: "d6" };
}

function getWarriorOfTheGodsDice(level: number) {
  if (level >= 17) {
    return 7;
  }
  if (level >= 12) {
    return 6;
  }
  if (level >= 6) {
    return 5;
  }
  return 4;
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

function getWisdomModifierUseCount(context: {
  abilityScoresByIndex?: Record<string, number>;
}) {
  const wisdomScore = context.abilityScoresByIndex?.wis;

  if (typeof wisdomScore !== "number") {
    return null;
  }

  return Math.max(1, Math.floor((wisdomScore - 10) / 2));
}

export { deriveResourceEntries };
