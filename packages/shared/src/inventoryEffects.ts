type SharedEquipmentLike = {
  description?: string | null;
  equipmentCategory?: string | null;
  index?: string;
  itemType?: string | null;
  name: string;
  sourceJson?: unknown;
};

type SharedReferenceEquipmentEffects = {
  armorClassBonus: number;
  attackBonus: number;
  damage: string;
  damageBonus: number;
  resistances: string[];
  savingThrowBonus: number;
  spellAttackBonus: number;
  spellSaveDcBonus: number;
  speedPenalty: number;
  strengthMinimum: number | null;
};

const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
] as const;

function extractEquipmentDescription(referenceItem: SharedEquipmentLike) {
  if (typeof referenceItem.description === "string" && referenceItem.description.trim().length > 0) {
    return referenceItem.description.trim();
  }

  const sourceJson =
    referenceItem.sourceJson && typeof referenceItem.sourceJson === "object"
      ? (referenceItem.sourceJson as Record<string, unknown>)
      : null;
  const desc = sourceJson?.desc;

  if (Array.isArray(desc)) {
    return desc.filter((entry): entry is string => typeof entry === "string").join(" ");
  }

  if (typeof desc === "string") {
    return desc;
  }

  return "";
}

function itemRequiresAttunement(referenceItem: SharedEquipmentLike) {
  const sourceJson =
    referenceItem.sourceJson && typeof referenceItem.sourceJson === "object"
      ? (referenceItem.sourceJson as Record<string, unknown>)
      : null;

  if (typeof sourceJson?.attunement === "boolean") {
    return sourceJson.attunement;
  }

  const description = extractEquipmentDescription(referenceItem).toLowerCase();
  return description.includes("requires attunement") || description.includes("attunement");
}

function deriveReferenceEquipmentEffects(referenceItem: SharedEquipmentLike): SharedReferenceEquipmentEffects {
  const normalizedName = referenceItem.name.trim().toLowerCase();
  const description = extractEquipmentDescription(referenceItem);
  const armorClassBonus = deriveArmorClassBonus(referenceItem, normalizedName);
  const attackBonus = deriveAttackBonus(normalizedName, description);
  const damageBonus = deriveDamageBonus(normalizedName, description);
  const spellcastingBonus = deriveSpellcastingBonus(description);

  return {
    armorClassBonus,
    attackBonus,
    damage: deriveWeaponDamage(referenceItem, normalizedName),
    damageBonus,
    resistances: deriveResistanceTargets(description),
    savingThrowBonus: deriveSavingThrowBonus(normalizedName),
    spellAttackBonus: spellcastingBonus.spellAttackBonus,
    spellSaveDcBonus: spellcastingBonus.spellSaveDcBonus,
    speedPenalty: 0,
    strengthMinimum: deriveStrengthMinimum(normalizedName),
  };
}

function summarizeReferenceEquipmentEffects(referenceItem: SharedEquipmentLike) {
  const effects = deriveReferenceEquipmentEffects(referenceItem);
  const effectLines = buildReferenceEquipmentEffectLines(referenceItem, effects);
  const description = extractEquipmentDescription(referenceItem);

  return {
    description,
    effectLines,
    summary: effectLines.length > 0 ? effectLines.join(" ") : description,
  };
}

function deriveArmorClassBonus(referenceItem: SharedEquipmentLike, normalizedName: string) {
  const sourceJson =
    referenceItem.sourceJson && typeof referenceItem.sourceJson === "object"
      ? (referenceItem.sourceJson as Record<string, unknown>)
      : null;
  const description = extractEquipmentDescription(referenceItem);
  const normalizedDescription = description.toLowerCase();
  const armorClass =
    sourceJson?.armor_class && typeof sourceJson.armor_class === "object"
      ? (sourceJson.armor_class as Record<string, unknown>)
      : null;
  const baseArmorClass = typeof armorClass?.base === "number" ? armorClass.base : null;
  const shieldBonus = parseNamedMagicBonus(normalizedName, "shield");

  if (shieldBonus > 0) {
    return 2 + shieldBonus;
  }

  if (normalizedName.includes("shield")) {
    return 2;
  }

  if (baseArmorClass !== null) {
    return Math.max(0, baseArmorClass - 10);
  }

  if (
    normalizedName.includes("ring of protection") ||
    normalizedName.includes("cloak of protection")
  ) {
    return 1;
  }

  return (
    parseDescriptionBonus(normalizedDescription, "armor class") ||
    parseNamedMagicBonus(normalizedName, "armor")
  );
}

