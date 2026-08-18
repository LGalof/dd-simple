import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { RoomDiceRoll } from "@dd-simple/shared";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRoomSocket } from "./useRoomSocket";

type Handler = (payload?: unknown) => void;

const socket = {
  disconnect: vi.fn(),
  emit: vi.fn(),
  handlers: new Map<string, Handler>(),
  on: vi.fn((event: string, handler: Handler) => {
    socket.handlers.set(event, handler);
    return socket;
  }),
  open: vi.fn(),
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => socket),
}));

const room = {
  boardState: { tokens: [{ id: "token-1" }] },
  code: "ABC123",
  createdAt: 1,
  creatorCharacterId: "char-1",
  creatorUserId: "u1",
  players: [],
  updatedAt: 10,
};

describe("useRoomSocket", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    socket.handlers.clear();
  });

  it("does not connect until room code, character, and token are available", () => {
    renderHook(() => useRoomSocket(undefined, "char-1", "token"));

    expect(socket.open).not.toHaveBeenCalled();
  });

  it("connects, joins the room, receives updates, sends board state, and cleans up", async () => {
    socket.emit.mockImplementation((event: string, _payload: unknown, callback?: (payload: unknown) => void) => {
      if (event === "room:join") {
        callback?.({ room });
      }

      if (event === "board:state") {
        callback?.({
          boardState: { tokens: [{ id: "server-token" }] },
          updatedAt: 20,
        });
      }

      if (event === "board:advance-turn") {
        callback?.({ error: "Turn conflict", updatedAt: 21 });
      }
    });

    const { result, unmount } = renderHook(() =>
      useRoomSocket("ABC123", "char-1", "token"),
    );

    expect(socket.open).toHaveBeenCalledTimes(1);

    act(() => {
      socket.handlers.get("connect")?.();
    });

    await waitFor(() => expect(result.current.connected).toBe(true));
    expect(result.current.room?.code).toBe("ABC123");
    expect(result.current.boardState).toEqual({ tokens: [{ id: "token-1" }] });
    expect(result.current.boardStateRevision).toBe(1);

    act(() => {
      socket.handlers.get("board:update")?.({
        boardState: { tokens: [{ id: "remote-token" }] },
        updatedAt: 15,
      });
    });

    expect(result.current.boardState).toEqual({ tokens: [{ id: "remote-token" }] });
    expect(result.current.boardStateRevision).toBe(2);

    act(() => {
      result.current.sendBoardState({ tokens: [{ id: "local-token" }] });
    });

    expect(socket.emit).toHaveBeenCalledWith(
      "board:state",
      {
        baseUpdatedAt: 15,
        boardState: { tokens: [{ id: "local-token" }] },
      },
      expect.any(Function),
    );
    expect(result.current.error).toBeNull();
    expect(result.current.boardState).toEqual({ tokens: [{ id: "server-token" }] });

    act(() => {
      result.current.advanceTurn(1);
    });

    expect(socket.emit).toHaveBeenCalledWith(
      "board:advance-turn",
      { direction: 1 },
      expect.any(Function),
    );
    expect(result.current.error).toBe("Turn conflict");

    act(() => {
      socket.handlers.get("disconnect")?.();
    });

    expect(result.current.connected).toBe(false);

    unmount();
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("surfaces connection and join errors", async () => {
    socket.emit.mockImplementation((event: string, _payload: unknown, callback?: (payload: unknown) => void) => {
      if (event === "room:join") {
        callback?.({ error: "Cannot join room" });
      }
    });

    const { result } = renderHook(() => useRoomSocket("ABC123", "char-1", "token"));

    await waitFor(() => expect(result.current.error).toBe("Cannot join room"));

    act(() => {
      socket.handlers.get("connect_error")?.({ message: "Socket offline" });
    });

    expect(result.current.error).toBe("Socket offline");
  });

  it("receives and announces dice rolls through the room socket", async () => {
    let diceRollAck: ((payload?: { error?: string; ok?: boolean }) => void) | undefined;
    const onDiceRolled = vi.fn();
    const roll: RoomDiceRoll = {
      characterId: "char-1",
      characterName: "Mira",
      formula: "1d20 + 5",
      id: "roll-1",
      modifier: 5,
      reason: "Attack",
      rollValues: [{ sides: 20, value: 17 }],
      rolledAt: 123,
      total: 22,
    };

    socket.emit.mockImplementation((event: string, _payload: unknown, callback?: (payload: unknown) => void) => {
      if (event === "room:join") {
        callback?.({ room });
      }

      if (event === "dice:roll") {
        diceRollAck = callback as typeof diceRollAck;
      }
    });

    const { result } = renderHook(() =>
      useRoomSocket("ABC123", "char-1", "token", onDiceRolled),
    );

    await waitFor(() => expect(result.current.room?.code).toBe("ABC123"));

    act(() => {
      socket.handlers.get("dice:rolled")?.({ roll });
    });
    expect(onDiceRolled).toHaveBeenCalledWith(roll);

    act(() => {
      socket.handlers.get("connect_error")?.({ message: "Socket offline" });
    });
    expect(result.current.error).toBe("Socket offline");

    act(() => {
      result.current.announceDiceRoll("roll-1");
    });
    expect(socket.emit).toHaveBeenCalledWith(
      "dice:roll",
      { diceRollId: "roll-1" },
      expect.any(Function),
    );

    act(() => {
      diceRollAck?.({ ok: true });
    });
    expect(result.current.error).toBeNull();

    act(() => {
      result.current.announceDiceRoll("roll-2");
    });
    act(() => {
      diceRollAck?.({ error: "Dice roll not found for this room" });
    });
    expect(result.current.error).toBe("Dice roll not found for this room");
  });
});
