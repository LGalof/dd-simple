import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../../auth/AuthContext";
import { addCharacterCondition } from "../api/addCharacterCondition";
import { createCharacterDiceRoll } from "../api/createCharacterDiceRoll";
import { deleteCharacter } from "../api/deleteCharacter";
import { fetchCharacters } from "../api/fetchCharacters";
import { removeCharacterCondition } from "../api/removeCharacterCondition";
import { updateCharacter } from "../api/updateCharacter";
import { clearSelectedCharacterId } from "../utils/selectedCharacter";
import { useCharacters } from "./useCharacters";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/addCharacterCondition", () => ({
  addCharacterCondition: vi.fn(),
}));

vi.mock("../api/createCharacterDiceRoll", () => ({
  createCharacterDiceRoll: vi.fn(),
}));

vi.mock("../api/deleteCharacter", () => ({
  deleteCharacter: vi.fn(),
}));

vi.mock("../api/fetchCharacters", () => ({
  fetchCharacters: vi.fn(),
}));

vi.mock("../api/removeCharacterCondition", () => ({
  removeCharacterCondition: vi.fn(),
}));

vi.mock("../api/updateCharacter", () => ({
  updateCharacter: vi.fn(),
}));

vi.mock("../utils/selectedCharacter", () => ({
  clearSelectedCharacterId: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedAddCharacterCondition = vi.mocked(addCharacterCondition);
const mockedCreateCharacterDiceRoll = vi.mocked(createCharacterDiceRoll);
const mockedDeleteCharacter = vi.mocked(deleteCharacter);
const mockedFetchCharacters = vi.mocked(fetchCharacters);
const mockedRemoveCharacterCondition = vi.mocked(removeCharacterCondition);
const mockedUpdateCharacter = vi.mocked(updateCharacter);
const mockedClearSelectedCharacterId = vi.mocked(clearSelectedCharacterId);

const mira = {
  diceRolls: [],
  id: "c1",
  name: "Mira",
};
const torin = {
  diceRolls: [{ id: "old-1" }, { id: "old-2" }, { id: "old-3" }, { id: "old-4" }, { id: "old-5" }],
  id: "c2",
  name: "Torin",
};

function mockAuth(token: string | null = "token") {
  mockedUseAuth.mockReturnValue({
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    token,
    user: token ? { displayName: "Hero", email: "hero@example.com", id: "u1" } : null,
  });
}

describe("useCharacters", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads characters for authenticated users and stops loading without a token", async () => {
    mockAuth();
    mockedFetchCharacters.mockResolvedValueOnce([mira, torin] as Awaited<
      ReturnType<typeof fetchCharacters>
    >);

    const { result, rerender } = renderHook(() => useCharacters());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedFetchCharacters).toHaveBeenCalledWith("token");
    expect(result.current.characters.map((character) => character.name)).toEqual([
      "Mira",
      "Torin",
    ]);

    mockAuth(null);
    rerender();

    expect(result.current.loading).toBe(false);
  });

  it("removes and saves characters while exposing progress state", async () => {
    mockAuth();
    mockedFetchCharacters.mockResolvedValueOnce([mira, torin] as Awaited<
      ReturnType<typeof fetchCharacters>
    >);
    mockedDeleteCharacter.mockResolvedValueOnce(undefined);
    mockedUpdateCharacter.mockResolvedValueOnce({
      ...mira,
      name: "Mira Updated",
    } as Awaited<ReturnType<typeof updateCharacter>>);

    const { result } = renderHook(() => useCharacters());

    await waitFor(() => expect(result.current.characters).toHaveLength(2));

    await act(async () => {
      await result.current.removeCharacter("c2");
    });

    expect(mockedDeleteCharacter).toHaveBeenCalledWith("c2", "token");
    expect(mockedClearSelectedCharacterId).toHaveBeenCalledWith("c2");
    expect(result.current.characters.map((character) => character.id)).toEqual(["c1"]);

    await act(async () => {
      const updated = await result.current.saveCharacter("c1", { name: "Mira Updated" });
      expect(updated?.name).toBe("Mira Updated");
    });

    expect(mockedUpdateCharacter).toHaveBeenCalledWith(
      "c1",
      { name: "Mira Updated" },
      "token",
    );
    expect(result.current.characters[0]?.name).toBe("Mira Updated");
  });

  it("updates conditions, records recent dice rolls, and handles failures", async () => {
    mockAuth();
    mockedFetchCharacters.mockResolvedValueOnce([mira, torin] as Awaited<
      ReturnType<typeof fetchCharacters>
    >);
    mockedAddCharacterCondition.mockResolvedValueOnce({
      ...mira,
      conditions: [{ index: "poisoned" }],
    } as Awaited<ReturnType<typeof addCharacterCondition>>);
    mockedRemoveCharacterCondition.mockRejectedValueOnce(new Error("Cannot remove"));
    mockedCreateCharacterDiceRoll.mockResolvedValueOnce({ id: "new-roll" } as Awaited<
      ReturnType<typeof createCharacterDiceRoll>
    >);

    const { result } = renderHook(() => useCharacters());

    await waitFor(() => expect(result.current.characters).toHaveLength(2));

    await act(async () => {
      const updated = await result.current.addCondition("c1", "poisoned");
      expect(updated?.conditions).toHaveLength(1);
    });

    await act(async () => {
      const updated = await result.current.removeCondition("c1", "poisoned");
      expect(updated).toBeNull();
    });

    expect(result.current.saveError).toBe("Cannot remove");

    await act(async () => {
      const roll = await result.current.recordDiceRoll("c2", {
        formula: "1d20",
        rollType: "check",
        rollValues: [],
        total: 12,
      });
      expect(roll?.id).toBe("new-roll");
    });

    const updatedTorin = result.current.characters.find((character) => character.id === "c2");
    expect(updatedTorin?.diceRolls.map((roll) => roll.id)).toEqual([
      "new-roll",
      "old-1",
      "old-2",
      "old-3",
      "old-4",
    ]);
  });

  it("sets friendly errors when mutation calls run without auth", async () => {
    mockAuth(null);

    const { result } = renderHook(() => useCharacters());

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.removeCharacter("c1");
      expect(await result.current.saveCharacter("c1", { name: "Mira" })).toBeNull();
      expect(await result.current.addCondition("c1", "poisoned")).toBeNull();
      expect(await result.current.removeCondition("c1", "poisoned")).toBeNull();
      expect(await result.current.recordDiceRoll("c1", {
        formula: "1d20",
        rollType: "check",
        rollValues: [],
        total: 10,
      })).toBeNull();
    });

    expect(result.current.error).toBe("You must be signed in to delete a character.");
    expect(result.current.saveError).toBe("You must be signed in to remove a condition.");
  });
});
