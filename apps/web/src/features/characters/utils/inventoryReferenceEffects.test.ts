import { describe, expect, it } from "vitest";

import {
  deriveReferenceEquipmentEffects,
  extractEquipmentDescription,
  itemRequiresAttunement,
  summarizeReferenceEquipmentEffects,
} from "./inventoryReferenceEffects";

describe("inventoryReferenceEffects", () => {
  it("derives combat bonuses and summaries from structured weapon data", () => {
    const item = {
      description:
        "Requires attunement. You have advantage on saving throws against spells.",
      name: "Weapon +2",
      sourceJson: {
        damage: {
          damage_dice: "1d8",
          damage_type: { name: "Slashing" },
        },
      },
    };

    expect(extractEquipmentDescription(item)).toContain("Requires attunement");
    expect(itemRequiresAttunement(item)).toBe(true);
    expect(deriveReferenceEquipmentEffects(item)).toMatchObject({
      attackBonus: 2,
      damage: "1d8 slashing",
      damageBonus: 2,
    });
    expect(summarizeReferenceEquipmentEffects(item).effectLines).toEqual(
      expect.arrayContaining([
        "Requires attunement to grant its magical benefits.",
        "Grants +2 to attack rolls and +2 to damage rolls made with this item.",
        "Uses 1d8 slashing as its weapon damage profile.",
        "Grants advantage on saving throws against spells.",
      ]),
    );
  });

  it("extracts defensive magic from names, descriptions, and source JSON", () => {
    const protectiveItem = {
      name: "Ring of Protection",
      sourceJson: {
        desc: [
          "You gain a +1 bonus to spell attack rolls.",
          "You gain a +2 bonus to spell saving throw DCs.",
          "You have resistance to fire and cold damage.",
        ],
      },
    };

    expect(extractEquipmentDescription(protectiveItem)).toContain("spell attack rolls");
    expect(deriveReferenceEquipmentEffects(protectiveItem)).toMatchObject({
      armorClassBonus: 1,
      resistances: ["Cold", "Fire"],
      savingThrowBonus: 1,
      spellAttackBonus: 1,
      spellSaveDcBonus: 2,
    });
    expect(summarizeReferenceEquipmentEffects(protectiveItem).summary).toContain(
      "Grants +1 Armor Class while equipped.",
    );
  });

  it("falls back to description bonuses and strength-setting items", () => {
    expect(
      deriveReferenceEquipmentEffects({
        description: "+3 bonus to armor class.",
        name: "Guardian Charm",
      }).armorClassBonus,
    ).toBe(3);
    expect(
      summarizeReferenceEquipmentEffects({
        description: "",
        name: "Gauntlets of Ogre Power",
      }).effectLines,
    ).toContain("Sets your Strength score to 19 if it is lower.");
  });
});
