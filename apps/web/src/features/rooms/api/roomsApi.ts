import { api } from "../../../lib/api";
import type { SavedBoardState } from "../../tactical-board/types/board";

type RoomDetails = {
  code: string;
  createdAt: number;
  updatedAt: number;
  boardState: SavedBoardState | null;
  players: Array<{
    userId: string;
    characterId: string;
    characterName: string;
    joinedAt: number;
  }>;
};

type CreateRoomResponse = {
  room: {
    code: string;
    createdAt: number;
    updatedAt: number;
    boardState: SavedBoardState | null;
    players: RoomDetails["players"];
  };
};

type RoomResponse = CreateRoomResponse;

async function createRoom(characterId: string, token: string) {
  return api.post<CreateRoomResponse>("/rooms", { characterId }, { token });
}

async function joinRoom(roomCode: string, characterId: string, token: string) {
  return api.post<RoomResponse>(`/rooms/${encodeURIComponent(roomCode)}/join`, { characterId }, { token });
}

async function getRoom(roomCode: string, token: string) {
  return api.get<RoomResponse>(`/rooms/${encodeURIComponent(roomCode)}`, { token });
}

export { createRoom, getRoom, joinRoom };
export type { RoomDetails };
