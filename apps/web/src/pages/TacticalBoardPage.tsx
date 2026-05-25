import {
  Castle,
  ChevronLeft,
  ChevronRight,
  Download,
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
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, DragEvent } from "react";
import { AppLayout } from "../components/layout/AppLayout";

type BoardTerrain = "normal" | "difficult" | "wall" | "water" | "forest";
type BoardMode = BoardTerrain | "move";
type TokenTeam = "players" | "enemies" | "neutral";

type BoardToken = {
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
};

type SavedBoardState = {
  tokens: BoardToken[];
  terrain: Record<string, BoardTerrain>;
  selectedTokenId: string;
  initiativeOrder: string[];
  activeInitiativeIndex: number;
};

type SavedBoardEntry = {
  id: string;
  name: string;
  updatedAt: string;
  state: SavedBoardState;
};

const boardColumns = 18;
const boardRows = 12;
const cellDistance = 5;
const boardStorageKey = "dd-simple.tactical-board-state";
const savedBoardsStorageKey = "dd-simple.saved-tactical-boards";

const terrainLabels: Record<BoardTerrain, string> = {
  normal: "Normal",
  difficult: "Difficult",
  wall: "Wall",
  water: "Water",
  forest: "Forest",
};

const terrainIcons = {
  normal: Sparkles,
  difficult: Mountain,
  wall: Castle,
  water: Waves,
  forest: Trees,
};

