import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAuth } from "../features/auth/AuthContext";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { createRoom, getCreatedRooms } from "../features/rooms/api/roomsApi";
import { CreateRoomPage } from "./CreateRoomPage";

const navigateMock = vi.fn();

vi.mock("react-router-dom", () => ({
  Link: ({ children, to }: { children: ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => navigateMock,
}));

vi.mock("../components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => (
    <main>{children}</main>
  ),
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../features/characters/hooks/useCharacters", () => ({
  useCharacters: vi.fn(),
}));

vi.mock("../features/rooms/api/roomsApi", () => ({
  createRoom: vi.fn(),
  getCreatedRooms: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);
const mockedUseCharacters = vi.mocked(useCharacters);
const mockedCreateRoom = vi.mocked(createRoom);
const mockedGetCreatedRooms = vi.mocked(getCreatedRooms);

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

function mockCharacters(characters = [{ id: "c1", name: "Mira" }]) {
  mockedUseCharacters.mockReturnValue({
    characters,
    error: null,
    loading: false,
    refetch: vi.fn(),
  });
}

describe("CreateRoomPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("creates a room for the selected character and navigates to it", async () => {
    mockAuth();
    mockCharacters([
      { id: "c1", name: "Mira" },
      { id: "c2", name: "Torin" },
    ]);
    mockedGetCreatedRooms.mockResolvedValueOnce({ rooms: [] });
    mockedCreateRoom.mockResolvedValueOnce({
      room: { code: "ABC123" },
    });

    render(<CreateRoomPage />);

    await waitFor(() => expect(mockedGetCreatedRooms).toHaveBeenCalledWith("token"));
    fireEvent.change(screen.getByLabelText("Character entering as host"), {
      target: { value: "c2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create room" }));

    await waitFor(() =>
      expect(mockedCreateRoom).toHaveBeenCalledWith("c2", "token"),
    );
    expect(navigateMock).toHaveBeenCalledWith("/room/ABC123?characterId=c2");
  });

  it("disables creation when the user already has three rooms", async () => {
    mockAuth();
    mockCharacters();
    mockedGetCreatedRooms.mockResolvedValueOnce({
      rooms: [
        { code: "A", currentUserRole: "creator" },
        { code: "B", currentUserRole: "creator" },
        { code: "C", currentUserRole: "creator" },
      ],
    });

    render(<CreateRoomPage />);

    expect(await screen.findByText(/You already have 3 rooms/i)).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Create room" }).disabled).toBe(
      true,
    );
  });

  it("shows helpful empty and auth states", async () => {
    mockAuth(null);
    mockCharacters([]);

    render(<CreateRoomPage />);

    expect(
      screen.getByText("You need a character first."),
    ).toBeTruthy();
    expect(screen.getByText("Create one before opening a room for the party.")).toBeTruthy();
    expect(screen.getByRole<HTMLButtonElement>("button", { name: "Create room" }).disabled).toBe(
      true,
    );
    expect(mockedGetCreatedRooms).not.toHaveBeenCalled();
  });
});
