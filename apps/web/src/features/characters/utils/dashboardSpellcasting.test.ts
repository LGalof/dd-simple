import { describe, expect, it } from "vitest";
import { getSpellcastingSummary } from "./dashboardSpellcasting";

function character(level: number, scores: Record<string, number> = {}) {
  return {
    level,
    abilityScores: ["str", "dex", "con", "int", "wis", "cha"].map((abilityIndex) => ({
      abilityIndex,
      score: scores[abilityIndex] ?? 10,
      ability: {
        fullName: {
          str: "Strength",
          dex: "Dexterity",
          con: "Constitution",
          int: "Intelligence",
          wis: "Wisdom",
          cha: "Charisma",
        }[abilityIndex],
      },
    })),
  };
}

describe("getSpellcastingSummary", () => {
  it("returns null for classes without spellcasting ability data", () => {
    expect(getSpellcastingSummary(character(5) as never, { index: "fighter" } as never, null)).toBeNull();
  });

  it("uses full-caster fallback progressions and wizard notes", () => {
    const summary = getSpellcastingSummary(
      character(5, { int: 18 }) as never,
      { index: "wizard", name: "Wizard" } as never,
      null,
    );

    expect(summary).toMatchObject({
      abilityLabel: "Intelligence",
      attackBonus: 7,
      castingType: "Full caster",
      proficiencyBonus: 3,
      saveDc: 15,
      slotsAvailable: true,
    });
    expect(summary?.knownPrepared).toEqual([
      { label: "Cantrips Known", value: "4" },
      { label: "Prepared Spells", value: "9" },
    ]);
    expect(summary?.slotLevels).toEqual([
      { level: 1, max: 4 },
      { level: 2, max: 3 },
      { level: 3, max: 2 },
    ]);
    expect(summary?.notes).toContain("Prepare Wizard spells from your spellbook for which you have spell slots.");
  });

  it("uses structured spellcasting metadata when present", () => {
    const summary = getSpellcastingSummary(
      character(9, { cha: 20 }) as never,
      {
        index: "custom-bard",
        name: "Bard",
        spellcasting: {
          abilityIndex: "charisma",
          castingType: "full-caster",
          notes: ["Choose spells from the bard list.", "Choose spells from the bard list."],
          levels: [
            {
              level: 1,
              cantripsKnown: 2,
              spellsKnown: 4,
              spellSlots: [{ level: 1, slots: 2 }],
            },
            {
              level: 7,
              cantripsKnown: 3,
              spellsKnown: 10,
              spellSlots: [
                { level: 1, slots: 4 },
                { level: 2, slots: 3 },
                { level: 3, slots: 3 },
                { level: 4, slots: 1 },
              ],
            },
          ],
        },
      } as never,
      {
        index: "college-of-lore",
        name: "College of Lore",
        features: [
          { level: 6, name: "Additional Magical Secrets", description: "You learn two spells." },
          { level: 14, name: "Peerless Skill", description: "Not yet available spell text." },
          { level: 3, name: "Cutting Words", description: "Use your wit." },
        ],
      } as never,
    );

    expect(summary).toMatchObject({
      abilityLabel: "Charisma",
      attackBonus: 9,
      castingType: "Full caster",
      saveDc: 17,
    });
    expect(summary?.knownPrepared).toEqual([
      { label: "Cantrips Known", value: "3" },
      { label: "Spells Known", value: "10" },
    ]);
    expect(summary?.notes).toEqual([
      "Choose spells from the bard list.",
      "College of Lore: Additional Magical Secrets - You learn two spells.",
    ]);
  });

  it("uses bard known-spell fallbacks and proficiency bands", () => {
    const summary = getSpellcastingSummary(
      character(17, { cha: 16 }) as never,
      { index: "bard", name: "Bard" } as never,
      null,
    );

    expect(summary?.proficiencyBonus).toBe(6);
    expect(summary?.attackBonus).toBe(9);
    expect(summary?.knownPrepared).toContainEqual({ label: "Prepared Spells", value: "22" });
    expect(summary?.slotLevels.at(-1)).toEqual({ level: 9, max: 1 });
  });

  it("handles Arcane Trickster as an Intelligence third caster", () => {
    const summary = getSpellcastingSummary(
      character(13, { int: 14 }) as never,
      { index: "rogue", name: "Rogue" } as never,
      {
        index: "arcane-trickster",
        name: "Arcane Trickster",
        features: [{ level: 3, name: "Spellcasting", description: "You gain Wizard spells." }],
      } as never,
    );

    expect(summary).toMatchObject({
      abilityLabel: "Intelligence",
      attackBonus: 7,
      castingType: "Third caster",
      saveDc: 15,
    });
    expect(summary?.knownPrepared).toEqual([
      { label: "Cantrips Known", value: "4" },
      { label: "Prepared Spells", value: "9" },
    ]);
    expect(summary?.slotLevels).toEqual([
      { level: 1, max: 4 },
      { level: 2, max: 3 },
      { level: 3, max: 2 },
    ]);
  });

  it("uses cleric prepared-spell fallbacks at low levels", () => {
    const summary = getSpellcastingSummary(
      character(1, { wis: 16 }) as never,
      { index: "cleric", name: "Cleric" } as never,
      null,
    );

    expect(summary).toMatchObject({
      abilityLabel: "Wisdom",
      attackBonus: 5,
      proficiencyBonus: 2,
      saveDc: 13,
    });
    expect(summary?.knownPrepared).toContainEqual({ label: "Prepared Spells", value: "4" });
    expect(summary?.slotLevels).toEqual([{ level: 1, max: 2 }]);
  });

  it("keeps caster metadata even when no spell slot progression is known", () => {
    const summary = getSpellcastingSummary(
      character(6, { cha: 14 }) as never,
      {
        index: "homebrew-caster",
        name: "Homebrew Caster",
        spellcasting: {
          abilityIndex: "charisma",
          castingType: "pact-magic",
          levels: [],
        },
      } as never,
      null,
    );

    expect(summary).toMatchObject({
      abilityLabel: "Charisma",
      castingType: "Spellcaster",
      slotsAvailable: false,
    });
    expect(summary?.knownPrepared).toEqual([]);
    expect(summary?.slotLevels).toEqual([]);
  });

  it("shows Arcane Trickster metadata before subclass spell slots unlock", () => {
    const summary = getSpellcastingSummary(
      character(2, { int: 12 }) as never,
      { index: "rogue", name: "Rogue" } as never,
      {
        index: "arcane-trickster",
        name: "Arcane Trickster",
        features: [{ level: 3, name: "Spellcasting", description: "You gain Wizard spells." }],
      } as never,
    );

    expect(summary).toMatchObject({
      abilityLabel: "Intelligence",
      castingType: "Third caster",
      slotsAvailable: false,
    });
    expect(summary?.knownPrepared).toEqual([]);
  });
});
