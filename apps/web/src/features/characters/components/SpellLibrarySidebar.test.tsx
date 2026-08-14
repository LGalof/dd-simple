import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpellLibrarySidebar } from "./SpellLibrarySidebar";
import type { CharacterSpellcastingState } from "../../../types/character";
import type { CharacterSpellEntry } from "../../../types/characterDerived";
import type { SpellcastingSummary } from "./CharacterSheet";

const spellEntries: CharacterSpellEntry[] = [
  {
    description: "A bright flame leaps from your hand.",
    id: "fire-bolt",
    isCantrip: true,
    kind: "spell_feature",
    level: 1,
    preparationMode: "known",
    sourceIndex: "wizard",
    sourceType: "class",
    spellLevel: 0,
    title: "Fire Bolt",
  },
  {
    description: "A shimmering field protects you.",
    id: "shield",
    isCantrip: false,
    kind: "spell_feature",
    level: 1,
    preparationMode: "prepared",
    sourceIndex: "wizard",
    sourceType: "class",
    spellLevel: 1,
    title: "Shield",
  },
];

const summary: SpellcastingSummary = {
  abilityLabel: "Intelligence",
  attackBonus: 6,
  castingType: "Prepared",
  knownPrepared: [
    { label: "Cantrips", value: "3" },
    { label: "Prepared Spells", value: "2" },
  ],
  notes: ["Prepare spells after a long rest."],
  proficiencyBonus: 3,
  saveDc: 14,
  slotLevels: [
    { level: 1, max: 4 },
    { level: 2, max: 2 },
  ],
  slotsAvailable: true,
  slotsUnavailableReason: "",
};

function renderSidebar(
  selectedClassIndex = "wizard",
  spellcastingState: CharacterSpellcastingState = {
    learnedSpellIds: ["fire-bolt", "shield"],
    preparedSpellIds: ["shield"],
    slotUsageByLevel: {},
  },
) {
  const onSpellcastingStateChange = vi.fn();

  render(
    <SpellLibrarySidebar
      isOpen
      onSpellcastingStateChange={onSpellcastingStateChange}
      selectedClassIndex={selectedClassIndex}
      selectedClassName={selectedClassIndex === "cleric" ? "Cleric" : "Wizard"}
      spellEntries={spellEntries}
      spellcastingState={spellcastingState}
      spellcastingSummary={summary}
    />,
  );

  return { onSpellcastingStateChange };
}

describe("SpellLibrarySidebar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders wizard spellbook, filters library spells, and updates prepared spells", () => {
    const { onSpellcastingStateChange } = renderSidebar();

    expect(screen.getByText("WIZARD")).toBeTruthy();
    expect(screen.getByText("Spell Slots")).toBeTruthy();
    expect(screen.getAllByText(/Prepared Spells/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Spellbook/).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByPlaceholderText("Enter Spell Name"), {
      target: { value: "shield" },
    });
    expect(screen.getAllByText("Shield").length).toBeGreaterThan(0);

    fireEvent.click(screen.getAllByRole("button", { name: "Learn" })[0]);
    expect(onSpellcastingStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        learnedSpellIds: expect.arrayContaining(["shield"]),
      }),
    );
  });

  it("renders prepared-caster controls and toggles cantrips", () => {
    const { onSpellcastingStateChange } = renderSidebar("cleric", {
      learnedSpellIds: ["fire-bolt"],
      preparedSpellIds: [],
      slotUsageByLevel: {},
    });

    expect(screen.getByText("CLERIC")).toBeTruthy();
    expect(screen.queryByText(/Spellbook/)).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Enter Spell Name"), {
      target: { value: "fire bolt" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Learn" })[0]);

    expect(onSpellcastingStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        learnedSpellIds: expect.arrayContaining(["fire-bolt"]),
      }),
    );
  });
});
