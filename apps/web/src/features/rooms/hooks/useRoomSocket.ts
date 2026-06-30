import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../../../lib/api";
import type { SavedBoardState } from "../../tactical-board/types/board";

type RoomPlayer = {
  userId: string;
  characterId: string;
  characterName: string;
  joinedAt: number;
};

type RoomDetails = {
  code: string;
  createdAt: number;
  updatedAt: number;
  boardState: SavedBoardState | null;
  players: RoomPlayer[];
};

type RoomSocketResponse = {
  room?: RoomDetails;
  error?: string;
};

function useRoomSocket(
  roomCode: string | undefined,
  characterId: string | null,
  token: string | null,
) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [boardState, setBoardState] = useState<SavedBoardState | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!roomCode || !characterId || !token) {
      return undefined;
    }

    const socket: Socket = io(API_BASE_URL, {
      auth: {
        token,
      },
      autoConnect: false,
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setError(null);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      setError(err.message);
    });

    socket.on("room:update", (payload: { room: RoomDetails }) => {
      setRoom(payload.room);
      setBoardState(payload.room.boardState);
    });

    socket.on("board:update", (payload: { boardState: SavedBoardState }) => {
      setBoardState(payload.boardState);
    });

    socket.open();

    socket.emit("room:join", { roomCode, characterId }, (response: RoomSocketResponse) => {
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.room) {
        setRoom(response.room);
        setBoardState(response.room.boardState);
      }
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [characterId, roomCode, token]);

  const sendBoardState = useCallback((nextBoardState: SavedBoardState) => {
    socketRef.current?.emit("board:state", { boardState: nextBoardState });
  }, []);

  return {
    boardState,
    connected,
    error,
    room,
    sendBoardState,
  };
}

export { useRoomSocket };
export type { RoomDetails };
