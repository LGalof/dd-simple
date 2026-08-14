import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CharacterSummaryCard } from "./CharacterSummaryCard";

const character = {
  class: { index: "fighter", name: "Fighter" },
  id: "char-1",
  level: 5,
  name: "mira",
  species: { index: "human", name: "Human" },
};

describe("CharacterSummaryCard", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders character summary and wires actions", () => {
    const onDelete = vi.fn();
    const onSelect = vi.fn();

    render(
      <CharacterSummaryCard
        character={character as Parameters<typeof CharacterSummaryCard>[0]["character"]}
        onDelete={onDelete}
        onSelect={onSelect}
      />,
    );

    expect(screen.getByText("M")).toBeTruthy();
    expect(screen.getByText("mira")).toBeTruthy();
    expect(screen.getByText("Level 5 | Human | Fighter")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "View Character" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onSelect).toHaveBeenCalledWith(character);
    expect(onDelete).toHaveBeenCalledWith(character);
  });

  it("disables delete while deletion is pending", () => {
    render(
      <CharacterSummaryCard
        character={character as Parameters<typeof CharacterSummaryCard>[0]["character"]}
        deleting
        onDelete={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Deleting..." }).disabled).toBe(
      true,
    );
  });
});
