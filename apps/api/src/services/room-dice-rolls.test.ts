import assert from "node:assert/strict";
import test from "node:test";
import {
  findPublicRoomDiceRollsForUser,
  findRoomDiceRollAnnouncement,
} from "./room.service.js";
import { prisma } from "../lib/prisma.js";

type FakeRoll = {
  characterId: string;
  characterName?: string;
  id: string;
  roomId: string | null;
  rolledAt: Date;
  rolledByUserId: string;
  visibility: "private" | "public";
  total?: number;
};

const players = [
  { characterId: "character-thorin", characterName: "Thorin", userId: "user-thorin" },
  { characterId: "character-gandalf", characterName: "Gandalf", userId: "user-gandalf" },
];

const rooms = {
  ABC123: {
    code: "ABC123",
    id: "room-a",
    players,
  },
  DEF456: {
    code: "DEF456",
    id: "room-b",
    players: [players[1]],
  },
};

function roll(overrides: FakeRoll): FakeRoll {
  return overrides;
}

function toRow(source: FakeRoll) {
  return {
    character: {
      name: source.characterName ?? players.find((player) => player.characterId === source.characterId)?.characterName ?? "Hero",
    },
    characterId: source.characterId,
    formula: "1d20",
    id: source.id,
    modifier: 0,
    reason: null,
    rolledAt: source.rolledAt,
    rollValues: [{ sides: 20, value: source.total ?? 10 }],
    total: source.total ?? 10,
  };
}

async function withRolls(rolls: FakeRoll[], run: () => Promise<void>) {
  const room = prisma.room as unknown as { findUnique: unknown };
  const diceRoll = prisma.diceRoll as unknown as { findFirst: unknown; findMany: unknown };
  const originals = {
    findFirst: diceRoll.findFirst,
    findMany: diceRoll.findMany,
    findUnique: room.findUnique,
  };

  room.findUnique = async (args: { where: { code: keyof typeof rooms } }) => rooms[args.where.code] ?? null;
  diceRoll.findMany = async (args: {
    take: number;
    where: { roomId: string; visibility: "public" };
  }) =>
    rolls
      .filter((entry) => entry.roomId === args.where.roomId && entry.visibility === "public")
      .sort((left, right) => right.rolledAt.getTime() - left.rolledAt.getTime())
      .slice(0, args.take)
      .map(toRow);
  diceRoll.findFirst = async (args: {
    where: {
      characterId: string;
      id: string;
      roomId: string;
      rolledByUserId: string;
      visibility: "public";
    };
  }) => {
    const found = rolls.find(
      (entry) =>
        entry.characterId === args.where.characterId &&
        entry.id === args.where.id &&
        entry.roomId === args.where.roomId &&
        entry.rolledByUserId === args.where.rolledByUserId &&
        entry.visibility === "public",
    );

    return found ? toRow(found) : null;
  };

  try {
    await run();
  } finally {
    room.findUnique = originals.findUnique;
    diceRoll.findMany = originals.findMany;
    diceRoll.findFirst = originals.findFirst;
  }
}

test("room dice history returns public latest ten rolls for the exact room", async () => {
  await withRolls(
    [
      roll({
        characterId: "character-thorin",
        id: "private-newest",
        roomId: "room-a",
        rolledAt: new Date("2026-08-14T10:30:00.000Z"),
        rolledByUserId: "user-thorin",
        visibility: "private",
      }),
      roll({
        characterId: "character-thorin",
        id: "old-null-room-roll",
        roomId: null,
        rolledAt: new Date("2026-08-14T10:29:00.000Z"),
        rolledByUserId: "user-thorin",
        visibility: "public",
      }),
      roll({
        characterId: "character-gandalf",
        id: "room-b-roll",
        roomId: "room-b",
        rolledAt: new Date("2026-08-14T10:28:00.000Z"),
        rolledByUserId: "user-gandalf",
        visibility: "public",
      }),
      ...Array.from({ length: 12 }, (_, index) =>
        roll({
          characterId: index % 2 === 0 ? "character-thorin" : "character-gandalf",
          id: `room-a-public-${index + 1}`,
          roomId: "room-a",
          rolledAt: new Date(`2026-08-14T10:${String(index + 1).padStart(2, "0")}:00.000Z`),
          rolledByUserId: index % 2 === 0 ? "user-thorin" : "user-gandalf",
          total: index + 1,
          visibility: "public",
        }),
      ),
    ],
    async () => {
      const result = await findPublicRoomDiceRollsForUser("ABC123", "user-thorin");

      assert.equal(result.status, "ok");
      if (result.status !== "ok") {
        assert.fail("Expected room member to load dice-roll history");
      }
      assert.deepEqual(result.rolls.map((entry) => entry.id), [
        "room-a-public-12",
        "room-a-public-11",
        "room-a-public-10",
        "room-a-public-9",
        "room-a-public-8",
        "room-a-public-7",
        "room-a-public-6",
        "room-a-public-5",
        "room-a-public-4",
        "room-a-public-3",
      ]);
      assert.equal(result.rolls[0].characterName, "Gandalf");
      assert.deepEqual(await findPublicRoomDiceRollsForUser("ABC123", "user-stranger"), {
        status: "forbidden",
      });
    },
  );
});

