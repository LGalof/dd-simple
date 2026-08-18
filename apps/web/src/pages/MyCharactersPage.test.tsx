import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useCharacters } from "../features/characters/hooks/useCharacters";
import { setSelectedCharacterId } from "../features/characters/utils/selectedCharacter";
import { MyCharactersPage } from "./MyCharactersPage";

const navigateMock = vi.fn();
const removeCharacterMock = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigateMock,
}));

vi.mock("../components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("../features/characters/components/CharacterSummaryCard", () => ({
  CharacterSummaryCard: ({
    character,
    deleting,
    onDelete,
    onSelect,
  }: {
    character: { id: string; name: string };
    deleting: boolean;
    onDelete: (character: unknown) => void;
    onSelect: (character: unknown) => void;
  }) => (
    <article>
      <h2>{character.name}</h2>
      <span>{deleting ? "Deleting" : "Ready"}</span>
      <button type="button" onClick={() => onSelect(character)}>
        Select {character.name}
      </button>
      <button type="button" onClick={() => onDelete(character)}>
        Delete {character.name}
      </button>
    </article>
  ),
}));

vi.mock("../features/characters/components/CharactersEmptyState", () => ({
  CharactersEmptyState: () => <p>No characters empty state</p>,
}));

vi.mock("../features/characters/hooks/useCharacters", () => ({
  useCharacters: vi.fn(),
}));

vi.mock("../features/characters/utils/selectedCharacter", () => ({
  setSelectedCharacterId: vi.fn(),
}));

const mockedUseCharacters = vi.mocked(useCharacters);
const mockedSetSelectedCharacterId = vi.mocked(setSelectedCharacterId);

const characters = [
  {
    class: { name: "Wizard" },
    createdAt: "2024-01-01T00:00:00.000Z",
    id: "c1",
    level: 3,
    name: "Mira",
    species: { name: "Elf" },
  },
  {
    class: { name: "Rogue" },
    createdAt: "2024-02-01T00:00:00.000Z",
    id: "c2",
    level: 5,
    name: "Torin",
    species: { name: "Human" },
  },
];

function mockCharactersState(patch = {}) {
  mockedUseCharacters.mockReturnValue({
    characters,
    deletingCharacterId: "c2",
    error: null,
    loading: false,
    refetch: vi.fn(),
    removeCharacter: removeCharacterMock,
    ...patch,
  });
}

describe("MyCharactersPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("lists, selects, and deletes characters without library controls", () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockCharactersState();

    render(<MyCharactersPage />);

    expect(screen.getByText("Mira")).toBeTruthy();
    expect(screen.getByText("Torin")).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByLabelText("Sort By")).toBeNull();
    expect(screen.queryByRole("button", { name: "Settings" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Select Torin" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete Torin" }));

    expect(mockedSetSelectedCharacterId).toHaveBeenCalledWith("c2");
    expect(navigateMock).toHaveBeenCalledWith("/");
    expect(removeCharacterMock).toHaveBeenCalledWith("c2");
  });

  it("renders loading, error, and empty states", () => {
    mockCharactersState({ characters: [], loading: true });
    const { rerender } = render(<MyCharactersPage />);
    expect(screen.getByText("Loading characters...")).toBeTruthy();

    mockCharactersState({ error: "Could not load" });
    rerender(<MyCharactersPage />);
    expect(screen.getByText("Error: Could not load")).toBeTruthy();

    mockCharactersState({ characters: [] });
    rerender(<MyCharactersPage />);
    expect(screen.getByText("No characters empty state")).toBeTruthy();
  });
});
