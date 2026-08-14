import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CharacterDashboardRightRail } from "./CharacterDashboardRightRail";
import { createDefaultConditionState } from "./ConditionsSidebar";

vi.mock("../../../pages/InventorySandboxPage", () => ({
  InventoryDetailsSidebar: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="inventory-details">Inventory:{String(isOpen)}</div>
  ),
}));

vi.mock("./SpellLibrarySidebar", () => ({
  SpellLibrarySidebar: ({
    selectedClassName,
  }: {
    selectedClassName: string;
  }) => <div data-testid="spell-library">Spell Library:{selectedClassName}</div>,
}));

const spellcastingState = {
  learnedSpellIds: [],
  preparedSpellIds: [],
  slotUsageByLevel: {},
};

const baseProps = {
  conditionState: createDefaultConditionState(),
  diceRollSaveError: null,
  inventoryController: {} as Parameters<typeof CharacterDashboardRightRail>[0]["inventoryController"],
  localRolls: [],
  onDismissLocalRoll: vi.fn(),
  onManualRoll: vi.fn(),
  onSetExhaustionLevel: vi.fn(),
  onSpellcastingStateChange: vi.fn(),
  onToggleCondition: vi.fn(),
  rightRailMode: null,
  selectedClassIndex: "wizard",
  selectedClassName: "Wizard",
  selectedSpellEntry: null,
  spellEntries: [],
  spellcastingState,
  spellcastingSummary: {
    attackBonus: 7,
    preparedSpellLimit: 5,
    saveDc: 15,
    spellcastingAbility: "int",
    spellcastingClass: "wizard",
    spellcastingModifier: 4,
    spellSlotRows: [],
  },
} satisfies Parameters<typeof CharacterDashboardRightRail>[0];

describe("CharacterDashboardRightRail", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("opens the manual dice roller and shows recent local rolls", () => {
    const onManualRoll = vi.fn();
    const onDismissLocalRoll = vi.fn();

    render(
      <CharacterDashboardRightRail
        {...baseProps}
        localRolls={[
          {
            dice: [{ sides: 20, value: 20 }],
            id: "roll-1",
            label: "Initiative",
            modifier: 3,
            naturalRoll: 20,
            normalizedFormula: "1d20 + 3",
            parseable: true,
            rolledAt: 1,
            rollType: "initiative",
            total: 23,
          },
        ]}
        onDismissLocalRoll={onDismissLocalRoll}
        onManualRoll={onManualRoll}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Dice Roller/i }));
    expect(screen.getByRole("region", { name: "Dice Roller" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "d20" }));
    expect(onManualRoll).toHaveBeenCalledWith(expect.objectContaining({ rollType: "custom" }));
    expect(screen.getByText("Recent Rolls")).toBeTruthy();
    expect(screen.getByText("Initiative")).toBeTruthy();
  });

  it("renders conditions, inventory, and spell library rail modes", () => {
    const { rerender } = render(
      <CharacterDashboardRightRail
        {...baseProps}
        rightRailMode="conditions"
      />,
    );

    expect(screen.getByText("Conditions")).toBeTruthy();

    rerender(
      <CharacterDashboardRightRail
        {...baseProps}
        rightRailMode="inventory"
      />,
    );

    expect(screen.getByTestId("inventory-details").textContent).toBe("Inventory:true");

    rerender(
      <CharacterDashboardRightRail
        {...baseProps}
        rightRailMode="spells"
      />,
    );

    expect(screen.getByTestId("spell-library").textContent).toBe("Spell Library:Wizard");
  });

  it("renders selected spell details from entry metadata and spellcasting summary", () => {
    render(
      <CharacterDashboardRightRail
        {...baseProps}
        rightRailMode="spells"
        selectedSpellEntry={{
          description:
            "Casting Time: 1 Action\nRange: 90 feet\nComponents: V, S\nDuration: Instantaneous\n\nMake a spell attack against one target. At Higher Levels: The spell deals more force damage.",
          id: "spell-custom-bolt",
          preparationMode: "always_prepared",
          sourceIndex: "custom-bolt",
          sourceType: "class_feature",
          spellLevel: 2,
          title: "Custom Bolt",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "Custom Bolt" })).toBeTruthy();
    expect(screen.getByText("2nd Level")).toBeTruthy();
    expect(screen.getByText("always prepared")).toBeTruthy();
    expect(screen.getByText("+7")).toBeTruthy();
    expect(screen.getByText("1 Action")).toBeTruthy();
    expect(screen.getByText("90 feet")).toBeTruthy();
    expect(screen.getByText("The spell deals more force damage.")).toBeTruthy();
  });

  it("uses save DC labels and placeholder spell stats when metadata is missing", () => {
    render(
      <CharacterDashboardRightRail
        {...baseProps}
        rightRailMode="spells"
        selectedSpellEntry={{
          description: "A creature must make a Wisdom saving throw or fall prone.",
          id: "spell-save",
          preparationMode: null,
          sourceIndex: "spell-save",
          sourceType: "species_trait",
          spellLevel: 0,
          title: "Saving Spark",
        }}
      />,
    );

    expect(screen.getByText("Cantrip")).toBeTruthy();
    expect(screen.getByText("WIS 15")).toBeTruthy();
    expect(screen.getAllByText("--").length).toBeGreaterThan(0);
  });
});
