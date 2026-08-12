import { api } from "../../../lib/api";
import type { SavedBoardState } from "../../tactical-board/types/board";

type RoomDetails = {
  code: string;
  creatorUserId: string;
  creatorCharacterId: string;
  createdAt: number;
  updatedAt: number;
  boardState: SavedBoardState | null;
  players: Array<{
    userId: string;
    characterId: string;
    characterName: string;
    joinedAt: number;
    role?: "creator" | "player";
  }>;
};

type CreateRoomResponse = {
  room: {
    code: string;
    creatorUserId: string;
    creatorCharacterId: string;
    createdAt: number;
    updatedAt: number;
    boardState: SavedBoardState | null;
    players: RoomDetails["players"];
  };
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
  players: RoomDetails["players"];
};

type RoomResponse = CreateRoomResponse;

type CreatedRoomsResponse = {
  rooms: CreatedRoomSummary[];
};

function normalizeRoomCodeInput(value: string) {
  const normalizedValue = value.trim().toUpperCase();
  const explicitRoomCodeMatch =
    normalizedValue.match(/[?&]ROOMCODE=([A-Z0-9]{6})(?:\b|$)/) ??
    normalizedValue.match(/\/ROOM\/([A-Z0-9]{6})(?:\b|$)/);
  const standaloneRoomCodeMatch = normalizedValue.match(/\b([A-Z0-9]{6})\b/);

  return explicitRoomCodeMatch?.[1] ?? standaloneRoomCodeMatch?.[1] ?? normalizedValue;
}

async function createRoom(characterId: string, token: string) {
  return api.post<CreateRoomResponse>("/rooms", { characterId }, { token });
}

async function joinRoom(roomCode: string, characterId: string, token: string) {
  const normalizedRoomCode = normalizeRoomCodeInput(roomCode);

  return api.post<RoomResponse>(`/rooms/${encodeURIComponent(normalizedRoomCode)}/join`, { characterId }, { token });
}

async function getRoom(roomCode: string, token: string) {
  const normalizedRoomCode = normalizeRoomCodeInput(roomCode);

  return api.get<RoomResponse>(`/rooms/${encodeURIComponent(normalizedRoomCode)}`, { token });
}

async function getCreatedRooms(token: string) {
  return api.get<CreatedRoomsResponse>("/rooms", { token });
}

export { createRoom, getCreatedRooms, getRoom, joinRoom, normalizeRoomCodeInput };
export type { CreatedRoomSummary, RoomDetails };
