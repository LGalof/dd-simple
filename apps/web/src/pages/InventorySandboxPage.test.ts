import { describe, expect, it } from "vitest";
import {
  canEquipItemInSlot,
  convertCurrencyToGp,
  enforceAttunementLimit,
  getInventoryTotals,
  shouldPreferLocalInventoryState,
  type InventoryItem,
} from "./InventorySandboxPage";

function createItem(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    armorClassBonus: 0,
    attackBonus: 0,
    color: "#fff",
    damage: "",
    height: 1,
    id: "item-1",
    kind: "treasure",
    location: "inventory",
    maxStack: 1,
    name: "Test Item",
    notes: "",
    quantity: 1,
    rarity: "Common",
    rotated: false,
    speedPenalty: 0,
    stackable: false,
    value: 0,
    weight: 0,
    width: 1,
    x: 0,
    y: 0,
    ...overrides,
  };
}

describe("inventory totals", () => {
  it("converts currency units to gold pieces", () => {
    expect(convertCurrencyToGp(100, "cp")).toBe(1);
    expect(convertCurrencyToGp(10, "sp")).toBe(1);
    expect(convertCurrencyToGp(2, "ep")).toBe(1);
    expect(convertCurrencyToGp(2, "pp")).toBe(20);
  });

  it("includes quantities, equipped items, weight, and converted value", () => {
    const totals = getInventoryTotals([
      createItem({ quantity: 2, value: 5, valueUnit: "sp", weight: 1 }),
      createItem({ id: "equipped", location: "equipped", value: 2, valueUnit: "gp", weight: 3 }),
    ]);

    expect(totals).toEqual({ itemCount: 3, value: 3, weight: 5 });
  });
});

describe("inventory rules", () => {
  it("keeps newer local changes when reload happens before backend autosave", () => {
    expect(
      shouldPreferLocalInventoryState({ updatedAt: 200 }, { updatedAt: 100 }),
    ).toBe(true);
    expect(
      shouldPreferLocalInventoryState({ updatedAt: 100 }, { updatedAt: 200 }),
    ).toBe(false);
    expect(shouldPreferLocalInventoryState({}, null)).toBe(false);
  });

  it("limits imported attuned items", () => {
    const items = Array.from({ length: 4 }, (_, index) =>
      createItem({
        attuned: true,
        id: `item-${index}`,
        requiresAttunement: true,
      }),
    );

    expect(enforceAttunementLimit(items, 3).filter((item) => item.attuned)).toHaveLength(3);
  });

  it("allows accessories and one-handed weapons in compatible slots", () => {
    const ring = createItem({ equipmentSlot: "accessory1", name: "Ring of Protection" });
    const dagger = createItem({ equipmentSlot: "mainHand", kind: "weapon", name: "Dagger" });

    expect(canEquipItemInSlot(ring, "accessory2")).toBe(true);
    expect(canEquipItemInSlot(dagger, "offHand")).toBe(true);
    expect(canEquipItemInSlot(dagger, "body")).toBe(false);
  });
});
