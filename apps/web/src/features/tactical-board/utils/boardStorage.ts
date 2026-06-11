import {
  boardStorageKey,
  conditionOptions,
  defaultLayers,
  defaultSettings,
  defaultTurnState,
  pinTypeLabels,
  savedBoardsStorageKey,
} from "../data/boardConstants";
import type { MapPin, PinType, SavedBoardEntry, SavedBoardState, TokenCondition } from "../types/board";

export function loadSavedBoardState(): SavedBoardState | null {
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

export function parseBoardState(rawState: string): SavedBoardState | null {
  try {
    const parsedState = JSON.parse(rawState) as SavedBoardState;

    return normalizeBoardState(parsedState);
  } catch {
    return null;
  }
}

export function normalizePins(pins: SavedBoardState["pins"] = {}) {
  if (!pins || typeof pins !== "object") {
    return {};
  }

  return Object.entries(pins).reduce<Record<string, MapPin>>((normalizedPins, [key, value]) => {
    if (typeof value === "string") {
      normalizedPins[key] = {
        label: value,
        type: "note",
        hidden: false,
      };
      return normalizedPins;
    }

    if (value && typeof value === "object") {
      normalizedPins[key] = {
        label: value.label || pinTypeLabels[value.type as PinType] || "Note",
        type: Object.keys(pinTypeLabels).includes(value.type as PinType) ? value.type : "note",
        hidden: Boolean(value.hidden),
        open: Boolean(value.open),
      };
    }

    return normalizedPins;
  }, {});
}

export function normalizeBoardState(state: SavedBoardState): SavedBoardState | null {
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
    ac: Math.max(1, token.ac || 10),
    notes: token.notes ?? "",
    conditions: Array.isArray(token.conditions)
      ? token.conditions.filter((condition): condition is TokenCondition =>
          conditionOptions.includes(condition as TokenCondition),
        )
      : [],
    turn: {
      ...defaultTurnState,
      ...(token.turn ?? {}),
      movementUsed: Math.max(0, token.turn?.movementUsed ?? 0),
    },
    visionFeet: Math.max(0, token.visionFeet ?? 60),
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
    fog: typeof state.fog === "object" && state.fog ? state.fog : {},
    pins: normalizePins(state.pins ?? {}),
    templates: Array.isArray(state.templates) ? state.templates : [],
    layers: { ...defaultLayers, ...(state.layers ?? {}) },
    settings: { ...defaultSettings, ...(state.settings ?? {}) },
    selectedTokenId: tokenIds.has(state.selectedTokenId) ? state.selectedTokenId : tokens[0]?.id ?? "",
    initiativeOrder,
    activeInitiativeIndex:
      initiativeOrder.length > 0
        ? Math.max(0, Math.min(initiativeOrder.length - 1, state.activeInitiativeIndex || 0))
        : 0,
  };
}

export function encodeBoardState(state: SavedBoardState) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeBoardState(code: string): SavedBoardState | null {
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

export function formatSavedBoardDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function loadSavedBoardEntries(): SavedBoardEntry[] {
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
