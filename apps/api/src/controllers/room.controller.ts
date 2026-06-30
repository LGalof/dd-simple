import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../middleware/auth.js";
import { createRoom, getRoom, joinRoom } from "../services/room.service.js";
import { findCharacterByIdForUser } from "../services/character.service.js";
import { eventBus } from "../lib/events.js";

async function createRoomController(req: Request, res: Response) {
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
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      players: room.players,
      boardState: room.boardState,
    },
  });
}

async function joinRoomController(req: Request, res: Response) {
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

  eventBus.emit("room:update", roomCode);

  res.json({
    room: {
      code: nextRoom.code,
      createdAt: nextRoom.createdAt,
      updatedAt: nextRoom.updatedAt,
      players: nextRoom.players,
      boardState: nextRoom.boardState,
    },
  });
}

async function getRoomController(req: Request, res: Response) {
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
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
      players: room.players,
      boardState: room.boardState,
    },
  });
}

export { createRoomController, getRoomController, joinRoomController };
