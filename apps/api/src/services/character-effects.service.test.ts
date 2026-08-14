import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveActiveResourceSources,
  hasArmorEquipped,
  hasHeavyArmorEquipped,
} from "./character-effects.service.js";
import type { ResolvedFeatureSource } from "./character-effects/types.js";

const sources: ResolvedFeatureSource[] = [
  {
    description: "You can enter a rage.",
    level: 1,
    sourceIndex: "rage",
    sourceType: "class_feature",
    title: "Rage",
  },
  {
    description: "You can grow in size.",
    level: 5,
    sourceIndex: "goliath-large-form",
    sourceType: "species_trait",
    title: "Large Form",
  },
];

test("deriveActiveResourceSources only adds toggled and known active resources", () => {
  assert.deepEqual(
    deriveActiveResourceSources(sources, {
      "large-form": true,
      rage: true,
      unused: true,
    }),
    [
      {
        description: "While Large Form is active, your Speed increases by 10 feet.",
        level: 5,
        sourceIndex: "large-form-active",
        sourceType: "species_trait",
        title: "Large Form (Active)",
      },
      {
        description:
          "While Rage is active, you have resistance to bludgeoning, piercing, and slashing damage.",
        level: 1,
        sourceIndex: "rage-active",
        sourceType: "class_feature",
        title: "Rage (Active)",
      },
    ],
  );
  assert.deepEqual(deriveActiveResourceSources(sources, { rage: false }), []);
});

test("hasArmorEquipped detects equipped armor from type and item names", () => {
  assert.equal(
    hasArmorEquipped([
      { equipment: { itemType: "Adventuring Gear", name: "Torch" } },
      { equipment: { itemType: "Armor", name: "Shield" } },
    ]),
    true,
  );
  assert.equal(
    hasArmorEquipped([{ equipment: { itemType: null, name: "Chain Shirt" } }]),
    true,
  );
  assert.equal(
    hasArmorEquipped([{ equipment: { itemType: "Weapon", name: "Longsword" } }]),
    false,
  );
});

test("hasHeavyArmorEquipped detects heavy armor by type and common names", () => {
  assert.equal(
    hasHeavyArmorEquipped([
      { equipment: { itemType: "Heavy Armor", name: "Custom Plate" } },
    ]),
    true,
  );
  assert.equal(
    hasHeavyArmorEquipped([{ equipment: { itemType: null, name: "Chain Mail" } }]),
    true,
  );
  assert.equal(
    hasHeavyArmorEquipped([
      { equipment: { itemType: "Armor", name: "Leather Armor" } },
    ]),
    false,
  );
});
