import { randomUUID } from "crypto";

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
  players: RoomPlayer[];
};

const rooms = new Map<string, Room>();
const ROOM_CODE_LENGTH = 6;
const ROOM_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

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

function createRoom(userId: string, characterId: string, characterName: string) {
  let code = generateRoomCode();

  while (rooms.has(code)) {
    code = generateRoomCode();
  }

  const room: Room = {
    code,
    creatorUserId: userId,
    creatorCharacterId: characterId,
    createdAt: Date.now(),
    players: [
      {
        userId,
        characterId,
        characterName,
        joinedAt: Date.now(),
      },
    ],
  };

  rooms.set(code, room);

  return room;
}

function getRoom(roomCode: string) {
  return rooms.get(normalizeRoomCode(roomCode)) ?? null;
}

function joinRoom(roomCode: string, userId: string, characterId: string, characterName: string) {
  const room = getRoom(roomCode);

  if (!room) {
    return null;
  }

  const existingPlayer = room.players.find(
    (player) => player.userId === userId && player.characterId === characterId,
  );

  if (existingPlayer) {
    return room;
  }

  room.players.push({
    userId,
    characterId,
    characterName,
    joinedAt: Date.now(),
  });

  return room;
}

function leaveRoom(roomCode: string, userId: string, characterId: string) {
  const room = getRoom(roomCode);

  if (!room) {
    return null;
  }

  room.players = room.players.filter(
    (player) => !(player.userId === userId && player.characterId === characterId),
  );

  if (room.players.length === 0) {
    rooms.delete(room.code);
    return null;
  }

  return room;
}

export type { Room, RoomPlayer };
export { createRoom, getRoom, joinRoom, leaveRoom };
