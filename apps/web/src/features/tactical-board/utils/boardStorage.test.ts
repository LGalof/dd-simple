import { beforeEach, describe, expect, it } from "vitest";
import { boardStorageKey, savedBoardsStorageKey } from "../data/boardConstants";
import type { SavedBoardState } from "../types/board";
import {
  decodeBoardState,
  encodeBoardState,
  formatSavedBoardDate,
  loadSavedBoardEntries,
  loadSavedBoardState,
  normalizeBoardState,
  normalizePins,
  parseBoardState,
} from "./boardStorage";

function state(overrides: Partial<SavedBoardState> = {}): SavedBoardState {
  return {
    tokens: [
      {
        id: "hero",
        name: "Hero",
        team: "players",
        color: "#60a5fa",
        x: 1,
        y: 2,
        size: 1,
        speed: 30,
        hp: 12,
        maxHp: 12,
        initiative: 14,
      },
    ],
    terrain: {},
    selectedTokenId: "hero",
    initiativeOrder: ["hero"],
    activeInitiativeIndex: 0,
    ...overrides,
  };
}

describe("boardStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("normalizes legacy pins and invalid pin metadata", () => {
    expect(
      normalizePins({
        "1:1": "Secret door",
        "2:2": { label: "", type: "door", hidden: true, open: true },
        "3:3": { label: "", type: "missing", hidden: 0 },
      }),
    ).toEqual({
      "1:1": { label: "Secret door", type: "note", hidden: false },
      "2:2": { label: "Door", type: "door", hidden: true, open: true },
      "3:3": { label: "Note", type: "note", hidden: false, open: false },
    });
    expect(normalizePins(null)).toEqual({});
  });

  it("normalizes token health, status, turn state, selection, and initiative order", () => {
    const normalized = normalizeBoardState(
      state({
        tokens: [
          {
            id: "downed",
            name: "Downed",
            team: "players",
            color: "#60a5fa",
            x: 1,
            y: 2,
            size: 99,
            speed: 0,
            hp: -5,
            maxHp: 0,
            initiative: Number.NaN,
            initiativeModifier: Number.NaN,
            ac: 0,
            lifeStatus: "alive",
            deathSaves: { successes: 8, failures: -2 },
            lastDeathSaveRoll: 25,
            conditions: ["Prone", "Bogus"],
            turn: { movementUsed: -10, actionUsed: true, bonusActionUsed: true, reactionUsed: false },
            visionFeet: -30,
          },
          {
            id: "healthy",
            name: "Healthy",
            team: "players",
            color: "#22c55e",
            x: 3,
            y: 4,
            size: 1,
            speed: 30,
            hp: 99,
            maxHp: 20,
            initiative: 18,
          },
        ],
        activeInitiativeIndex: 99,
        initiativeOrder: ["missing", "healthy"],
        selectedTokenId: "missing",
        fog: null,
        layers: { grid: false },
        settings: { feetPerSquare: 10, diagonalRule: "five-ten", backgroundUrl: "map.png" },
      } as unknown as SavedBoardState),
    );

    expect(normalized).not.toBeNull();
    expect(normalized?.selectedTokenId).toBe("downed");
    expect(normalized?.initiativeOrder).toEqual(["healthy", "downed"]);
    expect(normalized?.activeInitiativeIndex).toBe(1);
    expect(normalized?.fog).toEqual({});
    expect(normalized?.layers?.grid).toBe(false);
    expect(normalized?.settings?.feetPerSquare).toBe(10);

    expect(normalized?.tokens[0]).toMatchObject({
      hp: 0,
      maxHp: 1,
      initiative: 10,
      initiativeModifier: 0,
      ac: 10,
      lifeStatus: "dying",
      deathSaves: { successes: 3, failures: 0 },
      size: 3,
      speed: 30,
      conditions: ["Prone"],
      visionFeet: 0,
    });
    expect(normalized?.tokens[0]?.lastDeathSaveRoll).toBeUndefined();
    expect(normalized?.tokens[0]?.turn?.movementUsed).toBe(0);
    expect(normalized?.tokens[1]?.hp).toBe(20);
    expect(normalizeBoardState({ tokens: null, terrain: null } as unknown as SavedBoardState)).toBeNull();
  });

  it("parses, loads, encodes, and decodes board state safely", () => {
    const savedState = state({
      pins: { "1:1": "Note" },
      templates: [{ id: "fireball", name: "Fireball", damage: "8d6", x: 3, y: 3, shape: "burst", sizeFeet: 20, color: "#f97316" }],
    });

    expect(parseBoardState("not json")).toBeNull();
    expect(parseBoardState(JSON.stringify(savedState))?.pins).toEqual({
      "1:1": { label: "Note", type: "note", hidden: false },
    });

    localStorage.setItem(boardStorageKey, JSON.stringify(savedState));
    expect(loadSavedBoardState()?.selectedTokenId).toBe("hero");

    localStorage.setItem(boardStorageKey, "{broken");
    expect(loadSavedBoardState()).toBeNull();

    const encoded = encodeBoardState(savedState);

    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(decodeBoardState(encoded)?.tokens[0]?.id).toBe("hero");
    expect(decodeBoardState("%%%")).toBeNull();
  });

  it("loads valid saved boards sorted by update date", () => {
    localStorage.setItem(
      savedBoardsStorageKey,
      JSON.stringify([
        { id: "old", name: "Old", updatedAt: "2026-01-01T00:00:00.000Z", state: state() },
        { id: "invalid", name: "", updatedAt: "2026-03-01T00:00:00.000Z", state: state() },
        { id: "new", name: "New", updatedAt: "2026-02-01T00:00:00.000Z", state: state() },
      ]),
    );

    expect(loadSavedBoardEntries().map((entry) => entry.id)).toEqual(["new", "old"]);

    localStorage.setItem(savedBoardsStorageKey, "{}");
    expect(loadSavedBoardEntries()).toEqual([]);

    localStorage.setItem(savedBoardsStorageKey, "{broken");
    expect(loadSavedBoardEntries()).toEqual([]);
  });

  it("formats saved board dates and handles invalid values", () => {
    expect(formatSavedBoardDate("not a date")).toBe("unknown");
    expect(formatSavedBoardDate("2026-01-01T12:30:00.000Z")).not.toBe("unknown");
  });
});