test("room dice history excludes Room A rolls from Room B", async () => {
  await withRolls(
    [
      roll({
        characterId: "character-thorin",
        id: "room-a-roll",
        roomId: "room-a",
        rolledAt: new Date("2026-08-14T10:00:00.000Z"),
        rolledByUserId: "user-thorin",
        visibility: "public",
      }),
      roll({
        characterId: "character-gandalf",
        id: "room-b-roll",
        roomId: "room-b",
        rolledAt: new Date("2026-08-14T10:01:00.000Z"),
        rolledByUserId: "user-gandalf",
        visibility: "public",
      }),
    ],
    async () => {
      const result = await findPublicRoomDiceRollsForUser("DEF456", "user-gandalf");

      assert.equal(result.status, "ok");
      if (result.status !== "ok") {
        assert.fail("Expected room member to load dice-roll history");
      }
      assert.deepEqual(result.rolls.map((entry) => entry.id), ["room-b-roll"]);
    },
  );
});

test("room dice announcements validate joined room, character, user, and public persisted roll", async () => {
  await withRolls(
    [
      roll({
        characterId: "character-thorin",
        id: "saved-roll",
        roomId: "room-a",
        rolledAt: new Date("2026-08-14T10:00:00.000Z"),
        rolledByUserId: "user-thorin",
        total: 21,
        visibility: "public",
      }),
      roll({
        characterId: "character-thorin",
        id: "other-room-roll",
        roomId: "room-b",
        rolledAt: new Date("2026-08-14T10:02:00.000Z"),
        rolledByUserId: "user-thorin",
        visibility: "public",
      }),
      roll({
        characterId: "character-thorin",
        id: "non-room-roll",
        roomId: null,
        rolledAt: new Date("2026-08-14T10:03:00.000Z"),
        rolledByUserId: "user-thorin",
        visibility: "public",
      }),
      roll({
        characterId: "character-thorin",
        id: "private-roll",
        roomId: "room-a",
        rolledAt: new Date("2026-08-14T10:04:00.000Z"),
        rolledByUserId: "user-thorin",
        visibility: "private",
      }),
    ],
    async () => {
      const accepted = await findRoomDiceRollAnnouncement(
        "ABC123",
        "user-thorin",
        "character-thorin",
        "saved-roll",
      );

      assert.equal(accepted.status, "ok");
      if (accepted.status !== "ok") {
        assert.fail("Expected saved-roll announcement to be accepted");
      }
      assert.equal(accepted.roll.id, "saved-roll");
      assert.equal(accepted.roll.characterName, "Thorin");
      assert.deepEqual(
        await findRoomDiceRollAnnouncement(
          "ABC123",
          "user-thorin",
          "character-thorin",
          "other-room-roll",
        ),
        { status: "not_found" },
      );
      assert.deepEqual(
        await findRoomDiceRollAnnouncement(
          "ABC123",
          "user-thorin",
          "character-thorin",
          "non-room-roll",
        ),
        { status: "not_found" },
      );
      assert.deepEqual(
        await findRoomDiceRollAnnouncement(
          "ABC123",
          "user-thorin",
          "character-thorin",
          "private-roll",
        ),
        { status: "not_found" },
      );
      assert.deepEqual(
        await findRoomDiceRollAnnouncement(
          "ABC123",
          "user-gandalf",
          "character-thorin",
          "saved-roll",
        ),
        { status: "forbidden" },
      );
    },
  );
});
