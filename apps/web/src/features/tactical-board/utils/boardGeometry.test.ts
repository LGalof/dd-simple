import { describe, expect, it } from "vitest";
import type { BoardTerrain, BoardToken } from "../types/board";
import {
  canPlaceToken,
  findTokenSpace,
  getBrushCells,
  getCellKey,
  getCellsInRadius,
  getGridDistance,
  getLineCells,
  getLineOfSightStatus,
  getMovementCostFeet,
  getOccupiedCells,
  getSpellAffectedCells,
  getSquareDistance,
  getTokenCenter,
  getWaypointCells,
  tokensOverlap,
} from "./boardGeometry";

function token(overrides: Partial<BoardToken> = {}): BoardToken {
  return {
    id: "token",
    name: "Token",
    team: "players",
    color: "#60a5fa",
    x: 1,
    y: 1,
    size: 1,
    speed: 30,
    hp: 10,
    maxHp: 10,
    initiative: 10,
    ...overrides,
  };
}

describe("boardGeometry", () => {
  it("formats keys and derives occupied cells and token centers", () => {
    const largeToken = token({ x: 2, y: 3, size: 2 });

    expect(getCellKey(2, 3)).toBe("2:3");
    expect(getOccupiedCells(largeToken)).toEqual([
      { x: 2, y: 3 },
      { x: 3, y: 3 },
      { x: 2, y: 4 },
      { x: 3, y: 4 },
    ]);
    expect(getTokenCenter(largeToken)).toEqual({ x: 3, y: 4 });
  });

  it("calculates grid, square, brush, and radius distances", () => {
    expect(getGridDistance(1, 1, 4, 5)).toBe(7);
    expect(getSquareDistance(1, 1, 4, 5)).toBe(4);
    expect(getBrushCells(16, 10, 3)).toEqual([
      { x: 16, y: 10 },
      { x: 17, y: 10 },
      { x: 16, y: 11 },
      { x: 17, y: 11 },
    ]);

    const radiusCells = getCellsInRadius({ x: 1, y: 1 }, 1);

    expect(radiusCells).toContainEqual({ x: 0, y: 0 });
    expect(radiusCells).toContainEqual({ x: 2, y: 2 });
    expect(radiusCells).not.toContainEqual({ x: 3, y: 1 });
  });

  it("builds line and waypoint paths", () => {
    expect(getLineCells({ x: 0, y: 0 }, { x: 3, y: 0 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);

    expect(getLineCells({ x: 0, y: 0 }, { x: 3, y: 3 })).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ]);

    expect(getWaypointCells({ x: 0, y: 0 }, [{ x: 2, y: 0 }, { x: 2, y: 2 }])).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ]);
  });

  it("calculates movement cost with terrain and diagonal rules", () => {
    const path = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ];
    const terrain: Record<string, BoardTerrain> = {
      "1:1": "difficult",
      "3:2": "water",
    };

    expect(getMovementCostFeet([{ x: 0, y: 0 }], terrain)).toBe(0);
    expect(getMovementCostFeet(path, terrain, 5, "standard")).toBe(25);
    expect(getMovementCostFeet(path, terrain, 5, "five-ten")).toBe(30);
  });

  it("reports line of sight through blocking and cover terrain", () => {
    const cells = getLineCells({ x: 0, y: 0 }, { x: 4, y: 0 });

    expect(getLineOfSightStatus(cells, {})).toBe("Clear line");
    expect(getLineOfSightStatus(cells, { "2:0": "forest" })).toBe("Half cover");
    expect(getLineOfSightStatus(cells, { "2:0": "wall" })).toBe("Line blocked");
    expect(getLineOfSightStatus(cells, { "4:0": "wall" })).toBe("Clear line");
  });

  it("selects affected cells for single, burst, line, and cone templates", () => {
    expect(getSpellAffectedCells({ x: 0, y: 0 }, { x: 5, y: 5 }, "single", 0)).toEqual([
      { x: 5, y: 5 },
    ]);
    expect(getSpellAffectedCells({ x: 0, y: 0 }, { x: 3, y: 0 }, "line", 0)).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
    expect(getSpellAffectedCells({ x: 0, y: 0 }, { x: 2, y: 2 }, "burst", 1)).toContainEqual({
      x: 3,
      y: 3,
    });

    const coneCells = getSpellAffectedCells({ x: 1, y: 1 }, { x: 4, y: 1 }, "cone", 3);

    expect(coneCells).toContainEqual({ x: 2, y: 1 });
    expect(coneCells).toContainEqual({ x: 3, y: 2 });
    expect(coneCells).not.toContainEqual({ x: 1, y: 1 });
    expect(coneCells).not.toContainEqual({ x: 0, y: 1 });
  });

  it("validates token placement against bounds, walls, and collisions", () => {
    const existing = token({ id: "existing", x: 2, y: 2, size: 2 });

    expect(tokensOverlap(existing, token({ id: "candidate", x: 3, y: 3 }))).toBe(true);
    expect(tokensOverlap(existing, token({ id: "candidate", x: 4, y: 4 }))).toBe(false);
    expect(canPlaceToken(token({ id: "candidate", x: -1, y: 0 }), [], {})).toBe(false);
    expect(canPlaceToken(token({ id: "candidate", x: 17, y: 11, size: 2 }), [], {})).toBe(false);
    expect(canPlaceToken(token({ id: "candidate", x: 4, y: 4 }), [], { "4:4": "wall" })).toBe(false);
    expect(canPlaceToken(token({ id: "candidate", x: 3, y: 3 }), [existing], {})).toBe(false);
    expect(canPlaceToken(token({ id: "existing", x: 3, y: 3 }), [existing], {})).toBe(true);
  });

  it("finds the first valid token space", () => {
    const blockers = [
      token({ id: "first", x: 0, y: 0 }),
      token({ id: "second", x: 1, y: 0 }),
    ];

    expect(findTokenSpace(token({ id: "new", size: 1 }), blockers, { "2:0": "wall" })).toEqual({
      x: 3,
      y: 0,
    });
    expect(findTokenSpace(token({ id: "huge", size: 19 }), [], {})).toBeNull();
  });
});
