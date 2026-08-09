import { beforeEach, describe, expect, it } from "vitest";
import type { ReferenceEquipment } from "../types/reference";
import {
  canMergeItems,
  canPlaceItem,
  clampNumber,
  decodeInventoryState,
  encodeInventoryState,
  extractReferenceDescription,
  findFirstAvailableSlot,
  formatInventoryNumber,
  formatReferenceEquipmentMeta,
  getContainerStats,
  getInventoryDragScrollSpeed,
  getInventoryStorageKey,
  getItemHeight,
  getItemWidth,
  inferReferenceEquipmentSlot,
  inferReferenceItemColor,
  inferReferenceItemHeight,
  inferReferenceItemKind,
  inferReferenceItemWidth,
  inferReferenceLibraryType,
  inferReferenceRequiresAttunement,
  inferReferenceSourceCategory,
  isReferenceEquipmentCommon,
  isReferenceEquipmentContainer,
  isReferenceEquipmentMagical,
  itemsOverlap,
  loadSavedInventoryState,
  mapBackendInventoryItemToGridItem,
  mapGridItemToBackendInventoryItem,
  summarizeInventoryItemEffects,
  type InventoryContainer,
  type InventoryItem,
} from "./InventorySandboxPage";

function item(patch: Partial<InventoryItem> = {}): InventoryItem {
  return {
    armorClassBonus: 0,
    attackBonus: 0,
    color: "#38bdf8",
    damage: "",
    height: 1,
    id: "item-1",
    kind: "treasure",
    location: "inventory",
    maxStack: 1,
    name: "Torch",
    notes: "",
    quantity: 1,
    rarity: "Common",
    rotated: false,
    speedPenalty: 0,
    stackable: false,
    value: 1,
    weight: 1,
    width: 1,
    x: 0,
    y: 0,
    ...patch,
  };
}

function reference(patch: Partial<ReferenceEquipment>): ReferenceEquipment {
  return {
    costQuantity: null,
    costUnit: null,
    description: null,
    equipmentCategory: null,
    index: "ref",
    itemType: null,
    name: "Reference Item",
    sourceJson: null,
    weight: null,
    ...patch,
  };
}

