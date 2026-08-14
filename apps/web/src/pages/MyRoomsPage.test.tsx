import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../features/auth/AuthContext";
import { deleteRoom, getCreatedRooms, leaveRoom } from "../features/rooms/api/roomsApi";
import { copyRoomInviteUrl } from "../features/rooms/utils/roomInvite";
import { MyRoomsPage } from "./MyRoomsPage";

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

vi.mock("../features/rooms/api/roomsApi", () => ({
  deleteRoom: vi.fn(),
  getCreatedRooms: vi.fn(),
  leaveRoom: vi.fn(),
}));

vi.mock("../features/rooms/utils/roomInvite", () => ({
  copyRoomInviteUrl: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedGetCreatedRooms = vi.mocked(getCreatedRooms);
const mockedDeleteRoom = vi.mocked(deleteRoom);
const mockedLeaveRoom = vi.mocked(leaveRoom);
const mockedCopyRoomInviteUrl = vi.mocked(copyRoomInviteUrl);

const baseRoom = {
  code: "ABC123",
  createdAt: Date.UTC(2024, 0, 1, 10, 0),
  creatorCharacterId: "c1",
  creatorCharacterName: "Mira",
  creatorDisplayName: "Alen",
  creatorUserId: "u1",
  currentUserCharacterId: null,
  currentUserRole: "creator" as const,
  playerCount: 1,
  players: [
    {
      characterId: "c1",
      characterName: "Mira",
      joinedAt: Date.UTC(2024, 0, 1, 10, 5),
      role: "creator" as const,
      userId: "u1",
    },
  ],
  updatedAt: Date.UTC(2024, 0, 1, 11, 0),
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

describe("MyRoomsPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("loads rooms and supports rejoin and delete actions", async () => {
    vi.stubGlobal("confirm", vi.fn(() => true));
    mockAuth();
    mockedGetCreatedRooms.mockResolvedValueOnce({
      rooms: [
        baseRoom,
        {
          ...baseRoom,
          code: "DEF456",
          currentUserCharacterId: "c2",
          currentUserRole: "player" as const,
          playerCount: 2,
        },
      ],
    });
    mockedDeleteRoom.mockResolvedValueOnce(undefined);

    render(<MyRoomsPage />);

    expect((await screen.findAllByText("Mira")).length).toBeGreaterThan(0);
    expect(screen.getByText("1/3 created rooms")).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button", { name: "Rejoin room" })[0]);
    expect(navigateMock).toHaveBeenCalledWith("/room/ABC123?characterId=c1");

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(mockedDeleteRoom).toHaveBeenCalledWith("ABC123", "token"),
    );
  });

  it("copies invite links and handles clipboard failures", async () => {
    mockAuth();
    mockedGetCreatedRooms.mockResolvedValue({ rooms: [baseRoom] });
    mockedCopyRoomInviteUrl.mockResolvedValueOnce(undefined);

    render(<MyRoomsPage />);

    expect((await screen.findAllByText("Mira")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Copy invite" }));

    await waitFor(() =>
      expect(mockedCopyRoomInviteUrl).toHaveBeenCalledWith("ABC123"),
    );
    expect(screen.getByRole("button", { name: "Link copied" })).toBeTruthy();

    cleanup();
    mockedGetCreatedRooms.mockResolvedValue({ rooms: [baseRoom] });
    mockedCopyRoomInviteUrl.mockRejectedValueOnce(new Error("clipboard denied"));
    render(<MyRoomsPage />);

    expect((await screen.findAllByText("Mira")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Copy invite" }));

    expect(await screen.findByText("Error: Invite link could not be copied. Check browser clipboard permission.")).toBeTruthy();
  });

  it("leaves joined rooms only after confirmation", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    mockAuth();
    mockedGetCreatedRooms.mockResolvedValue({
      rooms: [
        {
          ...baseRoom,
          code: "DEF456",
          currentUserCharacterId: "c2",
          currentUserRole: "player" as const,
          playerCount: 2,
        },
      ],
    });

    render(<MyRoomsPage />);

    expect((await screen.findAllByText("Mira")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Leave room" }));
    expect(mockedLeaveRoom).not.toHaveBeenCalled();

    confirm.mockReturnValueOnce(true);
    mockedLeaveRoom.mockResolvedValueOnce(undefined);
    fireEvent.click(screen.getByRole("button", { name: "Leave room" }));

    await waitFor(() =>
      expect(mockedLeaveRoom).toHaveBeenCalledWith("DEF456", "token"),
    );
    await waitFor(() => expect(screen.queryByText("DEF456")).toBeNull());
  });

  it("shows loading, auth, API, empty, and room-limit states", async () => {
    mockAuth(null);
    render(<MyRoomsPage />);

    expect(await screen.findByText("Error: Authentication is required to load rooms.")).toBeTruthy();
    expect(mockedGetCreatedRooms).not.toHaveBeenCalled();

    cleanup();
    mockAuth();
    mockedGetCreatedRooms.mockRejectedValueOnce(new Error("Nope"));
    render(<MyRoomsPage />);
    expect(await screen.findByText("Error: Nope")).toBeTruthy();

    cleanup();
    mockedGetCreatedRooms.mockResolvedValueOnce({ rooms: [] });
    render(<MyRoomsPage />);
    expect(await screen.findByText("No rooms yet")).toBeTruthy();

    cleanup();
    mockedGetCreatedRooms.mockResolvedValueOnce({
      rooms: [
        baseRoom,
        { ...baseRoom, code: "DEF456" },
        { ...baseRoom, code: "GHI789" },
      ],
    });
    render(<MyRoomsPage />);
    expect(await screen.findByText("Room limit reached")).toBeTruthy();
  });
});
