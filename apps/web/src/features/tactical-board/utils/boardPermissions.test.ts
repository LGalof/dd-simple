import { describe, expect, it } from "vitest";
import type { BoardToken } from "../types/board";
import { getDmOnlyBoardActionIssue, getTokenControlIssue } from "./boardPermissions";

const token: BoardToken = {
  id: "token-1",
  characterId: "character-1",
  name: "Kael",
  team: "players",
  color: "#38bdf8",
  x: 0,
  y: 0,
  size: 1,
  speed: 30,
  hp: 10,
  maxHp: 10,
  initiative: 12,
};

describe("board permission helpers", () => {
  it("allows the DM to control any token in a room", () => {
    expect(
      getTokenControlIssue(token, {
        activeTokenId: "other-token",
        isRoomDm: true,
        roomCharacterId: "different-character",
        roomMode: true,
        ruleOverride: false,
      }),
    ).toBe("");
  });

  it("allows the active player to control their active token", () => {
    expect(
      getTokenControlIssue(token, {
        activeTokenId: token.id,
        isRoomDm: false,
        roomCharacterId: token.characterId ?? null,
        roomMode: true,
        ruleOverride: false,
      }),
    ).toBe("");
  });

  it("blocks players from controlling tokens outside their active turn", () => {
    expect(
      getTokenControlIssue(token, {
        activeTokenId: "other-token",
        isRoomDm: false,
        roomCharacterId: token.characterId ?? null,
        roomMode: true,
        ruleOverride: false,
      }),
    ).toBe("Kael is not the active turn.");
  });

  it("blocks non-DM synced board edits in rooms", () => {
    expect(
      getDmOnlyBoardActionIssue(
        {
          isRoomDm: false,
          roomMode: true,
        },
        "add tokens",
      ),
    ).toBe("Only the DM can add tokens.");
  });
});
