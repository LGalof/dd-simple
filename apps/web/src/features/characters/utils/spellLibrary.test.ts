import { describe, expect, it } from "vitest";
import {
  buildSpellId,
  extractSpellAttackDamage,
  findSpellLibraryRecordByName,
  formatSpellAttackNotes,
  formatSpellAttackRange,
  formatSpellAttackSubtitle,
  formatSpellLibraryDescription,
  getManagedSpellEntriesForClass,
  getReferenceSpellsForClass,
  getSpellManagementMode,
  inferSpellActionActivationType,
  isAttackRollSpell,
  normalizeSpellLookupName,
  spellLibraryRecords,
} from "./spellLibrary";

describe("spellLibrary", () => {
  it("normalizes spell ids and lookup names", () => {
    expect(buildSpellId("  Tasha's Hideous Laughter! ")).toBe("spell:tasha-s-hideous-laughter");
    expect(normalizeSpellLookupName("  Fire   Bolt ")).toBe("fire bolt");
    expect(findSpellLibraryRecordByName(" fire bolt ")?.id).toBe("spell:fire-bolt");
    expect(findSpellLibraryRecordByName("Missing Spell")).toBeNull();
    expect(spellLibraryRecords.length).toBeGreaterThan(100);
  });

  it("filters reference spells by class, subclass spell list, and max level", () => {
    const wizardCantripsAndFirst = getReferenceSpellsForClass("wizard", 1);

    expect(wizardCantripsAndFirst[0]?.level).toBe(0);
    expect(wizardCantripsAndFirst.some((spell) => spell.name === "Fire Bolt")).toBe(true);
    expect(wizardCantripsAndFirst.some((spell) => spell.name === "Shield")).toBe(true);
    expect(wizardCantripsAndFirst.every((spell) => spell.level <= 1)).toBe(true);

    expect(getReferenceSpellsForClass("arcane-trickster", 1).map((spell) => spell.id)).toContain("spell:shield");
    expect(getReferenceSpellsForClass("cleric", 0).map((spell) => spell.id)).toContain("spell:guidance");
  });

  it("expands learned and prepared spell ids into dashboard spell entries", () => {
    expect(getSpellManagementMode("wizard")).toBe("known");
    expect(getSpellManagementMode("cleric")).toBe("prepared");

    const wizardEntries = getManagedSpellEntriesForClass("wizard", {
      learnedSpellIds: ["spell:fire-bolt", "spell:shield"],
      preparedSpellIds: [],
    });
    const clericEntries = getManagedSpellEntriesForClass("cleric", {
      learnedSpellIds: ["spell:guidance", "spell:cure-wounds"],
      preparedSpellIds: ["spell:cure-wounds"],
    });

    expect(wizardEntries.map((entry) => [entry.id, entry.preparationMode])).toEqual([
      ["spell:fire-bolt", "known"],
      ["spell:shield", "known"],
    ]);
    expect(clericEntries.map((entry) => [entry.id, entry.preparationMode])).toEqual([
      ["spell:guidance", "known"],
      ["spell:cure-wounds", "prepared"],
    ]);
    expect(clericEntries[1]?.description).toContain("Casting Time:");
  });

  it("formats spell descriptions and attack metadata", () => {
    const fireBolt = findSpellLibraryRecordByName("Fire Bolt");
    const shield = findSpellLibraryRecordByName("Shield");

    expect(fireBolt).not.toBeNull();
    expect(shield).not.toBeNull();
    expect(formatSpellLibraryDescription(fireBolt!)).toContain("Casting Time: 1 action");
    expect(isAttackRollSpell(fireBolt!)).toBe(true);
    expect(isAttackRollSpell(shield!)).toBe(false);
    expect(extractSpellAttackDamage(fireBolt!.description)).toBe("1d10 fire");
    expect(extractSpellAttackDamage("The target is pushed.")).toBe("--");
    expect(formatSpellAttackRange("120 feet")).toBe("120 ft.");
    expect(formatSpellAttackNotes({ components: "V, S, M", ritual: true, school: "evocation" })).toBe("V/S/M Ritual");
    expect(formatSpellAttackNotes({ components: "", ritual: false, school: "evocation" })).toBe("evocation");
    expect(formatSpellAttackNotes({ components: "", ritual: false, school: "" })).toBe("--");
  });

  it("infers activation types and subtitles", () => {
    expect(inferSpellActionActivationType({ castingTime: "1 bonus action" })).toBe("bonus_action");
    expect(inferSpellActionActivationType({ castingTime: "1 reaction" })).toBe("reaction");
    expect(inferSpellActionActivationType({ castingTime: "1 action" })).toBe("action");
    expect(inferSpellActionActivationType({ castingTime: "1 minute" })).toBe("attack");
    expect(formatSpellAttackSubtitle({ spellLevel: 0 }, "Wizard")).toBe("Cantrip - Wizard");
    expect(formatSpellAttackSubtitle({ spellLevel: 1 }, "Wizard")).toBe("1st Level - Wizard");
    expect(formatSpellAttackSubtitle({ spellLevel: 2 }, "Wizard")).toBe("2nd Level - Wizard");
    expect(formatSpellAttackSubtitle({ spellLevel: 3 }, "Wizard")).toBe("3rd Level - Wizard");
    expect(formatSpellAttackSubtitle({ spellLevel: 4 }, "Wizard")).toBe("4th Level - Wizard");
    expect(formatSpellAttackSubtitle({ spellLevel: null }, "Wizard")).toBe("Spell - Wizard");
  });
});
