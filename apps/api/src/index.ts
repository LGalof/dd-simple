import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { findUserByToken } from "./services/auth.service.js";
import { findCharacterByIdForUser } from "./services/character.service.js";
import { getRoom, joinRoom, saveRoomBoardState, type Room } from "./services/room.service.js";
import { eventBus } from "./lib/events.js";

const port = Number(process.env.PORT ?? 4000);
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(async (socket, next) => {
  const token =
    socket.handshake.auth?.token ?? socket.handshake.query?.token;

  if (!token || typeof token !== "string") {
    return next(new Error("Authentication required"));
  }

  try {
    const user = await findUserByToken(token);
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

type BoardTokenRecord = Record<string, unknown> & {
  deathSaves?: unknown;
  id?: unknown;
  characterId?: unknown;
  initiative?: unknown;
  lastDeathSaveRoll?: unknown;
  lifeStatus?: unknown;
  hp?: unknown;
  turn?: unknown;
  x?: unknown;
  y?: unknown;
};

type BoardStateRecord = Record<string, unknown> & {
  activeInitiativeIndex?: unknown;
  initiativeOrder?: unknown;
  selectedTokenId?: unknown;
  tokens?: unknown;
};

const defaultBoardTurn = {
  movementUsed: 0,
  actionUsed: false,
  bonusActionUsed: false,
  reactionUsed: false,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function asBoardState(value: unknown): BoardStateRecord {
  return isRecord(value) ? value : {};
}

function stableJson(value: unknown) {
  return JSON.stringify(value ?? null);
}

function valuesMatch(left: unknown, right: unknown) {
  return stableJson(left) === stableJson(right);
}

function getBoardTokens(state: BoardStateRecord) {
  return Array.isArray(state.tokens)
    ? state.tokens.filter(isRecord).filter((token): token is BoardTokenRecord => typeof token.id === "string")
    : [];
}

function getTokenMap(state: BoardStateRecord) {
  return new Map(getBoardTokens(state).map((token) => [String(token.id), token]));
}

function getInitiativeOrder(state: BoardStateRecord) {
  return Array.isArray(state.initiativeOrder)
    ? state.initiativeOrder.filter((tokenId): tokenId is string => typeof tokenId === "string")
    : [];
}

function getActiveInitiativeIndex(state: BoardStateRecord) {
  return typeof state.activeInitiativeIndex === "number" && Number.isFinite(state.activeInitiativeIndex)
    ? Math.trunc(state.activeInitiativeIndex)
    : 0;
}

function getActiveTokenId(state: BoardStateRecord) {
  const initiativeOrder = getInitiativeOrder(state);

  if (initiativeOrder.length === 0) {
    return "";
  }

  const activeIndex = getActiveInitiativeIndex(state);
  return initiativeOrder[((activeIndex % initiativeOrder.length) + initiativeOrder.length) % initiativeOrder.length];
}

function cloneBoardState(state: BoardStateRecord): BoardStateRecord {
  return JSON.parse(JSON.stringify(state)) as BoardStateRecord;
}

function advanceBoardTurn(state: BoardStateRecord, direction: 1 | -1) {
  const initiativeOrder = getInitiativeOrder(state);

  if (initiativeOrder.length === 0) {
    return null;
  }

  const currentIndex = getActiveInitiativeIndex(state);
  const nextIndex = (currentIndex + direction + initiativeOrder.length) % initiativeOrder.length;
  const nextTokenId = initiativeOrder[nextIndex];
  const nextState = cloneBoardState(state);
  const tokens = getBoardTokens(nextState);

  nextState.activeInitiativeIndex = nextIndex;
  nextState.selectedTokenId = nextTokenId;
  nextState.initiativeOrder = initiativeOrder;
  nextState.tokens = tokens.map((token) =>
    token.id === nextTokenId
      ? {
          ...token,
          turn: defaultBoardTurn,
        }
      : token,
  );

  return nextState;
}

function stateMatchesExcept(
  currentState: BoardStateRecord,
  nextState: BoardStateRecord,
  ignoredKeys: string[],
) {
  const keys = new Set([...Object.keys(currentState), ...Object.keys(nextState)]);

  for (const key of keys) {
    if (ignoredKeys.includes(key)) {
      continue;
    }

    if (!valuesMatch(currentState[key], nextState[key])) {
      return false;
    }
  }

  return true;
}

function tokenMatchesExcept(
  currentToken: BoardTokenRecord,
  nextToken: BoardTokenRecord,
  ignoredKeys: string[],
) {
  const keys = new Set([...Object.keys(currentToken), ...Object.keys(nextToken)]);

  for (const key of keys) {
    if (ignoredKeys.includes(key)) {
      continue;
    }

    if (!valuesMatch(currentToken[key], nextToken[key])) {
      return false;
    }
  }

  return true;
}

function onlyActiveTokenMoved(currentState: BoardStateRecord, nextState: BoardStateRecord, activeTokenId: string) {
  if (!stateMatchesExcept(currentState, nextState, ["tokens", "selectedTokenId"])) {
    return false;
  }

  const currentTokens = getTokenMap(currentState);
  const nextTokens = getTokenMap(nextState);

  if (currentTokens.size !== nextTokens.size) {
    return false;
  }

  for (const [tokenId, currentToken] of currentTokens) {
    const nextToken = nextTokens.get(tokenId);

    if (!nextToken) {
      return false;
    }

    if (tokenId === activeTokenId) {
      if (!tokenMatchesExcept(currentToken, nextToken, ["x", "y", "turn"])) {
        return false;
      }
      continue;
    }

    if (!valuesMatch(currentToken, nextToken)) {
      return false;
    }
  }

  return true;
}

function onlyActiveTokenDeathSaveChanged(
  currentState: BoardStateRecord,
  nextState: BoardStateRecord,
  activeTokenId: string,
) {
  if (!stateMatchesExcept(currentState, nextState, ["tokens"])) {
    return false;
  }

  const currentTokens = getTokenMap(currentState);
  const nextTokens = getTokenMap(nextState);

  if (currentTokens.size !== nextTokens.size) {
    return false;
  }

  for (const [tokenId, currentToken] of currentTokens) {
    const nextToken = nextTokens.get(tokenId);

    if (!nextToken) {
      return false;
    }

    if (tokenId === activeTokenId) {
      if (
        !tokenMatchesExcept(currentToken, nextToken, [
          "deathSaves",
          "hp",
          "lastDeathSaveRoll",
          "lifeStatus",
        ])
      ) {
        return false;
      }
      continue;
    }

    if (!valuesMatch(currentToken, nextToken)) {
      return false;
    }
  }

  return (
    Number.isInteger(nextTokens.get(activeTokenId)?.lastDeathSaveRoll) &&
    Number(nextTokens.get(activeTokenId)?.lastDeathSaveRoll) >= 1 &&
    Number(nextTokens.get(activeTokenId)?.lastDeathSaveRoll) <= 20
  );
}

function onlyActiveTokenHpChanged(
  currentState: BoardStateRecord,
  nextState: BoardStateRecord,
  activeTokenId: string,
) {
  if (!stateMatchesExcept(currentState, nextState, ["tokens"])) {
    return false;
  }

  const currentTokens = getTokenMap(currentState);
  const nextTokens = getTokenMap(nextState);

  if (currentTokens.size !== nextTokens.size) {
    return false;
  }

  for (const [tokenId, currentToken] of currentTokens) {
    const nextToken = nextTokens.get(tokenId);

    if (!nextToken) {
      return false;
    }

    if (tokenId === activeTokenId) {
      if (
        !tokenMatchesExcept(currentToken, nextToken, [
          "deathSaves",
          "hp",
          "lastDeathSaveRoll",
          "lifeStatus",
        ])
      ) {
        return false;
      }
      continue;
    }

    if (!valuesMatch(currentToken, nextToken)) {
      return false;
    }
  }

  const nextToken = nextTokens.get(activeTokenId);

  return (
    typeof nextToken?.hp === "number" &&
    Number.isFinite(nextToken.hp) &&
    nextToken.hp >= 0 &&
    nextToken.lastDeathSaveRoll === undefined
  );
}

function onlyActivePlayerAdvancedTurn(currentState: BoardStateRecord, nextState: BoardStateRecord) {
  const initiativeOrder = getInitiativeOrder(currentState);

  if (initiativeOrder.length === 0 || !valuesMatch(currentState.initiativeOrder, nextState.initiativeOrder)) {
    return false;
  }

  const currentIndex = getActiveInitiativeIndex(currentState);
  const expectedNextIndex = (currentIndex + 1) % initiativeOrder.length;

  if (getActiveInitiativeIndex(nextState) !== expectedNextIndex) {
    return false;
  }

  if (!stateMatchesExcept(currentState, nextState, ["activeInitiativeIndex", "selectedTokenId", "tokens"])) {
    return false;
  }

  const currentTokens = getTokenMap(currentState);
  const nextTokens = getTokenMap(nextState);
  const previousActiveTokenId = getActiveTokenId(currentState);
  const nextActiveTokenId = getActiveTokenId(nextState);

  if (currentTokens.size !== nextTokens.size) {
    return false;
  }

  for (const [tokenId, currentToken] of currentTokens) {
    const nextToken = nextTokens.get(tokenId);

    if (!nextToken) {
      return false;
    }

    if (tokenId === previousActiveTokenId || tokenId === nextActiveTokenId) {
      if (!tokenMatchesExcept(currentToken, nextToken, ["turn"])) {
        return false;
      }
      continue;
    }

    if (!valuesMatch(currentToken, nextToken)) {
      return false;
    }
  }

  return true;
}

function getSortedInitiativeOrder(tokens: BoardTokenRecord[]) {
  return [...tokens]
    .sort((leftToken, rightToken) => {
      const leftInitiative =
        typeof leftToken.initiative === "number" && Number.isFinite(leftToken.initiative)
          ? leftToken.initiative
          : 0;
      const rightInitiative =
        typeof rightToken.initiative === "number" && Number.isFinite(rightToken.initiative)
          ? rightToken.initiative
          : 0;

      if (rightInitiative !== leftInitiative) {
        return rightInitiative - leftInitiative;
      }

      return String(leftToken.id).localeCompare(String(rightToken.id));
    })
    .map((token) => String(token.id));
}

function onlyOwnTokenInitiativeChanged(
  currentState: BoardStateRecord,
  nextState: BoardStateRecord,
  characterId: string | undefined,
) {
  if (!characterId) {
    return false;
  }

  if (!stateMatchesExcept(currentState, nextState, [
    "tokens",
    "selectedTokenId",
    "initiativeOrder",
    "activeInitiativeIndex",
  ])) {
    return false;
  }

  const currentTokens = getTokenMap(currentState);
  const nextTokens = getTokenMap(nextState);

  if (currentTokens.size !== nextTokens.size) {
    return false;
  }

  let changedOwnInitiative = false;

  for (const [tokenId, currentToken] of currentTokens) {
    const nextToken = nextTokens.get(tokenId);

    if (!nextToken) {
      return false;
    }

    if (currentToken.characterId === characterId) {
      if (!tokenMatchesExcept(currentToken, nextToken, ["initiative"])) {
        return false;
      }

      if (!valuesMatch(currentToken.initiative, nextToken.initiative)) {
        changedOwnInitiative = true;
      }
      continue;
    }

    if (!valuesMatch(currentToken, nextToken)) {
      return false;
    }
  }

  if (!changedOwnInitiative) {
    return false;
  }

  const nextInitiativeOrder = getInitiativeOrder(nextState);
  const sortedInitiativeOrder = getSortedInitiativeOrder(getBoardTokens(nextState));

  if (!valuesMatch(nextInitiativeOrder, sortedInitiativeOrder)) {
    return false;
  }

  const activeInitiativeIndex = getActiveInitiativeIndex(nextState);

  return (
    activeInitiativeIndex >= 0 &&
    activeInitiativeIndex < Math.max(1, sortedInitiativeOrder.length)
  );
}

function authorizeBoardStateSync(
  room: Room,
  userId: string,
  characterId: string | undefined,
  nextBoardState: unknown,
) {
  if (room.creatorUserId === userId) {
    return { allowed: true };
  }

  const currentState = asBoardState(room.boardState);
  const nextState = asBoardState(nextBoardState);
  const activeTokenId = getActiveTokenId(currentState);
  const activeToken = getTokenMap(currentState).get(activeTokenId);

  if (onlyOwnTokenInitiativeChanged(currentState, nextState, characterId)) {
    return { allowed: true };
  }

  if (!activeTokenId || typeof activeToken?.characterId !== "string" || activeToken.characterId !== characterId) {
    return { allowed: false, error: "Only the DM or the active player can update the board." };
  }

  if (
    onlyActiveTokenMoved(currentState, nextState, activeTokenId) ||
    onlyActiveTokenDeathSaveChanged(currentState, nextState, activeTokenId) ||
    onlyActiveTokenHpChanged(currentState, nextState, activeTokenId) ||
    onlyActivePlayerAdvancedTurn(currentState, nextState)
  ) {
    return { allowed: true };
  }

  return { allowed: false, error: "Only the DM can edit the board outside your active turn." };
}

async function emitRoomUpdate(roomCode: string) {
  const normalizedRoomCode = roomCode.trim().toUpperCase();
  const room = await getRoom(normalizedRoomCode);

  if (!room) {
    return;
  }

  io.to(`room:${normalizedRoomCode}`).emit("room:update", {
    room: {
      code: room.code,
      creatorUserId: room.creatorUserId,
      creatorCharacterId: room.creatorCharacterId,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      players: room.players,
      boardState: room.boardState,
    },
  });
}

eventBus.on("room:update", async (roomCode: string) => {
  await emitRoomUpdate(roomCode);
});

io.on("connection", (socket) => {
  socket.on("room:join", async (payload, callback) => {
    const roomCode = typeof payload?.roomCode === "string" ? payload.roomCode.trim().toUpperCase() : "";
    const characterId = typeof payload?.characterId === "string" ? payload.characterId.trim() : "";
    const user = socket.data.user;

    if (!roomCode || !characterId) {
      if (typeof callback === "function") {
        callback({ error: "roomCode and characterId are required" });
      }
      return;
    }

    try {
      const character = await findCharacterByIdForUser(user.id, characterId);

      if (!character) {
        if (typeof callback === "function") {
          callback({ error: "Character not found" });
        }
        return;
      }

      const room = await joinRoom(roomCode, user.id, character);

      if (!room) {
        if (typeof callback === "function") {
          callback({ error: "Room not found" });
        }
        return;
      }

      socket.join(`room:${room.code}`);
      socket.data.roomCode = room.code;
      socket.data.characterId = character.id;

      await emitRoomUpdate(room.code);

      if (typeof callback === "function") {
        callback({
          room: {
            code: room.code,
            creatorUserId: room.creatorUserId,
            creatorCharacterId: room.creatorCharacterId,
            createdAt: room.createdAt,
            updatedAt: room.updatedAt,
            players: room.players,
            boardState: room.boardState,
          },
        });
      }
    } catch (error) {
      if (typeof callback === "function") {
        callback({ error: "Failed to join room" });
      }
    }
  });

  socket.on("room:leave", () => {
    const roomCode = socket.data.roomCode;

    if (!roomCode) {
      return;
    }

    socket.leave(`room:${roomCode}`);
    socket.data.roomCode = undefined;
    socket.data.characterId = undefined;
  });

  socket.on("board:state", async (payload, callback) => {
    const roomCode = socket.data.roomCode;
    const boardState = payload?.boardState;
    const baseUpdatedAt = typeof payload?.baseUpdatedAt === "number" ? payload.baseUpdatedAt : null;

    if (!roomCode || !boardState) {
      if (typeof callback === "function") {
        callback({ error: "Join a room before syncing board state" });
      }
      return;
    }

    try {
      const room = await getRoom(roomCode);

      if (!room) {
        if (typeof callback === "function") {
          callback({ error: "Room not found" });
        }
        return;
      }

      if (baseUpdatedAt !== null && room.updatedAt > baseUpdatedAt) {
        socket.emit("board:update", {
          boardState: room.boardState,
          updatedAt: room.updatedAt,
        });

        if (typeof callback === "function") {
          callback({
            error: "Board changed in another client. Synced latest room state.",
            boardState: room.boardState,
            updatedAt: room.updatedAt,
          });
        }
        return;
      }

      const authorization = authorizeBoardStateSync(
        room,
        socket.data.user.id,
        socket.data.characterId,
        boardState,
      );

      if (!authorization.allowed) {
        socket.emit("board:update", {
          boardState: room.boardState,
          updatedAt: room.updatedAt,
        });

        if (typeof callback === "function") {
          callback({ error: authorization.error });
        }
        return;
      }

      const nextRoom = await saveRoomBoardState(room.code, boardState);

      io.to(`room:${room.code}`).emit("board:update", {
        boardState: nextRoom.boardState,
        updatedAt: nextRoom.updatedAt,
      });

      if (typeof callback === "function") {
        callback({ ok: true, boardState: nextRoom.boardState, updatedAt: nextRoom.updatedAt });
      }
    } catch (error) {
      if (typeof callback === "function") {
        callback({ error: "Failed to sync board state" });
      }
    }
  });

  socket.on("board:advance-turn", async (payload, callback) => {
    const roomCode = socket.data.roomCode;
    const direction = payload?.direction === -1 ? -1 : 1;

    if (!roomCode) {
      if (typeof callback === "function") {
        callback({ error: "Join a room before advancing turn" });
      }
      return;
    }

    try {
      const room = await getRoom(roomCode);

      if (!room) {
        if (typeof callback === "function") {
          callback({ error: "Room not found" });
        }
        return;
      }

      const currentState = asBoardState(room.boardState);
      const activeTokenId = getActiveTokenId(currentState);
      const activeToken = getTokenMap(currentState).get(activeTokenId);
      const isDm = room.creatorUserId === socket.data.user.id;
      const isActivePlayer =
        typeof activeToken?.characterId === "string" &&
        activeToken.characterId === socket.data.characterId;

      if (!isDm && (!isActivePlayer || direction === -1)) {
        socket.emit("board:update", {
          boardState: room.boardState,
          updatedAt: room.updatedAt,
        });

        if (typeof callback === "function") {
          callback({
            error: "Only the DM or the active player can advance the turn.",
            boardState: room.boardState,
            updatedAt: room.updatedAt,
          });
        }
        return;
      }

      const nextBoardState = advanceBoardTurn(currentState, direction);

      if (!nextBoardState) {
        if (typeof callback === "function") {
          callback({ error: "Add tokens to initiative before advancing turn." });
        }
        return;
      }

      const nextRoom = await saveRoomBoardState(room.code, nextBoardState);

      io.to(`room:${room.code}`).emit("board:update", {
        boardState: nextRoom.boardState,
        updatedAt: nextRoom.updatedAt,
      });

      if (typeof callback === "function") {
        callback({ ok: true, boardState: nextRoom.boardState, updatedAt: nextRoom.updatedAt });
      }
    } catch (error) {
      if (typeof callback === "function") {
        callback({ error: "Failed to advance turn" });
      }
    }
  });

  socket.on("disconnect", () => {
    socket.data.roomCode = undefined;
    socket.data.characterId = undefined;
  });
});

server.listen(port, () => {
  console.log(`dd-simple-api listening on port ${port}`);
});
