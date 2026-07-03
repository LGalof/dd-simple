import {
  deriveReferenceEquipmentEffects,
  extractEquipmentDescription,
  itemRequiresAttunement,
  summarizeReferenceEquipmentEffects,
  type SharedEquipmentLike,
} from "@dd-simple/shared";
import { compareDefenseEntries, dedupeDefenses } from "./shared.js";
import type { CharacterDefenseEntry, ResolvedFeatureSource } from "./types.js";

type EquippedInventoryItem = {
  equipmentIndex: string;
  customName?: string | null;
  equipment: {
    description?: string | null;
    index: string;
    itemType?: string | null;
    name: string;
    sourceJson?: unknown;
  };
  notes?: string | null;
};

type EquippedItemDerivedEffects = {
  activeSources: ResolvedFeatureSource[];
  armorClassBonus: number;
  defenses: CharacterDefenseEntry[];
  savingThrowBonus: number;
  strengthMinimum: number | null;
};

type InventoryStateItem = {
  attuned?: boolean;
  id?: string;
  name?: string;
  notes?: string;
  referenceEquipmentIndex?: string;
  requiresAttunement?: boolean;
};

function deriveEquippedItemEffects(
  items: EquippedInventoryItem[],
  attunedStateBySignature: Map<string, number> = new Map(),
): EquippedItemDerivedEffects {
  const activeSources: ResolvedFeatureSource[] = [];
  const defenses: CharacterDefenseEntry[] = [];
  let armorClassBonus = 0;
  let savingThrowBonus = 0;
  let strengthMinimum: number | null = null;

  for (const item of items) {
    const sharedItem = toSharedEquipmentLike(item);
    const requiresAttunement = itemRequiresAttunement(sharedItem);
    const isAttuned = !requiresAttunement || consumeAttunedStateMatch(attunedStateBySignature, item);

    if (requiresAttunement && !isAttuned) {
      continue;
    }

    const description = extractEquipmentDescription(sharedItem);
    const normalizedName = (item.customName?.trim() || item.equipment.name).toLowerCase();
    const title = item.customName?.trim() || item.equipment.name;
    const itemEffects = deriveItemEffectDetails(item);

    armorClassBonus += itemEffects.armorClassBonus;
    savingThrowBonus += itemEffects.savingThrowBonus;

    if (itemEffects.strengthMinimum !== null) {
      strengthMinimum = Math.max(strengthMinimum ?? 0, itemEffects.strengthMinimum);
    }

    if (
      requiresAttunement ||
      normalizedName.includes("+1") ||
      normalizedName.includes("protection") ||
      normalizedName.includes("warmth") ||
      normalizedName.includes("ogre power") ||
      itemEffects.resistanceTargets.length > 0
    ) {
      activeSources.push({
        description: itemEffects.summary,
        level: null,
        sourceIndex: item.equipment.index,
        sourceType: "item",
        title,
      });
    }

    itemEffects.resistanceTargets.forEach((target) => {
      defenses.push({
        description,
        id: `item:${item.equipment.index}:resistance:${target.toLowerCase()}`,
        kind: "resistance",
        level: null,
        sourceIndex: item.equipment.index,
        sourceType: "item",
        target,
        title,
      });
    });
  }

  return {
    activeSources,
    armorClassBonus,
    defenses: dedupeDefenses(defenses).sort(compareDefenseEntries),
    savingThrowBonus,
    strengthMinimum,
  };
}

function decodeInventoryAttunementState(
  stateCode: string | null | undefined,
) {
  if (!stateCode || stateCode.trim().length === 0) {
    return new Map<string, number>();
  }

  try {
    const normalizedCode = stateCode.trim().replace(/-/g, "+").replace(/_/g, "/");
    const paddedCode = normalizedCode.padEnd(
      normalizedCode.length + ((4 - (normalizedCode.length % 4)) % 4),
      "=",
    );
    const binary = Buffer.from(paddedCode, "base64").toString("binary");
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsedState = JSON.parse(json) as { items?: InventoryStateItem[] };

    if (!Array.isArray(parsedState.items)) {
      return new Map<string, number>();
    }

    const attunedEntries = parsedState.items.filter(
      (item) =>
        item &&
        item.attuned === true &&
        item.requiresAttunement === true &&
        typeof item.referenceEquipmentIndex === "string" &&
        item.referenceEquipmentIndex.trim().length > 0,
    );
    const signatureCounts = new Map<string, number>();

    for (const item of attunedEntries) {
      const signature = createInventoryStateSignature(item);
      signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
    }

    return signatureCounts;
  } catch {
    return new Map<string, number>();
  }
}

function consumeAttunedStateMatch(
  attunedStateBySignature: Map<string, number>,
  item: EquippedInventoryItem,
) {
  const signature = createEquippedItemSignature(item);
  const currentCount = attunedStateBySignature.get(signature) ?? 0;

  if (currentCount <= 0) {
    return false;
  }

  if (currentCount === 1) {
    attunedStateBySignature.delete(signature);
  } else {
    attunedStateBySignature.set(signature, currentCount - 1);
  }

  return true;
}

function createInventoryStateSignature(item: InventoryStateItem) {
  return [
    item.referenceEquipmentIndex?.trim().toLowerCase() ?? "",
    item.name?.trim().toLowerCase() ?? "",
    item.notes?.trim().toLowerCase() ?? "",
  ].join("|");
}

function createEquippedItemSignature(item: EquippedInventoryItem) {
  return [
    item.equipmentIndex.trim().toLowerCase(),
    (item.customName?.trim() || item.equipment.name).toLowerCase(),
    item.notes?.trim().toLowerCase() ?? "",
  ].join("|");
}

function deriveItemEffectDetails(
  item: EquippedInventoryItem,
) {
  const sharedItem = toSharedEquipmentLike(item);
  const summary = summarizeReferenceEquipmentEffects(sharedItem);
  const effects = deriveReferenceEquipmentEffects(sharedItem);

  return {
    ...effects,
    resistanceTargets: effects.resistances,
    summary: summary.summary,
  };
}

function toSharedEquipmentLike(item: EquippedInventoryItem): SharedEquipmentLike {
  return {
    description:
      typeof item.notes === "string" && item.notes.trim().length > 0
        ? item.notes.trim()
        : item.equipment.description ?? null,
    name: item.customName?.trim() || item.equipment.name,
    sourceJson: item.equipment.sourceJson,
  };
}

export { decodeInventoryAttunementState, deriveEquippedItemEffects };
