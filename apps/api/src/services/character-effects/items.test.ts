import assert from "node:assert/strict";
import test from "node:test";

import {
  decodeInventoryAttunementState,
  deriveEquippedItemEffects,
} from "./items.js";

function encodeInventoryState(value: unknown) {
  return Buffer.from(new TextEncoder().encode(JSON.stringify(value)))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function item(overrides = {}) {
  return {
    customName: null,
    equipmentIndex: "cloak-of-protection",
    equipment: {
      description:
        "Requires attunement. You gain a +1 bonus to AC and saving throws while wearing this cloak.",
      index: "cloak-of-protection",
      itemType: "Wondrous Item",
      name: "Cloak of Protection",
      sourceJson: {
        desc: [
          "Wondrous Item, uncommon (requires attunement)",
          "You gain a +1 bonus to AC and saving throws while wearing this cloak.",
        ],
      },
    },
    notes: null,
    ...overrides,
  };
}

test("decodeInventoryAttunementState reads URL-safe attuned inventory signatures", () => {
  const state = decodeInventoryAttunementState(
    encodeInventoryState({
      items: [
        {
          attuned: true,
          name: "Cloak of Protection",
          notes: "blue trim",
          referenceEquipmentIndex: "cloak-of-protection",
          requiresAttunement: true,
        },
        {
          attuned: false,
          name: "Ring of Warmth",
          referenceEquipmentIndex: "ring-of-warmth",
          requiresAttunement: true,
        },
        {
          attuned: true,
          name: "Shield",
          referenceEquipmentIndex: "shield",
          requiresAttunement: false,
        },
      ],
    }),
  );

  assert.equal(state.get("cloak-of-protection|cloak of protection|blue trim"), 1);
  assert.equal(state.has("ring-of-warmth|ring of warmth|"), false);
  assert.equal(decodeInventoryAttunementState(null).size, 0);
  assert.equal(decodeInventoryAttunementState("not valid json").size, 0);
});

test("deriveEquippedItemEffects skips unattuned required items", () => {
  const effects = deriveEquippedItemEffects([item()]);

  assert.deepEqual(effects, {
    activeSources: [],
    armorClassBonus: 0,
    defenses: [],
    savingThrowBonus: 0,
    strengthMinimum: null,
  });
});

test("deriveEquippedItemEffects applies attuned protection bonuses once per matching item", () => {
  const attunedState = new Map([
    ["cloak-of-protection|cloak of protection|", 1],
  ]);
  const effects = deriveEquippedItemEffects([
    item(),
    item({ equipmentIndex: "cloak-of-protection" }),
  ], attunedState);

  assert.equal(effects.armorClassBonus, 1);
  assert.equal(effects.savingThrowBonus, 1);
  assert.equal(effects.activeSources.length, 1);
  assert.equal(effects.activeSources[0]?.title, "Cloak of Protection");
  assert.equal(attunedState.size, 0);
});

test("deriveEquippedItemEffects includes resistance defenses and strength minimums", () => {
  const effects = deriveEquippedItemEffects([
    item({
      equipmentIndex: "ring-of-warmth",
      equipment: {
        description:
          "While wearing this ring, you have resistance to cold damage.",
        index: "ring-of-warmth",
        itemType: "Ring",
        name: "Ring of Warmth",
        sourceJson: {
          desc: [
            "Ring, uncommon (requires attunement)",
            "While wearing this ring, you have resistance to cold damage.",
          ],
        },
      },
    }),
    item({
      equipmentIndex: "gauntlets-of-ogre-power",
      equipment: {
        description:
          "Your Strength score is 19 while you wear these gauntlets.",
        index: "gauntlets-of-ogre-power",
        itemType: "Wondrous Item",
        name: "Gauntlets of Ogre Power",
        sourceJson: {
          desc: [
            "Wondrous Item, uncommon (requires attunement)",
            "Your Strength score is 19 while you wear these gauntlets.",
          ],
        },
      },
    }),
  ], new Map([
    ["ring-of-warmth|ring of warmth|", 1],
    ["gauntlets-of-ogre-power|gauntlets of ogre power|", 1],
  ]));

  assert.equal(effects.strengthMinimum, 19);
  assert.deepEqual(
    effects.defenses.map((defense) => [defense.kind, defense.target, defense.title]),
    [["resistance", "Cold", "Ring of Warmth"]],
  );
  assert.deepEqual(
    effects.activeSources.map((source) => source.sourceIndex).sort(),
    ["gauntlets-of-ogre-power", "ring-of-warmth"],
  );
});
