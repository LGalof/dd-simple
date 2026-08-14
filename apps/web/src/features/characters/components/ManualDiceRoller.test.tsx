import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ManualDiceRoller } from "./ManualDiceRoller";

describe("ManualDiceRoller", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("rolls selected dice with labels, quantity, and modifiers", () => {
    const onRoll = vi.fn();
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);

    render(<ManualDiceRoller onRoll={onRoll} />);

    fireEvent.change(screen.getByLabelText("Qty"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Mod"), { target: { value: "3" } });
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Sneak Attack" } });
    fireEvent.click(screen.getByRole("button", { name: "d6" }));

    expect(onRoll).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Sneak Attack: 2d6 + 3",
        normalizedFormula: "2d6 + 3",
        rollType: "custom",
        total: 5,
      }),
    );

    randomSpy.mockRestore();
  });

  it("disables dice while input is invalid and restores invalid fields on blur", () => {
    render(<ManualDiceRoller onRoll={vi.fn()} />);

    fireEvent.change(screen.getByLabelText("Qty"), { target: { value: "99" } });

    expect(screen.getByText("Invalid roll")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "d20" }).disabled).toBe(true);

    fireEvent.blur(screen.getByLabelText("Qty"));
    expect(screen.getByLabelText<HTMLInputElement>("Qty").value).toBe("1");

    fireEvent.change(screen.getByLabelText("Mod"), { target: { value: "" } });
    expect(screen.getByText("1d20")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Mod"), { target: { value: "101" } });
    fireEvent.blur(screen.getByLabelText("Mod"));
    expect(screen.getByLabelText<HTMLInputElement>("Mod").value).toBe("0");
  });
});
