import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  ConditionsSidebar,
  createDefaultConditionState,
  getConditionSummaryEntries,
} from "./ConditionsSidebar";

describe("ConditionsSidebar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders condition state, expands details, toggles conditions, and sets exhaustion", () => {
    const onToggleCondition = vi.fn();
    const onSetExhaustionLevel = vi.fn();
    const state = createDefaultConditionState();
    state.activeConditions.blinded = true;
    state.exhaustionLevel = 2;

    render(
      <ConditionsSidebar
        conditionState={state}
        isOpen
        onSetExhaustionLevel={onSetExhaustionLevel}
        onToggleCondition={onToggleCondition}
      />,
    );

    expect(screen.getByText("2 active effects")).toBeTruthy();
    expect(screen.getByText("Level 2")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Toggle Blinded details" }));
    expect(screen.getByText(/You can't see, automatically fail/i)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { pressed: true })[0]);
    expect(onToggleCondition).toHaveBeenCalledWith("blinded");

    fireEvent.click(screen.getByRole("button", { name: "4" }));
    expect(onSetExhaustionLevel).toHaveBeenCalledWith(4);
  });

  it("builds condition summary entries and closed rail classes", () => {
    const state = createDefaultConditionState();
    state.activeConditions.poisoned = true;
    state.exhaustionLevel = 1;

    expect(getConditionSummaryEntries(state)).toEqual([
      { label: "Poisoned", value: "Active" },
      { label: "Exhaustion", value: "Level 1" },
    ]);

    render(
      <ConditionsSidebar
        conditionState={createDefaultConditionState()}
        isOpen={false}
        onSetExhaustionLevel={vi.fn()}
        onToggleCondition={vi.fn()}
      />,
    );

    expect(screen.getByRole("complementary").className).toContain(
      "inventory-side-rail-closed",
    );
    expect(screen.getByText("Toggle character conditions and exhaustion.")).toBeTruthy();
  });
});
