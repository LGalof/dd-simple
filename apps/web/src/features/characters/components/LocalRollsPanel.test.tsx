import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LocalRollsPanel, type LocalRollEntry } from "./LocalRollsPanel";

const roll = {
  dice: [{ sides: 20, value: 20 }],
  id: "roll-1",
  label: "Longsword",
  modifier: 5,
  naturalRoll: 20,
  normalizedFormula: "1d20 + 5",
  parseable: true,
  rolledAt: 1,
  rollType: "attack",
  source: "Attack",
  total: 25,
} satisfies LocalRollEntry;

describe("LocalRollsPanel", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("renders roll details, dismisses manually, and auto-dismisses later", () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn();

    render(
      <LocalRollsPanel
        rolls={[roll, { ...roll, dice: [{ sides: 20, value: 1 }], id: "roll-2", label: "Trap", naturalRoll: 1, total: 1 }]}
        onDismiss={onDismiss}
        syncMessage="Saved locally"
      />,
    );

    expect(screen.getByText("Saved locally")).toBeTruthy();
    expect(screen.getByText("Natural 20")).toBeTruthy();
    expect(screen.getByText("Natural 1")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Dismiss Longsword roll" }));
    expect(onDismiss).toHaveBeenCalledWith("roll-1");

    vi.advanceTimersByTime(5000);
    expect(onDismiss).toHaveBeenCalledWith("roll-2");
  });

  it("renders unparseable and damage rolls", () => {
    render(
      <LocalRollsPanel
        rolls={[
          {
            ...roll,
            damageType: "Fire",
            dice: [],
            id: "roll-3",
            label: "Burn",
            naturalRoll: undefined,
            parseable: false,
          },
        ]}
        onDismiss={vi.fn()}
      />,
    );

    expect(screen.getByText("Unable Fire")).toBeTruthy();
    expect(screen.getAllByText("Fire").length).toBeGreaterThan(0);
  });
});
