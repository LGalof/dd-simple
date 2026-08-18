import type { RoomDiceRoll } from "@dd-simple/shared";
import type { Server, Socket } from "socket.io";
import { findRoomDiceRollAnnouncement } from "../services/room.service.js";

type DiceRollCallback = (response: {
  error?: string;
  ok?: true;
  roll?: RoomDiceRoll;
}) => void;

async function handleRoomDiceRollEvent(
  socket: Socket,
  io: Server,
  payload: unknown,
  callback?: DiceRollCallback,
) {
  const roomCode = socket.data.roomCode;
  const characterId = socket.data.characterId;
  const userId = socket.data.user?.id;
  const diceRollId =
    payload && typeof payload === "object" && "diceRollId" in payload
      ? (payload as { diceRollId?: unknown }).diceRollId
      : undefined;

  if (!roomCode || !characterId || !userId) {
    callback?.({ error: "Join a room before announcing dice rolls" });
    return;
  }

  if (typeof diceRollId !== "string" || diceRollId.trim() === "") {
    callback?.({ error: "A saved diceRollId is required" });
    return;
  }

  const result = await findRoomDiceRollAnnouncement(roomCode, userId, characterId, diceRollId.trim());

  if (result.status !== "ok") {
    callback?.({ error: "Dice roll not found for this room" });
    return;
  }

  io.to(`room:${roomCode}`).emit("dice:rolled", {
    roll: result.roll,
  });
  callback?.({ ok: true, roll: result.roll });
}

export { handleRoomDiceRollEvent };
export type { DiceRollCallback };