function deriveAttackBonus(normalizedName: string, description: string) {
  const normalizedDescription = description.toLowerCase();

  const namedBonus =
    parseNamedMagicBonus(normalizedName, "weapon") ||
    parseNamedMagicBonus(normalizedName, "ammunition");

  if (namedBonus > 0) {
    return namedBonus;
  }

  return parseWeaponAttackBonus(normalizedDescription);
}

function deriveDamageBonus(normalizedName: string, description: string) {
  const normalizedDescription = description.toLowerCase();

  const namedBonus =
    parseNamedMagicBonus(normalizedName, "weapon") ||
    parseNamedMagicBonus(normalizedName, "ammunition");

  if (namedBonus > 0) {
    return namedBonus;
  }

  return parseWeaponDamageBonus(normalizedDescription);
}

function deriveSpellcastingBonus(description: string) {
  const normalizedDescription = description.toLowerCase();
  const attackMatch = normalizedDescription.match(/\+(\d+)\s+bonus to spell attack rolls/);
  const dcMatch = normalizedDescription.match(/\+(\d+)\s+bonus to [^.]*saving throw dcs?/);

  return {
    spellAttackBonus: attackMatch ? Number.parseInt(attackMatch[1] ?? "0", 10) : 0,
    spellSaveDcBonus: dcMatch ? Number.parseInt(dcMatch[1] ?? "0", 10) : 0,
  };
}

function deriveWeaponDamage(referenceItem: SharedEquipmentLike, normalizedName: string) {
  const sourceJson =
    referenceItem.sourceJson && typeof referenceItem.sourceJson === "object"
      ? (referenceItem.sourceJson as Record<string, unknown>)
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

  if (damageDice) {
    return damageTypeName ? `${damageDice} ${damageTypeName.toLowerCase()}` : damageDice;
  }

  if (parseNamedMagicBonus(normalizedName, "weapon") > 0) {
    return "1d6";
  }

  return "";
}

function deriveResistanceTargets(description: string) {
  const normalizedDescription = description.toLowerCase();
  const matches = [...normalizedDescription.matchAll(/resistance to ([^.]+?) damage/g)];
  const results = new Set<string>();

  for (const match of matches) {
    const value = match[1] ?? "";

    for (const damageType of DAMAGE_TYPES) {
      if (new RegExp(`\\b${damageType}\\b`, "i").test(value)) {
        results.add(toTitleCase(damageType));
      }
    }
  }

  return [...results];
}

function deriveSavingThrowBonus(normalizedName: string) {
  if (
    normalizedName.includes("ring of protection") ||
    normalizedName.includes("cloak of protection")
  ) {
    return 1;
  }

  return 0;
}

function deriveStrengthMinimum(normalizedName: string) {
  if (normalizedName.includes("gauntlets of ogre power")) {
    return 19;
  }

  return null;
}

function parseNamedMagicBonus(normalizedName: string, itemName: string) {
  const escapedItemName = itemName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = normalizedName.match(new RegExp(`\\b${escapedItemName}\\b[^+]*\\+(\\d+)\\b`));

  return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
}

function parseDescriptionBonus(normalizedDescription: string, target: string) {
  const escapedTarget = target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = normalizedDescription.match(new RegExp(`\\+(\\d+)\\s+bonus to [^.]*${escapedTarget}`));

  return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
}

