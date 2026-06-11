import type {
  AoeShape,
  BoardSettings,
  BoardTerrain,
  BoardToken,
  LayerKey,
  LayerState,
  PinType,
  SpellTemplate,
  TokenCondition,
  TurnState,
} from "../types/board";

export const boardColumns = 18;
export const boardRows = 12;
export const cellDistance = 5;
export const boardStorageKey = "dd-simple.tactical-board-state";
export const savedBoardsStorageKey = "dd-simple.saved-tactical-boards";

export const conditionOptions: TokenCondition[] = [
  "Prone",
  "Stunned",
  "Poisoned",
  "Hidden",
  "Concentrating",
];

export const defaultLayers: LayerState = {
  terrain: true,
  tokens: true,
  fog: true,
  pins: true,
  templates: true,
  vision: true,
  grid: true,
};

export const defaultSettings: BoardSettings = {
  backgroundUrl: "",
  feetPerSquare: cellDistance,
  diagonalRule: "standard",
};

export const defaultTurnState: TurnState = {
  movementUsed: 0,
  actionUsed: false,
  bonusActionUsed: false,
  reactionUsed: false,
};

export const aoeShapeLabels: Record<AoeShape, string> = {
  single: "Single",
  burst: "Burst",
  line: "Line",
  cone: "Cone",
};

export const spellTemplates: SpellTemplate[] = [
  { name: "Fireball", damage: "8d6 fire", rangeFeet: 150, aoeFeet: 20, shape: "burst" },
  { name: "Burning Hands", damage: "3d6 fire", rangeFeet: 15, aoeFeet: 15, shape: "cone" },
  { name: "Lightning Bolt", damage: "8d6 lightning", rangeFeet: 100, aoeFeet: 100, shape: "line" },
  { name: "Cure Wounds", damage: "1d8 + mod healing", rangeFeet: 5, aoeFeet: 0, shape: "single" },
];

export const tokenPresets: Array<
  Pick<
    BoardToken,
    "name" | "team" | "color" | "size" | "speed" | "hp" | "maxHp" | "initiative" | "ac" | "visionFeet"
  >
> = [
  { name: "Commoner", team: "neutral", color: "#facc15", size: 1, speed: 30, hp: 4, maxHp: 4, initiative: 10, ac: 10, visionFeet: 30 },
  { name: "Goblin", team: "enemies", color: "#f97316", size: 1, speed: 30, hp: 7, maxHp: 7, initiative: 14, ac: 15, visionFeet: 60 },
  { name: "Wolf", team: "enemies", color: "#94a3b8", size: 1, speed: 40, hp: 11, maxHp: 11, initiative: 12, ac: 13, visionFeet: 60 },
  { name: "Skeleton", team: "enemies", color: "#e5e7eb", size: 1, speed: 30, hp: 13, maxHp: 13, initiative: 12, ac: 13, visionFeet: 60 },
  { name: "Ogre", team: "enemies", color: "#ef4444", size: 2, speed: 40, hp: 59, maxHp: 59, initiative: 8, ac: 11, visionFeet: 60 },
  { name: "Boss", team: "enemies", color: "#dc2626", size: 2, speed: 30, hp: 120, maxHp: 120, initiative: 18, ac: 17, visionFeet: 120 },
  { name: "Player", team: "players", color: "#60a5fa", size: 1, speed: 30, hp: 24, maxHp: 24, initiative: 14, ac: 16, visionFeet: 60 },
];

export const terrainLabels: Record<BoardTerrain, string> = {
  normal: "Normal",
  difficult: "Difficult",
  wall: "Wall",
  water: "Water",
  forest: "Forest",
};

export const pinTypeLabels: Record<PinType, string> = {
  note: "Note",
  door: "Door",
  trap: "Trap",
  loot: "Loot",
  lever: "Lever",
};

export const layerLabels: Record<LayerKey, string> = {
  terrain: "Terrain",
  tokens: "Tokens",
  fog: "Fog",
  pins: "Pins",
  templates: "Templates",
  vision: "Vision",
  grid: "Grid",
};

export const initialTokens: BoardToken[] = [
  {
    id: "kael",
    name: "Kael",
    team: "players",
    color: "#60a5fa",
    x: 2,
    y: 5,
    size: 1,
    speed: 30,
    hp: 24,
    maxHp: 24,
    initiative: 16,
  },
  {
    id: "mira",
    name: "Mira",
    team: "players",
    color: "#a78bfa",
    x: 4,
    y: 6,
    size: 1,
    speed: 30,
    hp: 18,
    maxHp: 18,
    initiative: 13,
  },
  {
    id: "goblin-1",
    name: "Goblin",
    team: "enemies",
    color: "#f97316",
    x: 12,
    y: 4,
    size: 1,
    speed: 30,
    hp: 7,
    maxHp: 7,
    initiative: 14,
  },
  {
    id: "ogre",
    name: "Ogre",
    team: "enemies",
    color: "#ef4444",
    x: 14,
    y: 7,
    size: 2,
    speed: 40,
    hp: 59,
    maxHp: 59,
    initiative: 8,
  },
];

export const initialTerrain: Record<string, BoardTerrain> = {
  "8:4": "wall",
  "8:5": "wall",
  "8:6": "wall",
  "9:6": "wall",
  "5:2": "forest",
  "6:2": "forest",
  "6:3": "forest",
  "11:8": "water",
  "12:8": "water",
  "11:9": "water",
  "12:9": "water",
  "3:8": "difficult",
  "4:8": "difficult",
};
