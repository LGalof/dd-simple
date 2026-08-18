import type { RoomDiceRoll } from "@dd-simple/shared";

const roomDiceRollDisplayLimit = 10;

function mergeRoomDiceRoll(rolls: RoomDiceRoll[], roll: RoomDiceRoll): RoomDiceRoll[] {
  return [roll, ...rolls.filter((entry) => entry.id !== roll.id)]
    .sort((leftRoll, rightRoll) => rightRoll.rolledAt - leftRoll.rolledAt)
    .slice(0, roomDiceRollDisplayLimit);
}

export { mergeRoomDiceRoll };
