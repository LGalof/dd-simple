import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middleware/auth.js";
import {
  createRoom,
  deleteRoomForCreator,
  findPublicRoomDiceRollsForUser,
  getRoom,
  joinRoom,
  leaveRoom,
  listRoomsForUser,
  JoinedRoomLimitError,
  RoomLimitError,
} from "../services/room.service.js";
import { findCharacterByIdForUser } from "../services/character.service.js";
import { eventBus } from "../lib/events.js";

function logRoomError(action: string, error: unknown) {
  console.error(`[rooms] ${action} failed`, error);
}

async function createRoomController(req: Request, res: Response) {
  try {
    const body = req.body as { characterId?: unknown };
    const user = getAuthenticatedUser(req);

    if (typeof body.characterId !== "string" || body.characterId.trim() === "") {
      res.status(400).json({
        error: "A valid characterId is required to create a room",
      });
      return;
    }

    const character = await findCharacterByIdForUser(user.id, body.characterId);

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    const room = await createRoom(user.id, character);

    res.status(201).json({
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
  } catch (error) {
    if (error instanceof RoomLimitError) {
      res.status(409).json({ error: error.message });
      return;
    }

    logRoomError("create room", error);
    res.status(500).json({
      error: "Failed to create room",
    });
  }
}

async function deleteRoomController(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;

    if (!roomCode || typeof roomCode !== "string") {
      res.status(400).json({ error: "A valid room code is required" });
      return;
    }

    const deleted = await deleteRoomForCreator(roomCode, getAuthenticatedUser(req).id);

    if (!deleted) {
      res.status(404).json({ error: "Room not found or you are not its creator" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    logRoomError("delete room", error);
    res.status(500).json({ error: "Failed to delete room" });
  }
}

async function joinRoomController(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;
    const body = req.body as { characterId?: unknown };
    const user = getAuthenticatedUser(req);

    if (!roomCode || typeof roomCode !== "string") {
      res.status(400).json({
        error: "A valid room code is required",
      });
      return;
    }

    if (typeof body.characterId !== "string" || body.characterId.trim() === "") {
      res.status(400).json({
        error: "A valid characterId is required to join a room",
      });
      return;
    }

    const room = await getRoom(roomCode);

    if (!room) {
      res.status(404).json({
        error: "Room not found",
      });
      return;
    }

    const character = await findCharacterByIdForUser(user.id, body.characterId);

    if (!character) {
      res.status(404).json({
        error: "Character not found",
      });
      return;
    }

    const nextRoom = await joinRoom(roomCode, user.id, character);

    if (!nextRoom) {
      res.status(500).json({
        error: "Failed to join room",
      });
      return;
    }

    eventBus.emit("room:update", nextRoom.code);

    res.json({
      room: {
        code: nextRoom.code,
        creatorUserId: nextRoom.creatorUserId,
        creatorCharacterId: nextRoom.creatorCharacterId,
        createdAt: nextRoom.createdAt,
        updatedAt: nextRoom.updatedAt,
        players: nextRoom.players,
        boardState: nextRoom.boardState,
      },
    });
  } catch (error) {
    if (error instanceof JoinedRoomLimitError) {
      res.status(409).json({ error: error.message });
      return;
    }

    logRoomError("join room", error);
    res.status(500).json({
      error: "Failed to join room",
    });
  }
}

async function leaveRoomController(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;

    if (!roomCode || typeof roomCode !== "string") {
      res.status(400).json({ error: "A valid room code is required" });
      return;
    }

    const result = await leaveRoom(roomCode, getAuthenticatedUser(req).id);

    if (result.status === "not_found") {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    if (result.status === "creator") {
      res.status(400).json({ error: "Room creators must delete their room instead of leaving it" });
      return;
    }

    if (result.status === "not_joined") {
      res.status(404).json({ error: "You have not joined this room" });
      return;
    }

    eventBus.emit("room:update", result.roomCode);
    res.status(204).send();
  } catch (error) {
    logRoomError("leave room", error);
    res.status(500).json({ error: "Failed to leave room" });
  }
}

async function listRoomsForUserController(req: Request, res: Response) {
  try {
    const user = getAuthenticatedUser(req);
    const rooms = await listRoomsForUser(user.id);

    res.json({
      rooms,
    });
  } catch (error) {
    logRoomError("list rooms for user", error);
    res.status(500).json({
      error: "Failed to load rooms",
    });
  }
}

async function getRoomController(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;

    if (!roomCode || typeof roomCode !== "string") {
      res.status(400).json({
        error: "A valid room code is required",
      });
      return;
    }

    const room = await getRoom(roomCode);

    if (!room) {
      res.status(404).json({
        error: "Room not found",
      });
      return;
    }

    res.json({
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
  } catch (error) {
    logRoomError("get room", error);
    res.status(500).json({
      error: "Failed to load room",
    });
  }
}

async function getRoomDiceRollsController(req: Request, res: Response) {
  try {
    const { roomCode } = req.params;

    if (!roomCode || typeof roomCode !== "string") {
      res.status(400).json({
        error: "A valid room code is required",
      });
      return;
    }

    const result = await findPublicRoomDiceRollsForUser(roomCode, getAuthenticatedUser(req).id);

    switch (result.status) {
      case "not_found":
        res.status(404).json({
          error: "Room not found",
        });
        return;
      case "forbidden":
        res.status(403).json({
          error: "You must be a room participant to view its dice rolls",
        });
        return;
      case "ok":
        res.json({
          rolls: result.rolls,
        });
        return;
    }
  } catch (error) {
    logRoomError("load room dice rolls", error);
    res.status(500).json({
      error: "Failed to load room dice rolls",
    });
  }
}

export {
  createRoomController,
  deleteRoomController,
  getRoomDiceRollsController,
  getRoomController,
  joinRoomController,
  leaveRoomController,
  listRoomsForUserController,
};