describe("InventorySandboxPage helpers", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("calculates grid sizes, overlap, placement, merge, and stats", () => {
    const container: InventoryContainer = { id: "inventory", name: "Pack", columns: 4, rows: 3 };
    const sword = item({ id: "sword", name: "Longsword", width: 1, height: 3, value: 15, weight: 3 });
    const rotatedArmor = item({
      id: "armor",
      height: 3,
      location: "inventory",
      name: "Chain Mail",
      rotated: true,
      width: 2,
      x: 1,
      y: 0,
    });

    expect(getItemWidth(rotatedArmor)).toBe(3);
    expect(getItemHeight(rotatedArmor)).toBe(2);
    expect(itemsOverlap(sword, rotatedArmor)).toBe(false);
    expect(canPlaceItem(rotatedArmor, container, [sword, rotatedArmor])).toBe(true);
    expect(canPlaceItem(item({ id: "too-wide", width: 5 }), container, [])).toBe(false);
    expect(findFirstAvailableSlot(item({ id: "gem", width: 1, height: 1 }), container, [sword])).toEqual({ x: 1, y: 0 });

    expect(canMergeItems(item({ id: "a", name: "Potion", stackable: true }), item({ id: "b", name: " potion ", stackable: true }))).toBe(true);
    expect(canMergeItems(item({ id: "a", stackable: true }), item({ id: "a", stackable: true }))).toBe(false);
    expect(getContainerStats(container, [sword, item({ id: "coins", quantity: 5, value: 2, weight: 0.1 })])).toMatchObject({
      itemCount: 6,
      totalCells: 12,
      usedCells: 4,
      value: 25,
    });
  });

  it("formats values and round-trips saved inventory state", () => {
    const state = {
      containers: [{ id: "inventory", name: "Pack", columns: 2, rows: 2 }],
      items: [item({ id: "potion", quantity: 2, stackable: true })],
      selectedItemId: "",
    };

    expect(formatInventoryNumber(Number.NaN)).toBe("0");
    expect(formatInventoryNumber(2)).toBe("2");
    expect(formatInventoryNumber(2.25)).toBe("2.3");
    expect(clampNumber(9.8, 1, 6)).toBe(6);
    expect(clampNumber(Number.NaN, 1, 6)).toBe(1);
    expect(getInventoryStorageKey("sandbox")).toBe("dd-simple.inventory-sandbox.v1");
    expect(getInventoryStorageKey("character-1")).toBe("dd-simple.character-inventory.v1.character-1");

    const encodedState = encodeInventoryState(state);
    expect(encodedState).not.toContain("+");
    expect(decodeInventoryState(encodedState)).toMatchObject({
      selectedItemId: "",
      items: [{ id: "potion", maxStack: 1, quantity: 2 }],
    });

    const legacyItem = { ...state.items[0] };
    delete legacyItem.maxStack;
    localStorage.setItem("inventory-test", JSON.stringify({ containers: state.containers, items: [legacyItem] }));
    expect(loadSavedInventoryState("inventory-test")).toMatchObject({
      selectedItemId: "potion",
      items: [{ id: "potion", maxStack: 999 }],
    });
    expect(decodeInventoryState("not valid")).toBeNull();
    localStorage.setItem("inventory-test", JSON.stringify({ containers: null, items: [] }));
    expect(loadSavedInventoryState("inventory-test")).toBeNull();

    localStorage.setItem(
      "inventory-size-migration",
      JSON.stringify({
        containers: [{ id: "inventory", name: "Pack", columns: 10, rows: 6 }],
        items: [
          item({
            height: 1,
            id: "legacy-greatsword",
            kind: "weapon",
            name: "Greatsword",
            referenceEquipmentIndex: "greatsword",
            weight: 6,
            width: 1,
          }),
        ],
        selectedItemId: "legacy-greatsword",
      }),
    );
    expect(loadSavedInventoryState("inventory-size-migration")).toMatchObject({
      itemSizeVersion: 2,
      items: [{ id: "legacy-greatsword", width: 2, height: 3 }],
    });
  });

  it("infers reference equipment categories, dimensions, colors, and metadata", () => {
    const shield = reference({ equipmentCategory: "Armor", name: "Shield" });
    const wand = reference({
      description: "A magic wand that requires attunement.",
      itemType: "Wand",
      name: "Wand of Sparks",
      sourceJson: { source: "Critical Role" },
    });
    const pack = reference({ equipmentCategory: "Adventuring Gear", name: "Explorer Pack" });
    const scroll = reference({ itemType: "Scroll", name: "Spell Scroll", sourceJson: { desc: ["A copied spell."] } });
    const string = reference({ equipmentCategory: "Adventuring Gear", name: "String", weight: 0 });

    expect(inferReferenceLibraryType(shield)).toBe("armor");
    expect(inferReferenceItemKind(shield)).toBe("armor");
    expect(inferReferenceEquipmentSlot(shield)).toBe("offHand");
    expect(inferReferenceItemWidth(shield)).toBe(2);
    expect(inferReferenceItemHeight(shield)).toBe(2);
    expect(inferReferenceItemColor(shield)).toBe("#64748b");
    expect(isReferenceEquipmentCommon(shield)).toBe(true);

    expect(inferReferenceLibraryType(wand)).toBe("wand");
    expect(inferReferenceItemKind(wand)).toBe("tool");
    expect(inferReferenceRequiresAttunement(wand)).toBe(true);
    expect(inferReferenceSourceCategory(wand)).toBe("Critical Role");
    expect(isReferenceEquipmentMagical(wand)).toBe(true);
    expect(isReferenceEquipmentCommon(wand)).toBe(false);

    expect(isReferenceEquipmentContainer(pack)).toBe(true);
    expect(inferReferenceItemWidth(pack)).toBe(3);
    expect(inferReferenceItemHeight(pack)).toBe(2);
    expect(extractReferenceDescription(scroll)).toBe("A copied spell.");
    expect(formatReferenceEquipmentMeta(reference({ costQuantity: 25, costUnit: "gp", equipmentCategory: "Gear", name: "Spyglass" }))).toBe("Gear · 25 gp");
    expect(inferReferenceLibraryType(string)).toBe("other");
    expect(inferReferenceEquipmentSlot(string)).toBeUndefined();

    const sizeCases: Array<[string, Partial<ReferenceEquipment>, number, number]> = [
      ["potion", { itemType: "Potion", name: "Potion of Healing", weight: 0.5 }, 1, 1],
      ["scroll", { itemType: "Scroll", name: "Spell Scroll" }, 1, 2],
      ["wand", { itemType: "Wand", name: "Wand of Magic Missiles", weight: 1 }, 1, 2],
      ["staff", { itemType: "Staff", name: "Staff of Healing", weight: 4 }, 1, 3],
      ["ring", { itemType: "Ring", name: "Ring of Protection" }, 1, 1],
      ["light armor", { equipmentCategory: "Armor", itemType: "light-armor", name: "Leather Armor", weight: 10 }, 2, 2],
      ["heavy armor", { equipmentCategory: "Armor", itemType: "heavy-armor", name: "Chain Mail", weight: 55 }, 2, 3],
      ["great weapon", { equipmentCategory: "Weapons", name: "Greatsword", weight: 6 }, 2, 3],
      ["long weapon", { equipmentCategory: "Weapons", name: "Longbow", weight: 2 }, 1, 3],
      ["regular weapon", { equipmentCategory: "Weapons", name: "Battleaxe", weight: 4 }, 1, 2],
      ["small weapon", { equipmentCategory: "Weapons", name: "Dagger", weight: 1 }, 1, 1],
      ["tool kit", { equipmentCategory: "Tools", name: "Thieves' Tools", weight: 1 }, 2, 1],
      ["heavy supplies", { equipmentCategory: "Tools", name: "Alchemist's Supplies", weight: 8 }, 2, 2],
      ["rope", { equipmentCategory: "Adventuring Gear", name: "Rope", weight: 5 }, 2, 2],
      ["bedroll", { equipmentCategory: "Adventuring Gear", name: "Bedroll", weight: 25 }, 3, 2],
      ["lantern", { equipmentCategory: "Adventuring Gear", name: "Hooded Lantern", weight: 2 }, 1, 2],
      ["cloak", { equipmentCategory: "Wondrous Item", name: "Cloak of Protection", weight: 1 }, 2, 2],
      ["boots", { equipmentCategory: "Wondrous Item", name: "Boots of Elvenkind", weight: 1 }, 2, 1],
      ["gem", { equipmentCategory: "Treasure", name: "Ruby", weight: 0 }, 1, 1],
    ];

    sizeCases.forEach(([label, patch, width, height]) => {
      const sizedItem = reference(patch);
      expect([inferReferenceItemWidth(sizedItem), inferReferenceItemHeight(sizedItem)], label).toEqual([width, height]);
    });
  });

  it("maps inventory items between backend and grid payloads", () => {
    const backendItem = {
      equipment: {
        costQuantity: 10,
        costUnit: "gp",
        description: "A protective shield.",
        equipmentCategory: "Armor",
        index: "shield",
        itemType: "Shield",
        name: "Shield",
        sourceJson: null,
        weight: 6,
      },
      equipmentIndex: "shield",
      equipped: true,
      gridX: 2,
      gridY: 3,
      id: "inventory-item",
      notes: null,
      quantity: 1,
    };

    const gridItem = mapBackendInventoryItemToGridItem(backendItem);
    expect(gridItem).toMatchObject({
      armorClassBonus: 2,
      equipmentSlot: "offHand",
      equippedSlot: "offHand",
      id: "inventory-item",
      kind: "armor",
      location: "equipped",
      name: "Shield",
      referenceEquipmentIndex: "shield",
    });

    expect(mapGridItemToBackendInventoryItem(gridItem)).toEqual({
      customName: "Shield",
      equipped: true,
      equipmentIndex: "shield",
      gridX: null,
      gridY: null,
      notes: "A protective shield.",
      quantity: 1,
    });
    expect(mapGridItemToBackendInventoryItem(item())).toBeNull();
  });

  it("summarizes direct and reference-derived item effects", () => {
    expect(
      summarizeInventoryItemEffects(
        item({
          armorClassBonus: 1,
          attackBonus: 2,
          attuned: false,
          damage: "1d8 slashing",
          name: "Blade of Warning",
          notes: "You have advantage on initiative rolls.",
          referenceEquipmentIndex: "weapon-of-warning",
          requiresAttunement: true,
          speedPenalty: 10,
        }),
      ),
    ).toEqual(
      expect.arrayContaining([
        "This item needs attunement before its magical effects apply to the character.",
        "Grants +1 Armor Class while equipped.",
        "Grants +2 to attack rolls made with this item.",
        "Uses 1d8 slashing as its weapon damage profile.",
        "Reduces speed by 10 feet while equipped.",
      ]),
    );
  });

  it("calculates inventory drag auto-scroll speed near the viewport edges", () => {
    expect(getInventoryDragScrollSpeed(100, 100, 700)).toBe(-18);
    expect(getInventoryDragScrollSpeed(145, 100, 700)).toBeLessThan(0);
    expect(getInventoryDragScrollSpeed(400, 100, 700)).toBe(0);
    expect(getInventoryDragScrollSpeed(655, 100, 700)).toBeGreaterThan(0);
    expect(getInventoryDragScrollSpeed(700, 100, 700)).toBe(18);
    expect(getInventoryDragScrollSpeed(100, 200, 200)).toBe(0);
  });
});
