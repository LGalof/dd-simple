import type {
  CharacterActionEntry,
  CharacterDerivedStats,
  ResolvedFeatureSource,
} from "./types.js";

type EquippedInventoryItem = {
  customName?: string | null;
  equipmentIndex: string;
  notes?: string | null;
  equipment: {
    description?: string | null;
    index: string;
    itemType?: string | null;
    name: string;
    sourceJson?: unknown;
  };
};

type CharacterAbilityScore = {
  abilityIndex: string;
  score: number;
};

type CharacterProficiency = {
  proficiency: {
    index: string;
    name: string;
  };
};

function deriveWeaponActionEntries(options: {
  abilityScores: CharacterAbilityScore[];
  activeSources: ResolvedFeatureSource[];
  characterLevel: number;
  inventory: EquippedInventoryItem[];
  proficiencies: CharacterProficiency[];
  stats: CharacterDerivedStats;
}) {
  const { abilityScores, activeSources, characterLevel, inventory, proficiencies, stats } = options;
  const dexterityModifier = abilityModifier(getAbilityScore(abilityScores, "dex"));
  const strengthModifier = abilityModifier(
    Math.max(getAbilityScore(abilityScores, "str"), stats.strengthMinimum ?? 0),
  );
  const weaponProficiencies = proficiencies.map((entry) => entry.proficiency.name);
  const attackItems = inventory.filter((item) => isAttackItem(item.equipment.name));
  const attackItemNames = attackItems.map((item) => item.customName?.trim() || item.equipment.name);
  const activeSourceIndexes = new Set(
    activeSources.map((source) => source.sourceIndex.toLowerCase()),
  );
  const duelingActive =
    stats.oneHandedMeleeDamageBonus > 0 &&
    attackItemNames.length === 1 &&
    !isRangedWeaponName(attackItemNames[0] ?? "");
  const criticalHitRange = getCriticalHitRange(activeSourceIndexes);
  const dazzlingFootworkActive = activeSourceIndexes.has("dazzling-footwork");
  const greatWeaponFightingActive = activeSourceIndexes.has("great-weapon-fighting");
  const rageDamageBonus = activeSourceIndexes.has("rage-active")
    ? getRageDamageBonus(characterLevel)
    : 0;
  const radiantStrikesActive = activeSourceIndexes.has("radiant-strikes");
  const sneakAttackDice = activeSourceIndexes.has("sneak-attack")
    ? getSneakAttackDice(characterLevel)
    : "";
  const tavernBrawlerActive = activeSourceIndexes.has("tavern-brawler");
  const twoWeaponFightingActive =
    activeSourceIndexes.has("two-weapon-fighting") && attackItemNames.length >= 2;

  const weaponActions = attackItems.map((item) => {
    const itemName = item.customName?.trim() || item.equipment.name;
    const profile = getAttackProfile({
      dexterityModifier,
      itemName,
      proficiencyBonus: stats.proficiencyBonus,
      rangedAttackBonus: stats.rangedAttackBonus,
      strengthModifier,
      weaponProficiencies,
    });
    const itemModifiers = getItemCombatModifiers(item);
    const duelingBonus =
      duelingActive && isOneHandedMeleeWeaponName(itemName)
        ? stats.oneHandedMeleeDamageBonus
        : 0;
    const rageBonus =
      rageDamageBonus > 0 && profile.ability === "str" && profile.type.includes("Melee")
        ? rageDamageBonus
        : 0;
    const radiantStrikesDamage =
      radiantStrikesActive && profile.type.includes("Melee") ? "1d8 radiant" : "";
    const sneakAttackDamage = isSneakAttackEligibleProfile(profile) ? sneakAttackDice : "";

    return {
      activationType: "attack" as const,
      combat: {
        damage: appendExtraDamage(
          formatInventoryDamage(
            itemModifiers.damage || profile.damage,
            profile.damageModifier + duelingBonus + rageBonus + itemModifiers.damageBonus,
          ),
          [radiantStrikesDamage, sneakAttackDamage].filter(Boolean).join(" + "),
        ),
        hit: formatModifier(profile.attackBonus + itemModifiers.attackBonus),
        notes: appendFightingStyleNotes(item.notes || profile.notes, itemName, {
          criticalHitRange,
          greatWeaponFightingActive,
          radiantStrikesActive: Boolean(radiantStrikesDamage),
          rageDamageBonus: rageBonus,
          sneakAttackDice: sneakAttackDamage,
          twoWeaponFightingActive,
        }),
        range: profile.range,
        subtitle: profile.type,
      },
      description:
        item.notes?.trim() ||
        `${itemName} can be used as a weapon attack.`,
      id: `item:${item.equipment.index}:weapon-attack`,
      level: null,
      sourceIndex: item.equipment.index,
      sourceType: "item" as const,
      title: itemName,
    };
  });

  const unarmedStrike: CharacterActionEntry = {
    activationType: "attack",
    combat: {
      damage: appendExtraDamage(
        dazzlingFootworkActive
          ? `${getBardicInspirationDie(characterLevel)} ${formatInlineModifier(dexterityModifier)}`
          : tavernBrawlerActive
            ? `1d4 ${formatInlineModifier(strengthModifier + rageDamageBonus)}`
            : `1 + ${Math.max(1, strengthModifier + rageDamageBonus)}`,
        radiantStrikesActive ? "1d8 radiant" : "",
      ),
      hit: formatModifier(
        (dazzlingFootworkActive ? dexterityModifier : strengthModifier) + stats.proficiencyBonus,
      ),
      notes: appendUnarmedStrikeNotes({
        criticalHitRange,
        dazzlingFootworkActive,
        radiantStrikesActive,
        tavernBrawlerActive,
      }),
      range: "5 ft.",
      subtitle: "Melee Attack",
    },
    description:
      "You make a melee attack using your body to deal damage, grapple, or shove.",
    id: "core:unarmed-strike:weapon-attack",
    level: null,
    sourceIndex: "unarmed-strike",
    sourceType: "class_feature",
    title: tavernBrawlerActive ? "Enhanced Unarmed Strike" : "Unarmed Strike",
  };

  return [...weaponActions, unarmedStrike];
}

