import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../features/auth/AuthContext";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { joinRoom } from "../features/rooms/api/roomsApi";
import { JoinRoomPage } from "./JoinRoomPage";

const navigateMock = vi.fn();
const searchParams = new URLSearchParams();

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigateMock,
  useSearchParams: () => [searchParams],
}));

vi.mock("../components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/characters/hooks/useCharacters", () => ({
  useCharacters: vi.fn(),
}));

vi.mock("../features/rooms/api/roomsApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/rooms/api/roomsApi")>();

  return {
    ...actual,
    joinRoom: vi.fn(),
  };
});

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseCharacters = vi.mocked(useCharacters);
const mockedJoinRoom = vi.mocked(joinRoom);

function mockPageState({
  characters = [{ id: "c1", name: "Mira" }],
  token = "token",
}: {
  characters?: Array<{ id: string; name: string }>;
  token?: string | null;
} = {}) {
  mockedUseAuth.mockReturnValue({
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    token,
    user: token ? { displayName: "Hero", email: "hero@example.com", id: "u1" } : null,
  });
  mockedUseCharacters.mockReturnValue({
    characters,
    deletingCharacterId: null,
    error: null,
    loading: false,
    refetch: vi.fn(),
    removeCharacter: vi.fn(),
  });
}

describe("JoinRoomPage", () => {
  afterEach(() => {
    cleanup();
    searchParams.delete("roomCode");
    vi.clearAllMocks();
  });

  it("prefills a room code from the URL and joins with the selected character", async () => {
    searchParams.set("roomCode", "https://example.test/room/abc123");
    mockPageState({
      characters: [
        { id: "c1", name: "Mira" },
        { id: "c2", name: "Torin" },
      ],
    });
    mockedJoinRoom.mockResolvedValueOnce({ room: { code: "ABC123" } });

    render(<JoinRoomPage />);

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>(/Room code/).value).toBe(
        "ABC123",
      ),
    );
    fireEvent.change(screen.getByLabelText("Character joining the room"), {
      target: { value: "c2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Join room" }));

    await waitFor(() =>
      expect(mockedJoinRoom).toHaveBeenCalledWith("ABC123", "c2", "token"),
    );
    expect(navigateMock).toHaveBeenCalledWith("/room/ABC123?characterId=c2");
  });

  it("validates missing room codes and empty character lists", () => {
    mockPageState({ characters: [] });

    render(<JoinRoomPage />);

    expect(
      screen.getByText("You need a character first."),
    ).toBeTruthy();
    expect(screen.getByText("Create one before joining the party.")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Join room" }).disabled).toBe(
      true,
    );
  });
});
