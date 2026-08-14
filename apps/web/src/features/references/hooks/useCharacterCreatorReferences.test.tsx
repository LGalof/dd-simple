import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchCharacterCreatorReferences } from "../api/fetchReferences";
import { useCharacterCreatorReferences } from "./useCharacterCreatorReferences";

vi.mock("../api/fetchReferences", () => ({
  fetchCharacterCreatorReferences: vi.fn(),
}));

const mockedFetchCharacterCreatorReferences = vi.mocked(fetchCharacterCreatorReferences);

describe("useCharacterCreatorReferences", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads creator references with the current token", async () => {
    const references = {
      alignments: [],
      backgrounds: [{ index: "soldier", name: "Soldier" }],
      classes: [{ index: "fighter", name: "Fighter" }],
      species: [{ index: "human", name: "Human" }],
    };
    mockedFetchCharacterCreatorReferences.mockResolvedValueOnce(references as Awaited<
      ReturnType<typeof fetchCharacterCreatorReferences>
    >);

    const { result } = renderHook(() => useCharacterCreatorReferences("token"));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(mockedFetchCharacterCreatorReferences).toHaveBeenCalledWith({ token: "token" });
    expect(result.current.references).toBe(references);
  });

  it("exposes friendly errors for failed reference loads", async () => {
    mockedFetchCharacterCreatorReferences.mockRejectedValueOnce(new Error("No references"));

    const { result } = renderHook(() => useCharacterCreatorReferences(null));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("No references");
    expect(result.current.references).toBeNull();
  });
});