function getAttackProfile(options: {
  dexterityModifier: number;
  itemName: string;
  proficiencyBonus: number;
  rangedAttackBonus: number;
  strengthModifier: number;
  weaponProficiencies: string[];
}) {
  const {
    dexterityModifier,
    itemName,
    proficiencyBonus,
    rangedAttackBonus,
    strengthModifier,
    weaponProficiencies,
  } = options;
  const normalizedName = itemName.toLowerCase();
  const weaponKind = getWeaponKind(normalizedName) ?? "simpleMelee";
  const isProficient = hasWeaponProficiency(normalizedName, weaponKind, weaponProficiencies);
  const archeryBonus = isRangedWeaponKind(weaponKind) ? rangedAttackBonus : 0;

  if (weaponKind === "bow") {
    return {
      ability: "dex" as const,
      attackBonus: dexterityModifier + (isProficient ? proficiencyBonus : 0) + archeryBonus,
      damage: `1d6 ${formatInlineModifier(dexterityModifier)}`,
      damageModifier: dexterityModifier,
      notes: "Ranged weapon",
      range: normalizedName.includes("longbow") ? "150/600 ft." : "80/320 ft.",
      type: "Ranged Attack",
    };
  }

  if (weaponKind === "crossbow") {
    return {
      ability: "dex" as const,
      attackBonus: dexterityModifier + (isProficient ? proficiencyBonus : 0) + archeryBonus,
      damage: `1d6 ${formatInlineModifier(dexterityModifier)}`,
      damageModifier: dexterityModifier,
      notes: "Ranged weapon",
      range: normalizedName.includes("hand") ? "30/120 ft." : "80/320 ft.",
      type: "Ranged Attack",
    };
  }

  if (weaponKind === "dagger") {
    const modifier = Math.max(dexterityModifier, strengthModifier);

    return {
      ability: strengthModifier >= dexterityModifier ? "str" as const : "dex" as const,
      attackBonus: modifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d4 ${formatInlineModifier(modifier)}`,
      damageModifier: modifier,
      notes: "Finesse, light, thrown",
      range: "20/60 ft.",
      type: "Melee / Thrown",
    };
  }

  if (weaponKind === "finesseMelee") {
    const modifier = Math.max(dexterityModifier, strengthModifier);

    return {
      ability: strengthModifier >= dexterityModifier ? "str" as const : "dex" as const,
      attackBonus: modifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d8 ${formatInlineModifier(modifier)}`,
      damageModifier: modifier,
      notes: "Finesse",
      range: "5 ft.",
      type: "Melee Attack",
    };
  }

  if (weaponKind === "sling") {
    return {
      ability: "dex" as const,
      attackBonus: dexterityModifier + (isProficient ? proficiencyBonus : 0) + archeryBonus,
      damage: `1d4 ${formatInlineModifier(dexterityModifier)}`,
      damageModifier: dexterityModifier,
      notes: "Ranged weapon",
      range: "30/120 ft.",
      type: "Ranged Attack",
    };
  }

  return {
    ability: "str" as const,
    attackBonus: strengthModifier + (isProficient ? proficiencyBonus : 0),
    damage: `1d6 ${formatInlineModifier(strengthModifier)}`,
    damageModifier: strengthModifier,
    notes: "Weapon attack",
    range: "5 ft.",
    type: "Melee Attack",
  };
}

