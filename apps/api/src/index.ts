import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { findUserByToken } from "./services/auth.service.js";
import { findCharacterByIdForUser } from "./services/character.service.js";
import { getRoom, joinRoom, saveRoomBoardState } from "./services/room.service.js";
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

async function emitRoomUpdate(roomCode: string) {
  const room = await getRoom(roomCode);

  if (!room) {
    return;
  }

  io.to(`room:${roomCode}`).emit("room:update", {
    room: {
      code: room.code,
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

      socket.join(`room:${roomCode}`);
      socket.data.roomCode = roomCode;
      socket.data.characterId = character.id;

      await emitRoomUpdate(roomCode);

      if (typeof callback === "function") {
        callback({
          room: {
            code: room.code,
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

    if (!roomCode || !boardState) {
      if (typeof callback === "function") {
        callback({ error: "Join a room before syncing board state" });
      }
      return;
    }

    try {
      const room = await saveRoomBoardState(roomCode, boardState);

      socket.to(`room:${roomCode}`).emit("board:update", {
        boardState: room.boardState,
        updatedAt: room.updatedAt,
      });

      if (typeof callback === "function") {
        callback({ ok: true, updatedAt: room.updatedAt });
      }
    } catch (error) {
      if (typeof callback === "function") {
        callback({ error: "Failed to sync board state" });
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
