import { Prisma } from "@prisma/client";
import { randomInt } from "node:crypto";
import type { RoomDiceRoll } from "@dd-simple/shared";
import { prisma } from "../lib/prisma.js";

type RoomPlayer = {
  userId: string;
  characterId: string;
  characterName: string;
  joinedAt: number;
};

type Room = {
  code: string;
  creatorUserId: string;
  creatorCharacterId: string;
  createdAt: number;
  updatedAt: number;
  players: RoomPlayer[];
  boardState: unknown;
};

type CreatedRoomSummary = {
  code: string;
  currentUserRole: "creator" | "player";
  currentUserCharacterId: string | null;
  creatorUserId: string;
  creatorCharacterId: string;
  creatorCharacterName: string;
  creatorDisplayName: string;
  createdAt: number;
  updatedAt: number;
  playerCount: number;
  players: Array<RoomPlayer & { role: "creator" | "player" }>;
};

type RoomCharacter = {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  speed: number;
  abilityScores?: Array<{
    abilityIndex?: string;
    score?: number;
  }>;
};

type BoardToken = {
  id: string;
  characterId?: string;
  name: string;
  team: "players" | "enemies" | "neutral";
  color: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  hp: number;
  maxHp: number;
  initiative: number;
  initiativeModifier: number;
  ac: number;
  conditions: string[];
  notes: string;
  visionFeet: number;
  turn: {
    movementUsed: number;
    actionUsed: boolean;
    bonusActionUsed: boolean;
    reactionUsed: boolean;
  };
};

type BoardStateRecord = {
  tokens?: BoardToken[];
  terrain?: Record<string, string>;
  fog?: Record<string, boolean>;
  pins?: Record<string, unknown>;
  templates?: unknown[];
  layers?: Record<string, boolean>;
  settings?: Record<string, unknown>;
  selectedTokenId?: string;
  initiativeOrder?: string[];
  activeInitiativeIndex?: number;
};

const ROOM_CODE_LENGTH = 6;
const MAX_HOSTED_ROOMS_PER_USER = 3;
const MAX_JOINED_ROOMS_PER_USER = 6;
const ROOM_DICE_ROLL_HISTORY_LIMIT = 10;
const ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const playerTokenColors = ["#60a5fa", "#a78bfa", "#34d399", "#facc15", "#f472b6", "#22d3ee"];
const roomDiceRollSelect = {
  characterId: true,
  character: {
    select: {
      name: true,
    },
  },
  formula: true,
  id: true,
  modifier: true,
  reason: true,
  rollValues: true,
  rolledAt: true,
  total: true,
} satisfies Prisma.DiceRollSelect;

type RoomDiceRollRow = Prisma.DiceRollGetPayload<{ select: typeof roomDiceRollSelect }>;

const defaultTerrain = {
  "8:4": "wall",
  "8:5": "wall",
  "8:6": "wall",
  "9:6": "wall",
  "5:2": "forest",
  "6:2": "forest",
  "6:3": "forest",
  "11:8": "water",
  "12:8": "water",
  "11:9": "water",
  "12:9": "water",
  "3:8": "difficult",
  "4:8": "difficult",
};

const defaultLayers = {
  terrain: true,
  tokens: true,
  fog: true,
  pins: true,
  templates: true,
  vision: false,
  grid: true,
};

const defaultSettings = {
  backgroundUrl: "",
  feetPerSquare: 5,
  diagonalRule: "standard",
};

const defaultTurn = {
  movementUsed: 0,
  actionUsed: false,
  bonusActionUsed: false,
  reactionUsed: false,
};

class RoomLimitError extends Error {
  constructor() {
    super(`You can create up to ${MAX_HOSTED_ROOMS_PER_USER} rooms. Delete a room before creating another.`);
    this.name = "RoomLimitError";
  }
}

class JoinedRoomLimitError extends Error {
  constructor() {
    super(`You can join up to ${MAX_JOINED_ROOMS_PER_USER} rooms. Leave a room before joining another.`);
    this.name = "JoinedRoomLimitError";
  }
}