function getItemCombatModifiers(item: EquippedInventoryItem) {
  const normalizedName = (item.customName?.trim() || item.equipment.name).toLowerCase();
  const description = extractEquipmentDescription(item).toLowerCase();
  const sourceJson =
    item.equipment.sourceJson && typeof item.equipment.sourceJson === "object"
      ? (item.equipment.sourceJson as Record<string, unknown>)
      : null;
  const damage =
    sourceJson?.damage && typeof sourceJson.damage === "object"
      ? (sourceJson.damage as Record<string, unknown>)
      : null;
  const damageDice =
    typeof damage?.damage_dice === "string"
      ? damage.damage_dice
      : typeof damage?.damageDice === "string"
        ? damage.damageDice
        : "";
  const damageType =
    damage?.damage_type && typeof damage.damage_type === "object"
      ? (damage.damage_type as Record<string, unknown>)
      : null;
  const damageTypeName =
    typeof damageType?.name === "string"
      ? damageType.name
      : typeof damage?.damageType === "string"
        ? damage.damageType
        : "";

  return {
    attackBonus:
      normalizedName.includes("weapon +1") ||
      normalizedName.includes("ammunition, +1") ||
      description.includes("+1 bonus to attack rolls")
        ? 1
        : 0,
    damage: damageDice ? `${damageDice}${damageTypeName ? ` ${damageTypeName.toLowerCase()}` : ""}` : "",
    damageBonus:
      normalizedName.includes("weapon +1") ||
      normalizedName.includes("ammunition, +1") ||
      description.includes("+1 bonus to attack rolls and damage rolls")
        ? 1
        : 0,
  };
}

function extractEquipmentDescription(item: EquippedInventoryItem) {
  if (typeof item.notes === "string" && item.notes.trim().length > 0) {
    return item.notes.trim();
  }

  if (typeof item.equipment.description === "string" && item.equipment.description.trim().length > 0) {
    return item.equipment.description.trim();
  }

  const sourceJson =
    item.equipment.sourceJson && typeof item.equipment.sourceJson === "object"
      ? (item.equipment.sourceJson as Record<string, unknown>)
      : null;
  const desc = sourceJson?.desc;

  if (Array.isArray(desc)) {
    return desc.filter((entry): entry is string => typeof entry === "string").join(" ");
  }

  return typeof desc === "string" ? desc : "";
}

function isAttackItem(name: string) {
  return getWeaponKind(name.toLowerCase()) !== null;
}

function getWeaponKind(normalizedName: string) {
  if (normalizedName.includes("shield")) {
    return null;
  }
  if (normalizedName.includes("longbow") || normalizedName.includes("shortbow")) {
    return "bow";
  }
  if (normalizedName.includes("crossbow")) {
    return "crossbow";
  }
  if (normalizedName.includes("dagger")) {
    return "dagger";
  }
  if (normalizedName.includes("rapier") || normalizedName.includes("shortsword")) {
    return "finesseMelee";
  }
  if (normalizedName.includes("sling")) {
    return "sling";
  }
  if (
    ["sword", "warhammer", "hammer", "mace", "axe", "staff", "club", "spear"].some((keyword) =>
      normalizedName.includes(keyword),
    )
  ) {
    return "simpleMelee";
  }

  return null;
}

function hasWeaponProficiency(
  normalizedName: string,
  weaponKind: string,
  weaponProficiencies: string[],
) {
  const proficiencies = weaponProficiencies.map((entry) => entry.toLowerCase());

  if (proficiencies.some((entry) => normalizedName.includes(entry) || entry.includes(normalizedName))) {
    return true;
  }
  if (
    ["dagger", "sling", "bow", "crossbow", "simpleMelee"].includes(weaponKind) &&
    proficiencies.some((entry) => entry.includes("simple weapon"))
  ) {
    return true;
  }
  if (
    ["finesseMelee"].includes(weaponKind) &&
    proficiencies.some((entry) => entry.includes("martial weapon"))
  ) {
    return true;
  }
  if (
    normalizedName.includes("warhammer") &&
    proficiencies.some((entry) => entry.includes("martial weapon"))
  ) {
    return true;
  }

  return false;
}

function getAbilityScore(abilityScores: CharacterAbilityScore[], abilityIndex: string) {
  return abilityScores.find((entry) => entry.abilityIndex === abilityIndex)?.score ?? 10;
}

function abilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function formatModifier(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function formatInlineModifier(value: number) {
  return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function formatInventoryDamage(baseDamage: string, modifier: number) {
  const trimmedDamage = baseDamage.trim();
  if (!trimmedDamage) {
    return `1 ${formatInlineModifier(modifier)}`;
  }
  const diceMatch = trimmedDamage.match(/\d+d\d+/i);
  const damagePrefix = diceMatch ? diceMatch[0] : trimmedDamage;

  return `${damagePrefix} ${formatInlineModifier(modifier)}`;
}

function appendExtraDamage(baseDamage: string, extraDamage: string) {
  return extraDamage ? `${baseDamage} + ${extraDamage}` : baseDamage;
}

function getCriticalHitRange(activeSourceIndexes: Set<string>) {
  if (activeSourceIndexes.has("superior-critical")) {
    return "18-20";
  }
  if (activeSourceIndexes.has("improved-critical")) {
    return "19-20";
  }

  return "";
}

function getSneakAttackDice(level: number) {
  return `${Math.ceil(level / 2)}d6 Sneak Attack`;
}

function isSneakAttackEligibleProfile(profile: {
  notes: string;
  type: string;
}) {
  const normalizedNotes = profile.notes.toLowerCase();
  const normalizedType = profile.type.toLowerCase();

  return (
    normalizedNotes.includes("finesse") ||
    normalizedNotes.includes("ranged") ||
    normalizedNotes.includes("thrown") ||
    normalizedType.includes("ranged")
  );
}

function isRangedWeaponKind(weaponKind: ReturnType<typeof getWeaponKind> | "simpleMelee") {
  return weaponKind === "bow" || weaponKind === "crossbow" || weaponKind === "sling";
}

function isRangedWeaponName(name: string) {
  const weaponKind = getWeaponKind(name.toLowerCase()) ?? "simpleMelee";
  return isRangedWeaponKind(weaponKind);
}

function isOneHandedMeleeWeaponName(name: string) {
  const weaponKind = getWeaponKind(name.toLowerCase());
  return weaponKind === "simpleMelee" || weaponKind === "finesseMelee" || weaponKind === "dagger";
}

function isGreatWeaponStyleWeaponName(name: string) {
  const normalizedName = name.toLowerCase();

  return [
    "greatsword",
    "greataxe",
    "halberd",
    "glaive",
    "maul",
    "pike",
    "longsword",
    "warhammer",
    "battleaxe",
    "quarterstaff",
    "spear",
  ].some((keyword) => normalizedName.includes(keyword));
}

function appendFightingStyleNotes(
  baseNotes: string,
  itemName: string,
  options: {
    criticalHitRange: string;
    greatWeaponFightingActive: boolean;
    radiantStrikesActive: boolean;
    rageDamageBonus: number;
    sneakAttackDice: string;
    twoWeaponFightingActive: boolean;
  },
) {
  const notes = [baseNotes.trim()].filter((value) => value.length > 0);

  if (options.greatWeaponFightingActive && isGreatWeaponStyleWeaponName(itemName)) {
    notes.push("Great Weapon Fighting active");
  }

  if (options.criticalHitRange) {
    notes.push(`Critical hit on ${options.criticalHitRange}`);
  }

  if (options.rageDamageBonus > 0) {
    notes.push(`Rage +${options.rageDamageBonus} damage`);
  }

  if (options.radiantStrikesActive) {
    notes.push("Radiant Strikes +1d8 radiant");
  }

  if (options.sneakAttackDice) {
    notes.push(`${options.sneakAttackDice} once per turn`);
  }

  if (options.twoWeaponFightingActive && isOneHandedMeleeWeaponName(itemName)) {
    notes.push("Two-Weapon Fighting setup");
  }

  return notes.join(" • ");
}

function appendUnarmedStrikeNotes(options: {
  criticalHitRange: string;
  dazzlingFootworkActive: boolean;
  radiantStrikesActive: boolean;
  tavernBrawlerActive: boolean;
}) {
  const notes = ["Melee"];

  if (options.tavernBrawlerActive) {
    notes.push("Tavern Brawler");
  }

  if (options.criticalHitRange) {
    notes.push(`Critical hit on ${options.criticalHitRange}`);
  }

  if (options.radiantStrikesActive) {
    notes.push("Radiant Strikes +1d8 radiant");
  }

  if (options.dazzlingFootworkActive) {
    notes.push("Dazzling Footwork uses Dexterity and Bardic Inspiration die");
  }

  return notes.join(" • ");
}

function getRageDamageBonus(level: number) {
  if (level >= 16) {
    return 4;
  }
  if (level >= 9) {
    return 3;
  }
  return 2;
}

function getBardicInspirationDie(level: number) {
  if (level >= 15) {
    return "1d12";
  }
  if (level >= 10) {
    return "1d10";
  }
  if (level >= 5) {
    return "1d8";
  }
  return "1d6";
}

export { deriveWeaponActionEntries };
