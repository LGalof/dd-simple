import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../features/auth/AuthContext";
import { getRoom } from "../features/rooms/api/roomsApi";
import { useRoomSocket } from "../features/rooms/hooks/useRoomSocket";
import { RoomPage } from "./RoomPage";

const routeState = {
  params: { roomCode: "ABC123" },
  search: new URLSearchParams(""),
};

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useParams: () => routeState.params,
  useSearchParams: () => [routeState.search],
}));

vi.mock("../components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <main>{children}</main>,
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/rooms/api/roomsApi", () => ({
  getRoom: vi.fn(),
}));

vi.mock("../features/rooms/hooks/useRoomSocket", () => ({
  useRoomSocket: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetRoom = vi.mocked(getRoom);
const mockedUseRoomSocket = vi.mocked(useRoomSocket);

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

describe("RoomPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    routeState.params = { roomCode: "ABC123" };
    routeState.search = new URLSearchParams("");
  });

  it("loads and renders room details with a join prompt", async () => {
    mockAuth();
    mockedUseRoomSocket.mockReturnValue({
      connected: false,
      error: null,
      room: null,
    });
    mockedGetRoom.mockResolvedValueOnce({
      room: {
        code: "ABC123",
        createdAt: Date.parse("2026-01-01T10:00:00.000Z"),
        players: [
          {
            characterId: "char-1",
            characterName: "Mira",
            joinedAt: Date.parse("2026-01-01T10:05:00.000Z"),
            userId: "u1",
          },
        ],
      },
    } as Awaited<ReturnType<typeof getRoom>>);

    render(<RoomPage />);

    expect(screen.getByText("Loading room data…")).toBeTruthy();
    expect(await screen.findByText("Room code:")).toBeTruthy();
    expect(screen.getByText("ABC123")).toBeTruthy();
    expect(screen.getByText("Players in room:")).toBeTruthy();
    expect(screen.getByText("Mira")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Join room" }).getAttribute("href")).toBe(
      "/rooms/join?roomCode=ABC123",
    );
  });

  it("uses socket room state and live sync messaging when joined", async () => {
    routeState.search = new URLSearchParams("characterId=char-2");
    mockAuth();
    mockedUseRoomSocket.mockReturnValue({
      connected: true,
      error: "Socket delayed",
      room: {
        code: "LIVE99",
        createdAt: Date.parse("2026-01-02T10:00:00.000Z"),
        players: [],
      },
    });
    mockedGetRoom.mockResolvedValueOnce({
      room: {
        code: "ABC123",
        createdAt: Date.parse("2026-01-01T10:00:00.000Z"),
        players: [],
      },
    } as Awaited<ReturnType<typeof getRoom>>);

    render(<RoomPage />);

    expect(screen.getByText("Socket delayed")).toBeTruthy();
    expect(screen.getByText("Connected for live sync as your selected character.")).toBeTruthy();
    await waitFor(() => expect(mockedGetRoom).toHaveBeenCalledWith("ABC123", "token"));
    expect(await screen.findByText("LIVE99")).toBeTruthy();
  });

  it("handles missing auth and API load failures", async () => {
    mockAuth(null);
    mockedUseRoomSocket.mockReturnValue({
      connected: false,
      error: null,
      room: null,
    });

    const { rerender } = render(<RoomPage />);

    await waitFor(() => expect(screen.queryByText("Loading room data…")).toBeNull());
    expect(mockedGetRoom).not.toHaveBeenCalled();

    mockAuth("token");
    mockedGetRoom.mockRejectedValueOnce(new Error("Room not found"));
    rerender(<RoomPage />);

    expect(await screen.findByText("Room not found")).toBeTruthy();
  });
});
