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
  creatorUserId: string;
  creatorCharacterId: string;
  createdAt: number;
  updatedAt: number;
  boardState: SavedBoardState | null;
  players: RoomPlayer[];
};

type RoomSocketResponse = {
  room?: RoomDetails;
  boardState?: SavedBoardState | null;
  updatedAt?: number;
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
  const [boardStateRevision, setBoardStateRevision] = useState(0);
  const socketRef = useRef<Socket | null>(null);
  const latestRoomUpdatedAtRef = useRef<number | null>(null);

  const receiveBoardState = useCallback((nextBoardState: SavedBoardState | null) => {
    setBoardState(nextBoardState);
    setBoardStateRevision((currentRevision) => currentRevision + 1);
  }, []);

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
      receiveBoardState(payload.room.boardState);
      latestRoomUpdatedAtRef.current = payload.room.updatedAt;
    });

    socket.on("board:update", (payload: { boardState: SavedBoardState; updatedAt?: number }) => {
      receiveBoardState(payload.boardState);
      if (typeof payload.updatedAt === "number") {
        latestRoomUpdatedAtRef.current = payload.updatedAt;
      }
    });

    socket.open();

    socket.emit("room:join", { roomCode, characterId }, (response: RoomSocketResponse) => {
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.room) {
        setRoom(response.room);
        receiveBoardState(response.room.boardState);
        latestRoomUpdatedAtRef.current = response.room.updatedAt;
      }
    });

    return () => {
      socketRef.current = null;
      socket.disconnect();
    };
  }, [characterId, roomCode, token]);

  const sendBoardState = useCallback((nextBoardState: SavedBoardState) => {
    socketRef.current?.emit(
      "board:state",
      { boardState: nextBoardState, baseUpdatedAt: latestRoomUpdatedAtRef.current },
      (response?: RoomSocketResponse & { ok?: boolean }) => {
        if (typeof response?.updatedAt === "number") {
          latestRoomUpdatedAtRef.current = response.updatedAt;
        }

        if (response?.boardState) {
          receiveBoardState(response.boardState);
        }

        if (response?.error) {
          setError(response.error);
          return;
        }

        setError(null);
      },
    );
  }, []);

  const advanceTurn = useCallback((direction: 1 | -1) => {
    socketRef.current?.emit(
      "board:advance-turn",
      { direction },
      (response?: RoomSocketResponse & { ok?: boolean }) => {
        if (typeof response?.updatedAt === "number") {
          latestRoomUpdatedAtRef.current = response.updatedAt;
        }

        if (response?.boardState) {
          receiveBoardState(response.boardState);
        }

        if (response?.error) {
          setError(response.error);
          return;
        }

        setError(null);
      },
    );
  }, [receiveBoardState]);

  return {
    advanceTurn,
    boardState,
    boardStateRevision,
    connected,
    error,
    room,
    sendBoardState,
  };
}

export { useRoomSocket };
export type { RoomDetails };
