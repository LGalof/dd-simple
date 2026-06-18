import { Shield, Skull } from "lucide-react";
import type { CSSProperties, DragEvent } from "react";
import { boardColumns, boardRows, pinTypeLabels, terrainLabels } from "../data/boardConstants";
import type {
  BoardMode,
  BoardSettings,
  BoardTerrain,
  BoardToken,
  LayerState,
  MapPin,
} from "../types/board";
import { getCellKey, getGridDistance, getSquareDistance } from "../utils/boardGeometry";

type BoardCell = { x: number; y: number };
type HoverCell = BoardCell & { valid: boolean };
type PlacedTemplateCell = BoardCell & { templateId: string };

type TacticalBoardGridProps = {
  activeTokenId: string;
  boardSettings: BoardSettings;
  dragTokenId: string | null;
  fog: Record<string, boolean>;
  hoverCell: HoverCell | null;
  layers: LayerState;
  mode: BoardMode;
  pins: Record<string, MapPin>;
  placedTemplateCells: PlacedTemplateCell[];
  rulerCells: BoardCell[];
  rulerStart: BoardCell | null;
  selectedOccupiedCells: BoardCell[];
  selectedReach: number;
  selectedToken: BoardToken | null;
  selectedTokenId: string;
  selectedVisionCells: BoardCell[];
  showDmNotes: boolean;
  spellAffectedCells: BoardCell[];
  spellCoverStatus: string;
  spellLineCells: BoardCell[];
  spellOrigin: BoardCell | null;
  spellPreviewTarget: BoardCell | null;
  spellRangeCells: number;
  terrain: Record<string, BoardTerrain>;
  tokens: BoardToken[];
  waypointCells: BoardCell[];
  movementPathCells: BoardCell[];
  handleBoardDragOver: (event: DragEvent<HTMLDivElement>) => void;
  handleBoardDrop: (event: DragEvent<HTMLDivElement>) => void;
  handleCellClick: (x: number, y: number) => void;
  handleTokenDragEnd: () => void;
  handleTokenDragStart: (event: DragEvent<HTMLElement>, tokenId: string) => void;
  interactWithPin: (key: string) => void;
  setHoverRulerCell: (cell: BoardCell | null) => void;
  setHoverTargetCell: (cell: BoardCell | null) => void;
  setHoverCell: (cell: HoverCell | null) => void;
  setSelectedTokenId: (tokenId: string) => void;
};