const initialTokens: BoardToken[] = [
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

const initialTerrain: Record<string, BoardTerrain> = {
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

function TacticalBoardPage() {
  const savedBoardState = useMemo(() => loadSavedBoardState(), []);
  const initialSavedBoards = useMemo(() => loadSavedBoardEntries(), []);
  const [tokens, setTokens] = useState(savedBoardState?.tokens ?? initialTokens);
  const [terrain, setTerrain] = useState<Record<string, BoardTerrain>>(
    savedBoardState?.terrain ?? initialTerrain,
  );
  const [selectedTokenId, setSelectedTokenId] = useState(
    savedBoardState?.selectedTokenId ?? initialTokens[0].id,
  );
  const [initiativeOrder, setInitiativeOrder] = useState(
    savedBoardState?.initiativeOrder ?? initialTokens.map((token) => token.id),
  );
  const [activeInitiativeIndex, setActiveInitiativeIndex] = useState(
    savedBoardState?.activeInitiativeIndex ?? 0,
  );
  const [dragTokenId, setDragTokenId] = useState<string | null>(null);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number; valid: boolean } | null>(
    null,
  );
  const [mode, setMode] = useState<BoardMode>("move");
  const [newTokenName, setNewTokenName] = useState("New Hero");
  const [newTokenTeam, setNewTokenTeam] = useState<TokenTeam>("players");
  const [shareCode, setShareCode] = useState("");
  const [savedBoards, setSavedBoards] = useState(initialSavedBoards);
  const [boardName, setBoardName] = useState(initialSavedBoards[0]?.name ?? "Forest Road");
  const [selectedSavedBoardId, setSelectedSavedBoardId] = useState(initialSavedBoards[0]?.id ?? "");
  const [message, setMessage] = useState("Drag tokens on the board or paint terrain.");

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
  const selectedReach = selectedToken ? Math.floor(selectedToken.speed / cellDistance) : 0;
  const selectedOccupiedCells = useMemo(
    () => (selectedToken ? getOccupiedCells(selectedToken) : []),
    [selectedToken],
  );

  useEffect(() => {
    const state: SavedBoardState = {
      tokens,
      terrain,
      selectedTokenId,
      initiativeOrder: validInitiativeOrder,
      activeInitiativeIndex,
    };

    localStorage.setItem(boardStorageKey, JSON.stringify(state));
  }, [activeInitiativeIndex, selectedTokenId, terrain, tokens, validInitiativeOrder]);

  useEffect(() => {
    localStorage.setItem(savedBoardsStorageKey, JSON.stringify(savedBoards));
  }, [savedBoards]);

  useEffect(() => {
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
    const valid = canPlaceToken(candidate, tokens, terrain);

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

    updateToken(nextToken);
    setHoverCell(null);
    setMessage(`${draggedToken.name} moved to ${cell.x + 1}, ${cell.y + 1}.`);
  }

  function handleCellClick(x: number, y: number) {
    if (mode === "move") {
      return;
    }

    const key = getCellKey(x, y);

    setTerrain((currentTerrain) => {
      if (mode === "normal") {
        const { [key]: _removed, ...remainingTerrain } = currentTerrain;
        return remainingTerrain;
      }

      return {
        ...currentTerrain,
        [key]: mode,
      };
    });
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
      selectedTokenId,
      initiativeOrder: validInitiativeOrder,
      activeInitiativeIndex,
    };
  }

  function applyBoardState(state: SavedBoardState, nextMessage: string) {
    setTokens(state.tokens);
    setTerrain(state.terrain);
    setSelectedTokenId(state.selectedTokenId);
    setInitiativeOrder(state.initiativeOrder);
    setActiveInitiativeIndex(state.activeInitiativeIndex);
    setMessage(nextMessage);
  }

  function saveNamedBoard() {
    const name = boardName.trim();

    if (!name) {
      setMessage("Board needs a name before saving.");
      return;
    }

    const nextEntry: SavedBoardEntry = {
      id: selectedSavedBoardId || `board-${Date.now()}`,
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
    setMessage(`${name} saved.`);
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
    setSelectedTokenId(initialTokens[0].id);
    setInitiativeOrder(initialTokens.map((token) => token.id));
    setActiveInitiativeIndex(0);
    setShareCode("");
    setMessage("Board reset to the prototype encounter.");
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
    <AppLayout variant="wide-left">
      <section className="battle-board-workbench">
        <header className="battle-board-header">
          <div>
            <p className="eyebrow">Battle Map Prototype</p>
            <h1>Tactical Encounter Board</h1>
          </div>
          <span className="battle-board-status">{message}</span>
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

            <div className="battle-panel-heading">
              <span>Create</span>
              <strong>Add Token</strong>
            </div>

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

            <div className="battle-panel-heading">
              <span>Save</span>
              <strong>Saved Boards</strong>
            </div>

            <label className="battle-field">
              <span>Board Name</span>
              <input
                value={boardName}
                onChange={(event) => setBoardName(event.target.value)}
                placeholder="Cave entrance, city square..."
              />
            </label>
            <label className="battle-field">
              <span>Load Saved Board</span>
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
                <option value="">No saved board selected</option>
                {savedBoards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="battle-field-row">
              <button type="button" className="battle-primary-button" onClick={saveNamedBoard}>
                <Save size={17} />
                Save
              </button>
              <button type="button" className="battle-primary-button" onClick={() => loadNamedBoard()}>
                <Upload size={17} />
                Load
              </button>
            </div>
            <button type="button" className="battle-danger-button" onClick={deleteNamedBoard}>
              <Trash2 size={17} />
              Delete Saved Board
            </button>

            <div className="battle-panel-heading">
              <span>Share</span>
              <strong>Share Board</strong>
            </div>

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
          </aside>

          <div
            className="battle-board"
            style={
              {
                "--board-columns": boardColumns,
                "--board-rows": boardRows,
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
              const terrainType = terrain[getCellKey(x, y)] ?? "normal";
              const isInReach =
                selectedToken &&
                mode === "move" &&
                getGridDistance(selectedToken.x, selectedToken.y, x, y) <= selectedReach;
              const isOccupiedBySelected = selectedOccupiedCells.some(
                (cell) => cell.x === x && cell.y === y,
              );

              return (
                <button
                  key={getCellKey(x, y)}
                  type="button"
                  className={[
                    "battle-cell",
                    `battle-cell-${terrainType}`,
                    isInReach ? "battle-cell-reachable" : "",
                    isOccupiedBySelected ? "battle-cell-selected-occupied" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => handleCellClick(x, y)}
                />
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

            {tokens.map((token) => (
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
              </button>
            ))}
          </div>

          <aside className="battle-board-panel">
            <div className="battle-panel-heading">
              <span>Initiative</span>
              <strong>{activeToken ? `${activeToken.name}'s Turn` : "No Turn"}</strong>
            </div>

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
                <div className="battle-field-row">
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
                <div className="battle-stat-grid">
                  <div>
                    <span>Position</span>
                    <strong>
                      {selectedToken.x + 1}, {selectedToken.y + 1}
                    </strong>
                  </div>
                  <div>
                    <span>Move</span>
                    <strong>{selectedReach} cells</strong>
                  </div>
                  <div>
                    <span>Distance</span>
                    <strong>{cellDistance} ft</strong>
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
              </>
            )}
          </aside>
        </div>
      </section>
    </AppLayout>
  );
}

function getCellKey(x: number, y: number) {
  return `${x}:${y}`;
}

function getOccupiedCells(token: BoardToken) {
  const cells: Array<{ x: number; y: number }> = [];

  for (let y = token.y; y < token.y + token.size; y += 1) {
    for (let x = token.x; x < token.x + token.size; x += 1) {
      cells.push({ x, y });
    }
  }

  return cells;
}

function getGridDistance(fromX: number, fromY: number, toX: number, toY: number) {
  return Math.abs(fromX - toX) + Math.abs(fromY - toY);
}

function canPlaceToken(
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

function tokensOverlap(leftToken: BoardToken, rightToken: BoardToken) {
  return (
    leftToken.x < rightToken.x + rightToken.size &&
    leftToken.x + leftToken.size > rightToken.x &&
    leftToken.y < rightToken.y + rightToken.size &&
    leftToken.y + leftToken.size > rightToken.y
  );
}

function findTokenSpace(
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

function loadSavedBoardState(): SavedBoardState | null {
  try {
    const rawState = localStorage.getItem(boardStorageKey);

    if (!rawState) {
      return null;
    }

    return parseBoardState(rawState);
  } catch {
    return null;
  }
}

function parseBoardState(rawState: string): SavedBoardState | null {
  try {
    const parsedState = JSON.parse(rawState) as SavedBoardState;

    return normalizeBoardState(parsedState);
  } catch {
    return null;
  }
}

function normalizeBoardState(state: SavedBoardState): SavedBoardState | null {
  if (!Array.isArray(state.tokens) || typeof state.terrain !== "object" || !state.terrain) {
    return null;
  }

  const tokens = state.tokens.map((token) => ({
    ...token,
    initiative: Number.isFinite(token.initiative) ? token.initiative : 10,
    maxHp: Math.max(1, token.maxHp || 1),
    hp: Math.max(0, token.hp || 0),
    size: Math.max(1, Math.min(3, token.size || 1)),
    speed: Math.max(5, token.speed || 30),
  }));
  const tokenIds = new Set(tokens.map((token) => token.id));
  const savedInitiativeOrder = Array.isArray(state.initiativeOrder) ? state.initiativeOrder : [];
  const initiativeOrder = [
    ...savedInitiativeOrder.filter((tokenId) => tokenIds.has(tokenId)),
    ...tokens.filter((token) => !savedInitiativeOrder.includes(token.id)).map((token) => token.id),
  ];

  return {
    tokens,
    terrain: state.terrain,
    selectedTokenId: tokenIds.has(state.selectedTokenId) ? state.selectedTokenId : tokens[0]?.id ?? "",
    initiativeOrder,
    activeInitiativeIndex:
      initiativeOrder.length > 0
        ? Math.max(0, Math.min(initiativeOrder.length - 1, state.activeInitiativeIndex || 0))
        : 0,
  };
}

function encodeBoardState(state: SavedBoardState) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBoardState(code: string): SavedBoardState | null {
  try {
    const normalizedCode = code.trim().replace(/-/g, "+").replace(/_/g, "/");
    const paddedCode = normalizedCode.padEnd(
      normalizedCode.length + ((4 - (normalizedCode.length % 4)) % 4),
      "=",
    );
    const binary = atob(paddedCode);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsedState = JSON.parse(json) as SavedBoardState;

    return normalizeBoardState(parsedState);
  } catch {
    return null;
  }
}

function loadSavedBoardEntries(): SavedBoardEntry[] {
  try {
    const rawEntries = localStorage.getItem(savedBoardsStorageKey);

    if (!rawEntries) {
      return [];
    }

    const parsedEntries = JSON.parse(rawEntries) as SavedBoardEntry[];

    if (!Array.isArray(parsedEntries)) {
      return [];
    }

    return parsedEntries
      .map((entry) => {
        const state = normalizeBoardState(entry.state);

        if (!state || !entry.id || !entry.name) {
          return null;
        }

        return {
          id: entry.id,
          name: entry.name,
          updatedAt: entry.updatedAt || new Date(0).toISOString(),
          state,
        };
      })
      .filter((entry): entry is SavedBoardEntry => Boolean(entry))
      .sort((leftEntry, rightEntry) => rightEntry.updatedAt.localeCompare(leftEntry.updatedAt));
  } catch {
    return [];
  }
}

export { TacticalBoardPage };
