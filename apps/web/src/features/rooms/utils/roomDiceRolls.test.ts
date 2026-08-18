import { describe, expect, it } from "vitest";
import type { RoomDiceRoll } from "@dd-simple/shared";
import { mergeRoomDiceRoll } from "./roomDiceRolls";

function roll(overrides: Partial<RoomDiceRoll> & Pick<RoomDiceRoll, "id" | "rolledAt">): RoomDiceRoll {
  return {
    characterId: "character-thorin",
    characterName: "Thorin",
    formula: "1d20",
    id: overrides.id,
    modifier: 0,
    reason: "Attack",
    rolledAt: overrides.rolledAt,
    total: 10,
    ...overrides,
  };
}

describe("mergeRoomDiceRoll", () => {
  it("adds incoming rolls to one shared newest-first feed", () => {
    const nextRolls = mergeRoomDiceRoll(
      [roll({ id: "roll-1", rolledAt: 1, characterName: "Thorin" })],
      roll({ id: "roll-2", rolledAt: 2, characterName: "Gandalf" }),
    );

    expect(nextRolls.map((entry) => `${entry.characterName}:${entry.id}`)).toEqual([
      "Gandalf:roll-2",
      "Thorin:roll-1",
    ]);
  });

  it("deduplicates repeated realtime events by saved roll id", () => {
    const firstRolls = mergeRoomDiceRoll([], roll({ id: "roll-1", rolledAt: 1, total: 12 }));
    const nextRolls = mergeRoomDiceRoll(firstRolls, roll({ id: "roll-1", rolledAt: 1, total: 12 }));

    expect(nextRolls).toHaveLength(1);
  });

  it("keeps only the latest ten rolls total", () => {
    const currentRolls = Array.from({ length: 10 }, (_, index) =>
      roll({ id: `roll-${index + 1}`, rolledAt: index + 1 }),
    );

    expect(mergeRoomDiceRoll(currentRolls, roll({ id: "roll-11", rolledAt: 11 })).map((entry) => entry.id)).toEqual([
      "roll-11",
      "roll-10",
      "roll-9",
      "roll-8",
      "roll-7",
      "roll-6",
      "roll-5",
      "roll-4",
      "roll-3",
      "roll-2",
    ]);
  });
});
