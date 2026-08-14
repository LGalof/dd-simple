import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InventoryLibrarySidebar } from "./InventoryLibrarySidebar";

describe("InventoryLibrarySidebar", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders as open or closed and calls the close handler", () => {
    const onClose = vi.fn();
    const { rerender } = render(<InventoryLibrarySidebar isOpen onClose={onClose} />);

    expect(screen.getByText("Filter")).toBeTruthy();
    expect(screen.getByRole("complementary").className).toContain(
      "inventory-side-rail-open",
    );
    expect(screen.getByText("Longsword")).toBeTruthy();
    expect(screen.getByText("Shortbow")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close" }));

    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<InventoryLibrarySidebar isOpen={false} onClose={onClose} />);

    expect(screen.getByRole("complementary").className).toContain(
      "inventory-side-rail-closed",
    );
  });

  it("filters items by type, text search, and boolean flags", () => {
    render(<InventoryLibrarySidebar isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Potion" }));

    expect(screen.getByText("Potion of Healing")).toBeTruthy();
    expect(screen.queryByText("Longsword")).toBeNull();

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "healing" },
    });

    expect(screen.getByText("Potion of Healing")).toBeTruthy();
    expect(screen.getByText("1")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Magical"));

    expect(screen.getByText("Potion of Healing")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("Proficient"));

    expect(
      screen.getByText("No items match the current search and filter combination."),
    ).toBeTruthy();
    expect(screen.getByText("0")).toBeTruthy();
  });

  it("surfaces common container and uncommon magic item combinations", () => {
    render(<InventoryLibrarySidebar isOpen onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "Other Gear" }));
    fireEvent.click(screen.getByLabelText("Container"));

    expect(screen.getByText("Backpack")).toBeTruthy();
    expect(screen.queryByText("Silk Rope")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Ring" }));
    fireEvent.click(screen.getByLabelText("Container"));
    fireEvent.click(screen.getByLabelText("Magical"));

    expect(screen.getByText("Ring of Protection")).toBeTruthy();
  });
});
