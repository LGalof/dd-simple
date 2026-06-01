import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import { app } from "./app.js";
import { findUserByToken } from "./services/auth.service.js";
import { findCharacterByIdForUser } from "./services/character.service.js";
import { getRoom, joinRoom, leaveRoom } from "./services/room.service.js";

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

function emitRoomUpdate(roomCode: string) {
  const room = getRoom(roomCode);

  if (!room) {
    return;
  }

  io.to(`room:${roomCode}`).emit("room:update", {
    room: {
      code: room.code,
      createdAt: room.createdAt,
      players: room.players,
    },
  });
}

io.on("connection", (socket) => {
  socket.on("room:join", async (payload, callback) => {
    const roomCode = typeof payload?.roomCode === "string" ? payload.roomCode.trim() : "";
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

      const room = joinRoom(roomCode, user.id, character.id, character.name);

      if (!room) {
        if (typeof callback === "function") {
          callback({ error: "Room not found" });
        }
        return;
      }

      socket.join(`room:${roomCode}`);
      socket.data.roomCode = roomCode;
      socket.data.characterId = character.id;

      emitRoomUpdate(roomCode);

      if (typeof callback === "function") {
        callback({
          room: {
            code: room.code,
            createdAt: room.createdAt,
            players: room.players,
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
    const characterId = socket.data.characterId;
    const user = socket.data.user;

    if (!roomCode || !characterId) {
      return;
    }

    const room = leaveRoom(roomCode, user.id, characterId);
    socket.leave(`room:${roomCode}`);

    if (room) {
      emitRoomUpdate(roomCode);
    }
  });

  socket.on("disconnect", () => {
    const roomCode = socket.data.roomCode;
    const characterId = socket.data.characterId;
    const user = socket.data.user;

    if (!roomCode || !characterId) {
      return;
    }

    const room = leaveRoom(roomCode, user.id, characterId);

    if (room) {
      emitRoomUpdate(roomCode);
    }
  });
});

server.listen(port, () => {
  console.log(`dd-simple-api listening on port ${port}`);
});
