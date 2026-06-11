import { boardColumns, boardRows, cellDistance } from "../data/boardConstants";
import type { AoeShape, BoardSettings, BoardTerrain, BoardToken } from "../types/board";

export function getCellKey(x: number, y: number) {
  return `${x}:${y}`;
}

export function getOccupiedCells(token: BoardToken) {
  const cells: Array<{ x: number; y: number }> = [];

  for (let y = token.y; y < token.y + token.size; y += 1) {
    for (let x = token.x; x < token.x + token.size; x += 1) {
      cells.push({ x, y });
    }
  }

  return cells;
}

export function getTokenCenter(token: BoardToken) {
  return {
    x: token.x + Math.floor(token.size / 2),
    y: token.y + Math.floor(token.size / 2),
  };
}

export function getGridDistance(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
}

export function getSquareDistance(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.max(Math.abs(fromX - toX), Math.abs(fromY - toY));
}

export function getBrushCells(originX: number, originY: number, size: number) {
  const cells: Array<{ x: number; y: number }> = [];

  for (let y = originY; y < Math.min(boardRows, originY + size); y += 1) {
    for (let x = originX; x < Math.min(boardColumns, originX + size); x += 1) {
      cells.push({ x, y });
    }
  }

  return cells;
}

export function getMovementCostFeet(
  cells: Array<{ x: number; y: number }>,
  terrain: Record<string, BoardTerrain>,
  feetPerSquare = cellDistance,
  diagonalRule: BoardSettings["diagonalRule"] = "standard",
) {
  if (cells.length <= 1) {
    return 0;
  }

  let diagonalStepCount = 0;

  return cells.slice(1).reduce((totalCost, cell, index) => {
    const previousCell = cells[index];
    const terrainType = terrain[getCellKey(cell.x, cell.y)] ?? "normal";
    const multiplier = terrainType === "difficult" || terrainType === "forest" || terrainType === "water" ? 2 : 1;
    const isDiagonal = previousCell && previousCell.x !== cell.x && previousCell.y !== cell.y;
    const diagonalCost =
      diagonalRule === "five-ten" && isDiagonal
        ? (diagonalStepCount++ % 2 === 0 ? feetPerSquare : feetPerSquare * 2)
        : feetPerSquare;

    return totalCost + diagonalCost * multiplier;
  }, 0);
}

export function getWaypointCells(origin: { x: number; y: number }, waypoints: Array<{ x: number; y: number }>) {
  const cells: Array<{ x: number; y: number }> = [];
  let current = origin;

  waypoints.forEach((waypoint) => {
    const segment = getLineCells(current, waypoint);
    cells.push(...segment.slice(cells.length === 0 ? 0 : 1));
    current = waypoint;
  });

  return cells;
}

export function getCellsInRadius(origin: { x: number; y: number }, radiusCells: number) {
  const cells: Array<{ x: number; y: number }> = [];

  for (let y = 0; y < boardRows; y += 1) {
    for (let x = 0; x < boardColumns; x += 1) {
      if (getSquareDistance(origin.x, origin.y, x, y) <= radiusCells) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export function getLineOfSightStatus(cells: Array<{ x: number; y: number }>, terrain: Record<string, BoardTerrain>) {
  const middleCells = cells.slice(1, -1);

  if (middleCells.some((cell) => terrain[getCellKey(cell.x, cell.y)] === "wall")) {
    return "Line blocked";
  }

  if (middleCells.some((cell) => terrain[getCellKey(cell.x, cell.y)] === "forest")) {
    return "Half cover";
  }

  return "Clear line";
}

export function getSpellAffectedCells(
  origin: { x: number; y: number },
  target: { x: number; y: number },
  shape: AoeShape,
  sizeCells: number,
) {
  if (shape === "single") {
    return [target];
  }

  if (shape === "line") {
    return getLineCells(origin, target);
  }

  const cells: Array<{ x: number; y: number }> = [];
  const range = shape === "cone" ? Math.max(1, sizeCells) : Math.max(0, sizeCells);
  const directionX = target.x - origin.x;
  const directionY = target.y - origin.y;
  const directionLength = Math.hypot(directionX, directionY) || 1;

  for (let y = 0; y < boardRows; y += 1) {
    for (let x = 0; x < boardColumns; x += 1) {
      if (shape === "burst") {
        if (getSquareDistance(target.x, target.y, x, y) <= range) {
          cells.push({ x, y });
        }

        continue;
      }

      const cellX = x - origin.x;
      const cellY = y - origin.y;
      const cellDistanceFromOrigin = Math.hypot(cellX, cellY);

      if (cellDistanceFromOrigin === 0 || cellDistanceFromOrigin > range) {
        continue;
      }

      const dot = (directionX * cellX + directionY * cellY) / (directionLength * cellDistanceFromOrigin);

      if (dot >= Math.cos(Math.PI / 4)) {
        cells.push({ x, y });
      }
    }
  }

  return cells;
}

export function getLineCells(origin: { x: number; y: number }, target: { x: number; y: number }) {
  const cells: Array<{ x: number; y: number }> = [];
  const deltaX = Math.abs(target.x - origin.x);
  const deltaY = Math.abs(target.y - origin.y);
  const stepX = origin.x < target.x ? 1 : -1;
  const stepY = origin.y < target.y ? 1 : -1;
  let error = deltaX - deltaY;
  let x = origin.x;
  let y = origin.y;

  while (true) {
    if (x >= 0 && x < boardColumns && y >= 0 && y < boardRows) {
      cells.push({ x, y });
    }

    if (x === target.x && y === target.y) {
      break;
    }

    const doubledError = error * 2;

    if (doubledError > -deltaY) {
      error -= deltaY;
      x += stepX;
    }

    if (doubledError < deltaX) {
      error += deltaX;
      y += stepY;
    }
  }

  return cells;
}

export function canPlaceToken(
  candidate: BoardToken,
  tokens: BoardToken[],
  terrain: Record<string, BoardTerrain>,
) {
  if (
    candidate.x < 0 ||
    candidate.y < 0 ||
    candidate.x + candidate.size > boardColumns ||
    candidate.y + candidate.size > boardRows
  ) {
    return false;
  }

  const candidateCells = getOccupiedCells(candidate);
  const hitsBlockedTerrain = candidateCells.some(
    (cell) => terrain[getCellKey(cell.x, cell.y)] === "wall",
  );

  if (hitsBlockedTerrain) {
    return false;
  }

  return tokens
    .filter((token) => token.id !== candidate.id)
    .every((token) => !tokensOverlap(candidate, token));
}

export function tokensOverlap(leftToken: BoardToken, rightToken: BoardToken) {
  return (
    leftToken.x < rightToken.x + rightToken.size &&
    leftToken.x + leftToken.size > rightToken.x &&
    leftToken.y < rightToken.y + rightToken.size &&
    leftToken.y + leftToken.size > rightToken.y
  );
}

export function findTokenSpace(
  token: BoardToken,
  tokens: BoardToken[],
  terrain: Record<string, BoardTerrain>,
) {
  for (let y = 0; y <= boardRows - token.size; y += 1) {
    for (let x = 0; x <= boardColumns - token.size; x += 1) {
      const candidate = { ...token, x, y };

      if (canPlaceToken(candidate, tokens, terrain)) {
        return { x, y };
      }
    }
  }

  return null;
}