function parseWeaponAttackBonus(normalizedDescription: string) {
  const match = normalizedDescription.match(/\+(\d+)\s+bonus to attack rolls\b/);

  return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
}

function parseWeaponDamageBonus(normalizedDescription: string) {
  const combinedMatch = normalizedDescription.match(
    /\+(\d+)\s+bonus to attack rolls and damage rolls\b/,
  );
  const damageOnlyMatch = normalizedDescription.match(/\+(\d+)\s+bonus to damage rolls\b/);
  const match = combinedMatch ?? damageOnlyMatch;

  return match ? Number.parseInt(match[1] ?? "0", 10) : 0;
}

function buildReferenceEquipmentEffectLines(
  referenceItem: SharedEquipmentLike,
  effects: SharedReferenceEquipmentEffects,
) {
  const lines: string[] = [];
  const requiresAttunement = itemRequiresAttunement(referenceItem);
  const description = extractEquipmentDescription(referenceItem);
  const normalizedName = referenceItem.name.trim().toLowerCase();

  if (requiresAttunement) {
    lines.push("Requires attunement to grant its magical benefits.");
  }

  if (effects.armorClassBonus > 0) {
    lines.push(`Grants +${effects.armorClassBonus} Armor Class while equipped.`);
  }

  if (effects.attackBonus > 0 && effects.damageBonus > 0) {
    lines.push(
      `Grants +${effects.attackBonus} to attack rolls and +${effects.damageBonus} to damage rolls made with this item.`,
    );
  } else {
    if (effects.attackBonus > 0) {
      lines.push(`Grants +${effects.attackBonus} to attack rolls made with this item.`);
    }

    if (effects.damageBonus > 0) {
      lines.push(`Grants +${effects.damageBonus} to damage rolls made with this item.`);
    }
  }

  if (effects.damage) {
    lines.push(`Uses ${effects.damage} as its weapon damage profile.`);
  }

  if (effects.savingThrowBonus > 0) {
    lines.push(`Grants +${effects.savingThrowBonus} to saving throws.`);
  }

  if (effects.spellAttackBonus > 0) {
    lines.push(`Grants +${effects.spellAttackBonus} to spell attack rolls.`);
  }

  if (effects.spellSaveDcBonus > 0) {
    lines.push(`Grants +${effects.spellSaveDcBonus} to spell save DCs.`);
  }

  if (effects.resistances.length > 0) {
    lines.push(`Grants resistance to ${effects.resistances.join(", ")} damage.`);
  }

  extractSavingThrowAdvantageLines(description).forEach((line) => lines.push(line));

  if (normalizedName.includes("mantle of spell resistance")) {
    lines.push("Grants advantage on saving throws against spells.");
  }

  if (normalizedName.includes("serpent scale armor")) {
    lines.push("Allows your full Dexterity modifier for Armor Class and does not impose Stealth disadvantage.");
  }

  if (effects.strengthMinimum !== null) {
    lines.push(`Sets your Strength score to ${effects.strengthMinimum} if it is lower.`);
  }

  if (effects.speedPenalty > 0) {
    lines.push(`Reduces your speed by ${effects.speedPenalty} feet while equipped.`);
  }

  return lines;
}

function extractSavingThrowAdvantageLines(description: string) {
  const lines = new Set<string>();
  const pattern = /(?:you have|you gain) advantage on saving throws ([^.]+)/gi;

  [...description.matchAll(pattern)].forEach((match) => {
    const detail = match[1]?.trim();

    if (detail) {
      lines.add(`Grants advantage on saving throws ${detail}.`);
    }
  });

  return [...lines];
}

function toTitleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

export {
  deriveReferenceEquipmentEffects,
  extractEquipmentDescription,
  itemRequiresAttunement,
  summarizeReferenceEquipmentEffects,
};
export type { SharedEquipmentLike, SharedReferenceEquipmentEffects };
