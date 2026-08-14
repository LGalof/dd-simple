import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../lib/prisma.js";
import {
  buildPlayerToken,
  createRoom,
  createInitialBoardState,
  deleteRoomForCreator,
  ensureCharacterToken,
  ensureHostedRoomLimit,
  ensureJoinedRoomLimit,
  getRoom,
  JoinedRoomLimitError,
  joinRoom,
  leaveRoom,
  listRoomsForUser,
  normalizeBoardStateRecord,
  normalizeRoomCode,
  RoomLimitError,
  saveRoomBoardState,
  serializeRoom,
} from "./room.service.js";

const createdAt = new Date("2026-01-01T10:00:00.000Z");
const updatedAt = new Date("2026-01-01T10:05:00.000Z");

function character(overrides = {}) {
  return {
    id: "char-1",
    name: "Kael",
    currentHp: 12,
    maxHp: 18,
    armorClass: 15,
    speed: 30,
    abilityScores: [{ abilityIndex: "dex", score: 16 }],
    ...overrides,
  };
}

async function withPrismaStubs<T>(
  stubs: {
    room?: unknown;
    transaction?: (callback: (tx: unknown) => Promise<T>) => Promise<T>;
  },
  callback: () => Promise<T>,
) {
  const originalRoom = prisma.room;
  const originalTransaction = prisma.$transaction;

  if (stubs.room) {
    (prisma as unknown as { room: unknown }).room = stubs.room;
  }

  if (stubs.transaction) {
    (prisma as unknown as { $transaction: unknown }).$transaction = stubs.transaction;
  }

  try {
    return await callback();
  } finally {
    (prisma as unknown as { room: unknown }).room = originalRoom;
    (prisma as unknown as { $transaction: unknown }).$transaction = originalTransaction;
  }
}

function roomRecord(overrides = {}) {
  return {
    id: "room-id",
    code: "ABC123",
    creatorUserId: "creator",
    creatorCharacterId: "char-1",
    createdAt,
    updatedAt,
    boardState: { tokens: [] },
    players: [
      {
        userId: "creator",
        characterId: "char-1",
        characterName: "Kael",
        joinedAt: createdAt,
      },
    ],
    ...overrides,
  };
}

test("allows a user to create up to three rooms", () => {
  assert.doesNotThrow(() => ensureHostedRoomLimit(0));
  assert.doesNotThrow(() => ensureHostedRoomLimit(2));
});

test("rejects creation after the third hosted room", () => {
  assert.throws(() => ensureHostedRoomLimit(3), RoomLimitError);
});

test("allows a user to join up to six rooms", () => {
  assert.doesNotThrow(() => ensureJoinedRoomLimit(0));
  assert.doesNotThrow(() => ensureJoinedRoomLimit(5));
});

test("rejects joining a seventh room", () => {
  assert.throws(() => ensureJoinedRoomLimit(6), JoinedRoomLimitError);
});

test("normalizes room codes from direct input, URLs, and query strings", () => {
  assert.equal(normalizeRoomCode(" abc123 "), "ABC123");
  assert.equal(normalizeRoomCode("https://app.example/room/abc123"), "ABC123");
  assert.equal(normalizeRoomCode("https://app.example/join?roomCode=abc123"), "ABC123");
  assert.equal(normalizeRoomCode("room code abc123 please"), "ABC123");
  assert.equal(normalizeRoomCode("not-a-code"), "NOT-A-CODE");
});

test("serializes persisted rooms into timestamp-based room payloads", () => {
  const room = serializeRoom({
    code: "ABC123",
    creatorUserId: "creator",
    creatorCharacterId: "char-1",
    createdAt,
    updatedAt,
    boardState: { tokens: [] },
    players: [
      {
        userId: "creator",
        characterId: "char-1",
        characterName: "Kael",
        joinedAt: createdAt,
      },
      {
        userId: "player",
        characterId: "char-2",
        characterName: "Mira",
        joinedAt: updatedAt,
      },
    ],
  });

  assert.equal(room.createdAt, createdAt.getTime());
  assert.equal(room.updatedAt, updatedAt.getTime());
  assert.equal(room.players[1]?.joinedAt, updatedAt.getTime());
  assert.deepEqual(room.boardState, { tokens: [] });
});

test("builds player tokens from character combat stats", () => {
  assert.deepEqual(
    buildPlayerToken(character({ id: "char-2", name: "Mira", abilityScores: [{ abilityIndex: "dex", score: 8 }] }), 3),
    {
      id: "character-char-2",
      characterId: "char-2",
      name: "Mira",
      team: "players",
      color: "#facc15",
      x: 8,
      y: 4,
      size: 1,
      speed: 30,
      hp: 12,
      maxHp: 18,
      initiative: 10,
      initiativeModifier: -1,
      ac: 15,
      conditions: [],
      notes: "",
      visionFeet: 60,
      turn: {
        movementUsed: 0,
        actionUsed: false,
        bonusActionUsed: false,
        reactionUsed: false,
      },
    },
  );

  assert.equal(buildPlayerToken(character({ abilityScores: [] }), 8).initiativeModifier, 0);
});

