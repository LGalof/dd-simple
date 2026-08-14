import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../features/auth/AuthContext";
import { createCharacter } from "../features/characters/api/createCharacter";
import { setSelectedCharacterId } from "../features/characters/utils/selectedCharacter";
import { useCharacterCreatorReferences } from "../features/references/hooks/useCharacterCreatorReferences";
import { CreateCharacterPage } from "./CreateCharacterPage";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigateMock,
}));

vi.mock("../components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/characters/api/createCharacter", () => ({
  createCharacter: vi.fn(),
}));

vi.mock("../features/characters/utils/selectedCharacter", () => ({
  setSelectedCharacterId: vi.fn(),
}));

vi.mock("../features/references/hooks/useCharacterCreatorReferences", () => ({
  useCharacterCreatorReferences: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedCreateCharacter = vi.mocked(createCharacter);
const mockedSetSelectedCharacterId = vi.mocked(setSelectedCharacterId);
const mockedUseCharacterCreatorReferences = vi.mocked(useCharacterCreatorReferences);

const references = {
  alignments: [{ index: "neutral-good", name: "Neutral Good" }],
  backgrounds: [{ index: "soldier", name: "Soldier" }],
  classes: [{ index: "fighter", name: "Fighter" }],
  species: [{ index: "human", name: "Human" }],
};

function mockAuth(token: string | null = "token", loading = false) {
  mockedUseAuth.mockReturnValue({
    loading,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    token,
    user: token ? { displayName: "Hero", email: "hero@example.com", id: "u1" } : null,
  });
}

function mockReferences(
  state:
    | { loading: true; error: null; references: null }
    | { loading: false; error: string; references: null }
    | { loading: false; error: null; references: typeof references } = {
    error: null,
    loading: false,
    references,
  },
) {
  mockedUseCharacterCreatorReferences.mockReturnValue(state);
}

describe("CreateCharacterPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows loading and reference error states", () => {
    mockAuth("token", true);
    mockReferences({ error: null, loading: true, references: null });

    const { rerender } = render(<CreateCharacterPage />);

    expect(screen.getByText("Loading reference data...")).toBeTruthy();

    mockAuth("token", false);
    mockReferences({ error: "Reference service down", loading: false, references: null });
    rerender(<CreateCharacterPage />);

    expect(screen.getByText("Error: Reference service down")).toBeTruthy();
  });

  it("validates auth and required fields before saving", async () => {
    mockAuth(null);
    mockReferences();

    const { rerender } = render(<CreateCharacterPage />);

    fireEvent.submit(screen.getByRole("button", { name: "Create Character" }).closest("form")!);

    expect(
      await screen.findByText("Error: You must be signed in to create a character."),
    ).toBeTruthy();

    mockAuth("token");
    rerender(<CreateCharacterPage />);

    fireEvent.submit(screen.getByRole("button", { name: "Create Character" }).closest("form")!);

    expect(
      await screen.findByText(
        "Error: Choose a name, species, class, and background before creating the character.",
      ),
    ).toBeTruthy();
    expect(mockedCreateCharacter).not.toHaveBeenCalled();
  });

  it("creates a character, selects it, and navigates home", async () => {
    mockAuth();
    mockReferences();
    mockedCreateCharacter.mockResolvedValueOnce({ id: "char-1" } as Awaited<
      ReturnType<typeof createCharacter>
    >);

    render(<CreateCharacterPage />);

    fireEvent.change(screen.getByLabelText("Character Name"), {
      target: { value: " Mira " },
    });
    fireEvent.change(screen.getByLabelText("Species"), {
      target: { value: "human" },
    });
    fireEvent.change(screen.getByLabelText("Class"), {
      target: { value: "fighter" },
    });
    fireEvent.change(screen.getByLabelText("Background"), {
      target: { value: "soldier" },
    });
    fireEvent.change(screen.getByLabelText("Alignment"), {
      target: { value: "neutral-good" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Character" }));

    await waitFor(() =>
      expect(mockedCreateCharacter).toHaveBeenCalledWith(
        {
          abilityScores: {
            cha: 10,
            con: 10,
            dex: 10,
            int: 10,
            str: 10,
            wis: 10,
          },
          alignment: "neutral-good",
          backgroundIndex: "soldier",
          classIndex: "fighter",
          name: "Mira",
          skillIndexes: [],
          speciesIndex: "human",
        },
        "token",
      ),
    );
    expect(mockedSetSelectedCharacterId).toHaveBeenCalledWith("char-1");
    expect(navigateMock).toHaveBeenCalledWith("/");
  });

  it("shows save failures and re-enables the submit button", async () => {
    mockAuth();
    mockReferences();
    mockedCreateCharacter.mockRejectedValueOnce(new Error("Name already exists"));

    render(<CreateCharacterPage />);

    fireEvent.change(screen.getByLabelText("Character Name"), {
      target: { value: "Mira" },
    });
    fireEvent.change(screen.getByLabelText("Species"), {
      target: { value: "human" },
    });
    fireEvent.change(screen.getByLabelText("Class"), {
      target: { value: "fighter" },
    });
    fireEvent.change(screen.getByLabelText("Background"), {
      target: { value: "soldier" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create Character" }));

    expect(await screen.findByText("Error: Name already exists")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Create Character" }).disabled).toBe(
      false,
    );
  });
});
