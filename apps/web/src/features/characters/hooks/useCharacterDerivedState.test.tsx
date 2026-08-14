import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../../auth/AuthContext";
import { fetchCharacterDerivedState } from "../api/fetchCharacterDerivedState";
import { useCharacterDerivedState } from "./useCharacterDerivedState";

vi.mock("../../auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../api/fetchCharacterDerivedState", () => ({
  fetchCharacterDerivedState: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedFetchCharacterDerivedState = vi.mocked(fetchCharacterDerivedState);

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

describe("useCharacterDerivedState", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("loads derived state and refetches when preview state changes", async () => {
    mockAuth();
    mockedFetchCharacterDerivedState.mockResolvedValue({ stats: { armorClass: 16 } } as Awaited<
      ReturnType<typeof fetchCharacterDerivedState>
    >);

    const { result, rerender } = renderHook(
      ({ level }) => useCharacterDerivedState("char-1", { level }),
      { initialProps: { level: 1 } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.derivedState).toEqual({ stats: { armorClass: 16 } });
    expect(mockedFetchCharacterDerivedState).toHaveBeenCalledWith(
      "char-1",
      "token",
      { level: 1 },
    );

    rerender({ level: 2 });

    await waitFor(() =>
      expect(mockedFetchCharacterDerivedState).toHaveBeenCalledWith(
        "char-1",
        "token",
        { level: 2 },
      ),
    );
  });

  it("clears state without auth or character id and suppresses 404 errors", async () => {
    mockAuth(null);

    const { result, rerender } = renderHook(
      ({ characterId }) => useCharacterDerivedState(characterId),
      { initialProps: { characterId: "char-1" as string | null } },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.derivedState).toBeNull();
    expect(mockedFetchCharacterDerivedState).not.toHaveBeenCalled();

    mockAuth("token");
    mockedFetchCharacterDerivedState.mockRejectedValueOnce(new Error("status 404"));
    rerender({ characterId: "missing" });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.derivedState).toBeNull();
  });

  it("exposes non-404 load errors", async () => {
    mockAuth();
    mockedFetchCharacterDerivedState.mockRejectedValueOnce(new Error("Server down"));

    const { result } = renderHook(() => useCharacterDerivedState("char-1"));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Server down");
  });
});
