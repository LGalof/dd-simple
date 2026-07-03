import assert from "node:assert/strict";
import test from "node:test";
import { deriveResourceEntries } from "./resources.js";
import type { ResolvedFeatureSource } from "./types.js";

function createSource(
  overrides: Partial<ResolvedFeatureSource>,
): ResolvedFeatureSource {
  return {
    description: "",
    level: 1,
    sourceIndex: "test-source",
    sourceType: "class_feature",
    title: "Test Source",
    ...overrides,
  };
}

test("deriveResourceEntries tracks Rage uses from active feature sources", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "rage",
        title: "Rage",
      }),
    ],
    6,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Rage");
  assert.equal(resources[0]?.maxUsesValue, 4);
  assert.equal(resources[0]?.recharge, "Short Rest (1 use) / Long Rest (all uses)");
  assert.equal(resources[0]?.trackingMode, "uses");
});

test("deriveResourceEntries uses proficiency bonus for Bardic Inspiration", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 1,
        sourceIndex: "bardic-inspiration",
        title: "Bardic Inspiration",
      }),
    ],
    9,
  );

  assert.equal(resources[0]?.name, "Bardic Inspiration");
  assert.equal(resources[0]?.maxUsesValue, 4);
});

test("deriveResourceEntries tracks Lucky feat points from proficiency bonus", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "lucky",
        sourceType: "class_feature",
        title: "Lucky",
      }),
    ],
    13,
  );

  assert.equal(resources[0]?.name, "Luck Points");
  assert.equal(resources[0]?.maxUsesValue, 5);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries keeps the latest version of repeated resource features", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 2,
        sourceIndex: "action-surge",
        title: "Action Surge",
      }),
      createSource({
        level: 17,
        sourceIndex: "action-surge-2-use",
        title: "Action Surge",
      }),
    ],
    17,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Action Surge");
  assert.equal(resources[0]?.maxUsesValue, 2);
});

test("deriveResourceEntries tracks Dragonborn Breath Weapon uses from proficiency bonus", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "breath-weapon-cold",
        sourceType: "species_trait",
        title: "Breath Weapon: Cold",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Breath Weapon: Cold");
  assert.equal(resources[0]?.maxUsesValue, 3);
  assert.equal(resources[0]?.recharge, "Long Rest");
});

test("deriveResourceEntries tracks Orc Adrenaline Rush on short or long rest", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "adrenaline-rush",
        sourceType: "species_trait",
        title: "Adrenaline Rush",
      }),
    ],
    9,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Adrenaline Rush");
  assert.equal(resources[0]?.maxUsesValue, 4);
  assert.equal(resources[0]?.recharge, "Short or Long Rest");
});

test("deriveResourceEntries tracks selected Goliath Giant Ancestry option", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        sourceIndex: "giant-ancestry-stones-endurance",
        sourceType: "species_trait",
        title: "Giant Ancestry: Stone's Endurance",
      }),
    ],
    13,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Giant Ancestry: Stone's Endurance");
  assert.equal(resources[0]?.category, "reaction");
  assert.equal(resources[0]?.maxUsesValue, 5);
});

test("deriveResourceEntries tracks one-use species transformations", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 5,
        sourceIndex: "draconic-flight",
        sourceType: "species_trait",
        title: "Draconic Flight",
      }),
    ],
    5,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Draconic Flight");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.category, "bonus action");
});

test("deriveResourceEntries tracks Intimidating Presence free use", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 14,
        sourceIndex: "intimidating-presence",
        sourceType: "subclass_feature",
        title: "Intimidating Presence",
      }),
    ],
    14,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Intimidating Presence");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.recharge, "Long Rest / expend Rage");
});

test("deriveResourceEntries tracks World Tree extended teleport", () => {
  const resources = deriveResourceEntries(
    [
      createSource({
        level: 14,
        sourceIndex: "travel-along-the-tree",
        sourceType: "subclass_feature",
        title: "Travel Along the Tree",
      }),
    ],
    14,
  );

  assert.equal(resources.length, 1);
  assert.equal(resources[0]?.name, "Travel Along the Tree: Extended Teleport");
  assert.equal(resources[0]?.maxUsesValue, 1);
  assert.equal(resources[0]?.recharge, "Rage");
});
