import { describe, expect, it } from "vitest";
import { getArmorDexterityContribution } from "./armorClass";

describe("getArmorDexterityContribution", () => {
  it("does not add Dexterity to heavy armor", () => {
    expect(getArmorDexterityContribution("Chain Mail", 4)).toBe(0);
    expect(getArmorDexterityContribution("Plate Armor +1", 3)).toBe(0);
  });

  it("caps Dexterity at +2 for medium armor", () => {
    expect(getArmorDexterityContribution("Breastplate", 4)).toBe(2);
    expect(getArmorDexterityContribution("Chain Shirt", 1)).toBe(1);
  });

  it("keeps full Dexterity for light and special armor", () => {
    expect(getArmorDexterityContribution("Studded Leather Armor", 4)).toBe(4);
    expect(getArmorDexterityContribution("Serpent Scale Armor", 4)).toBe(4);
  });
});
