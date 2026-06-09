import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { API_BASE_URL } from "../../../lib/api";

type RoomPlayer = {
  userId: string;
  characterId: string;
  characterName: string;
  joinedAt: number;
};

type RoomDetails = {
  code: string;
  createdAt: number;
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
    });

    socket.open();

    socket.emit("room:join", { roomCode, characterId }, (response: RoomSocketResponse) => {
      if (response.error) {
        setError(response.error);
        return;
      }

      if (response.room) {
        setRoom(response.room);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [characterId, roomCode, token]);

  return {
    connected,
    error,
    room,
  };
}

export { useRoomSocket };
