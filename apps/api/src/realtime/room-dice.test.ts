import assert from "node:assert/strict";
import test from "node:test";
import type { Server, Socket } from "socket.io";
import { handleRoomDiceRollEvent, type DiceRollCallback } from "./room-dice.js";
import { prisma } from "../lib/prisma.js";

function emitter() {
  const emissions: Array<{ eventName: string; payload: { roll: { id: string } }; roomName: string }> = [];
  const io = {
    to(roomName: string) {
      return {
        emit(eventName: string, payload: { roll: { id: string } }) {
          emissions.push({ eventName, payload, roomName });
        },
      };
    },
  } as unknown as Server;

  return { emissions, io };
}

async function withSavedRoll(run: () => Promise<void>) {
  const room = prisma.room as unknown as { findUnique: unknown };
  const diceRoll = prisma.diceRoll as unknown as { findFirst: unknown };
  const originals = { findFirst: diceRoll.findFirst, findUnique: room.findUnique };

  room.findUnique = async () => ({
    code: "ABC123",
    id: "room-a",
    players: [{ characterId: "character-thorin", characterName: "Thorin", userId: "user-thorin" }],
  });
  diceRoll.findFirst = async (args: { where: { characterId: string; id: string; roomId: string; rolledByUserId: string } }) => {
    const rows = [
      {
        character: { name: "Thorin" },
        characterId: "character-thorin",
        formula: "1d20 + 4",
        id: "saved-roll",
        modifier: 4,
        reason: "Attack",
        rolledAt: new Date("2026-08-14T10:00:00.000Z"),
        rollValues: [{ sides: 20, value: 17 }],
        roomId: "room-a",
        rolledByUserId: "user-thorin",
        total: 21,
      },
      {
        character: { name: "Thorin" },
        characterId: "character-thorin",
        formula: "1d20",
        id: "other-room-roll",
        modifier: 0,
        reason: "Spoof",
        rolledAt: new Date("2026-08-14T10:05:00.000Z"),
        rollValues: [{ sides: 20, value: 15 }],
        roomId: "room-b",
        rolledByUserId: "user-thorin",
        total: 15,
      },
    ];

    return rows.find(
      (row) =>
        row.characterId === args.where.characterId &&
        row.id === args.where.id &&
        row.roomId === args.where.roomId &&
        row.rolledByUserId === args.where.rolledByUserId,
    ) ?? null;
  };

  try {
    await run();
  } finally {
    room.findUnique = originals.findUnique;
    diceRoll.findFirst = originals.findFirst;
  }
}

function socket(data: Record<string, unknown>): Socket {
  return { data } as unknown as Socket;
}

test("dice event cannot broadcast before a valid room join", async () => {
  const { emissions, io } = emitter();
  let response: Parameters<DiceRollCallback>[0] | undefined;

  await handleRoomDiceRollEvent(socket({}), io, { diceRollId: "saved-roll" }, (nextResponse) => {
    response = nextResponse;
  });

  assert.equal(response?.error, "Join a room before announcing dice rolls");
  assert.deepEqual(emissions, []);
});

test("dice event broadcasts a saved roll only to the joined room", async () => {
  await withSavedRoll(async () => {
    const { emissions, io } = emitter();
    let response: Parameters<DiceRollCallback>[0] | undefined;

    await handleRoomDiceRollEvent(
      socket({ characterId: "character-thorin", roomCode: "ABC123", user: { id: "user-thorin" } }),
      io,
      { diceRollId: "saved-roll" },
      (nextResponse) => {
        response = nextResponse;
      },
    );

    assert.equal(response?.ok, true);
    assert.equal(response?.roll?.id, "saved-roll");
    assert.deepEqual(emissions.map((entry) => [entry.eventName, entry.roomName, entry.payload.roll.id]), [
      ["dice:rolled", "room:ABC123", "saved-roll"],
    ]);
  });
});

test("dice event rejects another character's saved roll id", async () => {
  await withSavedRoll(async () => {
    const { emissions, io } = emitter();
    let response: Parameters<DiceRollCallback>[0] | undefined;

    await handleRoomDiceRollEvent(
      socket({ characterId: "character-thorin", roomCode: "ABC123", user: { id: "user-thorin" } }),
      io,
      { diceRollId: "other-character-roll" },
      (nextResponse) => {
        response = nextResponse;
      },
    );

    assert.equal(response?.error, "Dice roll not found for this room");
    assert.deepEqual(emissions, []);
  });
});

test("dice event rejects a saved roll from another room", async () => {
  await withSavedRoll(async () => {
    const { emissions, io } = emitter();
    let response: Parameters<DiceRollCallback>[0] | undefined;

    await handleRoomDiceRollEvent(
      socket({ characterId: "character-thorin", roomCode: "ABC123", user: { id: "user-thorin" } }),
      io,
      { diceRollId: "other-room-roll" },
      (nextResponse) => {
        response = nextResponse;
      },
    );

    assert.equal(response?.error, "Dice roll not found for this room");
    assert.deepEqual(emissions, []);
  });
});
