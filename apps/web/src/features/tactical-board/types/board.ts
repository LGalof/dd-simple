export type BoardTerrain = "normal" | "difficult" | "wall" | "water" | "forest";
export type BoardMode = BoardTerrain | "move" | "target" | "ruler" | "fog" | "pin" | "waypoint";
export type TokenTeam = "players" | "enemies" | "neutral";
export type AoeShape = "single" | "burst" | "line" | "cone";
export type TokenCondition = "Prone" | "Stunned" | "Poisoned" | "Hidden" | "Concentrating";
export type PinType = "note" | "door" | "trap" | "loot" | "lever";
export type LayerKey = "terrain" | "tokens" | "fog" | "pins" | "templates" | "vision" | "grid";

export type TurnState = {
  movementUsed: number;
  actionUsed: boolean;
  bonusActionUsed: boolean;
  reactionUsed: boolean;
};

export type SpellTemplate = {
  name: string;
  damage: string;
  rangeFeet: number;
  aoeFeet: number;
  shape: AoeShape;
};

export type MapPin = {
  label: string;
  type: PinType;
  hidden: boolean;
  open?: boolean;
};

export type PlacedTemplate = {
  id: string;
  name: string;
  damage: string;
  x: number;
  y: number;
  shape: AoeShape;
  sizeFeet: number;
  color: string;
};

export type LayerState = Record<LayerKey, boolean>;

export type BoardSettings = {
  backgroundUrl: string;
  feetPerSquare: number;
  diagonalRule: "standard" | "five-ten";
};

export type BoardToken = {
  id: string;
  name: string;
  team: TokenTeam;
  color: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  hp: number;
  maxHp: number;
  initiative: number;
  ac?: number;
  notes?: string;
  conditions?: TokenCondition[];
  turn?: TurnState;
  visionFeet?: number;
};

export type SavedBoardState = {
  tokens: BoardToken[];
  terrain: Record<string, BoardTerrain>;
  fog?: Record<string, boolean>;
  pins?: Record<string, MapPin | string>;
  templates?: PlacedTemplate[];
  layers?: LayerState;
  settings?: BoardSettings;
  selectedTokenId: string;
  initiativeOrder: string[];
  activeInitiativeIndex: number;
};

export type SavedBoardEntry = {
  id: string;
  name: string;
  updatedAt: string;
  state: SavedBoardState;
};
