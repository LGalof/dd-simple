import { Prisma } from "@prisma/client";
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

type RoomCharacter = {
  id: string;
  name: string;
  currentHp: number;
  maxHp: number;
  armorClass: number;
  speed: number;
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
const ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const playerTokenColors = ["#60a5fa", "#a78bfa", "#34d399", "#facc15", "#f472b6", "#22d3ee"];

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

function generateRoomCode() {
  let code = "";

  for (let index = 0; index < ROOM_CODE_LENGTH; index += 1) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARACTERS.length);
    code += ROOM_CODE_CHARACTERS[randomIndex];
  }

  return code;
}

function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase();
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
  let code = generateRoomCode();

  while (await prisma.room.findUnique({ where: { code } })) {
    code = generateRoomCode();
  }

  const room = await prisma.room.create({
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
}

async function getRoom(roomCode: string) {
  const room = await findRoomRecord(roomCode);

  return room ? serializeRoom(room) : null;
}

async function joinRoom(roomCode: string, userId: string, character: RoomCharacter) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
export { createRoom, getRoom, joinRoom, saveRoomBoardState };