function TacticalBoardGrid({
  activeTokenId,
  boardSettings,
  dragTokenId,
  fog,
  handleBoardDragOver,
  handleBoardDrop,
  handleCellClick,
  handleTokenDragEnd,
  handleTokenDragStart,
  hoverCell,
  interactWithPin,
  layers,
  mode,
  movementPathCells,
  pins,
  placedTemplateCells,
  rulerCells,
  rulerStart,
  selectedOccupiedCells,
  selectedReach,
  selectedToken,
  selectedTokenId,
  selectedVisionCells,
  setHoverCell,
  setHoverRulerCell,
  setHoverTargetCell,
  setSelectedTokenId,
  showDmNotes,
  spellAffectedCells,
  spellCoverStatus,
  spellLineCells,
  spellOrigin,
  spellPreviewTarget,
  spellRangeCells,
  terrain,
  tokens,
  waypointCells,
}: TacticalBoardGridProps) {
  return (
    <div
      className={["battle-board", !layers.grid ? "battle-board-grid-hidden" : ""]
        .filter(Boolean)
        .join(" ")}
      style={
        {
          "--board-columns": boardColumns,
          "--board-rows": boardRows,
          "--map-background": boardSettings.backgroundUrl
            ? `url("${boardSettings.backgroundUrl}")`
            : "none",
        } as CSSProperties
      }
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setHoverCell(null);
        }
      }}
      onDragOver={handleBoardDragOver}
      onDrop={handleBoardDrop}
    >
      {Array.from({ length: boardColumns * boardRows }).map((_, index) => {
        const x = index % boardColumns;
        const y = Math.floor(index / boardColumns);
        const terrainType = layers.terrain ? terrain[getCellKey(x, y)] ?? "normal" : "normal";
        const isInReach =
          selectedToken &&
          mode === "move" &&
          getGridDistance(selectedToken.x, selectedToken.y, x, y) <= selectedReach;
        const isOccupiedBySelected = selectedOccupiedCells.some(
          (cell) => cell.x === x && cell.y === y,
        );
        const isSpellOrigin = spellOrigin?.x === x && spellOrigin.y === y;
        const isSpellInRange =
          spellOrigin &&
          mode === "target" &&
          getSquareDistance(spellOrigin.x, spellOrigin.y, x, y) <= spellRangeCells;
        const isSpellAffected = spellAffectedCells.some(
          (cell) => cell.x === x && cell.y === y,
        );
        const isSpellTarget =
          spellPreviewTarget?.x === x && spellPreviewTarget.y === y;
        const isMovementPath = movementPathCells.some((cell) => cell.x === x && cell.y === y);
        const isWaypointPath = waypointCells.some((cell) => cell.x === x && cell.y === y);
        const isRulerPath = rulerCells.some((cell) => cell.x === x && cell.y === y);
        const isSpellLine = spellLineCells.some((cell) => cell.x === x && cell.y === y);
        const isFogged = layers.fog && Boolean(fog[getCellKey(x, y)]);
        const hasPin = layers.pins && Boolean(pins[getCellKey(x, y)]);
        const isInVision = layers.vision && selectedVisionCells.some((cell) => cell.x === x && cell.y === y);
        const hasPlacedTemplate = placedTemplateCells.some((cell) => cell.x === x && cell.y === y);
        const cellHint = [
          terrainType !== "normal" ? `${terrainLabels[terrainType]} terrain` : "Open ground",
          isFogged ? "Fog of war" : "",
          hasPin ? "Map pin" : "",
          isInReach ? "Movement reach" : "",
          isMovementPath ? "Drag path" : "",
          isWaypointPath ? "Waypoint path" : "",
          isRulerPath ? "Ruler line" : "",
          isSpellInRange ? "Spell range" : "",
          isSpellAffected ? "AOE target area" : "",
          isSpellLine && spellCoverStatus === "Line blocked" ? "Line blocked" : "",
          isInVision ? "Vision area" : "",
          layers.templates && hasPlacedTemplate ? "Placed template" : "",
        ]
          .filter(Boolean)
          .join(" · ");

        return (
          <button
            key={getCellKey(x, y)}
            type="button"
            className={[
              "battle-cell",
              `battle-cell-${terrainType}`,
              isInReach ? "battle-cell-reachable" : "",
              isOccupiedBySelected ? "battle-cell-selected-occupied" : "",
              isSpellInRange ? "battle-cell-spell-range" : "",
              isSpellAffected ? "battle-cell-spell-aoe" : "",
              isSpellTarget ? "battle-cell-spell-target" : "",
              isSpellOrigin ? "battle-cell-spell-origin" : "",
              isMovementPath ? "battle-cell-path" : "",
              isWaypointPath ? "battle-cell-waypoint" : "",
              isRulerPath ? "battle-cell-ruler" : "",
              isSpellLine && spellCoverStatus === "Line blocked" ? "battle-cell-line-blocked" : "",
              isFogged ? "battle-cell-fog" : "",
              hasPin ? "battle-cell-pin" : "",
              isInVision ? "battle-cell-vision" : "",
              layers.templates && hasPlacedTemplate ? "battle-cell-template" : "",
              !layers.grid ? "battle-cell-grid-hidden" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={cellHint}
            title={cellHint}
            onClick={() => handleCellClick(x, y)}
            onMouseEnter={() => {
              if (mode === "target") {
                setHoverTargetCell({ x, y });
              }
              if (mode === "ruler" && rulerStart) {
                setHoverRulerCell({ x, y });
              }
            }}
            onMouseLeave={() => {
              if (mode === "target") {
                setHoverTargetCell(null);
              }
              if (mode === "ruler") {
                setHoverRulerCell(null);
              }
            }}
          />
        );
      })}

      {Object.entries(pins).map(([key, pin]) => {
        const [x, y] = key.split(":").map(Number);

        if (!layers.pins || (pin.hidden && !showDmNotes)) {
          return null;
        }

        return (
          <button
            key={key}
            type="button"
            className={[
              "battle-map-pin",
              `battle-map-pin-${pin.type}`,
              pin.hidden ? "battle-map-pin-hidden" : "",
              pin.open ? "battle-map-pin-open" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              {
                "--pin-x": x,
                "--pin-y": y,
              } as CSSProperties
            }
            onClick={() => interactWithPin(key)}
          >
            <span>{pinTypeLabels[pin.type]}</span>
            {pin.label}
          </button>
        );
      })}

      {hoverCell && (
        <div
          className={[
            "battle-drop-preview",
            hoverCell.valid ? "battle-drop-preview-valid" : "battle-drop-preview-invalid",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              "--preview-x": hoverCell.x,
              "--preview-y": hoverCell.y,
              "--preview-size": dragTokenId
                ? tokens.find((token) => token.id === dragTokenId)?.size ?? 1
                : 1,
            } as CSSProperties
          }
        />
      )}

      {layers.tokens && tokens.map((token) => (
        <button
          key={token.id}
          type="button"
          draggable
          className={[
            "battle-token",
            `battle-token-${token.team}`,
            selectedTokenId === token.id ? "battle-token-selected" : "",
            activeTokenId === token.id ? "battle-token-active-turn" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          style={
            {
              "--token-color": token.color,
              "--token-x": token.x,
              "--token-y": token.y,
              "--token-size": token.size,
            } as CSSProperties
          }
          onClick={() => setSelectedTokenId(token.id)}
          onDragEnd={handleTokenDragEnd}
          onDragStart={(event) => handleTokenDragStart(event, token.id)}
        >
          {token.team === "enemies" ? <Skull size={18} /> : <Shield size={18} />}
          <span>{token.name}</span>
          <em>{token.hp}/{token.maxHp}</em>
          {(token.conditions ?? []).length > 0 && <b>{token.conditions?.length}</b>}
        </button>
      ))}
    </div>
  );
}

export { TacticalBoardGrid };