test("creates an initial board state around the creator token", () => {
  const boardState = createInitialBoardState(character());

  assert.equal(boardState.tokens.length, 1);
  assert.equal(boardState.tokens[0]?.initiativeModifier, 3);
  assert.equal(boardState.selectedTokenId, "character-char-1");
  assert.deepEqual(boardState.initiativeOrder, ["character-char-1"]);
  assert.equal(boardState.layers.grid, true);
  assert.equal(boardState.settings.feetPerSquare, 5);
});

test("normalizes partial board state records with defaults", () => {
  const normalized = normalizeBoardStateRecord({
    tokens: "bad",
    terrain: null,
    fog: null,
    pins: null,
    templates: "bad",
    layers: { grid: false },
    settings: { feetPerSquare: 10 },
    selectedTokenId: 123,
    initiativeOrder: "bad",
    activeInitiativeIndex: Number.NaN,
  });

  assert.deepEqual(normalized.tokens, []);
  assert.equal(normalized.terrain["8:4"], "wall");
  assert.deepEqual(normalized.fog, {});
  assert.deepEqual(normalized.pins, {});
  assert.deepEqual(normalized.templates, []);
  assert.equal(normalized.layers.grid, false);
  assert.equal(normalized.settings.feetPerSquare, 10);
  assert.equal(normalized.selectedTokenId, "");
  assert.deepEqual(normalized.initiativeOrder, []);
  assert.equal(normalized.activeInitiativeIndex, 0);
});

test("ensures joined characters have one board token and initiative entry", () => {
  const existingState = {
    tokens: [{ id: "character-char-1", characterId: "char-1" }],
    terrain: {},
    initiativeOrder: ["character-char-1", "missing-token"],
    selectedTokenId: "",
    activeInitiativeIndex: 2,
  };

  const nextState = ensureCharacterToken(
    existingState,
    character({ id: "char-2", name: "Mira", abilityScores: [] }),
    1,
  );

  assert.equal(nextState.tokens.length, 2);
  assert.equal(nextState.tokens[1]?.id, "character-char-2");
  assert.equal(nextState.selectedTokenId, "character-char-2");
  assert.deepEqual(nextState.initiativeOrder, ["character-char-1", "character-char-2"]);
  assert.equal(nextState.activeInitiativeIndex, 2);

  const unchangedState = ensureCharacterToken(nextState, character({ id: "char-2", name: "Mira" }), 1);

  assert.equal(unchangedState.tokens.length, 2);
});

test("creates a fresh board state when joining into invalid board data", () => {
  const boardState = ensureCharacterToken(null, character(), 0);

  assert.equal(boardState.tokens.length, 1);
  assert.equal(boardState.selectedTokenId, "character-char-1");
});

test("creates, reads, saves, and deletes rooms through prisma-backed service paths", async () => {
  const createdRooms: unknown[] = [];
  const tx = {
    $executeRaw: async () => undefined,
    room: {
      count: async () => 0,
      create: async ({ data }: { data: { code: string } }) => {
        const room = roomRecord({
          code: data.code,
          boardState: data.boardState,
        });
        createdRooms.push(room);
        return room;
      },
      findUnique: async ({ where }: { where: { code?: string; id?: string } }) =>
        where.id === "room-id" ? roomRecord() : null,
    },
  };

  await withPrismaStubs(
    {
      room: {
        deleteMany: async ({ where }: { where: { code: string; creatorUserId: string } }) => ({
          count: where.code === "ABC123" && where.creatorUserId === "creator" ? 1 : 0,
        }),
        findUnique: async () => roomRecord(),
        update: async ({ data }: { data: { boardState: unknown } }) =>
          roomRecord({ boardState: data.boardState }),
      },
      transaction: async (callback) => callback(tx),
    },
    async () => {
      const created = await createRoom("creator", character());

      assert.equal(created.creatorUserId, "creator");
      assert.equal(created.players[0]?.characterId, "char-1");
      assert.equal(createdRooms.length, 1);
      assert.deepEqual(await getRoom("abc123"), serializeRoom(roomRecord()));
      assert.equal(await deleteRoomForCreator("abc123", "creator"), true);
      assert.deepEqual((await saveRoomBoardState("abc123", { tokens: [] })).boardState, {
        tokens: [],
      });
    },
  );
});