function ensureHostedRoomLimit(hostedRoomCount: number) {
  if (hostedRoomCount >= MAX_HOSTED_ROOMS_PER_USER) {
    throw new RoomLimitError();
  }
}

function ensureJoinedRoomLimit(joinedRoomCount: number) {
  if (joinedRoomCount >= MAX_JOINED_ROOMS_PER_USER) {
    throw new JoinedRoomLimitError();
  }
}

async function lockRoomMembershipForUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$executeRaw(
    Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(CAST(${userId} AS text)))`,
  );
}

function getAbilityModifier(score: number) {
  return Math.floor((score - 10) / 2);
}

function getCharacterInitiativeModifier(character: RoomCharacter) {
  const dexterityScore = character.abilityScores?.find(
    (abilityScore) => abilityScore.abilityIndex === "dex",
  )?.score;

  return Number.isFinite(dexterityScore) ? getAbilityModifier(dexterityScore ?? 10) : 0;
}

function generateRoomCode() {
  let code = "";

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const randomIndex = randomInt(ROOM_CODE_CHARACTERS.length);
    code += ROOM_CODE_CHARACTERS[randomIndex];
  }

  return code;
}

function normalizeRoomCode(roomCode: string) {
  const normalizedValue = roomCode.trim().toUpperCase();
  const explicitRoomCodeMatch =
    normalizedValue.match(/[?&]ROOMCODE=([A-Z0-9]{6})(?:\b|$)/) ??
    normalizedValue.match(/\/ROOM\/([A-Z0-9]{6})(?:\b|$)/);
  const standaloneRoomCodeMatch = normalizedValue.match(/\b([A-Z0-9]{6})\b/);

  return explicitRoomCodeMatch?.[1] ?? standaloneRoomCodeMatch?.[1] ?? normalizedValue;
}

function serializeRoom(room: {
  code: string;
  creatorUserId: string;
  creatorCharacterId: string;
  createdAt: Date;
  updatedAt: Date;
  boardState: Prisma.JsonValue | null;
  players: Array<{
    userId: string;
    characterId: string;
    characterName: string;
    joinedAt: Date;
  }>;
}): Room {
  return {
    code: room.code,
    creatorUserId: room.creatorUserId,
    creatorCharacterId: room.creatorCharacterId,
    createdAt: room.createdAt.getTime(),
    updatedAt: room.updatedAt.getTime(),
    boardState: room.boardState,
    players: room.players.map((player) => ({
      userId: player.userId,
      characterId: player.characterId,
      characterName: player.characterName,
      joinedAt: player.joinedAt.getTime(),
    })),
  };
}

function isBoardStateRecord(value: unknown): value is BoardStateRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeBoardStateRecord(boardState: unknown): BoardStateRecord {
  const state = isBoardStateRecord(boardState) ? boardState : {};
  const tokens = Array.isArray(state.tokens) ? state.tokens : [];
  const terrain = typeof state.terrain === "object" && state.terrain ? state.terrain : defaultTerrain;
  const fog = typeof state.fog === "object" && state.fog ? state.fog : {};
  const pins = typeof state.pins === "object" && state.pins ? state.pins : {};
  const templates = Array.isArray(state.templates) ? state.templates : [];
  const layers = { ...defaultLayers, ...(state.layers ?? {}) };
  const settings = { ...defaultSettings, ...(state.settings ?? {}) };
  const initiativeOrder = Array.isArray(state.initiativeOrder) ? state.initiativeOrder : [];

  return {
    tokens,
    terrain,
    fog,
    pins,
    templates,
    layers,
    settings,
    selectedTokenId: typeof state.selectedTokenId === "string" ? state.selectedTokenId : "",
    initiativeOrder,
    activeInitiativeIndex: Number.isFinite(state.activeInitiativeIndex) ? state.activeInitiativeIndex : 0,
  };
}

function buildPlayerToken(character: RoomCharacter, playerIndex: number): BoardToken {
  return {
    id: `character-${character.id}`,
    characterId: character.id,
    name: character.name,
    team: "players",
    color: playerTokenColors[playerIndex % playerTokenColors.length],
    x: 2 + (playerIndex % 4) * 2,
    y: 4 + Math.floor(playerIndex / 4) * 2,
    size: 1,
    speed: character.speed,
    hp: character.currentHp,
    maxHp: character.maxHp,
    initiative: 10,
    initiativeModifier: getCharacterInitiativeModifier(character),
    ac: character.armorClass,
    conditions: [],
    notes: "",
    visionFeet: 60,
    turn: defaultTurn,
  };
}

function createInitialBoardState(character: RoomCharacter) {
  const token = buildPlayerToken(character, 0);

  return {
    tokens: [token],
    terrain: defaultTerrain,
    fog: {},
    pins: {},
    templates: [],
    layers: defaultLayers,
    settings: defaultSettings,
    selectedTokenId: token.id,
    initiativeOrder: [token.id],
    activeInitiativeIndex: 0,
  };
}

function ensureCharacterToken(boardState: unknown, character: RoomCharacter, playerIndex: number) {
  const state = isBoardStateRecord(boardState)
    ? normalizeBoardStateRecord(boardState)
    : createInitialBoardState(character);
  const tokens = Array.isArray(state.tokens) ? state.tokens : [];
  const tokenId = `character-${character.id}`;

  if (tokens.some((token) => token.characterId === character.id || token.id === tokenId)) {
    return state;
  }

  const nextToken = buildPlayerToken(character, playerIndex);
  const nextTokens = [...tokens, nextToken];
  const savedInitiativeOrder = Array.isArray(state.initiativeOrder) ? state.initiativeOrder : [];

  return {
    ...state,
    tokens: nextTokens,
    selectedTokenId: state.selectedTokenId || nextToken.id,
    initiativeOrder: [
      ...savedInitiativeOrder.filter((id) => nextTokens.some((token) => token.id === id)),
      nextToken.id,
    ],
    activeInitiativeIndex: state.activeInitiativeIndex ?? 0,
  };
}

async function findRoomRecord(roomCode: string) {
  return prisma.room.findUnique({
    where: {
      code: normalizeRoomCode(roomCode),
    },
    include: {
      players: {
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });
}

async function createRoom(userId: string, character: RoomCharacter) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await lockRoomMembershipForUser(tx, userId);

    const hostedRoomCount = await tx.room.count({
      where: {
        creatorUserId: userId,
      },
    });

    ensureHostedRoomLimit(hostedRoomCount);

    let code = generateRoomCode();

    while (await tx.room.findUnique({ where: { code } })) {
      code = generateRoomCode();
    }

    const room = await tx.room.create({
      data: {
        code,
        creatorUserId: userId,
        creatorCharacterId: character.id,
        boardState: createInitialBoardState(character) as Prisma.InputJsonValue,
        players: {
          create: {
            userId,
            characterId: character.id,
            characterName: character.name,
          },
        },
      },
      include: {
        players: {
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
    });

    return serializeRoom(room);
  });
}

async function deleteRoomForCreator(roomCode: string, userId: string) {
  const result = await prisma.room.deleteMany({
    where: {
      code: normalizeRoomCode(roomCode),
      creatorUserId: userId,
    },
  });

  return result.count > 0;
}

async function getRoom(roomCode: string) {
  const room = await findRoomRecord(roomCode);

  return room ? serializeRoom(room) : null;
}

function serializeRoomDiceRoll(roll: RoomDiceRollRow): RoomDiceRoll {
  return {
    characterId: roll.characterId,
    characterName: roll.character.name,
    formula: roll.formula,
    id: roll.id,
    modifier: roll.modifier,
    reason: roll.reason,
    rollValues: roll.rollValues,
    rolledAt: roll.rolledAt.getTime(),
    total: roll.total,
  };
}

async function findPublicRoomDiceRollsForUser(
  roomCode: string,
  userId: string,
): Promise<
  | { status: "forbidden" | "not_found" }
  | { status: "ok"; rolls: RoomDiceRoll[] }
> {
  const room = await findRoomRecord(roomCode);

  if (!room) {
    return { status: "not_found" };
  }

  if (!room.players.some((player) => player.userId === userId)) {
    return { status: "forbidden" };
  }

  const rolls = await prisma.diceRoll.findMany({
    where: {
      roomId: room.id,
      visibility: "public",
    },
    orderBy: {
      rolledAt: "desc",
    },
    take: ROOM_DICE_ROLL_HISTORY_LIMIT,
    select: roomDiceRollSelect,
  });

  return {
    rolls: rolls.map(serializeRoomDiceRoll),
    status: "ok",
  };
}

async function findRoomDiceRollAnnouncement(
  roomCode: string,
  userId: string,
  characterId: string,
  diceRollId: string,
): Promise<{ status: "forbidden" | "not_found" } | { status: "ok"; roll: RoomDiceRoll }> {
  const room = await findRoomRecord(roomCode);

  if (!room) {
    return { status: "not_found" };
  }

  const player = room.players.find(
    (roomPlayer) => roomPlayer.userId === userId && roomPlayer.characterId === characterId,
  );

  if (!player) {
    return { status: "forbidden" };
  }

  const roll = await prisma.diceRoll.findFirst({
    where: {
      characterId: player.characterId,
      id: diceRollId,
      roomId: room.id,
      rolledByUserId: userId,
      visibility: "public",
    },
    select: roomDiceRollSelect,
  });

  if (!roll) {
    return { status: "not_found" };
  }

  return {
    roll: serializeRoomDiceRoll(roll),
    status: "ok",
  };
}

async function listRoomsForUser(userId: string): Promise<CreatedRoomSummary[]> {
  const rooms = await prisma.room.findMany({
    where: {
      OR: [
        {
          creatorUserId: userId,
        },
        {
          players: {
            some: {
              userId,
            },
          },
        },
      ],
    },
    include: {
      creator: {
        select: {
          displayName: true,
          email: true,
        },
      },
      creatorCharacter: {
        select: {
          name: true,
        },
      },
      players: {
        orderBy: {
          joinedAt: "asc",
        },
      },
      _count: {
        select: {
          players: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return rooms.map((room) => {
    const currentUserPlayer = room.players.find((player) => player.userId === userId);

    return {
      code: room.code,
      currentUserRole: room.creatorUserId === userId ? "creator" : "player",
      currentUserCharacterId: currentUserPlayer?.characterId ?? null,
      creatorUserId: room.creatorUserId,
      creatorCharacterId: room.creatorCharacterId,
      creatorCharacterName: room.creatorCharacter.name,
      creatorDisplayName: room.creator.displayName ?? room.creator.email,
      createdAt: room.createdAt.getTime(),
      updatedAt: room.updatedAt.getTime(),
      playerCount: room._count.players,
      players: room.players.map((player) => ({
        userId: player.userId,
        characterId: player.characterId,
        characterName: player.characterName,
        joinedAt: player.joinedAt.getTime(),
        role: player.userId === room.creatorUserId ? "creator" : "player",
      })),
    };
  });
}

async function joinRoom(roomCode: string, userId: string, character: RoomCharacter) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await lockRoomMembershipForUser(tx, userId);

    const room = await tx.room.findUnique({
      where: {
        code: normalizeRoomCode(roomCode),
      },
      include: {
        players: {
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
    });

    if (!room) {
      return null;
    }

    const existingPlayer = room.players.find(
      (player) => player.userId === userId && player.characterId === character.id,
    );

    const alreadyJoinedRoom = room.players.some((player) => player.userId === userId);

    if (!alreadyJoinedRoom && room.creatorUserId !== userId) {
      const joinedRoomCount = await tx.roomPlayer.count({
        where: {
          userId,
          room: {
            creatorUserId: {
              not: userId,
            },
          },
        },
      });

      ensureJoinedRoomLimit(joinedRoomCount);
    }

    if (!existingPlayer) {
      await tx.roomPlayer.create({
        data: {
          roomId: room.id,
          userId,
          characterId: character.id,
          characterName: character.name,
        },
      });
    }

    const nextPlayerIndex = existingPlayer ? room.players.indexOf(existingPlayer) : room.players.length;
    const boardState = ensureCharacterToken(room.boardState, character, nextPlayerIndex);

    await tx.room.update({
      where: {
        id: room.id,
      },
      data: {
        boardState: boardState as Prisma.InputJsonValue,
      },
    });

    const nextRoom = await tx.room.findUnique({
      where: {
        id: room.id,
      },
      include: {
        players: {
          orderBy: {
            joinedAt: "asc",
          },
        },
      },
    });

    return nextRoom ? serializeRoom(nextRoom) : null;
  });
}

async function leaveRoom(roomCode: string, userId: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await lockRoomMembershipForUser(tx, userId);

    const room = await tx.room.findUnique({
      where: {
        code: normalizeRoomCode(roomCode),
      },
      include: {
        players: {
          where: {
            userId,
          },
        },
      },
    });

    if (!room) {
      return { status: "not_found" as const };
    }

    if (room.creatorUserId === userId) {
      return { status: "creator" as const };
    }

    if (room.players.length === 0) {
      return { status: "not_joined" as const };
    }

    const characterIds = new Set(room.players.map((player) => player.characterId));
    const state = normalizeBoardStateRecord(room.boardState);
    const currentTokens = state.tokens ?? [];
    const currentInitiativeOrder = state.initiativeOrder ?? [];
    const tokens = currentTokens.filter((token) => !characterIds.has(token.characterId ?? ""));
    const tokenIds = new Set(tokens.map((token) => token.id));
    const initiativeOrder = currentInitiativeOrder.filter((tokenId) => tokenIds.has(tokenId));
    const currentSelectedTokenId = state.selectedTokenId ?? "";
    const selectedTokenId = tokenIds.has(currentSelectedTokenId)
      ? currentSelectedTokenId
      : (initiativeOrder[0] ?? tokens[0]?.id ?? "");
    const currentActiveInitiativeIndex = state.activeInitiativeIndex ?? 0;

    await tx.roomPlayer.deleteMany({
      where: {
        roomId: room.id,
        userId,
      },
    });

    await tx.room.update({
      where: {
        id: room.id,
      },
      data: {
        boardState: {
          ...state,
          tokens,
          initiativeOrder,
          selectedTokenId,
          activeInitiativeIndex: Math.min(
            Math.max(0, currentActiveInitiativeIndex),
            Math.max(0, initiativeOrder.length - 1),
          ),
        } as Prisma.InputJsonValue,
      },
    });

    return { status: "left" as const, roomCode: room.code };
  });
}

async function saveRoomBoardState(roomCode: string, boardState: unknown) {
  const room = await prisma.room.update({
    where: {
      code: normalizeRoomCode(roomCode),
    },
    data: {
      boardState: boardState as Prisma.InputJsonValue,
    },
    include: {
      players: {
        orderBy: {
          joinedAt: "asc",
        },
      },
    },
  });

  return serializeRoom(room);
}

export type { Room, RoomPlayer };
export {
  buildPlayerToken,
  createRoom,
  createInitialBoardState,
  deleteRoomForCreator,
  findPublicRoomDiceRollsForUser,
  findRoomDiceRollAnnouncement,
  getRoom,
  ensureHostedRoomLimit,
  ensureJoinedRoomLimit,
  ensureCharacterToken,
  joinRoom,
  leaveRoom,
  listRoomsForUser,
  JoinedRoomLimitError,
  normalizeBoardStateRecord,
  normalizeRoomCode,
  RoomLimitError,
  saveRoomBoardState,
  serializeRoom,
};
