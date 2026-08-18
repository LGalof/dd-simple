import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { RoomDiceRoll } from "@dd-simple/shared";
import { TacticalBoardPage } from "./TacticalBoardPage";

const mocks = vi.hoisted(() => ({
  getRoom: vi.fn(),
  getRoomDiceRolls: vi.fn(),
  onDiceRolled: undefined as ((roll: RoomDiceRoll) => void) | undefined,
  room: null as {
    boardState: unknown;
    code: string;
    createdAt: number;
    creatorCharacterId: string;
    creatorUserId: string;
    players: Array<{ characterId: string; characterName: string; joinedAt: number; userId: string }>;
    updatedAt: number;
  } | null,
  token: null as string | null,
}));

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({
    loading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    token: mocks.token,
    user: { id: "user-1", email: "dm@example.com", displayName: "DM" },
  }),
}));

vi.mock("../features/rooms/hooks/useRoomSocket", () => ({
  useRoomSocket: (
    _roomCode: string | undefined,
    _characterId: string | null,
    _token: string | null,
    onDiceRolled?: (roll: RoomDiceRoll) => void,
  ) => {
    mocks.onDiceRolled = onDiceRolled;

    return {
      advanceTurn: vi.fn(),
      boardState: null,
      boardStateRevision: 0,
      connected: false,
      error: null,
      room: mocks.room,
      sendBoardState: vi.fn(),
    };
  },
}));

vi.mock("../features/rooms/api/roomsApi", () => ({
  getRoom: mocks.getRoom,
  getRoomDiceRolls: mocks.getRoomDiceRolls,
}));

function renderBoard() {
  return render(
    <MemoryRouter>
      <TacticalBoardPage />
    </MemoryRouter>,
  );
}

function renderRoomBoard() {
  return render(
    <MemoryRouter initialEntries={["/room/ABC123?characterId=char-1"]}>
      <Routes>
        <Route path="/room/:roomCode" element={<TacticalBoardPage roomMode />} />
      </Routes>
    </MemoryRouter>,
  );
}

function roll(overrides: Partial<RoomDiceRoll> & Pick<RoomDiceRoll, "id" | "rolledAt">): RoomDiceRoll {
  return {
    characterId: "char-1",
    characterName: "Thorin",
    formula: "1d20 + 5",
    id: overrides.id,
    modifier: 5,
    reason: "Attack",
    rolledAt: overrides.rolledAt,
    total: 18,
    ...overrides,
  };
}

const roomDetails = {
  boardState: null,
  code: "ABC123",
  createdAt: 1,
  creatorCharacterId: "char-1",
  creatorUserId: "user-1",
  players: [{ characterId: "char-1", characterName: "Thorin", joinedAt: 1, userId: "user-1" }],
  updatedAt: 2,
};

function prepareRoomMode() {
  mocks.token = "token";
  mocks.room = roomDetails;
  mocks.getRoom.mockResolvedValue({ room: roomDetails });
  mocks.getRoomDiceRolls.mockResolvedValue({ rolls: [] });
}

