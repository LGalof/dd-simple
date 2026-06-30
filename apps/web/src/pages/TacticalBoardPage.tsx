import {
  Castle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  FilePlus,
  Footprints,
  Mountain,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  Trees,
  Upload,
  Waves,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../features/auth/AuthContext";
import { getRoom } from "../features/rooms/api/roomsApi";
import { useRoomSocket } from "../features/rooms/hooks/useRoomSocket";
import { TacticalBoardGrid } from "../features/tactical-board/components/TacticalBoardGrid";
import {
  aoeShapeLabels,
  boardColumns,
  boardRows,
  boardStorageKey,
  cellDistance,
  conditionOptions,
  defaultLayers,
  defaultSettings,
  defaultTurnState,
  initialTerrain,
  initialTokens,
  layerLabels,
  pinTypeLabels,
  savedBoardsStorageKey,
  spellTemplates,
  terrainLabels,
  tokenPresets,
} from "../features/tactical-board/data/boardConstants";
import type {
  AoeShape,
  BoardMode,
  BoardSettings,
  BoardTerrain,
  BoardToken,
  LayerKey,
  LayerState,
  MapPin,
  PinType,
  PlacedTemplate,
  SavedBoardEntry,
  SavedBoardState,
  SpellTemplate,
  TokenCondition,
  TokenTeam,
  TurnState,
} from "../features/tactical-board/types/board";
import {
  canPlaceToken,
  findTokenSpace,
  getBrushCells,
  getCellsInRadius,
  getCellKey,
  getLineCells,
  getLineOfSightStatus,
  getMovementCostFeet,
  getOccupiedCells,
  getSpellAffectedCells,
  getSquareDistance,
  getTokenCenter,
  getWaypointCells,
} from "../features/tactical-board/utils/boardGeometry";
import {
  decodeBoardState,
  encodeBoardState,
  formatSavedBoardDate,
  loadSavedBoardEntries,
  loadSavedBoardState,
  normalizeBoardState,
  normalizePins,
  parseBoardState,
} from "../features/tactical-board/utils/boardStorage";

const terrainIcons = {
  normal: Sparkles,
  difficult: Mountain,
  wall: Castle,
  water: Waves,
  forest: Trees,
};

const boardModeLabels: Record<BoardMode, string> = {
  move: "Move",
  target: "Target",
  ruler: "Ruler",
  fog: "Fog",
  pin: "Pin",
  waypoint: "Path",
  normal: "Normal",
  difficult: "Difficult",
  wall: "Wall",
  water: "Water",
  forest: "Forest",
};

const boardModeDescriptions: Record<BoardMode, string> = {
  move: "Drag tokens. Green squares show the selected token's movement reach.",
  target: "Hover or click a square to preview spell range, area, and line of sight.",
  ruler: "Click a start square and an end square to measure distance.",
  fog: "Click squares to hide or reveal fog of war.",
  pin: "Click a square to place or remove a note, trap, door, loot, or lever.",
  waypoint: "Click squares to draw a movement path, then press Move.",
  normal: "Paint normal floor and clear terrain markings.",
  difficult: "Paint difficult terrain that costs extra movement.",
  wall: "Paint blocked wall squares.",
  water: "Paint water terrain.",
  forest: "Paint forest terrain.",
};

const boardLegendItems = [
  { className: "battle-legend-reach", label: "Move reach" },
  { className: "battle-legend-path", label: "Path / ruler" },
  { className: "battle-legend-spell", label: "Spell range" },
  { className: "battle-legend-aoe", label: "AOE / template" },
  { className: "battle-legend-fog", label: "Fog" },
  { className: "battle-legend-wall", label: "Wall" },
];

type TurnResourceKey = "actionUsed" | "bonusActionUsed" | "reactionUsed";
type SpellResource = TurnResourceKey | "free";
type TacticalBoardPageProps = {
  roomMode?: boolean;
};

const turnResourceLabels: Record<TurnResourceKey, string> = {
  actionUsed: "Action",
  bonusActionUsed: "Bonus Action",
  reactionUsed: "Reaction",
};

function TacticalBoardPage({ roomMode = false }: TacticalBoardPageProps) {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const roomCharacterId = searchParams.get("characterId");
  const {
    boardState: socketBoardState,
    connected: socketConnected,
    error: socketError,
    room: socketRoom,
    sendBoardState,
  } = useRoomSocket(roomMode ? roomCode : undefined, roomCharacterId, token);
  const savedBoardState = useMemo(() => (roomMode ? null : loadSavedBoardState()), [roomMode]);
  const initialSavedBoards = useMemo(() => (roomMode ? [] : loadSavedBoardEntries()), [roomMode]);
  const initialBoardState = socketBoardState ?? savedBoardState;
  const [loadedRoomBoardState, setLoadedRoomBoardState] = useState<SavedBoardState | null>(null);
  const [roomLoadError, setRoomLoadError] = useState<string | null>(null);
  const [tokens, setTokens] = useState(initialBoardState?.tokens ?? (roomMode ? [] : initialTokens));
  const [terrain, setTerrain] = useState<Record<string, BoardTerrain>>(
    initialBoardState?.terrain ?? initialTerrain,
  );
  const [fog, setFog] = useState<Record<string, boolean>>(initialBoardState?.fog ?? {});
  const [pins, setPins] = useState<Record<string, MapPin>>(normalizePins(initialBoardState?.pins ?? {}));
  const [placedTemplates, setPlacedTemplates] = useState<PlacedTemplate[]>(initialBoardState?.templates ?? []);
  const [layers, setLayers] = useState<LayerState>({ ...defaultLayers, ...(initialBoardState?.layers ?? {}) });
  const [boardSettings, setBoardSettings] = useState<BoardSettings>({
    ...defaultSettings,
    ...(initialBoardState?.settings ?? {}),
  });
  const [selectedTokenId, setSelectedTokenId] = useState(
    initialBoardState?.selectedTokenId ?? (roomMode ? "" : initialTokens[0].id),
  );
  const [initiativeOrder, setInitiativeOrder] = useState(
    initialBoardState?.initiativeOrder ?? (roomMode ? [] : initialTokens.map((token) => token.id)),
  );
  const [activeInitiativeIndex, setActiveInitiativeIndex] = useState(
    initialBoardState?.activeInitiativeIndex ?? 0,
  );
  const [dragTokenId, setDragTokenId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number; valid: boolean } | null>(
    null,
  );
  const [mode, setMode] = useState<BoardMode>("move");
  const [newTokenName, setNewTokenName] = useState("New Hero");
  const [newTokenTeam, setNewTokenTeam] = useState<TokenTeam>("players");
  const [shareCode, setShareCode] = useState("");
  const [spellName, setSpellName] = useState("Fireball");
  const [spellDamage, setSpellDamage] = useState("8d6 fire");
  const [spellRangeFeet, setSpellRangeFeet] = useState(60);
  const [spellResource, setSpellResource] = useState<SpellResource>("actionUsed");
  const [aoeShape, setAoeShape] = useState<AoeShape>("burst");
  const [aoeSizeFeet, setAoeSizeFeet] = useState(15);
  const [targetCell, setTargetCell] = useState<{ x: number; y: number } | null>(null);
  const [hoverTargetCell, setHoverTargetCell] = useState<{ x: number; y: number } | null>(null);
  const [rulerStart, setRulerStart] = useState<{ x: number; y: number } | null>(null);
  const [rulerEnd, setRulerEnd] = useState<{ x: number; y: number } | null>(null);
  const [hoverRulerCell, setHoverRulerCell] = useState<{ x: number; y: number } | null>(null);
  const [brushSize, setBrushSize] = useState(1);
  const [pinLabel, setPinLabel] = useState("Note");
  const [pinType, setPinType] = useState<PinType>("note");
  const [pinHidden, setPinHidden] = useState(false);
  const [showDmNotes, setShowDmNotes] = useState(true);
  const [waypoints, setWaypoints] = useState<Array<{ x: number; y: number }>>([]);
  const [combatLog, setCombatLog] = useState<string[]>(["Prototype board ready."]);
  const [savedBoards, setSavedBoards] = useState(initialSavedBoards);
  const [boardName, setBoardName] = useState(initialSavedBoards[0]?.name ?? "Forest Road");
  const [selectedSavedBoardId, setSelectedSavedBoardId] = useState(initialSavedBoards[0]?.id ?? "");
  const [ruleOverride, setRuleOverride] = useState(false);
  const [message, setMessage] = useState("Drag tokens on the board or paint terrain.");
  const lastAppliedRemoteStateRef = useRef("");
  const lastSentRoomStateRef = useRef("");
  const activeRoom = socketRoom;

  const selectedToken = tokens.find((token) => token.id === selectedTokenId) ?? null;
  const validInitiativeOrder = useMemo(
    () => initiativeOrder.filter((tokenId) => tokens.some((token) => token.id === tokenId)),
    [initiativeOrder, tokens],
  );
  const activeTokenId =
    validInitiativeOrder.length > 0
      ? validInitiativeOrder[activeInitiativeIndex % validInitiativeOrder.length]
      : "";
  const activeToken = tokens.find((token) => token.id === activeTokenId) ?? null;
  const selectedSavedBoard =
    savedBoards.find((board) => board.id === selectedSavedBoardId) ?? null;
  const feetPerSquare = Math.max(1, boardSettings.feetPerSquare || cellDistance);
  const selectedMovementUsed = selectedToken?.turn?.movementUsed ?? 0;
  const selectedMovementRemaining = selectedToken
    ? Math.max(0, selectedToken.speed - selectedMovementUsed)
    : 0;
  const selectedReach = selectedToken ? Math.floor(selectedMovementRemaining / feetPerSquare) : 0;
  const spellRangeCells = Math.max(1, Math.floor(spellRangeFeet / feetPerSquare));
  const aoeSizeCells = Math.max(0, Math.floor(aoeSizeFeet / feetPerSquare));
  const spellOrigin = selectedToken ? getTokenCenter(selectedToken) : null;
  const spellPreviewTarget = hoverTargetCell ?? targetCell;
  const spellAffectedCells = useMemo(
    () =>
      spellOrigin && spellPreviewTarget
        ? getSpellAffectedCells(spellOrigin, spellPreviewTarget, aoeShape, aoeSizeCells)
        : [],
    [aoeShape, aoeSizeCells, spellOrigin, spellPreviewTarget],
  );
  const affectedTokens = useMemo(
    () =>
      tokens.filter(
        (token) =>
          token.id !== selectedTokenId &&
          getOccupiedCells(token).some((occupiedCell) =>
            spellAffectedCells.some(
              (affectedCell) => affectedCell.x === occupiedCell.x && affectedCell.y === occupiedCell.y,
            ),
          ),
      ),
    [selectedTokenId, spellAffectedCells, tokens],
  );
  const spellLineCells = spellOrigin && spellPreviewTarget ? getLineCells(spellOrigin, spellPreviewTarget) : [];
  const spellCoverStatus = spellLineCells.length > 0 ? getLineOfSightStatus(spellLineCells, terrain) : "No target";
  const rulerPreviewEnd = hoverRulerCell ?? rulerEnd;
  const rulerCells = rulerStart && rulerPreviewEnd ? getLineCells(rulerStart, rulerPreviewEnd) : [];
  const rulerDistanceFeet =
    rulerStart && rulerPreviewEnd
      ? getSquareDistance(rulerStart.x, rulerStart.y, rulerPreviewEnd.x, rulerPreviewEnd.y) * feetPerSquare
      : 0;
  const movementPathCells =
    selectedToken && hoverCell ? getLineCells({ x: selectedToken.x, y: selectedToken.y }, hoverCell) : [];
  const movementCostFeet = getMovementCostFeet(
    movementPathCells,
    terrain,
    feetPerSquare,
    boardSettings.diagonalRule,
  );
  const waypointCells = selectedToken ? getWaypointCells(getTokenCenter(selectedToken), waypoints) : [];
  const waypointCostFeet = getMovementCostFeet(
    waypointCells,
    terrain,
    feetPerSquare,
    boardSettings.diagonalRule,
  );
  const selectedVisionCells =
    selectedToken && layers.vision
      ? getCellsInRadius(getTokenCenter(selectedToken), Math.max(0, Math.floor((selectedToken.visionFeet ?? 60) / feetPerSquare)))
      : [];
  const placedTemplateCells = useMemo(
    () =>
      placedTemplates.flatMap((template) =>
        getSpellAffectedCells(
          { x: template.x, y: template.y },
          { x: template.x, y: template.y },
          template.shape === "cone" || template.shape === "line" ? "burst" : template.shape,
          Math.max(0, Math.floor(template.sizeFeet / feetPerSquare)),
        ).map((cell) => ({ ...cell, templateId: template.id })),
      ),
    [feetPerSquare, placedTemplates],
  );
  const selectedOccupiedCells = useMemo(
    () => (selectedToken ? getOccupiedCells(selectedToken) : []),
    [selectedToken],
  );

  useEffect(() => {
    if (!roomMode || !roomCode || !token) {
      return;
    }

    let cancelled = false;
    const currentRoomCode = roomCode;
    const currentToken = token;

    async function loadRoomBoard() {
      setRoomLoadError(null);

      try {
        const response = await getRoom(currentRoomCode, currentToken);
        const normalizedState = response.room.boardState
          ? normalizeBoardState(response.room.boardState)
          : null;

        if (!cancelled) {
          setLoadedRoomBoardState(normalizedState);
        }
      } catch (error) {
        if (!cancelled) {
          setRoomLoadError(error instanceof Error ? error.message : "Failed to load room board.");
        }
      }
    }

    void loadRoomBoard();

    return () => {
      cancelled = true;
    };
  }, [roomCode, roomCharacterId, roomMode, token]);

  useEffect(() => {
    if (!roomMode) {
      return;
    }

    const nextState = socketBoardState ?? loadedRoomBoardState;

    if (!nextState) {
      return;
    }

    const normalizedState = normalizeBoardState(nextState);

    if (!normalizedState) {
      return;
    }

    const serializedState = JSON.stringify(normalizedState);

    if (serializedState === lastAppliedRemoteStateRef.current) {
      return;
    }

    lastAppliedRemoteStateRef.current = serializedState;
    lastSentRoomStateRef.current = serializedState;
    applyBoardState(normalizedState, socketBoardState ? "Board synced from room." : "Room board loaded.");
  }, [loadedRoomBoardState, roomMode, socketBoardState]);

  useEffect(() => {
    const state: SavedBoardState = {
      tokens,
      terrain,
      fog,
      pins,
      templates: placedTemplates,
      layers,
      settings: boardSettings,
      selectedTokenId,
      initiativeOrder: validInitiativeOrder,
      activeInitiativeIndex,
    };

    const serializedState = JSON.stringify(state);

    if (roomMode) {
      const hasLoadedRoomState = Boolean(socketBoardState ?? loadedRoomBoardState);

      if (!hasLoadedRoomState) {
        return;
      }

      if (!socketConnected || serializedState === lastSentRoomStateRef.current) {
        return;
      }

      const timeoutId = window.setTimeout(() => {
        lastSentRoomStateRef.current = serializedState;
        sendBoardState(state);
      }, 250);

      return () => window.clearTimeout(timeoutId);
    }

    localStorage.setItem(boardStorageKey, serializedState);
  }, [activeInitiativeIndex, boardSettings, fog, layers, loadedRoomBoardState, pins, placedTemplates, roomMode, selectedTokenId, sendBoardState, socketBoardState, socketConnected, terrain, tokens, validInitiativeOrder]);

  useEffect(() => {
    if (roomMode) {
      return;
    }

    localStorage.setItem(savedBoardsStorageKey, JSON.stringify(savedBoards));
  }, [roomMode, savedBoards]);

  useEffect(() => {
    if (roomMode) {
      return undefined;
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== boardStorageKey || !event.newValue) {
        return;
      }

      const nextState = parseBoardState(event.newValue);

      if (!nextState) {
        return;
      }

      setTokens(nextState.tokens);
      setTerrain(nextState.terrain);
      setFog(nextState.fog ?? {});
      setPins(normalizePins(nextState.pins ?? {}));
      setPlacedTemplates(nextState.templates ?? []);
      setLayers({ ...defaultLayers, ...(nextState.layers ?? {}) });
      setBoardSettings({ ...defaultSettings, ...(nextState.settings ?? {}) });
      setSelectedTokenId(nextState.selectedTokenId);
      setInitiativeOrder(nextState.initiativeOrder);
      setActiveInitiativeIndex(nextState.activeInitiativeIndex);
      setMessage("Board synced from another open tab.");
    }

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function updateToken(nextToken: BoardToken) {
    setTokens((currentTokens) =>
      currentTokens.map((token) => (token.id === nextToken.id ? nextToken : token)),
    );
  }

  function addCombatLog(entry: string) {
    setCombatLog((currentLog) => [entry, ...currentLog].slice(0, 8));
  }

  function handleTokenDragStart(event: DragEvent<HTMLElement>, tokenId: string) {
    setSelectedTokenId(tokenId);
    setDragTokenId(tokenId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/dd-simple-board-token", tokenId);
    event.dataTransfer.setData("text/plain", tokenId);
  }

  function handleTokenDragEnd() {
    setDragTokenId(null);
    setHoverCell(null);
  }

  function getDraggedToken(event: DragEvent<HTMLElement>) {
    const tokenId =
      event.dataTransfer.getData("application/dd-simple-board-token") ||
      event.dataTransfer.getData("text/plain");

    return tokens.find((token) => token.id === tokenId) ?? null;
  }

  function getRemainingMovementFeet(token: BoardToken) {
    return Math.max(0, token.speed - (token.turn?.movementUsed ?? 0));
  }

  function getTurnOwnershipIssue(token: BoardToken) {
    if (ruleOverride || !activeTokenId || token.id === activeTokenId) {
      return "";
    }

    return `${token.name} is not the active turn. Enable DM override to force it.`;
  }

  function spendTurnResource(token: BoardToken, resourceKey: TurnResourceKey, activity: string) {
    const turnIssue = getTurnOwnershipIssue(token);

    if (turnIssue) {
      setMessage(turnIssue);
      addCombatLog(`Rule warning: ${turnIssue}`);
      return false;
    }

    if (token.turn?.[resourceKey] && !ruleOverride) {
      const resourceLabel = turnResourceLabels[resourceKey].toLowerCase();

      setMessage(`${token.name} already used their ${resourceLabel}. Enable DM override to force it.`);
      addCombatLog(`Rule warning: ${token.name} already used their ${resourceLabel}.`);
      return false;
    }

    updateToken({
      ...token,
      turn: {
        ...defaultTurnState,
        ...(token.turn ?? {}),
        [resourceKey]: true,
      },
    });
    addCombatLog(`${token.name} spent ${turnResourceLabels[resourceKey]}: ${activity}.`);
    return true;
  }

  function getMovementRuleIssue(
    token: BoardToken,
    movementCostFeet: number,
    pathCells: Array<{ x: number; y: number }>,
  ) {
    if (pathCells.slice(1).some((cell) => terrain[getCellKey(cell.x, cell.y)] === "wall")) {
      return `${token.name}'s path crosses a wall.`;
    }

    if (ruleOverride) {
      return "";
    }

    const turnIssue = getTurnOwnershipIssue(token);

    if (turnIssue) {
      return turnIssue;
    }

    const remainingFeet = getRemainingMovementFeet(token);

    if (movementCostFeet > remainingFeet) {
      return `${token.name} only has ${remainingFeet} ft of movement left. Enable DM override to force it.`;
    }

    return "";
  }

  function handleBoardDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const draggedToken = dragTokenId ? tokens.find((token) => token.id === dragTokenId) : null;

    if (!draggedToken) {
      return;
    }

    const cell = getBoardCellFromEvent(event);
    const candidate = {
      ...draggedToken,
      x: cell.x,
      y: cell.y,
    };
    const movementCells = getLineCells({ x: draggedToken.x, y: draggedToken.y }, cell);
    const moveCost = getMovementCostFeet(
      movementCells,
      terrain,
      feetPerSquare,
      boardSettings.diagonalRule,
    );
    const valid =
      canPlaceToken(candidate, tokens, terrain) &&
      !getMovementRuleIssue(draggedToken, moveCost, movementCells);

    event.dataTransfer.dropEffect = valid ? "move" : "none";
    setHoverCell({ ...cell, valid });
  }

  function handleBoardDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const draggedToken = getDraggedToken(event);

    if (!draggedToken) {
      return;
    }

    const cell = getBoardCellFromEvent(event);
    const nextToken = {
      ...draggedToken,
      x: cell.x,
      y: cell.y,
    };

    if (!canPlaceToken(nextToken, tokens, terrain)) {
      setMessage(`${draggedToken.name} cannot move there.`);
      return;
    }

    const movementCells = getLineCells({ x: draggedToken.x, y: draggedToken.y }, cell);
    const moveCost = getMovementCostFeet(
      movementCells,
      terrain,
      feetPerSquare,
      boardSettings.diagonalRule,
    );
    const movementIssue = getMovementRuleIssue(draggedToken, moveCost, movementCells);

    if (movementIssue) {
      setMessage(movementIssue);
      addCombatLog(`Rule warning: ${movementIssue}`);
      return;
    }

    updateToken({
      ...nextToken,
      turn: {
        ...defaultTurnState,
        ...(draggedToken.turn ?? {}),
        movementUsed: (draggedToken.turn?.movementUsed ?? 0) + moveCost,
      },
    });
    setHoverCell(null);
    addCombatLog(`${draggedToken.name} moved ${moveCost} ft.`);
    setMessage(`${draggedToken.name} moved to ${cell.x + 1}, ${cell.y + 1}.`);
  }

  function handleCellClick(x: number, y: number) {
    if (mode === "waypoint") {
      if (!selectedToken) {
        setMessage("Select a token before plotting a path.");
        return;
      }

      setWaypoints((currentWaypoints) => [...currentWaypoints, { x, y }]);
      setMessage(`Waypoint added at ${x + 1}, ${y + 1}.`);
      return;
    }

    if (mode === "ruler") {
      if (!rulerStart) {
        setRulerStart({ x, y });
        setRulerEnd(null);
        setMessage(`Ruler started at ${x + 1}, ${y + 1}.`);
        return;
      }

      setRulerEnd({ x, y });
      addCombatLog(`Measured ${getSquareDistance(rulerStart.x, rulerStart.y, x, y) * feetPerSquare} ft.`);
      setMessage(`Measured ${getSquareDistance(rulerStart.x, rulerStart.y, x, y) * feetPerSquare} ft.`);
      return;
    }

    if (mode === "fog") {
      toggleFogBrush(x, y);
      return;
    }

    if (mode === "pin") {
      togglePin(x, y);
      return;
    }

    if (mode === "target") {
      if (!spellOrigin) {
        setMessage("Select a caster token before previewing a spell.");
        return;
      }

      const target = { x, y };
      const distance = getSquareDistance(spellOrigin.x, spellOrigin.y, x, y);

      setTargetCell(target);
      addCombatLog(`${spellName} targeted ${x + 1}, ${y + 1}; ${affectedTokens.length} token${affectedTokens.length === 1 ? "" : "s"} in AOE.`);
      setMessage(
        distance <= spellRangeCells
          ? `Target locked at ${x + 1}, ${y + 1}. ${distance * feetPerSquare} ft away.`
          : `Target is ${distance * feetPerSquare} ft away, beyond spell range.`,
      );
      return;
    }

    if (mode === "move") {
      return;
    }

    const cells = getBrushCells(x, y, brushSize);

    setTerrain((currentTerrain) => {
      const nextTerrain = { ...currentTerrain };

      cells.forEach((cell) => {
        const key = getCellKey(cell.x, cell.y);

      if (mode === "normal") {
          delete nextTerrain[key];
          return;
      }

        nextTerrain[key] = mode;
      });

      return nextTerrain;
    });
  }

  function toggleFogBrush(x: number, y: number) {
    const cells = getBrushCells(x, y, brushSize);

    setFog((currentFog) => {
      const nextFog = { ...currentFog };
      const shouldReveal = cells.some((cell) => currentFog[getCellKey(cell.x, cell.y)]);

      cells.forEach((cell) => {
        const key = getCellKey(cell.x, cell.y);

        if (shouldReveal) {
          delete nextFog[key];
          return;
        }

        nextFog[key] = true;
      });

      return nextFog;
    });
    setMessage("Fog of war updated.");
  }

  function togglePin(x: number, y: number) {
    const key = getCellKey(x, y);

    setPins((currentPins) => {
      const nextPins = { ...currentPins };

      if (nextPins[key]) {
        delete nextPins[key];
        setMessage(`Pin removed from ${x + 1}, ${y + 1}.`);
        return nextPins;
      }

      nextPins[key] = {
        label: pinLabel.trim() || pinTypeLabels[pinType],
        type: pinType,
        hidden: pinHidden,
        open: false,
      };
      setMessage(`Pin added at ${x + 1}, ${y + 1}.`);
      return nextPins;
    });
  }

  function interactWithPin(key: string) {
    const pin = pins[key];

    if (!pin) {
      return;
    }

    if (pin.type === "door" || pin.type === "lever") {
      setPins((currentPins) => ({
        ...currentPins,
        [key]: {
          ...pin,
          open: !pin.open,
        },
      }));
      setMessage(`${pin.label} ${pin.open ? "closed" : "opened"}.`);
      return;
    }

    if (pin.type === "trap") {
      setPins((currentPins) => ({
        ...currentPins,
        [key]: {
          ...pin,
          hidden: false,
        },
      }));
      setMessage(`${pin.label} revealed.`);
      return;
    }

    setMessage(`${pin.label}${pin.hidden ? " (DM note)" : ""}.`);
  }

  function applySpellTemplate(template: SpellTemplate) {
    setSpellName(template.name);
    setSpellDamage(template.damage);
    setSpellRangeFeet(template.rangeFeet);
    setAoeSizeFeet(template.aoeFeet);
    setAoeShape(template.shape);
    setMode("target");
    setMessage(`${template.name} template loaded. Hover a square to preview the effect.`);
  }

  function placePersistentTemplate() {
    const target = spellPreviewTarget ?? targetCell;

    if (!target) {
      setMessage("Choose a target square before placing a template.");
      return;
    }

    if (!selectedToken) {
      setMessage("Select a caster before placing a spell template.");
      return;
    }

    if (
      spellResource !== "free" &&
      !spendTurnResource(selectedToken, spellResource, spellName.trim() || "Spell")
    ) {
      return;
    }

    const template: PlacedTemplate = {
      id: `template-${Date.now()}`,
      name: spellName.trim() || "Area Effect",
      damage: spellDamage.trim(),
      x: target.x,
      y: target.y,
      shape: aoeShape,
      sizeFeet: aoeShape === "single" ? 0 : aoeSizeFeet,
      color: "#f59e0b",
    };

    setPlacedTemplates((currentTemplates) => [...currentTemplates, template]);
    addCombatLog(`${template.name} template placed.`);
    setMessage(`${template.name} placed on the map.`);
  }

  function clearPlacedTemplates() {
    setPlacedTemplates([]);
    setMessage("Persistent spell templates cleared.");
  }

  function toggleLayer(layer: LayerKey) {
    setLayers((currentLayers) => ({ ...currentLayers, [layer]: !currentLayers[layer] }));
  }

  function applyWaypointMove() {
    if (!selectedToken || waypoints.length === 0) {
      setMessage("Select a token and add waypoints first.");
      return;
    }

    const destination = waypoints[waypoints.length - 1];
    const nextToken = { ...selectedToken, x: destination.x, y: destination.y };

    if (!canPlaceToken(nextToken, tokens, terrain)) {
      setMessage(`${selectedToken.name} cannot finish that waypoint path.`);
      return;
    }

    const movementIssue = getMovementRuleIssue(selectedToken, waypointCostFeet, waypointCells);

    if (movementIssue) {
      setMessage(movementIssue);
      addCombatLog(`Rule warning: ${movementIssue}`);
      return;
    }

    updateToken({
      ...nextToken,
      turn: {
        ...defaultTurnState,
        ...(selectedToken.turn ?? {}),
        movementUsed: (selectedToken.turn?.movementUsed ?? 0) + waypointCostFeet,
      },
    });
    addCombatLog(`${selectedToken.name} followed waypoint path for ${waypointCostFeet} ft.`);
    setWaypoints([]);
    setMessage(`${selectedToken.name} moved by waypoint path.`);
  }

  function quickCombatAction(
    action: string,
    resourceKey?: TurnResourceKey,
  ) {
    if (!selectedToken) {
      setMessage("Select a token first.");
      return;
    }

    if (resourceKey) {
      if (!spendTurnResource(selectedToken, resourceKey, action)) {
        return;
      }

      setMessage(`${selectedToken.name}: ${action}.`);
      return;
    }

    addCombatLog(`${selectedToken.name}: ${action}.`);
    setMessage(`${selectedToken.name}: ${action}.`);
  }

  function addPresetToken(preset: typeof tokenPresets[number]) {
    const token: BoardToken = {
      id: `token-${Date.now()}`,
      ...preset,
      x: 0,
      y: 0,
      notes: "",
      conditions: [],
      turn: defaultTurnState,
      visionFeet: 60,
    };
    const position = findTokenSpace(token, tokens, terrain);

    if (!position) {
      setMessage("No space for that preset token.");
      return;
    }

    const nextToken = { ...token, ...position };

    setTokens((currentTokens) => [...currentTokens, nextToken]);
    setInitiativeOrder((currentOrder) => [...currentOrder, nextToken.id]);
    setSelectedTokenId(nextToken.id);
    addCombatLog(`${nextToken.name} spawned from preset.`);
    setMessage(`${nextToken.name} spawned.`);
  }

  function addToken() {
    const name = newTokenName.trim();

    if (!name) {
      setMessage("Token needs a name.");
      return;
    }

    const token: BoardToken = {
      id: `token-${Date.now()}`,
      name,
      team: newTokenTeam,
      color:
        newTokenTeam === "players" ? "#38bdf8" : newTokenTeam === "enemies" ? "#fb7185" : "#facc15",
      x: 0,
      y: 0,
      size: 1,
      speed: 30,
      hp: 10,
      maxHp: 10,
      initiative: 10,
      ac: 12,
      notes: "",
      conditions: [],
      turn: defaultTurnState,
    };
    const position = findTokenSpace(token, tokens, terrain);

    if (!position) {
      setMessage("No space for a new token.");
      return;
    }

    const nextToken = {
      ...token,
      ...position,
    };

    setTokens((currentTokens) => [...currentTokens, nextToken]);
    setInitiativeOrder((currentOrder) => [...currentOrder, nextToken.id]);
    setSelectedTokenId(nextToken.id);
    setMessage(`${nextToken.name} added to the board.`);
  }

  function removeSelectedToken() {
    if (!selectedToken) {
      return;
    }

    const remainingTokens = tokens.filter((token) => token.id !== selectedToken.id);
    setTokens(remainingTokens);
    setInitiativeOrder((currentOrder) =>
      currentOrder.filter((tokenId) => tokenId !== selectedToken.id),
    );
    setActiveInitiativeIndex((currentIndex) => Math.max(0, currentIndex - 1));
    setSelectedTokenId(remainingTokens[0]?.id ?? "");
    setMessage(`${selectedToken.name} removed from the board.`);
  }

  function sortInitiative() {
    const nextOrder = [...tokens]
      .sort((leftToken, rightToken) => rightToken.initiative - leftToken.initiative)
      .map((token) => token.id);

    setInitiativeOrder(nextOrder);
    setActiveInitiativeIndex(0);
    setSelectedTokenId(nextOrder[0] ?? "");
    setMessage("Initiative sorted from highest to lowest.");
  }

  function getCurrentBoardState(): SavedBoardState {
    return {
      tokens,
      terrain,
      fog,
      pins,
      templates: placedTemplates,
      layers,
      settings: boardSettings,
      selectedTokenId,
      initiativeOrder: validInitiativeOrder,
      activeInitiativeIndex,
    };
  }

  function applyBoardState(state: SavedBoardState, nextMessage: string) {
    setTokens(state.tokens);
    setTerrain(state.terrain);
    setFog(state.fog ?? {});
    setPins(normalizePins(state.pins ?? {}));
    setPlacedTemplates(state.templates ?? []);
    setLayers({ ...defaultLayers, ...(state.layers ?? {}) });
    setBoardSettings({ ...defaultSettings, ...(state.settings ?? {}) });
    setSelectedTokenId(state.selectedTokenId);
    setInitiativeOrder(state.initiativeOrder);
    setActiveInitiativeIndex(state.activeInitiativeIndex);
    setMessage(nextMessage);
  }

  function saveNamedBoard({ asNew = false }: { asNew?: boolean } = {}) {
    const name = boardName.trim();

    if (!name) {
      setMessage("Board needs a name before saving.");
      return;
    }

    const nextEntry: SavedBoardEntry = {
      id: asNew || !selectedSavedBoardId ? `board-${Date.now()}` : selectedSavedBoardId,
      name,
      updatedAt: new Date().toISOString(),
      state: getCurrentBoardState(),
    };

    setSavedBoards((currentBoards) => {
      const withoutCurrent = currentBoards.filter((board) => board.id !== nextEntry.id);

      return [nextEntry, ...withoutCurrent].sort((leftBoard, rightBoard) =>
        rightBoard.updatedAt.localeCompare(leftBoard.updatedAt),
      );
    });
    setSelectedSavedBoardId(nextEntry.id);
    setMessage(asNew ? `${name} saved as a new board.` : `${name} saved.`);
  }

  function loadNamedBoard(boardId = selectedSavedBoardId) {
    const savedBoard = savedBoards.find((board) => board.id === boardId);

    if (!savedBoard) {
      setMessage("Choose a saved board to load.");
      return;
    }

    setSelectedSavedBoardId(savedBoard.id);
    setBoardName(savedBoard.name);
    applyBoardState(savedBoard.state, `${savedBoard.name} loaded.`);
  }

  function deleteNamedBoard() {
    const savedBoard = savedBoards.find((board) => board.id === selectedSavedBoardId);

    if (!savedBoard) {
      setMessage("Choose a saved board to delete.");
      return;
    }

    const remainingBoards = savedBoards.filter((board) => board.id !== savedBoard.id);

    setSavedBoards(remainingBoards);
    setSelectedSavedBoardId(remainingBoards[0]?.id ?? "");
    setBoardName(remainingBoards[0]?.name ?? "Forest Road");
    setMessage(`${savedBoard.name} deleted.`);
  }

  function startBlankBoard() {
    setTokens([]);
    setTerrain({});
    setFog({});
    setPins({});
    setPlacedTemplates([]);
    setWaypoints([]);
    setSelectedTokenId("");
    setInitiativeOrder([]);
    setActiveInitiativeIndex(0);
    setSelectedSavedBoardId("");
    setBoardName("New Encounter Board");
    setHoverCell(null);
    setHoverTargetCell(null);
    setTargetCell(null);
    setRulerStart(null);
    setRulerEnd(null);
    setMessage("Blank board ready for DM prep.");
  }

  function advanceInitiative(direction: 1 | -1) {
    if (validInitiativeOrder.length === 0) {
      return;
    }

    const nextIndex =
      (activeInitiativeIndex + direction + validInitiativeOrder.length) %
      validInitiativeOrder.length;
    const nextTokenId = validInitiativeOrder[nextIndex];
    const nextToken = tokens.find((token) => token.id === nextTokenId);

    setActiveInitiativeIndex(nextIndex);
    setSelectedTokenId(nextTokenId);
    if (nextToken) {
      updateToken({ ...nextToken, turn: defaultTurnState });
    }
    addCombatLog(nextToken ? `${nextToken.name}'s turn started.` : "Turn advanced.");
    setMessage(nextToken ? `${nextToken.name}'s turn.` : "Turn advanced.");
  }

  function exportBoardState() {
    setShareCode(encodeBoardState(getCurrentBoardState()));
    setMessage("Board export code generated.");
  }

  function importBoardState() {
    const importedState = decodeBoardState(shareCode);

    if (!importedState) {
      setMessage("Board import code is not valid.");
      return;
    }

    applyBoardState(importedState, "Board imported from share code.");
  }

  function resetBoardState() {
    setTokens(initialTokens);
    setTerrain(initialTerrain);
    setFog({});
    setPins({});
    setPlacedTemplates([]);
    setWaypoints([]);
    setLayers(defaultLayers);
    setBoardSettings(defaultSettings);
    setSelectedTokenId(initialTokens[0].id);
    setInitiativeOrder(initialTokens.map((token) => token.id));
    setActiveInitiativeIndex(0);
    setShareCode("");
    setHoverTargetCell(null);
    setTargetCell(null);
    setRulerStart(null);
    setRulerEnd(null);
    setCombatLog(["Prototype board ready."]);
    setMessage("Board reset to the prototype encounter.");
  }

  function adjustSelectedHp(amount: number) {
    if (!selectedToken) {
      return;
    }

    const nextHp = Math.max(0, Math.min(selectedToken.maxHp, selectedToken.hp + amount));
    updateToken({ ...selectedToken, hp: nextHp });
    addCombatLog(`${selectedToken.name} ${amount < 0 ? "took" : "recovered"} ${Math.abs(amount)} HP.`);
  }

  function toggleCondition(condition: TokenCondition) {
    if (!selectedToken) {
      return;
    }

    const currentConditions = selectedToken.conditions ?? [];
    const hasCondition = currentConditions.includes(condition);
    const nextConditions = hasCondition
      ? currentConditions.filter((currentCondition) => currentCondition !== condition)
      : [...currentConditions, condition];

    updateToken({ ...selectedToken, conditions: nextConditions });
    addCombatLog(`${selectedToken.name} ${hasCondition ? "lost" : "gained"} ${condition}.`);
  }

  function updateTokenTurn(token: BoardToken, partialTurn: Partial<TurnState>) {
    updateToken({
      ...token,
      turn: {
        ...defaultTurnState,
        ...(token.turn ?? {}),
        ...partialTurn,
      },
    });
  }

  function getBoardCellFromEvent(event: DragEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const cellWidth = rect.width / boardColumns;
    const cellHeight = rect.height / boardRows;
    const draggedToken = dragTokenId ? tokens.find((token) => token.id === dragTokenId) : null;
    const size = draggedToken?.size ?? 1;
    const x = Math.floor((event.clientX - rect.left) / cellWidth);
    const y = Math.floor((event.clientY - rect.top) / cellHeight);

    return {
      x: Math.max(0, Math.min(boardColumns - size, x)),
      y: Math.max(0, Math.min(boardRows - size, y)),
    };
  }

  return (
    <AppLayout variant="fullscreen">
      <section className="battle-board-workbench">
        <header className="battle-board-header">
          <div>
            <p className="eyebrow">{roomMode ? `Room ${roomCode ?? ""}` : "Battle Map Prototype"}</p>
            <h1>{roomMode ? "Room Encounter Board" : "Tactical Encounter Board"}</h1>
            {roomMode && activeRoom && (
              <p className="muted">
                {activeRoom.players.length} player{activeRoom.players.length === 1 ? "" : "s"} joined -{" "}
                <Link to={`/rooms/join?roomCode=${activeRoom.code}`}>Invite link</Link>
              </p>
            )}
            {roomMode && !roomCharacterId && (
              <p className="error-message">
                Join this room with a character to enable live board sync.
              </p>
            )}
            {roomMode && (socketError || roomLoadError) && (
              <p className="error-message">{socketError ?? roomLoadError}</p>
            )}
          </div>
          <span className="battle-board-status">
            {roomMode ? (socketConnected ? "Live sync on" : "Loading room sync") : message}
          </span>
        </header>

        <div className="battle-board-layout">
          <aside className="battle-board-panel">
            <div className="battle-panel-heading">
              <span>Tools</span>
              <strong>Board Mode</strong>
            </div>

            <div className="battle-mode-grid">
              <button
                type="button"
                className={mode === "move" ? "battle-mode-button battle-mode-button-active" : "battle-mode-button"}
                onClick={() => setMode("move")}
              >
                <Footprints size={17} />
                Move
              </button>
              <button
                type="button"
                className={mode === "target" ? "battle-mode-button battle-mode-button-active" : "battle-mode-button"}
                onClick={() => setMode("target")}
              >
                <Swords size={17} />
                Target
              </button>
              <button
                type="button"
                className={mode === "ruler" ? "battle-mode-button battle-mode-button-active" : "battle-mode-button"}
                onClick={() => setMode("ruler")}
              >
                <Footprints size={17} />
                Ruler
              </button>
              <button
                type="button"
                className={mode === "fog" ? "battle-mode-button battle-mode-button-active" : "battle-mode-button"}
                onClick={() => setMode("fog")}
              >
                <Shield size={17} />
                Fog
              </button>
              <button
                type="button"
                className={mode === "pin" ? "battle-mode-button battle-mode-button-active" : "battle-mode-button"}
                onClick={() => setMode("pin")}
              >
                <Sparkles size={17} />
                Pin
              </button>
              <button
                type="button"
                className={mode === "waypoint" ? "battle-mode-button battle-mode-button-active" : "battle-mode-button"}
                onClick={() => setMode("waypoint")}
              >
                <Footprints size={17} />
                Path
              </button>
              {(Object.keys(terrainLabels) as BoardTerrain[]).map((terrainKey) => {
                const TerrainIcon = terrainIcons[terrainKey];

                return (
                  <button
                    key={terrainKey}
                    type="button"
                    className={
                      mode === terrainKey
                        ? "battle-mode-button battle-mode-button-active"
                        : "battle-mode-button"
                    }
                    onClick={() => setMode(terrainKey)}
                  >
                    <TerrainIcon size={17} />
                    {terrainLabels[terrainKey]}
                  </button>
                );
              })}
            </div>

            <div className="battle-tool-hint">
              <span>Active Tool</span>
              <strong>{boardModeLabels[mode]}</strong>
              <p>{boardModeDescriptions[mode]}</p>
            </div>

            <div className="battle-legend">
              {boardLegendItems.map((item) => (
                <span key={item.label}>
                  <i className={item.className} />
                  {item.label}
                </span>
              ))}
            </div>

            <details className="battle-compact-section">
              <summary>
                <span>View</span>
                <strong>Layers</strong>
              </summary>

              <div className="battle-layer-grid">
                {(Object.keys(layerLabels) as LayerKey[]).map((layer) => (
                  <button
                    key={layer}
                    type="button"
                    className={layers[layer] ? "battle-layer-active" : ""}
                    onClick={() => toggleLayer(layer)}
                  >
                    {layerLabels[layer]}
                  </button>
                ))}
              </div>
              <label className="battle-check-field">
                <input
                  checked={showDmNotes}
                  type="checkbox"
                  onChange={(event) => setShowDmNotes(event.target.checked)}
                />
                Show DM notes
              </label>
            </details>

            <details className="battle-compact-section">
              <summary>
                <span>Interact</span>
                <strong>Brush / Pins</strong>
              </summary>

              <div className="battle-tool-strip">
                <label className="battle-field">
                  <span>Brush</span>
                  <select value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))}>
                    <option value={1}>1 x 1</option>
                    <option value={2}>2 x 2</option>
                    <option value={3}>3 x 3</option>
                  </select>
                </label>
                <label className="battle-field">
                  <span>Pin Text</span>
                  <input value={pinLabel} onChange={(event) => setPinLabel(event.target.value)} />
                </label>
              </div>

              <div className="battle-tool-strip">
                <label className="battle-field">
                  <span>Pin Type</span>
                  <select value={pinType} onChange={(event) => setPinType(event.target.value as PinType)}>
                    {(Object.keys(pinTypeLabels) as PinType[]).map((type) => (
                      <option key={type} value={type}>
                        {pinTypeLabels[type]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="battle-check-field">
                  <input
                    checked={pinHidden}
                    type="checkbox"
                    onChange={(event) => setPinHidden(event.target.checked)}
                  />
                  DM only
                </label>
              </div>
            </details>

            <details className="battle-compact-section" open>
              <summary>
                <span>Measure</span>
                <strong>Movement</strong>
              </summary>

              <div className="battle-ruler-summary">
                <span>Ruler</span>
                <strong>{rulerDistanceFeet > 0 ? `${rulerDistanceFeet} ft` : "Pick two squares"}</strong>
                <button
                  type="button"
                  onClick={() => {
                    setRulerStart(null);
                    setRulerEnd(null);
                    setHoverRulerCell(null);
                    setMessage("Ruler cleared.");
                  }}
                >
                  Clear
                </button>
              </div>

              <div className="battle-ruler-summary">
                <span>Move Cost</span>
                <strong>{movementCostFeet > 0 ? `${movementCostFeet} ft` : "Drag a token"}</strong>
                <button type="button" onClick={() => setMessage("Green path shows estimated movement cost.")}>
                  Info
                </button>
              </div>

              <div className="battle-ruler-summary">
                <span>Path Cost</span>
                <strong>{waypointCostFeet > 0 ? `${waypointCostFeet} ft` : "Click path"}</strong>
                <button type="button" onClick={applyWaypointMove}>
                  Move
                </button>
              </div>
              <button
                type="button"
                className="battle-primary-button battle-primary-button-muted"
                onClick={() => {
                  setWaypoints([]);
                  setMessage("Waypoint path cleared.");
                }}
              >
                <RotateCcw size={17} />
                Clear Path
              </button>
            </details>

            <div className="battle-panel-heading">
              <span>Measure</span>
              <strong>Spell Range</strong>
            </div>

            <div className="battle-spell-summary">
              <span>{selectedToken ? `Origin: ${selectedToken.name}` : "Select a token"}</span>
              <strong>
                {spellPreviewTarget && spellOrigin
                  ? `${getSquareDistance(
                      spellOrigin.x,
                      spellOrigin.y,
                      spellPreviewTarget.x,
                      spellPreviewTarget.y,
                    ) * feetPerSquare} ft`
                  : `${spellRangeFeet} ft range`}
              </strong>
              <em>
                {spellName} · {spellDamage} · {aoeShapeLabels[aoeShape]}
                {aoeShape === "single" ? "" : ` ${aoeSizeFeet} ft`}
                {" · "}
                {spellResource === "free" ? "Free" : turnResourceLabels[spellResource]}
              </em>
              <small>{spellCoverStatus}</small>
            </div>

            <div className="battle-affected-list">
              <span>AOE Targets</span>
              {affectedTokens.length > 0 ? (
                affectedTokens.map((token) => (
                  <button
                    key={token.id}
                    type="button"
                    onClick={() => setSelectedTokenId(token.id)}
                  >
                    <strong>{token.name}</strong>
                    <em>
                      AC {token.ac ?? 10} · HP {token.hp}/{token.maxHp}
                    </em>
                  </button>
                ))
              ) : (
                <p>No tokens in the current effect.</p>
              )}
            </div>

            <details className="battle-compact-section">
              <summary>
                <span>Spells</span>
                <strong>Templates / Damage</strong>
              </summary>

              <div className="battle-spell-presets">
                {spellTemplates.map((template) => (
                  <button
                    key={template.name}
                    type="button"
                    onClick={() => applySpellTemplate(template)}
                  >
                    {template.name}
                  </button>
                ))}
              </div>

              <label className="battle-field">
                <span>Spell</span>
                <input value={spellName} onChange={(event) => setSpellName(event.target.value)} />
              </label>

              <label className="battle-field">
                <span>Damage / Effect</span>
                <input
                  value={spellDamage}
                  onChange={(event) => setSpellDamage(event.target.value)}
                />
              </label>

              <div className="battle-field-row">
                <label className="battle-field">
                  <span>Range ft</span>
                  <input
                    min={5}
                    step={5}
                    type="number"
                    value={spellRangeFeet}
                    onChange={(event) => setSpellRangeFeet(Math.max(5, Number(event.target.value)))}
                  />
                </label>
                <label className="battle-field">
                  <span>AOE ft</span>
                  <input
                    min={0}
                    step={5}
                    type="number"
                    value={aoeSizeFeet}
                    onChange={(event) => setAoeSizeFeet(Math.max(0, Number(event.target.value)))}
                  />
                </label>
              </div>

              <label className="battle-field">
                <span>Shape</span>
                <select value={aoeShape} onChange={(event) => setAoeShape(event.target.value as AoeShape)}>
                  {(Object.keys(aoeShapeLabels) as AoeShape[]).map((shape) => (
                    <option key={shape} value={shape}>
                      {aoeShapeLabels[shape]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="battle-field">
                <span>Consumes</span>
                <select value={spellResource} onChange={(event) => setSpellResource(event.target.value as SpellResource)}>
                  <option value="actionUsed">Action</option>
                  <option value="bonusActionUsed">Bonus Action</option>
                  <option value="reactionUsed">Reaction</option>
                  <option value="free">Free / No Cost</option>
                </select>
              </label>

              <div className="battle-field-row">
                <button
                  type="button"
                  className="battle-primary-button battle-primary-button-muted"
                  onClick={() => {
                    setMode("target");
                    setMessage("Hover or click a square to preview range and AOE.");
                  }}
                >
                  <Sparkles size={17} />
                  Preview
                </button>
                <button
                  type="button"
                  className="battle-primary-button battle-primary-button-muted"
                  onClick={() => {
                    setTargetCell(null);
                    setHoverTargetCell(null);
                    setMessage("Spell preview cleared.");
                  }}
                >
                  <RotateCcw size={17} />
                  Clear
                </button>
              </div>
              <div className="battle-field-row">
                <button type="button" className="battle-primary-button" onClick={placePersistentTemplate}>
                  <Plus size={17} />
                  Place
                </button>
                <button type="button" className="battle-danger-button" onClick={clearPlacedTemplates}>
                  <Trash2 size={17} />
                  Clear Areas
                </button>
              </div>
            </details>

            <details className="battle-compact-section">
              <summary>
                <span>Create</span>
                <strong>Add Token</strong>
              </summary>

              <label className="battle-field">
                <span>Name</span>
                <input value={newTokenName} onChange={(event) => setNewTokenName(event.target.value)} />
              </label>
              <label className="battle-field">
                <span>Team</span>
                <select
                  value={newTokenTeam}
                  onChange={(event) => setNewTokenTeam(event.target.value as TokenTeam)}
                >
                  <option value="players">Players</option>
                  <option value="enemies">Enemies</option>
                  <option value="neutral">Neutral</option>
                </select>
              </label>
              <button type="button" className="battle-primary-button" onClick={addToken}>
                <Plus size={17} />
                Add Token
              </button>

              <div className="battle-preset-grid">
                {tokenPresets.map((preset) => (
                  <button key={preset.name} type="button" onClick={() => addPresetToken(preset)}>
                    {preset.name}
                  </button>
                ))}
              </div>
            </details>

            <details className="battle-compact-section">
              <summary>
                <span>Map</span>
                <strong>Background / Scale</strong>
              </summary>

              <label className="battle-field">
                <span>Image URL</span>
                <input
                  value={boardSettings.backgroundUrl}
                  onChange={(event) =>
                    setBoardSettings((currentSettings) => ({
                      ...currentSettings,
                      backgroundUrl: event.target.value,
                    }))
                  }
                  placeholder="Paste battlemap image URL..."
                />
              </label>
              <div className="battle-field-row">
                <label className="battle-field">
                  <span>Ft / Square</span>
                  <input
                    min={1}
                    step={1}
                    type="number"
                    value={feetPerSquare}
                    onChange={(event) =>
                      setBoardSettings((currentSettings) => ({
                        ...currentSettings,
                        feetPerSquare: Math.max(1, Number(event.target.value)),
                      }))
                    }
                  />
                </label>
                <label className="battle-field">
                  <span>Diagonal</span>
                  <select
                    value={boardSettings.diagonalRule}
                    onChange={(event) =>
                      setBoardSettings((currentSettings) => ({
                        ...currentSettings,
                        diagonalRule: event.target.value as BoardSettings["diagonalRule"],
                      }))
                    }
                  >
                    <option value="standard">5 ft</option>
                    <option value="five-ten">5/10 ft</option>
                  </select>
                </label>
              </div>
            </details>

            <details className="battle-compact-section">
              <summary>
                <span>DM Prep</span>
                <strong>Saved Maps</strong>
              </summary>

              <div className="battle-saved-board-meta">
                <span>{savedBoards.length} saved</span>
                <strong>
                  {selectedSavedBoard
                    ? `Updated ${formatSavedBoardDate(selectedSavedBoard.updatedAt)}`
                    : "No map selected"}
                </strong>
              </div>

              <label className="battle-field">
                <span>Map Name</span>
                <input
                  value={boardName}
                  onChange={(event) => setBoardName(event.target.value)}
                  placeholder="Cave entrance, city square..."
                />
              </label>
              <label className="battle-field">
                <span>Prepared Maps</span>
                <select
                  value={selectedSavedBoardId}
                  onChange={(event) => {
                    const nextBoardId = event.target.value;
                    const nextBoard = savedBoards.find((board) => board.id === nextBoardId);

                    setSelectedSavedBoardId(nextBoardId);

                    if (nextBoard) {
                      setBoardName(nextBoard.name);
                    }
                  }}
                >
                  <option value="">Choose a saved map</option>
                  {savedBoards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="battle-field-row">
                <button type="button" className="battle-primary-button" onClick={() => saveNamedBoard()}>
                  <Save size={17} />
                  Save
                </button>
                <button type="button" className="battle-primary-button" onClick={() => loadNamedBoard()}>
                  <Upload size={17} />
                  Load
                </button>
              </div>
              <div className="battle-field-row">
                <button
                  type="button"
                  className="battle-primary-button battle-primary-button-muted"
                  onClick={() => saveNamedBoard({ asNew: true })}
                >
                  <Copy size={17} />
                  Save As
                </button>
                <button
                  type="button"
                  className="battle-primary-button battle-primary-button-muted"
                  onClick={startBlankBoard}
                >
                  <FilePlus size={17} />
                  Blank
                </button>
              </div>
              <button type="button" className="battle-danger-button" onClick={deleteNamedBoard}>
                <Trash2 size={17} />
                Delete Saved Map
              </button>
            </details>

            <details className="battle-compact-section">
              <summary>
                <span>Share</span>
                <strong>Export / Import</strong>
              </summary>

              <label className="battle-field">
                <span>Save Code</span>
                <textarea
                  value={shareCode}
                  onChange={(event) => setShareCode(event.target.value)}
                  placeholder="Export or paste a board code..."
                />
              </label>
              <div className="battle-field-row">
                <button type="button" className="battle-primary-button" onClick={exportBoardState}>
                  <Download size={17} />
                  Export
                </button>
                <button type="button" className="battle-primary-button" onClick={importBoardState}>
                  <Upload size={17} />
                  Import
                </button>
              </div>
              <button type="button" className="battle-danger-button" onClick={resetBoardState}>
                <RotateCcw size={17} />
                Reset Board
              </button>
            </details>
          </aside>

          <TacticalBoardGrid
            activeTokenId={activeTokenId}
            boardSettings={boardSettings}
            dragTokenId={dragTokenId}
            fog={fog}
            handleBoardDragOver={handleBoardDragOver}
            handleBoardDrop={handleBoardDrop}
            handleCellClick={handleCellClick}
            handleTokenDragEnd={handleTokenDragEnd}
            handleTokenDragStart={handleTokenDragStart}
            hoverCell={hoverCell}
            interactWithPin={interactWithPin}
            layers={layers}
            mode={mode}
            movementPathCells={movementPathCells}
            pins={pins}
            placedTemplateCells={placedTemplateCells}
            rulerCells={rulerCells}
            rulerStart={rulerStart}
            selectedOccupiedCells={selectedOccupiedCells}
            selectedReach={selectedReach}
            selectedToken={selectedToken}
            selectedTokenId={selectedTokenId}
            selectedVisionCells={selectedVisionCells}
            setHoverCell={setHoverCell}
            setHoverRulerCell={setHoverRulerCell}
            setHoverTargetCell={setHoverTargetCell}
            setSelectedTokenId={setSelectedTokenId}
            showDmNotes={showDmNotes}
            spellAffectedCells={spellAffectedCells}
            spellCoverStatus={spellCoverStatus}
            spellLineCells={spellLineCells}
            spellOrigin={spellOrigin}
            spellPreviewTarget={spellPreviewTarget}
            spellRangeCells={spellRangeCells}
            terrain={terrain}
            tokens={tokens}
            waypointCells={waypointCells}
          />

          <aside className="battle-board-panel">
            <div className="battle-panel-heading">
              <span>Initiative</span>
              <strong>{activeToken ? `${activeToken.name}'s Turn` : "No Turn"}</strong>
            </div>

            {activeToken && (
              <div className="battle-turn-card">
                <div className="battle-turn-token" style={{ background: activeToken.color }}>
                  {activeToken.team === "enemies" ? <Skull size={24} /> : <Shield size={24} />}
                </div>
                <div>
                  <span>Now Acting</span>
                  <strong>{activeToken.name}</strong>
                  <em>
                    Init {activeToken.initiative} · HP {activeToken.hp}/{activeToken.maxHp}
                  </em>
                </div>
              </div>
            )}

            {activeToken && (
              <div className="battle-turn-resources">
                {(["actionUsed", "bonusActionUsed", "reactionUsed"] as const).map((key) => {
                  const labels = {
                    actionUsed: "Action",
                    bonusActionUsed: "Bonus",
                    reactionUsed: "Reaction",
                  };
                  const used = Boolean(activeToken.turn?.[key]);

                  return (
                    <button
                      key={key}
                      type="button"
                      className={used ? "battle-resource-used" : ""}
                      onClick={() => {
                        setSelectedTokenId(activeToken.id);
                        updateTokenTurn(activeToken, { [key]: !used });
                      }}
                    >
                      {labels[key]}
                    </button>
                  );
                })}
                <label>
                  <span>Move Used</span>
                  <input
                    min={0}
                    step={5}
                    type="number"
                    value={activeToken.turn?.movementUsed ?? 0}
                    onChange={(event) => {
                      setSelectedTokenId(activeToken.id);
                      updateTokenTurn(activeToken, { movementUsed: Math.max(0, Number(event.target.value)) });
                    }}
                  />
                </label>
                <div className="battle-rule-summary">
                  <span>Remaining</span>
                  <strong>{getRemainingMovementFeet(activeToken)} ft</strong>
                </div>
                <label className="battle-rule-override">
                  <input
                    checked={ruleOverride}
                    type="checkbox"
                    onChange={(event) => setRuleOverride(event.target.checked)}
                  />
                  DM override
                </label>
              </div>
            )}

            <div className="battle-initiative-actions">
              <button
                type="button"
                className="battle-mode-button"
                onClick={() => advanceInitiative(-1)}
              >
                <ChevronLeft size={17} />
                Prev
              </button>
              <button type="button" className="battle-mode-button" onClick={sortInitiative}>
                Sort
              </button>
              <button
                type="button"
                className="battle-mode-button"
                onClick={() => advanceInitiative(1)}
              >
                Next
                <ChevronRight size={17} />
              </button>
            </div>

            <div className="battle-initiative-list">
              {validInitiativeOrder.map((tokenId, index) => {
                const token = tokens.find((currentToken) => currentToken.id === tokenId);

                if (!token) {
                  return null;
                }

                return (
                  <button
                    key={token.id}
                    type="button"
                    className={[
                      "battle-initiative-item",
                      activeTokenId === token.id ? "battle-initiative-item-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => {
                      setActiveInitiativeIndex(index);
                      setSelectedTokenId(token.id);
                      setMessage(`${token.name}'s turn.`);
                    }}
                  >
                    <span>{index + 1}</span>
                    <strong>{token.name}</strong>
                    <em>{token.initiative}</em>
                  </button>
                );
              })}
            </div>

            <details className="battle-compact-section">
              <summary>
                <span>History</span>
                <strong>Combat Log</strong>
              </summary>

              <div className="battle-combat-log">
                {combatLog.map((entry, index) => (
                  <p key={`${entry}-${index}`}>{entry}</p>
                ))}
              </div>
            </details>

            <div className="battle-panel-heading">
              <span>Selected</span>
              <strong>{selectedToken?.name ?? "No token"}</strong>
            </div>

            {selectedToken && (
              <>
                <div className="battle-token-card">
                  <div className="battle-token-avatar" style={{ background: selectedToken.color }}>
                    {selectedToken.team === "enemies" ? <Skull size={24} /> : <Swords size={24} />}
                  </div>
                  <div>
                    <strong>{selectedToken.name}</strong>
                    <span>{selectedToken.team}</span>
                  </div>
                </div>

                {getTurnOwnershipIssue(selectedToken) && (
                  <div className="battle-rule-warning">
                    <span>Turn ownership</span>
                    <strong>{getTurnOwnershipIssue(selectedToken)}</strong>
                  </div>
                )}

                <div className="battle-condition-row">
                  {(selectedToken.conditions ?? []).length > 0 ? (
                    selectedToken.conditions?.map((condition) => <span key={condition}>{condition}</span>)
                  ) : (
                    <em>No conditions</em>
                  )}
                </div>

                <div className="battle-field-row">
                  <label className="battle-field">
                    <span>HP</span>
                    <input
                      min={0}
                      type="number"
                      value={selectedToken.hp}
                      onChange={(event) =>
                        updateToken({
                          ...selectedToken,
                          hp: Math.max(0, Number(event.target.value)),
                        })
                      }
                    />
                  </label>
                  <label className="battle-field">
                    <span>Max HP</span>
                    <input
                      min={1}
                      type="number"
                      value={selectedToken.maxHp}
                      onChange={(event) =>
                        updateToken({
                          ...selectedToken,
                          maxHp: Math.max(1, Number(event.target.value)),
                        })
                      }
                    />
                  </label>
                </div>
                <div className="battle-field-row battle-hp-actions">
                  <button type="button" onClick={() => adjustSelectedHp(-1)}>-1</button>
                  <button type="button" onClick={() => adjustSelectedHp(-5)}>-5</button>
                  <button type="button" onClick={() => adjustSelectedHp(5)}>+5</button>
                  <button type="button" onClick={() => adjustSelectedHp(10)}>+10</button>
                </div>

                <div className="battle-condition-grid">
                  {conditionOptions.map((condition) => {
                    const active = selectedToken.conditions?.includes(condition);

                    return (
                      <button
                        key={condition}
                        type="button"
                        className={active ? "battle-condition-active" : ""}
                        onClick={() => toggleCondition(condition)}
                      >
                        {condition}
                      </button>
                    );
                  })}
                </div>

                <div className="battle-quick-actions">
                  <button type="button" onClick={() => quickCombatAction("Attack roll", "actionUsed")}>Attack</button>
                  <button
                    type="button"
                    onClick={() =>
                      quickCombatAction(
                        `${spellName || "Spell"} cast`,
                        spellResource === "free" ? undefined : spellResource,
                      )
                    }
                  >
                    Cast
                  </button>
                  <button type="button" onClick={() => quickCombatAction("Bonus action", "bonusActionUsed")}>Bonus</button>
                  <button type="button" onClick={() => quickCombatAction("Reaction", "reactionUsed")}>React</button>
                  <button type="button" onClick={() => quickCombatAction("Saving throw")}>Save</button>
                  <button type="button" onClick={() => quickCombatAction("Concentration check")}>Conc.</button>
                  <button type="button" onClick={() => quickCombatAction("Death save")}>Death</button>
                </div>

                <details className="battle-compact-section">
                  <summary>
                    <span>Details</span>
                    <strong>Edit Token</strong>
                  </summary>

                  <label className="battle-field">
                    <span>Name</span>
                    <input
                      value={selectedToken.name}
                      onChange={(event) =>
                        updateToken({
                          ...selectedToken,
                          name: event.target.value,
                        })
                      }
                    />
                  </label>
                  <div className="battle-field-row battle-field-row-three">
                    <label className="battle-field">
                      <span>AC</span>
                      <input
                        min={1}
                        type="number"
                        value={selectedToken.ac ?? 10}
                        onChange={(event) =>
                          updateToken({
                            ...selectedToken,
                            ac: Math.max(1, Number(event.target.value)),
                          })
                        }
                      />
                    </label>
                    <label className="battle-field">
                      <span>Speed</span>
                      <input
                        min={5}
                        step={5}
                        type="number"
                        value={selectedToken.speed}
                        onChange={(event) =>
                          updateToken({
                            ...selectedToken,
                            speed: Math.max(5, Number(event.target.value)),
                          })
                        }
                      />
                    </label>
                    <label className="battle-field">
                      <span>Size</span>
                      <select
                        value={selectedToken.size}
                        onChange={(event) =>
                          updateToken({
                            ...selectedToken,
                            size: Number(event.target.value),
                          })
                        }
                      >
                        <option value={1}>1 x 1</option>
                        <option value={2}>2 x 2</option>
                        <option value={3}>3 x 3</option>
                      </select>
                    </label>
                  </div>
                  <label className="battle-field">
                    <span>Initiative</span>
                    <input
                      type="number"
                      value={selectedToken.initiative}
                      onChange={(event) =>
                        updateToken({
                          ...selectedToken,
                          initiative: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="battle-field">
                    <span>Vision ft</span>
                    <input
                      min={0}
                      step={5}
                      type="number"
                      value={selectedToken.visionFeet ?? 60}
                      onChange={(event) =>
                        updateToken({
                          ...selectedToken,
                          visionFeet: Math.max(0, Number(event.target.value)),
                        })
                      }
                    />
                  </label>
                  <label className="battle-field">
                    <span>Notes</span>
                    <textarea
                      value={selectedToken.notes ?? ""}
                      onChange={(event) =>
                        updateToken({
                          ...selectedToken,
                          notes: event.target.value,
                        })
                      }
                      placeholder="Concentration, cover, readied action..."
                    />
                  </label>
                  <div className="battle-stat-grid">
                    <div>
                      <span>Position</span>
                      <strong>
                        {selectedToken.x + 1}, {selectedToken.y + 1}
                      </strong>
                    </div>
                    <div>
                      <span>Move</span>
                      <strong>{selectedMovementRemaining} ft left</strong>
                    </div>
                    <div>
                      <span>Distance</span>
                      <strong>{feetPerSquare} ft</strong>
                    </div>
                    <div>
                      <span>Board</span>
                      <strong>
                        {boardColumns} x {boardRows}
                      </strong>
                    </div>
                  </div>
                  <button type="button" className="battle-danger-button" onClick={removeSelectedToken}>
                    <Trash2 size={17} />
                    Remove Token
                  </button>
                </details>
              </>
            )}
          </aside>
        </div>
      </section>
    </AppLayout>
  );
}

export { TacticalBoardPage };