test("joins rooms, adds board tokens, and returns null for missing rooms", async () => {
  let nextRoomLookup: unknown = null;
  const tx = {
    $executeRaw: async () => undefined,
    room: {
      findUnique: async ({ where }: { where: { code?: string; id?: string } }) => {
        if (where.code === "MISSING") {
          return null;
        }

        if (where.id === "room-id") {
          return roomRecord({
            players: [
              ...roomRecord().players,
              {
                userId: "player",
                characterId: "char-2",
                characterName: "Mira",
                joinedAt: updatedAt,
              },
            ],
          });
        }

        return nextRoomLookup;
      },
      update: async () => roomRecord(),
    },
    roomPlayer: {
      count: async () => 0,
      create: async () => ({ id: "player-row" }),
    },
  };

  await withPrismaStubs(
    {
      transaction: async (callback) => callback(tx),
    },
    async () => {
      assert.equal(await joinRoom("missing", "player", character({ id: "char-2" })), null);

      nextRoomLookup = roomRecord({
        boardState: createInitialBoardState(character()),
      });
      const joinedRoom = await joinRoom(
        "abc123",
        "player",
        character({ id: "char-2", name: "Mira", abilityScores: [] }),
      );

      assert.equal(joinedRoom?.players.length, 2);
      assert.equal(joinedRoom?.players[1]?.characterName, "Mira");
    },
  );
});

test("leaves rooms and normalizes membership status responses", async () => {
  const lookups = [
    null,
    roomRecord({ creatorUserId: "player", players: [{ userId: "player", characterId: "char-2", characterName: "Mira", joinedAt: updatedAt }] }),
    roomRecord({ players: [] }),
    roomRecord({
      boardState: {
        activeInitiativeIndex: 5,
        initiativeOrder: ["character-char-1", "character-char-2"],
        selectedTokenId: "character-char-2",
        tokens: [
          { id: "character-char-1", characterId: "char-1" },
          { id: "character-char-2", characterId: "char-2" },
        ],
      },
      players: [{ userId: "player", characterId: "char-2", characterName: "Mira", joinedAt: updatedAt }],
    }),
  ];
  const updatedStates: unknown[] = [];
  const tx = {
    $executeRaw: async () => undefined,
    room: {
      findUnique: async () => lookups.shift(),
      update: async ({ data }: { data: { boardState: unknown } }) => {
        updatedStates.push(data.boardState);
        return roomRecord({ boardState: data.boardState });
      },
    },
    roomPlayer: {
      deleteMany: async () => ({ count: 1 }),
    },
  };

  await withPrismaStubs(
    {
      transaction: async (callback) => callback(tx),
    },
    async () => {
      assert.deepEqual(await leaveRoom("abc123", "player"), { status: "not_found" });
      assert.deepEqual(await leaveRoom("abc123", "player"), { status: "creator" });
      assert.deepEqual(await leaveRoom("abc123", "player"), { status: "not_joined" });
      assert.deepEqual(await leaveRoom("abc123", "player"), {
        roomCode: "ABC123",
        status: "left",
      });
      assert.equal((updatedStates[0] as { selectedTokenId: string }).selectedTokenId, "character-char-1");
      assert.deepEqual((updatedStates[0] as { initiativeOrder: string[] }).initiativeOrder, [
        "character-char-1",
      ]);
    },
  );
});

test("lists rooms for a user with role metadata", async () => {
  await withPrismaStubs(
    {
      room: {
        findMany: async () => [
          {
            ...roomRecord({
              creator: { displayName: null, email: "creator@example.com" },
              creatorCharacter: { name: "Kael" },
              _count: { players: 2 },
              players: [
                {
                  userId: "creator",
                  characterId: "char-1",
                  characterName: "Kael",
                  joinedAt: createdAt,
                },
                {
                  userId: "player",
                  characterId: "char-2",
                  characterName: "Mira",
                  joinedAt: updatedAt,
                },
              ],
            }),
          },
        ],
      },
    },
    async () => {
      assert.deepEqual(await listRoomsForUser("player"), [
        {
          code: "ABC123",
          createdAt: createdAt.getTime(),
          creatorCharacterId: "char-1",
          creatorCharacterName: "Kael",
          creatorDisplayName: "creator@example.com",
          creatorUserId: "creator",
          currentUserCharacterId: "char-2",
          currentUserRole: "player",
          playerCount: 2,
          players: [
            {
              userId: "creator",
              characterId: "char-1",
              characterName: "Kael",
              joinedAt: createdAt.getTime(),
              role: "creator",
            },
            {
              userId: "player",
              characterId: "char-2",
              characterName: "Mira",
              joinedAt: updatedAt.getTime(),
              role: "player",
            },
          ],
          updatedAt: updatedAt.getTime(),
        },
      ]);
    },
  );
});