describe("TacticalBoardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    mocks.token = null;
    mocks.room = null;
    mocks.onDiceRolled = undefined;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders the standalone tactical board with controls and combat log", () => {
    renderBoard();

    expect(screen.getByText("D&D Simple")).toBeTruthy();
    expect(screen.getByText("Prototype board ready.")).toBeTruthy();
    expect(screen.getByDisplayValue("Forest Road")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: "Move" }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Target" })).toBeTruthy();
    expect(screen.getByRole("button", { name: /Add Token/i })).toBeTruthy();
  });

  it("switches board tools, updates spell fields, places templates, and adds tokens", () => {
    renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /Target/i }));
    expect(screen.getByText(/Hover or click a square/i)).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("Fireball"), {
      target: { value: "Cone of Cold" },
    });
    fireEvent.change(screen.getByDisplayValue("8d6 fire"), {
      target: { value: "8d8 cold" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Place" }));
    expect(screen.getByText(/Choose a target square/i)).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("New Hero"), {
      target: { value: "Vex" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Add Token/i }));
    expect(screen.getByText(/Vex added/i)).toBeTruthy();
  });

  it("exports, imports, and resets local board state", () => {
    renderBoard();

    fireEvent.click(screen.getByRole("button", { name: /Export/i }));
    expect(screen.getByText(/Board export code generated/i)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /Reset Board/i }));
    expect(screen.getByText(/Board reset/i)).toBeTruthy();
  });

  it("opens the room character dashboard in a new tab", () => {
    prepareRoomMode();

    renderRoomBoard();

    const dashboardLink = screen.getByRole("link", {
      name: "Open Character Dashboard in a new tab",
    });

    expect(dashboardLink.getAttribute("href")).toBe(
      "/room/ABC123/character?characterId=char-1",
    );
    expect(dashboardLink.getAttribute("target")).toBe("_blank");
    expect(dashboardLink.getAttribute("rel")).toBe("noopener noreferrer");
    expect(screen.getByText("Open Character Dashboard")).toBeTruthy();
  });

  it("renders one shared chronological room dice feed without changing Combat Log", async () => {
    prepareRoomMode();
    mocks.getRoomDiceRolls.mockResolvedValueOnce({
      rolls: [
        roll({
          characterId: "char-2",
          characterName: "Gandalf",
          formula: "1d20 + 3",
          id: "roll-2",
          reason: "Arcana",
          rolledAt: 2,
          total: 16,
        }),
        roll({ id: "roll-1", reason: "Attack", rolledAt: 1, total: 18 }),
      ],
    });

    const { container } = renderRoomBoard();

    fireEvent.click(screen.getByRole("button", { name: "Dice Rolls" }));
    await screen.findByText("Arcana");

    const rows = Array.from(container.querySelectorAll(".battle-dice-roll-row")).map((row) => row.textContent ?? "");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain("Gandalf");
    expect(rows[0]).toContain("Arcana");
    expect(rows[0]).toContain("16");
    expect(rows[1]).toContain("Thorin");
    expect(rows[1]).toContain("Attack");

    fireEvent.click(screen.getByRole("button", { name: "Combat Log" }));
    expect(screen.getByText("Prototype board ready.")).toBeTruthy();
  });

  it("merges realtime room dice rolls, deduplicates ids, and keeps latest ten", async () => {
    prepareRoomMode();
    mocks.getRoomDiceRolls.mockResolvedValueOnce({
      rolls: Array.from({ length: 10 }, (_, index) =>
        roll({ id: `roll-${10 - index}`, reason: `Roll ${10 - index}`, rolledAt: 10 - index, total: 10 - index }),
      ),
    });

    const { container } = renderRoomBoard();

    fireEvent.click(screen.getByRole("button", { name: "Dice Rolls" }));
    await waitFor(() => expect(container.querySelectorAll(".battle-dice-roll-row")).toHaveLength(10));

    act(() => {
      mocks.onDiceRolled?.(roll({ id: "roll-11", reason: "Damage", rolledAt: 11, total: 22 }));
      mocks.onDiceRolled?.(roll({ id: "roll-11", reason: "Damage", rolledAt: 11, total: 22 }));
    });

    const rows = Array.from(container.querySelectorAll(".battle-dice-roll-row")).map((row) => row.textContent ?? "");
    expect(rows).toHaveLength(10);
    expect(rows[0]).toContain("Damage");
    expect(rows[0]).toContain("22");
    expect(screen.queryByText("Roll 1")).toBeNull();
  });

  it("keeps realtime dice rolls that arrive while initial history is loading", async () => {
    prepareRoomMode();
    let resolveHistory: (response: { rolls: RoomDiceRoll[] }) => void = () => undefined;
    const historyPromise = new Promise<{ rolls: RoomDiceRoll[] }>((resolve) => {
      resolveHistory = resolve;
    });
    mocks.getRoomDiceRolls.mockReturnValueOnce(historyPromise);

    const { container } = renderRoomBoard();

    fireEvent.click(screen.getByRole("button", { name: "Dice Rolls" }));

    act(() => {
      mocks.onDiceRolled?.(roll({ id: "realtime-roll", reason: "Realtime Attack", rolledAt: 3, total: 20 }));
    });

    expect(screen.getByText("Realtime Attack")).toBeTruthy();

    await act(async () => {
      resolveHistory({
        rolls: [roll({ id: "api-roll", reason: "Loaded Attack", rolledAt: 2, total: 18 })],
      });
      await historyPromise;
    });

    await waitFor(() => expect(screen.getByText("Loaded Attack")).toBeTruthy());
    expect(screen.getByText("Realtime Attack")).toBeTruthy();
    expect(container.querySelectorAll(".battle-dice-roll-row")).toHaveLength(2);
  });
});
