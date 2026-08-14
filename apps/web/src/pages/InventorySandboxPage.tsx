import {
  Archive,
  Backpack,
  Crown,
  Footprints,
  Gem,
  Hand,
  PackageOpen,
  Plus,
  RotateCw,
  Save,
  Search,
  Shield,
  Shirt,
  Sparkles,
  Sword,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, DragEvent, KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../features/auth/AuthContext";
import { secureRandomId } from "../lib/secureRandom";
import {
  fetchCharacterInventory,
  fetchCharacterInventoryState,
  saveCharacterFullInventory,
  type CharacterInventorySaveItem,
} from "../features/characters/api/characterInventory";
import { fetchEquipment } from "../features/references/api/fetchReferences";
import type { ReferenceEquipment } from "../types/reference";
import {
  deriveReferenceEquipmentEffects,
  extractEquipmentDescription,
  summarizeReferenceEquipmentEffects,
} from "../features/characters/utils/inventoryReferenceEffects";

type ContainerId = string;
type EquipmentSlotId =
  | "head"
  | "body"
  | "mainHand"
  | "offHand"
  | "hands"
  | "feet"
  | "accessory1"
  | "accessory2"
  | "accessory3";
type ItemLocation = ContainerId | "equipped";
type ItemKind = "armor" | "weapon" | "tool" | "consumable" | "treasure";

type InventoryItem = {
  id: string;
  name: string;
  kind: ItemKind;
  width: number;
  height: number;
  location: ItemLocation;
  x: number;
  y: number;
  rotated: boolean;
  color: string;
  quantity: number;
  stackable: boolean;
  maxStack: number;
  weight: number;
  value: number;
  valueUnit?: string;
  rarity: string;
  armorClassBonus: number;
  attackBonus: number;
  damage: string;
  speedPenalty: number;
  notes: string;
  requiresAttunement?: boolean;
  attuned?: boolean;
  equipmentSlot?: EquipmentSlotId;
  equippedSlot?: EquipmentSlotId;
  referenceEquipmentIndex?: string;
};

type InventoryContainer = {
  id: ContainerId;
  name: string;
  columns: number;
  rows: number;
};

type DragPayload = {
  id: string;
};

type HoverPreview = {
  containerId: ContainerId;
  x: number;
  y: number;
  width: number;
  height: number;
  valid: boolean;
};

type NewItemForm = {
  color: string;
  equipmentSlot: EquipmentSlotId | "none";
  height: number;
  kind: ItemKind;
  location: ContainerId;
  name: string;
  quantity: number;
  requiresAttunement: boolean;
  stackable: boolean;
  maxStack: number;
  width: number;
};

type SavedInventoryState = {
  containers: InventoryContainer[];
  items: InventoryItem[];
  selectedItemId: string;
  updatedAt?: number;
};

type ItemTemplate = Omit<NewItemForm, "location" | "requiresAttunement"> & {
  id: string;
  armorClassBonus: number;
  attackBonus: number;
  damage: string;
  notes: string;
  requiresAttunement?: boolean;
  rarity: string;
  speedPenalty: number;
  value: number;
  weight: number;
};

type InventoryToolPanel =
  | "selected"
  | "share"
  | "manage"
  | "createChest"
  | "createItem"
  | null;

type InventoryLibraryType =
  | "all"
  | "armor"
  | "potion"
  | "ring"
  | "rod"
  | "scroll"
  | "staff"
  | "wand"
  | "weapon"
  | "wondrous"
  | "other";

type BackendCharacterInventoryItem = Awaited<ReturnType<typeof fetchCharacterInventory>>[number];

const inventoryStorageKey = "dd-simple.inventory-sandbox.v1";
const inventoryDashboardStoragePrefix = "dd-simple.character-inventory.v1";
const inventoryBackendAutosaveDelayMs = 1200;
const defaultAttunementLimit = 3;

const inventoryLibraryTypeOptions: Array<{ id: InventoryLibraryType; label: string }> = [
  { id: "armor", label: "Armor" },
  { id: "potion", label: "Potion" },
  { id: "ring", label: "Ring" },
  { id: "rod", label: "Rod" },
  { id: "scroll", label: "Scroll" },
  { id: "staff", label: "Staff" },
  { id: "wand", label: "Wand" },
  { id: "weapon", label: "Weapon" },
  { id: "wondrous", label: "Wondrous" },
  { id: "other", label: "Other Gear" },
];

const initialContainers: InventoryContainer[] = [
  {
    id: "inventory",
    name: "Character Inventory",
    columns: 10,
    rows: 6,
  },
  {
    id: "chest",
    name: "Ironbound Chest",
    columns: 8,
    rows: 5,
  },
];

const equipmentSlots: Array<{
  id: EquipmentSlotId;
  label: string;
  accepts: ItemKind[];
}> = [
  { id: "head", label: "Head", accepts: ["armor", "treasure"] },
  { id: "body", label: "Armor", accepts: ["armor"] },
  { id: "mainHand", label: "Main Hand", accepts: ["weapon", "tool", "consumable"] },
  { id: "offHand", label: "Off Hand", accepts: ["armor", "weapon"] },
  { id: "hands", label: "Hands", accepts: ["armor", "treasure"] },
  { id: "feet", label: "Feet", accepts: ["armor", "treasure"] },
  { id: "accessory1", label: "Accessory 1", accepts: ["treasure", "armor", "tool"] },
  { id: "accessory2", label: "Accessory 2", accepts: ["treasure", "armor", "tool"] },
  { id: "accessory3", label: "Accessory 3", accepts: ["treasure", "armor", "tool"] },
];

const initialItems: InventoryItem[] = [
  {
    id: "steel-sword",
    name: "Steel Longsword",
    kind: "weapon",
    width: 1,
    height: 3,
    location: "inventory",
    x: 0,
    y: 0,
    rotated: false,
    color: "#9ca3af",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 3,
    value: 15,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 1,
    damage: "1d8 slashing",
    speedPenalty: 0,
    notes: "A versatile blade for close combat.",
    equipmentSlot: "mainHand",
  },
  {
    id: "round-shield",
    name: "Round Shield",
    kind: "weapon",
    width: 2,
    height: 2,
    location: "inventory",
    x: 2,
    y: 0,
    rotated: false,
    color: "#60a5fa",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 6,
    value: 10,
    rarity: "Common",
    armorClassBonus: 2,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Raises armor class while equipped.",
    equipmentSlot: "offHand",
  },
  {
    id: "chainmail",
    name: "Chainmail",
    kind: "armor",
    width: 2,
    height: 3,
    location: "inventory",
    x: 4,
    y: 0,
    rotated: false,
    color: "#94a3b8",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 55,
    value: 75,
    rarity: "Common",
    armorClassBonus: 6,
    attackBonus: 0,
    damage: "",
    speedPenalty: 10,
    notes: "Heavy protective armor with a movement penalty.",
    equipmentSlot: "body",
  },
  {
    id: "healing-potion",
    name: "Healing Potion",
    kind: "consumable",
    width: 1,
    height: 1,
    location: "inventory",
    x: 7,
    y: 0,
    rotated: false,
    color: "#f87171",
    quantity: 3,
    stackable: true,
    maxStack: 10,
    weight: 0.5,
    value: 50,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Restores hit points when consumed.",
  },
  {
    id: "traveler-boots",
    name: "Traveler Boots",
    kind: "armor",
    width: 2,
    height: 1,
    location: "chest",
    x: 0,
    y: 0,
    rotated: false,
    color: "#a16207",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 2,
    value: 2,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Reliable boots for long travel.",
    equipmentSlot: "feet",
  },
  {
    id: "warhammer",
    name: "Warhammer",
    kind: "weapon",
    width: 2,
    height: 3,
    location: "chest",
    x: 3,
    y: 0,
    rotated: false,
    color: "#f59e0b",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 2,
    value: 15,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "1d8 bludgeoning",
    speedPenalty: 0,
    notes: "A blunt weapon with a heavy strike.",
    equipmentSlot: "mainHand",
  },
  {
    id: "lockpicks",
    name: "Lockpicks",
    kind: "tool",
    width: 2,
    height: 1,
    location: "chest",
    x: 0,
    y: 2,
    rotated: false,
    color: "#34d399",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 1,
    value: 25,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Useful for locks and traps.",
  },
  {
    id: "ruby-cache",
    name: "Ruby Cache",
    kind: "treasure",
    width: 1,
    height: 2,
    location: "chest",
    x: 6,
    y: 1,
    rotated: false,
    color: "#fb7185",
    quantity: 6,
    stackable: true,
    maxStack: 999,
    weight: 0.1,
    value: 100,
    rarity: "Uncommon",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "A small cache of cut rubies.",
  },
];

const itemTemplates: ItemTemplate[] = [
  {
    id: "healing-potion",
    name: "Healing Potion",
    kind: "consumable",
    width: 1,
    height: 1,
    color: "#f87171",
    equipmentSlot: "none",
    quantity: 3,
    stackable: true,
    maxStack: 10,
    weight: 0.5,
    value: 50,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Restores hit points when consumed.",
  },
  {
    id: "arrows",
    name: "Arrows",
    kind: "weapon",
    width: 1,
    height: 2,
    color: "#d97706",
    equipmentSlot: "none",
    quantity: 20,
    stackable: true,
    maxStack: 20,
    weight: 0.05,
    value: 1,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "A bundle of ammunition.",
  },
  {
    id: "gold-coins",
    name: "Gold Coins",
    kind: "treasure",
    width: 1,
    height: 1,
    color: "#facc15",
    equipmentSlot: "none",
    quantity: 100,
    stackable: true,
    maxStack: 999,
    weight: 0.02,
    value: 1,
    rarity: "Currency",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Spendable gold pieces.",
  },
  {
    id: "longsword",
    name: "Longsword",
    kind: "weapon",
    width: 1,
    height: 3,
    color: "#9ca3af",
    equipmentSlot: "mainHand",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 3,
    value: 15,
    rarity: "Common",
    armorClassBonus: 0,
    attackBonus: 1,
    damage: "1d8 slashing",
    speedPenalty: 0,
    notes: "A dependable martial weapon.",
  },
  {
    id: "shield",
    name: "Shield",
    kind: "weapon",
    width: 2,
    height: 2,
    color: "#60a5fa",
    equipmentSlot: "offHand",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 6,
    value: 10,
    rarity: "Common",
    armorClassBonus: 2,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "Adds protection when equipped.",
  },
  {
    id: "chainmail",
    name: "Chainmail",
    kind: "armor",
    width: 2,
    height: 3,
    color: "#94a3b8",
    equipmentSlot: "body",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 55,
    value: 75,
    rarity: "Common",
    armorClassBonus: 6,
    attackBonus: 0,
    damage: "",
    speedPenalty: 10,
    notes: "Heavy armor with a movement penalty.",
  },
  {
    id: "spell-scroll",
    name: "Spell Scroll",
    kind: "consumable",
    width: 1,
    height: 2,
    color: "#c084fc",
    equipmentSlot: "none",
    quantity: 1,
    stackable: true,
    maxStack: 5,
    weight: 0.1,
    value: 75,
    rarity: "Uncommon",
    armorClassBonus: 0,
    attackBonus: 0,
    damage: "",
    speedPenalty: 0,
    notes: "A prepared spell written onto a scroll.",
  },
  {
    id: "ring-of-protection",
    name: "Ring of Protection",
    kind: "treasure",
    width: 1,
    height: 1,
    color: "#38bdf8",
    equipmentSlot: "none",
    quantity: 1,
    stackable: false,
    maxStack: 1,
    weight: 0,
    value: 3500,
    rarity: "Rare",
    armorClassBonus: 1,
    attackBonus: 0,
    damage: "",
    requiresAttunement: true,
    speedPenalty: 0,
    notes: "Requires attunement. Grants a protective magical bonus while worn.",
  },
];

function useInventorySandboxController(
  storageScope = "sandbox",
  backendCharacterId?: string,
  attunementLimit = defaultAttunementLimit,
) {
  const { token } = useAuth();
  const storageKey = useMemo(() => getInventoryStorageKey(storageScope), [storageScope]);
  const savedInventoryState = useMemo(() => loadSavedInventoryState(storageKey), [storageKey]);
  const savedInventoryItems = useMemo(
    () =>
      savedInventoryState
        ? enforceAttunementLimit(savedInventoryState.items, attunementLimit)
        : initialItems,
    [attunementLimit, savedInventoryState],
  );
  const skipNextPersistRef = useRef(false);
  const skipNextBackendPersistRef = useRef(true);
  const backendEnabled = Boolean(backendCharacterId && token);
  const [containers, setContainers] = useState(
    savedInventoryState?.containers ?? initialContainers,
  );
  const [items, setItems] = useState(savedInventoryItems);
  const [persistedItems, setPersistedItems] = useState(savedInventoryItems);
  const [selectedItemId, setSelectedItemId] = useState(
    savedInventoryState?.selectedItemId ?? initialItems[0].id,
  );
  const [dragItemId, setDragItemId] = useState<string | null>(null);
  const [hoverPreview, setHoverPreview] = useState<HoverPreview | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [newChestName, setNewChestName] = useState("Stash Chest");
  const [newChestColumns, setNewChestColumns] = useState(6);
  const [newChestRows, setNewChestRows] = useState(4);
  const [newItemForm, setNewItemForm] = useState<NewItemForm>({
    color: "#38bdf8",
    equipmentSlot: "none",
    height: 2,
    kind: "treasure",
    location: "inventory",
    name: "Custom Relic",
    quantity: 1,
    requiresAttunement: false,
    stackable: false,
    maxStack: 1,
    width: 2,
  });
  const [splitAmount, setSplitAmount] = useState(1);
  const [shareCode, setShareCode] = useState("");
  const [message, setMessage] = useState("Drag items between grids, rotate them, or drop gear on equipment slots.");
  const [backendSaving, setBackendSaving] = useState(false);
  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;
  const attunedItems = useMemo(
    () => items.filter((item) => item.requiresAttunement && item.attuned),
    [items],
  );
  const equippedItems = useMemo(
    () => new Map(items.filter((item) => item.location === "equipped").map((item) => [item.equippedSlot, item])),
    [items],
  );

  useEffect(() => {
    const nextState = loadSavedInventoryState(storageKey);

    skipNextPersistRef.current = true;
    setContainers(nextState?.containers ?? initialContainers);
    const nextItems = nextState
      ? enforceAttunementLimit(nextState.items, attunementLimit)
      : initialItems;
    setItems(nextItems);
    setPersistedItems(nextItems);
    setSelectedItemId(nextState?.selectedItemId ?? initialItems[0].id);
    setDragItemId(null);
    setHoverPreview(null);
    setMergeTargetId(null);
  }, [attunementLimit, storageKey]);

  useEffect(() => {
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }

    const state: SavedInventoryState = {
      containers,
      items,
      selectedItemId,
      updatedAt: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [containers, items, selectedItemId, storageKey]);

  useEffect(() => {
    async function loadBackendInventory() {
      if (!backendCharacterId || !token) {
        return;
      }

      async function restoreNewerLocalState(localState: SavedInventoryState) {
        const recoveredItems = enforceAttunementLimit(
          localState.items,
          attunementLimit,
        );
        const recoveredState = {
          ...localState,
          items: recoveredItems,
        };
        const recoveredBackendItems = recoveredItems
          .map(mapGridItemToBackendInventoryItem)
          .filter((item): item is CharacterInventorySaveItem => Boolean(item));

        skipNextPersistRef.current = true;
        skipNextBackendPersistRef.current = true;
        setContainers(recoveredState.containers);
        setItems(recoveredItems);
        setPersistedItems(recoveredItems);
        setSelectedItemId(recoveredState.selectedItemId);
        setBackendSaving(true);

        try {
          await saveCharacterFullInventory(
            backendCharacterId!,
            recoveredBackendItems,
            encodeInventoryState(recoveredState),
            token!,
          );
          setMessage("Recovered and saved the latest local inventory changes.");
        } finally {
          setBackendSaving(false);
        }
      }

      try {
        const stateResponse = await fetchCharacterInventoryState(backendCharacterId, token);
        const localState = loadSavedInventoryState(storageKey);

        if (stateResponse.stateCode) {
          const decodedState = decodeInventoryState(stateResponse.stateCode);

          if (decodedState) {
            if (localState && shouldPreferLocalInventoryState(localState, decodedState)) {
              await restoreNewerLocalState(localState);
              return;
            }

            const decodedItems = enforceAttunementLimit(decodedState.items, attunementLimit);
            const normalizedBackendState = {
              ...decodedState,
              items: decodedItems,
            };

            skipNextPersistRef.current = true;
            skipNextBackendPersistRef.current = true;
            localStorage.setItem(storageKey, JSON.stringify(normalizedBackendState));
            setContainers(decodedState.containers);
            setItems(decodedItems);
            setPersistedItems(decodedItems);
            setSelectedItemId(decodedState.selectedItemId);
            setMessage("Inventory layout loaded from character database.");
            return;
          }
        }

        if (localState && shouldPreferLocalInventoryState(localState, null)) {
          await restoreNewerLocalState(localState);
          return;
        }

        const backendItems = await fetchCharacterInventory(backendCharacterId, token);
        const nextItems = backendItems.map(mapBackendInventoryItemToGridItem);
        const fallbackState: SavedInventoryState = {
          containers: initialContainers,
          items: nextItems,
          selectedItemId: nextItems[0]?.id ?? "",
          updatedAt: Date.now(),
        };

        skipNextPersistRef.current = true;
        skipNextBackendPersistRef.current = true;
        localStorage.setItem(storageKey, JSON.stringify(fallbackState));
        setContainers(initialContainers);
        setItems(nextItems);
        setPersistedItems(nextItems);
        setSelectedItemId(nextItems[0]?.id ?? "");
        setMessage(
          nextItems.length > 0
            ? "Inventory loaded from character database."
            : "This character's inventory is empty.",
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Failed to load backend inventory.");
      }
    }

    void loadBackendInventory();
  }, [attunementLimit, backendCharacterId, storageKey, token]);

  const saveToBackend = useCallback(async (source: "autosave" | "manual" = "manual") => {
    if (!backendCharacterId || !token) {
      setMessage("Login and select a character before saving inventory to the database.");
      return;
    }

    const backendItems = items
      .map(mapGridItemToBackendInventoryItem)
      .filter((item): item is CharacterInventorySaveItem => Boolean(item));
    const stateToSave: SavedInventoryState = {
      containers,
      items,
      selectedItemId,
      updatedAt: Date.now(),
    };
    const fullStateCode = encodeInventoryState(stateToSave);

    localStorage.setItem(storageKey, JSON.stringify(stateToSave));

    setBackendSaving(true);

    try {
      await saveCharacterFullInventory(backendCharacterId, backendItems, fullStateCode, token);
      setPersistedItems(items);
      setMessage(
        source === "autosave"
          ? "Inventory autosaved to the character database."
          : "Saved full inventory layout to the character database.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : source === "autosave"
            ? "Inventory autosave failed."
            : "Failed to save inventory.",
      );
    } finally {
      setBackendSaving(false);
    }
  }, [backendCharacterId, containers, items, selectedItemId, storageKey, token]);

  useEffect(() => {
    skipNextBackendPersistRef.current = true;
  }, [backendCharacterId, token]);

  useEffect(() => {
    if (!backendEnabled) {
      return;
    }

    if (skipNextBackendPersistRef.current) {
      skipNextBackendPersistRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void saveToBackend("autosave");
    }, inventoryBackendAutosaveDelayMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [backendEnabled, containers, items, saveToBackend, selectedItemId]);

  function updateItem(nextItem: InventoryItem) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === nextItem.id ? nextItem : item)),
    );
  }

  function moveItemToContainer(itemId: string, containerId: string) {
    const item = items.find((candidate) => candidate.id === itemId);
    const container = containers.find((candidate) => candidate.id === containerId);

    if (!item || !container) {
      setMessage("Item or destination container could not be found.");
      return;
    }

    const candidate = {
      ...item,
      location: container.id,
      equippedSlot: undefined,
      x: 0,
      y: 0,
    };
    const position = findFirstAvailableSlot(candidate, container, items);

    if (!position) {
      setMessage(`${item.name} does not fit in ${container.name}.`);
      return;
    }

    updateItem({
      ...candidate,
      ...position,
    });
    setMessage(
      item.location === "equipped"
        ? `${item.name} unequipped to ${container.name}.`
        : `${item.name} moved to ${container.name}.`,
    );
  }

  function equipItem(itemId: string) {
    const item = items.find((candidate) => candidate.id === itemId);

    if (!item) {
      return;
    }

    if (item.quantity > 1) {
      setMessage(`Split ${item.name} before equipping a single item.`);
      return;
    }

    const compatibleSlot = equipmentSlots.find(
      (slot) =>
        canEquipItemInSlot(item, slot.id) &&
        !items.some(
          (candidate) => candidate.location === "equipped" && candidate.equippedSlot === slot.id,
        ),
    );

    if (!compatibleSlot) {
      setMessage(`${item.name} has no compatible free equipment slot.`);
      return;
    }

    updateItem({
      ...item,
      location: "equipped",
      equippedSlot: compatibleSlot.id,
      x: 0,
      y: 0,
    });
    setMessage(`${item.name} equipped to ${compatibleSlot.label}.`);
  }

  function updateSelectedItem(patch: Partial<InventoryItem>) {
    if (!selectedItem) {
      return;
    }

    if (
      patch.attuned &&
      !selectedItem.attuned &&
      attunedItems.length >= attunementLimit
    ) {
      setMessage(`Attunement limit reached. A character can attune to ${attunementLimit} items.`);
      return;
    }

    const nextItem = {
      ...selectedItem,
      ...patch,
    };
    const nextMaxStack = nextItem.stackable ? Math.max(1, nextItem.maxStack) : 1;
    const requiresAttunement = Boolean(nextItem.requiresAttunement);

    updateItem({
      ...nextItem,
      attuned: requiresAttunement ? Boolean(nextItem.attuned) : false,
      maxStack: nextMaxStack,
      quantity: clampNumber(nextItem.quantity, 1, nextMaxStack),
      requiresAttunement,
    });
  }

  function exportShareCode() {
    const state: SavedInventoryState = {
      containers,
      items,
      selectedItemId,
      updatedAt: Date.now(),
    };
    const nextShareCode = encodeInventoryState(state);

    setShareCode(nextShareCode);
    setMessage("Inventory export code generated.");
  }

  function importShareCode() {
    const importedState = decodeInventoryState(shareCode);

    if (!importedState) {
      setMessage("Import code is not valid.");
      return;
    }

    setContainers(importedState.containers);
    setItems(enforceAttunementLimit(importedState.items, attunementLimit));
    setSelectedItemId(importedState.selectedItemId);
    setMessage("Inventory imported from share code.");
  }

  function handleDragStart(event: DragEvent<HTMLElement>, itemId: string) {
    setSelectedItemId(itemId);
    setDragItemId(itemId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/dd-simple-item", JSON.stringify({ id: itemId }));
    event.dataTransfer.setData("text/plain", itemId);
  }

  function handleDragEnd() {
    setDragItemId(null);
    setHoverPreview(null);
    setMergeTargetId(null);
  }

  function getDraggedItem(event: DragEvent<HTMLElement>) {
    const rawPayload = event.dataTransfer.getData("application/dd-simple-item");
    const fallbackId = event.dataTransfer.getData("text/plain");

    try {
      const payload = JSON.parse(rawPayload) as DragPayload;
      return items.find((item) => item.id === payload.id) ?? null;
    } catch {
      return items.find((item) => item.id === fallbackId) ?? null;
    }
  }

  function handleGridDrop(event: DragEvent<HTMLDivElement>, container: InventoryContainer) {
    event.preventDefault();
    setHoverPreview(null);
    setMergeTargetId(null);

    const draggedItem = getDraggedItem(event);

    if (!draggedItem) {
      return;
    }

    const { x, y } = getDropPosition(event, container, draggedItem);
    const nextItem = {
      ...draggedItem,
      location: container.id,
      x,
      y,
      equippedSlot: undefined,
    };

    if (!canPlaceItem(nextItem, container, items)) {
      setMessage(`${draggedItem.name} does not fit there.`);
      return;
    }

    updateItem(nextItem);
    setMessage(`${draggedItem.name} moved to ${container.name}.`);
  }

  function handleGridDragOver(event: DragEvent<HTMLDivElement>, container: InventoryContainer) {
    event.preventDefault();
    setMergeTargetId(null);

    const draggedItem = dragItemId ? items.find((item) => item.id === dragItemId) : null;

    if (!draggedItem) {
      return;
    }

    const { x, y } = getDropPosition(event, container, draggedItem);
    const candidate = {
      ...draggedItem,
      location: container.id,
      x,
      y,
      equippedSlot: undefined,
    };
    const valid = canPlaceItem(candidate, container, items);

    event.dataTransfer.dropEffect = valid ? "move" : "none";
    setHoverPreview({
      containerId: container.id,
      x,
      y,
      width: getItemWidth(draggedItem),
      height: getItemHeight(draggedItem),
      valid,
    });
  }

  function handleGridDragLeave(event: DragEvent<HTMLDivElement>, container: InventoryContainer) {
    if (
      hoverPreview?.containerId === container.id &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    ) {
      setHoverPreview(null);
    }
  }

  function handleItemDragOver(event: DragEvent<HTMLElement>, targetItemId: string) {
    const draggedItem = dragItemId ? items.find((item) => item.id === dragItemId) : null;
    const targetItem = items.find((item) => item.id === targetItemId);

    if (!draggedItem || !targetItem || !canMergeItems(draggedItem, targetItem)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "move";
    setHoverPreview(null);
    setMergeTargetId(targetItem.id);
  }

  function handleItemDragLeave(event: DragEvent<HTMLElement>, targetItemId: string) {
    if (
      mergeTargetId === targetItemId &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    ) {
      setMergeTargetId(null);
    }
  }

  function handleItemDrop(event: DragEvent<HTMLElement>, targetItemId: string) {
    const draggedItem = getDraggedItem(event);
    const targetItem = items.find((item) => item.id === targetItemId);

    if (!draggedItem || !targetItem || !canMergeItems(draggedItem, targetItem)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const availableSpace = Math.max(0, targetItem.maxStack - targetItem.quantity);

    if (availableSpace === 0) {
      setMessage(`${targetItem.name} is already at max stack x${targetItem.maxStack}.`);
      return;
    }

    const transferredQuantity = Math.min(availableSpace, draggedItem.quantity);
    const leftoverQuantity = draggedItem.quantity - transferredQuantity;
    const nextQuantity = targetItem.quantity + transferredQuantity;

    setItems((currentItems) =>
      currentItems
        .map((item) =>
          item.id === targetItem.id
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item.id === draggedItem.id
              ? {
                  ...item,
                  quantity: leftoverQuantity,
                }
            : item,
        )
        .filter((item) => item.id !== draggedItem.id || leftoverQuantity > 0),
    );
    setSelectedItemId(targetItem.id);
    setDragItemId(null);
    setHoverPreview(null);
    setMergeTargetId(null);
    setMessage(
      leftoverQuantity > 0
        ? `${draggedItem.name} merged ${transferredQuantity}; x${leftoverQuantity} left over.`
        : `${draggedItem.name} stacks merged to x${nextQuantity}.`,
    );
  }

  function handleEquipmentDrop(event: DragEvent<HTMLDivElement>, slotId: EquipmentSlotId) {
    event.preventDefault();
    setHoverPreview(null);

    const draggedItem = getDraggedItem(event);
    const slot = equipmentSlots.find((equipmentSlot) => equipmentSlot.id === slotId);

    if (!draggedItem || !slot) {
      return;
    }

    if (draggedItem.quantity > 1) {
      setMessage(`Split ${draggedItem.name} before equipping a single item.`);
      return;
    }

    if (!slot.accepts.includes(draggedItem.kind) || !canEquipItemInSlot(draggedItem, slotId)) {
      setMessage(`${draggedItem.name} cannot be equipped in ${slot.label}.`);
      return;
    }

    if (items.some((item) => item.location === "equipped" && item.equippedSlot === slotId)) {
      setMessage(`${slot.label} is already occupied.`);
      return;
    }

    updateItem({
      ...draggedItem,
      location: "equipped",
      equippedSlot: slotId,
      x: 0,
      y: 0,
    });
    setMessage(`${draggedItem.name} equipped to ${slot.label}.`);
  }

  function handleDiscardDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    const draggedItem = getDraggedItem(event);

    if (!draggedItem) {
      return;
    }

    discardItem(draggedItem.id);
  }

  function discardItem(itemId: string) {
    const discardedItem = items.find((item) => item.id === itemId);

    if (!discardedItem) {
      return;
    }

    const remainingItems = items.filter((item) => item.id !== itemId);

    setItems(remainingItems);
    setSelectedItemId((currentItemId) =>
      currentItemId === itemId ? (remainingItems[0]?.id ?? "") : currentItemId,
    );
    setHoverPreview(null);
    setDragItemId(null);
    setMergeTargetId(null);
    setMessage(`${discardedItem.name} discarded.`);
  }

  function consumeItem(itemId: string) {
    const item = items.find((candidate) => candidate.id === itemId);

    if (!item || item.kind !== "consumable") {
      return;
    }

    if (item.quantity <= 1) {
      const remainingItems = items.filter((candidate) => candidate.id !== itemId);
      setItems(remainingItems);
      setSelectedItemId(remainingItems[0]?.id ?? "");
    } else {
      updateItem({
        ...item,
        quantity: item.quantity - 1,
      });
    }

    setMessage(`${item.name} used. ${Math.max(0, item.quantity - 1)} remaining.`);
  }

  function createChest() {
    const name = newChestName.trim();
    const columns = clampNumber(newChestColumns, 3, 12);
    const rows = clampNumber(newChestRows, 3, 10);

    if (!name) {
      setMessage("Chest needs a name.");
      return;
    }

    const id = `chest-${Date.now()}`;

    setContainers((currentContainers) => [
      ...currentContainers,
      {
        id,
        name,
        columns,
        rows,
      },
    ]);
    setNewItemForm((currentForm) => ({
      ...currentForm,
      location: id,
    }));
    setMessage(`${name} created.`);
  }

  function createItem() {
    const name = newItemForm.name.trim();
    const width = clampNumber(newItemForm.width, 1, 6);
    const height = clampNumber(newItemForm.height, 1, 6);
    const container = containers.find((nextContainer) => nextContainer.id === newItemForm.location);

    if (!name || !container) {
      setMessage("Item needs a name and a target container.");
      return;
    }

    const item: InventoryItem = {
      id: `item-${Date.now()}`,
      name,
      kind: newItemForm.kind,
      width,
      height,
      location: container.id,
      x: 0,
      y: 0,
      rotated: false,
      color: newItemForm.color,
      quantity: clampNumber(
        newItemForm.quantity,
        1,
        newItemForm.stackable ? Math.max(1, newItemForm.maxStack) : 1,
      ),
      stackable: newItemForm.stackable,
      maxStack: newItemForm.stackable ? Math.max(1, newItemForm.maxStack) : 1,
      weight: 1,
      value: 0,
      valueUnit: "gp",
      rarity: "Custom",
      armorClassBonus: 0,
      attackBonus: 0,
      damage: newItemForm.kind === "weapon" ? "1d6" : "",
      speedPenalty: 0,
      notes: "",
      requiresAttunement: newItemForm.requiresAttunement,
      attuned: false,
      equipmentSlot: newItemForm.equipmentSlot === "none" ? undefined : newItemForm.equipmentSlot,
    };
    const position = findFirstAvailableSlot(item, container, items);

    if (!position) {
      setMessage(`${name} does not fit in ${container.name}.`);
      return;
    }

    const nextItem = {
      ...item,
      ...position,
    };

    setItems((currentItems) => [...currentItems, nextItem]);
    setSelectedItemId(nextItem.id);
    setMessage(`${name} added to ${container.name}.`);
  }

  function addReferenceEquipment(referenceItem: ReferenceEquipment) {
    const container = containers.find((nextContainer) => nextContainer.id === "inventory") ?? containers[0];

    if (!container) {
      setMessage("No inventory container is available.");
      return;
    }

    const equipmentSlot = inferReferenceEquipmentSlot(referenceItem);
    const kind = inferReferenceItemKind(referenceItem);
    const stackable = kind === "consumable";
    const maxStack = stackable ? 10 : 1;
    const effects = deriveReferenceEquipmentEffects(referenceItem);
    const baseItem: InventoryItem = {
      id: `ref-item-${secureRandomId()}`,
      name: referenceItem.name,
      kind,
      width: inferReferenceItemWidth(referenceItem),
      height: inferReferenceItemHeight(referenceItem),
      location: container.id,
      x: 0,
      y: 0,
      rotated: false,
      color: inferReferenceItemColor(referenceItem),
      quantity: 1,
      stackable,
      maxStack,
      weight: referenceItem.weight ?? 1,
      value: referenceItem.costQuantity ?? 0,
      valueUnit: referenceItem.costUnit ?? "gp",
      rarity: isReferenceEquipmentMagical(referenceItem) ? "Magical" : "Common",
      armorClassBonus: effects.armorClassBonus,
      attackBonus: effects.attackBonus,
      damage: kind === "weapon" ? effects.damage || "1d6" : "",
      speedPenalty: effects.speedPenalty,
      notes: extractEquipmentDescription(referenceItem),
      requiresAttunement: inferReferenceRequiresAttunement(referenceItem),
      attuned: false,
      equipmentSlot,
      referenceEquipmentIndex: referenceItem.index,
    };
    const position = findFirstAvailableSlot(baseItem, container, items);

    if (!position) {
      setMessage(`${referenceItem.name} does not fit in ${container.name}.`);
      return;
    }

    const nextItem = {
      ...baseItem,
      ...position,
    };

    setItems((currentItems) => [...currentItems, nextItem]);
    setSelectedItemId(nextItem.id);
    setMessage(`${referenceItem.name} added to ${container.name}.`);
  }

  function takeOneFromSelectedStack() {
    if (!selectedItem || !selectedItem.stackable) {
      return;
    }

    if (selectedItem.quantity <= 1) {
      discardItem(selectedItem.id);
      return;
    }

    updateItem({
      ...selectedItem,
      quantity: selectedItem.quantity - 1,
    });
    setMessage(`Removed 1 ${selectedItem.name}.`);
  }

  function splitSelectedStack() {
    if (!selectedItem || !selectedItem.stackable) {
      return;
    }

    const amount = clampNumber(splitAmount, 1, Math.max(1, selectedItem.quantity - 1));

    if (selectedItem.quantity <= 1 || amount >= selectedItem.quantity) {
      setMessage(`${selectedItem.name} needs at least 2 items to split.`);
      return;
    }

    if (selectedItem.location === "equipped") {
      setMessage("Unequip the stack before splitting it.");
      return;
    }

    const container = containers.find((nextContainer) => nextContainer.id === selectedItem.location);

    if (!container) {
      return;
    }

    const splitItem: InventoryItem = {
      ...selectedItem,
      id: `item-${Date.now()}`,
      quantity: amount,
      equippedSlot: undefined,
    };
    const remainingItem = {
      ...selectedItem,
      quantity: selectedItem.quantity - amount,
    };
    const position = findFirstAvailableSlot(splitItem, container, [
      ...items.filter((item) => item.id !== selectedItem.id),
      remainingItem,
    ]);

    if (!position) {
      setMessage(`No space to split ${selectedItem.name}.`);
      return;
    }

    const nextSplitItem = {
      ...splitItem,
      ...position,
    };

    setItems((currentItems) =>
      currentItems
        .map((item) => (item.id === selectedItem.id ? remainingItem : item))
        .concat(nextSplitItem),
    );
    setSelectedItemId(nextSplitItem.id);
    setSplitAmount(1);
    setMessage(`Split ${amount} ${selectedItem.name}.`);
  }

  function applyItemTemplate(templateId: string) {
    const template = itemTemplates.find((itemTemplate) => itemTemplate.id === templateId);

    if (!template) {
      return;
    }

    setNewItemForm((currentForm) => ({
      color: template.color,
      equipmentSlot: template.equipmentSlot,
      height: template.height,
      kind: template.kind,
      location: currentForm.location,
      maxStack: template.maxStack,
      name: template.name,
      quantity: template.quantity,
      requiresAttunement: Boolean(template.requiresAttunement),
      stackable: template.stackable,
      width: template.width,
    }));
    setMessage(`${template.name} template loaded.`);
  }

  function renameContainer(containerId: ContainerId, name: string) {
    setContainers((currentContainers) =>
      currentContainers.map((container) =>
        container.id === containerId
          ? {
              ...container,
              name,
            }
          : container,
      ),
    );
  }

  function resizeContainer(containerId: ContainerId, patch: Partial<InventoryContainer>) {
    const container = containers.find((nextContainer) => nextContainer.id === containerId);

    if (!container) {
      return;
    }

    const nextContainer = {
      ...container,
      ...patch,
      columns: clampNumber(patch.columns ?? container.columns, 3, 12),
      rows: clampNumber(patch.rows ?? container.rows, 3, 10),
    };
    const containerItems = items.filter((item) => item.location === containerId);
    const allItemsFit = containerItems.every(
      (item) =>
        item.x + getItemWidth(item) <= nextContainer.columns &&
        item.y + getItemHeight(item) <= nextContainer.rows,
    );

    if (!allItemsFit) {
      setMessage(`${container.name} cannot shrink while items are outside the new bounds.`);
      return;
    }

    setContainers((currentContainers) =>
      currentContainers.map((currentContainer) =>
        currentContainer.id === containerId ? nextContainer : currentContainer,
      ),
    );
  }

  function clearContainer(containerId: ContainerId) {
    const container = containers.find((nextContainer) => nextContainer.id === containerId);

    if (!container || container.id === "inventory") {
      return;
    }

    setItems((currentItems) => currentItems.filter((item) => item.location !== containerId));
    setMessage(`${container.name} cleared.`);
  }

  function deleteContainer(containerId: ContainerId) {
    const container = containers.find((nextContainer) => nextContainer.id === containerId);

    if (!container || container.id === "inventory") {
      return;
    }

    if (items.some((item) => item.location === containerId)) {
      setMessage(`${container.name} must be empty before deleting.`);
      return;
    }

    setContainers((currentContainers) =>
      currentContainers.filter((currentContainer) => currentContainer.id !== containerId),
    );
    setNewItemForm((currentForm) => ({
      ...currentForm,
      location: currentForm.location === containerId ? "inventory" : currentForm.location,
    }));
    setMessage(`${container.name} deleted.`);
  }

  function rotateSelectedItem() {
    if (!selectedItem || selectedItem.width === selectedItem.height) {
      return;
    }

    if (selectedItem.location === "equipped") {
      updateItem({
        ...selectedItem,
        rotated: !selectedItem.rotated,
      });
      setMessage(`${selectedItem.name} rotated.`);
      return;
    }

    const container = containers.find((nextContainer) => nextContainer.id === selectedItem.location);

    if (!container) {
      return;
    }

    const nextItem = {
      ...selectedItem,
      rotated: !selectedItem.rotated,
    };

    if (!canPlaceItem(nextItem, container, items)) {
      setMessage(`${selectedItem.name} cannot rotate here.`);
      return;
    }

    updateItem(nextItem);
    setMessage(`${selectedItem.name} rotated.`);
  }

  function handleKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key.toLowerCase() === "r") {
      event.preventDefault();
      rotateSelectedItem();
    }
  }

  return {
    applyItemTemplate,
    attunedItems,
    attunementLimit,
    backendEnabled,
    backendSaving,
    clearContainer,
    containers,
    consumeItem,
    createChest,
    createItem,
    addReferenceEquipment,
    deleteContainer,
    discardItem,
    dragItemId,
    equippedItems,
    exportShareCode,
    equipItem,
    handleDiscardDrop,
    handleDragEnd,
    handleDragLeave: handleGridDragLeave,
    handleDragOver: handleGridDragOver,
    handleDragStart,
    handleDrop: handleGridDrop,
    handleEquipmentDrop,
    handleItemDragLeave,
    handleItemDragOver,
    handleItemDrop,
    handleKeyboard,
    hoverPreview,
    importShareCode,
    items,
    moveItemToContainer,
    persistedItems,
    mergeTargetId,
    message,
    newChestColumns,
    newChestName,
    newChestRows,
    newItemForm,
    renameContainer,
    resizeContainer,
    rotateSelectedItem,
    selectedItem,
    selectedItemId,
    saveToBackend,
    setNewChestColumns,
    setNewChestName,
    setNewChestRows,
    setNewItemForm,
    setSelectedItemId,
    setShareCode,
    setSplitAmount,
    shareCode,
    splitAmount,
    splitSelectedStack,
    takeOneFromSelectedStack,
    updateSelectedItem,
  };
}

type InventorySandboxController = ReturnType<typeof useInventorySandboxController>;

type InventoryWorkbenchProps = {
  carryingCapacity?: number;
  controller: InventorySandboxController;
  embedded?: boolean;
  hideDetailsPanel?: boolean;
};

type InventoryDetailsSidebarProps = {
  controller: InventorySandboxController;
  isOpen: boolean;
};

function InventoryDetailsContent({
  controller,
  isOpen = true,
}: {
  controller: InventorySandboxController;
  isOpen?: boolean;
}) {
  const { token } = useAuth();
  const {
    addReferenceEquipment,
    applyItemTemplate,
    attunedItems,
    attunementLimit,
    backendEnabled,
    backendSaving,
    clearContainer,
    containers,
    consumeItem,
    createChest,
    createItem,
    deleteContainer,
    discardItem,
    equipItem,
    handleDiscardDrop,
    importShareCode,
    items,
    message,
    moveItemToContainer,
    newChestColumns,
    newChestName,
    newChestRows,
    newItemForm,
    renameContainer,
    resizeContainer,
    saveToBackend,
    selectedItem,
    setNewChestColumns,
    setNewChestName,
    setNewChestRows,
    setNewItemForm,
    setShareCode,
    setSplitAmount,
    shareCode,
    splitAmount,
    splitSelectedStack,
    takeOneFromSelectedStack,
    updateSelectedItem,
    exportShareCode,
  } = controller;

  const [activeToolPanel, setActiveToolPanel] = useState<InventoryToolPanel>(null);
  const [equipmentResults, setEquipmentResults] = useState<ReferenceEquipment[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const [equipmentError, setEquipmentError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeLibraryType, setActiveLibraryType] = useState<InventoryLibraryType>("all");
  const [selectedSourceCategory, setSelectedSourceCategory] = useState("all");
  const [commonOnly, setCommonOnly] = useState(false);
  const [magicalOnly, setMagicalOnly] = useState(false);
  const [containerOnly, setContainerOnly] = useState(false);
  const [visibleEquipmentCount, setVisibleEquipmentCount] = useState(18);
  const [expandedEquipmentIndexes, setExpandedEquipmentIndexes] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) {
      setActiveToolPanel(null);
    }
  }, [isOpen]);

  useEffect(() => {
    setVisibleEquipmentCount(18);
  }, [
    searchQuery,
    activeLibraryType,
    selectedSourceCategory,
    commonOnly,
    magicalOnly,
    containerOnly,
  ]);

  useEffect(() => {
    let isMounted = true;

    async function loadEquipment() {
      setEquipmentLoading(true);
      setEquipmentError(null);

      try {
        const nextEquipment = await fetchEquipment({ token });

        if (isMounted) {
          setEquipmentResults(nextEquipment);
        }
      } catch (error) {
        if (isMounted) {
          setEquipmentError(error instanceof Error ? error.message : "Equipment library could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setEquipmentLoading(false);
        }
      }
    }

    void loadEquipment();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const sourceCategories = useMemo(() => {
    const categories = Array.from(
      new Set(equipmentResults.map((item) => inferReferenceSourceCategory(item)).filter(Boolean)),
    );

    return categories.length > 0 ? categories : ["5E Core Rules"];
  }, [equipmentResults]);

  useEffect(() => {
    if (selectedSourceCategory === "all") {
      return;
    }

    if (!sourceCategories.includes(selectedSourceCategory)) {
      setSelectedSourceCategory("all");
    }
  }, [selectedSourceCategory, sourceCategories]);

  const filteredEquipment = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return equipmentResults.filter((referenceItem) => {
      const referenceType = inferReferenceLibraryType(referenceItem);
      const sourceCategory = inferReferenceSourceCategory(referenceItem);
      const matchesType = activeLibraryType === "all" || referenceType === activeLibraryType;
      const matchesSource =
        selectedSourceCategory === "all" || sourceCategory === selectedSourceCategory;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [
          referenceItem.name,
          referenceItem.equipmentCategory ?? "",
          referenceItem.itemType ?? "",
          extractReferenceDescription(referenceItem),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCommon = !commonOnly || isReferenceEquipmentCommon(referenceItem);
      const matchesMagical = !magicalOnly || isReferenceEquipmentMagical(referenceItem);
      const matchesContainer = !containerOnly || isReferenceEquipmentContainer(referenceItem);

      return (
        matchesType &&
        matchesSource &&
        matchesQuery &&
        matchesCommon &&
        matchesMagical &&
        matchesContainer
      );
    });
  }, [
    activeLibraryType,
    commonOnly,
    containerOnly,
    equipmentResults,
    magicalOnly,
    searchQuery,
    selectedSourceCategory,
  ]);

  const visibleEquipment = useMemo(
    () => filteredEquipment.slice(0, visibleEquipmentCount),
    [filteredEquipment, visibleEquipmentCount],
  );

  const hasMoreEquipment = visibleEquipmentCount < filteredEquipment.length;

  useEffect(() => {
    setExpandedEquipmentIndexes((currentIndexes) =>
      currentIndexes.filter((index) =>
        filteredEquipment.some((referenceItem) => referenceItem.index === index),
      ),
    );
  }, [filteredEquipment]);

  const modalTitle =
    activeToolPanel === "selected"
      ? "Selected Item"
      : activeToolPanel === "share"
        ? "Share Inventory"
        : activeToolPanel === "manage"
          ? "Manage Containers"
          : activeToolPanel === "createChest"
            ? "Create Chest"
            : activeToolPanel === "createItem"
              ? "Create Item"
              : "";

  function renderSelectedQuickActions(className = "") {
    if (!selectedItem) {
      return null;
    }

    return (
      <div
        className={`inventory-selected-actions ${className}`.trim()}
        aria-label="Selected item actions"
      >
        <div className="inventory-selected-actions-heading">
          <span>Quick actions</span>
          <small>{selectedItem.location === "equipped" ? "Equipped" : "Stored"}</small>
        </div>
        {selectedItem.kind === "consumable" ? (
          <button
            type="button"
            className="inventory-tool-button inventory-selected-action inventory-selected-action-use"
            onClick={() => consumeItem(selectedItem.id)}
          >
            <Sparkles size={15} aria-hidden="true" />
            <span>Use one</span>
          </button>
        ) : null}
        {selectedItem.location === "equipped" ? (
          <button
            type="button"
            className="inventory-tool-button inventory-selected-action inventory-selected-action-secondary"
            onClick={() => moveItemToContainer(selectedItem.id, "inventory")}
          >
            <RotateCw size={15} aria-hidden="true" />
            <span>Unequip</span>
          </button>
        ) : (
          <button
            type="button"
            className="inventory-tool-button inventory-selected-action inventory-selected-action-primary"
            onClick={() => equipItem(selectedItem.id)}
          >
            <Sword size={15} aria-hidden="true" />
            <span>Equip</span>
          </button>
        )}
        <button
          type="button"
          className={`inventory-tool-button inventory-tool-button-danger inventory-selected-action ${
            selectedItem.kind === "consumable" ? "inventory-selected-action-wide" : ""
          }`.trim()}
          onClick={() => discardItem(selectedItem.id)}
        >
          <Trash2 size={15} aria-hidden="true" />
          <span>Delete</span>
        </button>
        {selectedItem.location !== "equipped" && containers.length > 1 ? (
          <label className="inventory-tool-field inventory-move-field">
            <span className="inventory-move-label">
              <Backpack size={14} aria-hidden="true" />
              Move item
            </span>
            <select
              value=""
              onChange={(event) => {
                if (event.target.value) {
                  moveItemToContainer(selectedItem.id, event.target.value);
                }
              }}
            >
              <option value="">Choose container</option>
              {containers
                .filter((container) => container.id !== selectedItem.location)
                .map((container) => (
                  <option key={container.id} value={container.id}>
                    {container.name}
                  </option>
                ))}
            </select>
          </label>
        ) : null}
      </div>
    );
  }

  function renderSelectedPanel() {
    if (!selectedItem) {
      return (
        <div className="inventory-modal-empty-state">
          <strong>No item selected</strong>
          <span>Select an item from the inventory grid or equipped gear to edit it.</span>
        </div>
      );
    }

    const selectedItemEffectLines = summarizeInventoryItemEffects(selectedItem);
    const selectedItemReferenceDescription = getSelectedItemReferenceDescription(selectedItem);

    return (
      <>
        <div className="selected-item-panel">
          <span>Selected</span>
          <strong>{selectedItem.name}</strong>
          <p>
            {getItemWidth(selectedItem)} x {getItemHeight(selectedItem)} cells,
            {selectedItem.location === "equipped"
              ? " equipped"
              : ` in ${selectedItem.location}`}
          </p>
          <div className="selected-item-kind">
            <ItemIcon item={selectedItem} />
            <span>{selectedItem.kind}</span>
            {selectedItem.requiresAttunement ? (
              <span>{selectedItem.attuned ? "Attuned" : "Needs Attunement"}</span>
            ) : null}
          </div>
        </div>

        <div className="item-detail-editor">
          {renderSelectedQuickActions()}
          {selectedItemEffectLines.length > 0 ? (
            <div className="attunement-panel">
              <div>
                <strong>Character Effect</strong>
                <span>What this item changes for the character</span>
              </div>
              <div className="list">
                {selectedItemEffectLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          ) : null}
          {selectedItemReferenceDescription ? (
            <div className="attunement-panel">
              <div>
                <strong>Reference Description</strong>
                <span>Official rule text or flavor</span>
              </div>
              <p>{selectedItemReferenceDescription}</p>
            </div>
          ) : null}
          <label className="inventory-tool-field">
            <span>Name</span>
            <input
              value={selectedItem.name}
              onChange={(event) => updateSelectedItem({ name: event.target.value })}
            />
          </label>
          <div className="inventory-tool-row">
            <label className="inventory-tool-field">
              <span>Qty</span>
              <input
                min={1}
                type="number"
                value={selectedItem.quantity}
                onChange={(event) =>
                  updateSelectedItem({
                    quantity: clampNumber(Number(event.target.value), 1, 999),
                  })
                }
              />
            </label>
            <label className="inventory-tool-field">
              <span>Weight</span>
              <input
                min={0}
                step={0.1}
                type="number"
                value={selectedItem.weight}
                onChange={(event) =>
                  updateSelectedItem({ weight: Math.max(0, Number(event.target.value)) })
                }
              />
            </label>
          </div>
          <label className="inventory-tool-check">
            <input
              checked={selectedItem.stackable}
              type="checkbox"
              onChange={(event) => updateSelectedItem({ stackable: event.target.checked })}
            />
            Stackable item
          </label>
          {selectedItem.stackable && (
            <div className="stack-action-panel">
              <div className="inventory-tool-row">
                <label className="inventory-tool-field">
                  <span>Split Amount</span>
                  <input
                    min={1}
                    max={Math.max(1, selectedItem.quantity - 1)}
                    type="number"
                    value={splitAmount}
                    onChange={(event) => setSplitAmount(Number(event.target.value))}
                  />
                </label>
                <div className="stack-action-buttons">
                  <button
                    type="button"
                    className="inventory-tool-button inventory-tool-button-muted"
                    onClick={takeOneFromSelectedStack}
                  >
                    Take One
                  </button>
                  <button
                    type="button"
                    className="inventory-tool-button"
                    disabled={selectedItem.quantity <= 1}
                    onClick={splitSelectedStack}
                  >
                    Split
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="inventory-tool-row">
            <label className="inventory-tool-field">
              <span>Value</span>
              <input
                min={0}
                type="number"
                value={selectedItem.value}
                onChange={(event) =>
                  updateSelectedItem({ value: Math.max(0, Number(event.target.value)) })
                }
              />
            </label>
            <label className="inventory-tool-field">
              <span>Currency</span>
              <select
                value={selectedItem.valueUnit ?? "gp"}
                onChange={(event) => updateSelectedItem({ valueUnit: event.target.value })}
              >
                <option value="cp">CP</option>
                <option value="sp">SP</option>
                <option value="ep">EP</option>
                <option value="gp">GP</option>
                <option value="pp">PP</option>
              </select>
            </label>
            <label className="inventory-tool-field">
              <span>Rarity</span>
              <input
                value={selectedItem.rarity}
                onChange={(event) => updateSelectedItem({ rarity: event.target.value })}
              />
            </label>
          </div>
          <div className="attunement-panel">
            <div>
              <strong>Attunement</strong>
              <span>
                {attunedItems.length} / {attunementLimit} attuned
              </span>
            </div>
            <label className="inventory-tool-check">
              <input
                checked={Boolean(selectedItem.requiresAttunement)}
                type="checkbox"
                onChange={(event) =>
                  updateSelectedItem({ requiresAttunement: event.target.checked })
                }
              />
              Requires attunement
            </label>
            <label className="inventory-tool-check">
              <input
                checked={Boolean(selectedItem.attuned)}
                disabled={!selectedItem.requiresAttunement}
                type="checkbox"
                onChange={(event) => updateSelectedItem({ attuned: event.target.checked })}
              />
              Attuned by this character
            </label>
            <p>
              Magic items that require attunement only grant their special benefits while attuned.
              This character can maintain {attunementLimit} attuned items.
            </p>
          </div>
          <div className="inventory-tool-row">
            <label className="inventory-tool-field">
              <span>AC Bonus</span>
              <input
                type="number"
                value={selectedItem.armorClassBonus}
                onChange={(event) =>
                  updateSelectedItem({ armorClassBonus: Number(event.target.value) })
                }
              />
            </label>
            <label className="inventory-tool-field">
              <span>Atk Bonus</span>
              <input
                type="number"
                value={selectedItem.attackBonus}
                onChange={(event) =>
                  updateSelectedItem({ attackBonus: Number(event.target.value) })
                }
              />
            </label>
          </div>
          <div className="inventory-tool-row">
            <label className="inventory-tool-field">
              <span>Damage</span>
              <input
                value={selectedItem.damage}
                onChange={(event) => updateSelectedItem({ damage: event.target.value })}
              />
            </label>
            <label className="inventory-tool-field">
              <span>Speed Penalty</span>
              <input
                min={0}
                type="number"
                value={selectedItem.speedPenalty}
                onChange={(event) =>
                  updateSelectedItem({
                    speedPenalty: Math.max(0, Number(event.target.value)),
                  })
                }
              />
            </label>
          </div>
          <label className="inventory-tool-field">
            <span>Notes</span>
            <textarea
              value={selectedItem.notes}
              onChange={(event) => updateSelectedItem({ notes: event.target.value })}
            />
          </label>
          <div
            className="discard-drop-zone"
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
            }}
            onDrop={handleDiscardDrop}
          >
            <Trash2 aria-hidden="true" size={22} />
            <div>
              <strong>Discard</strong>
              <span>Drop item here to delete it.</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderSharePanel() {
    return (
      <>
        <p className="inventory-modal-copy">
          Export a share code from the current layout or paste one to load another inventory setup.
        </p>
        <label className="inventory-tool-field">
          <span>Export / Import Code</span>
          <textarea
            value={shareCode}
            onChange={(event) => setShareCode(event.target.value)}
            placeholder="Generate or paste inventory code"
          />
        </label>
        <div className="inventory-modal-actions">
          <button type="button" className="inventory-tool-button" onClick={exportShareCode}>
            Export
          </button>
          <button
            type="button"
            className="inventory-tool-button inventory-tool-button-muted"
            onClick={importShareCode}
          >
            Import
          </button>
        </div>
      </>
    );
  }

  function renderManagePanel() {
    return (
      <div className="container-control-list">
        {containers.map((container) => {
          const itemCount = items.filter((item) => item.location === container.id).length;
          const isBaseInventory = container.id === "inventory";

          return (
            <div key={container.id} className="container-control-card">
              <label className="inventory-tool-field">
                <span>Name</span>
                <input
                  disabled={isBaseInventory}
                  value={container.name}
                  onChange={(event) => renameContainer(container.id, event.target.value)}
                />
              </label>
              <div className="inventory-tool-row">
                <label className="inventory-tool-field">
                  <span>Columns</span>
                  <input
                    min={3}
                    max={12}
                    type="number"
                    value={container.columns}
                    onChange={(event) =>
                      resizeContainer(container.id, {
                        columns: Number(event.target.value),
                      })
                    }
                  />
                </label>
                <label className="inventory-tool-field">
                  <span>Rows</span>
                  <input
                    min={3}
                    max={10}
                    type="number"
                    value={container.rows}
                    onChange={(event) =>
                      resizeContainer(container.id, {
                        rows: Number(event.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <div className="container-control-actions">
                <span>{itemCount} items</span>
                <button
                  type="button"
                  className="inventory-tool-button inventory-tool-button-muted"
                  disabled={isBaseInventory || itemCount === 0}
                  onClick={() => clearContainer(container.id)}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="inventory-tool-button inventory-tool-button-danger"
                  disabled={isBaseInventory || itemCount > 0}
                  onClick={() => deleteContainer(container.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderCreateChestPanel() {
    return (
      <>
        <p className="inventory-modal-copy">
          Add a new container to the current inventory and choose the grid size it should use.
        </p>
        <label className="inventory-tool-field">
          <span>Name</span>
          <input value={newChestName} onChange={(event) => setNewChestName(event.target.value)} />
        </label>
        <div className="inventory-tool-row">
          <label className="inventory-tool-field">
            <span>Columns</span>
            <input
              min={3}
              max={12}
              type="number"
              value={newChestColumns}
              onChange={(event) => setNewChestColumns(Number(event.target.value))}
            />
          </label>
          <label className="inventory-tool-field">
            <span>Rows</span>
            <input
              min={3}
              max={10}
              type="number"
              value={newChestRows}
              onChange={(event) => setNewChestRows(Number(event.target.value))}
            />
          </label>
        </div>
        <div className="inventory-modal-actions">
          <button type="button" className="inventory-tool-button" onClick={createChest}>
            Add Chest
          </button>
        </div>
      </>
    );
  }

  function renderCreateItemPanel() {
    return (
      <>
        <p className="inventory-modal-copy">
          Create a custom item manually and place it into one of the existing inventory containers.
        </p>
        <label className="inventory-tool-field inventory-template-field">
          <span>Template</span>
          <select defaultValue="" onChange={(event) => applyItemTemplate(event.target.value)}>
            <option value="" disabled>
              Choose template
            </option>
            {itemTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </label>
        <label className="inventory-tool-field">
          <span>Name</span>
          <input
            value={newItemForm.name}
            onChange={(event) =>
              setNewItemForm((currentForm) => ({
                ...currentForm,
                name: event.target.value,
              }))
            }
          />
        </label>
        <div className="inventory-tool-row">
          <label className="inventory-tool-field">
            <span>Width</span>
            <input
              min={1}
              max={6}
              type="number"
              value={newItemForm.width}
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  width: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="inventory-tool-field">
            <span>Height</span>
            <input
              min={1}
              max={6}
              type="number"
              value={newItemForm.height}
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  height: Number(event.target.value),
                }))
              }
            />
          </label>
        </div>
        <div className="inventory-tool-row">
          <label className="inventory-tool-field">
            <span>Quantity</span>
            <input
              min={1}
              type="number"
              value={newItemForm.quantity}
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  quantity: Number(event.target.value),
                }))
              }
            />
          </label>
          <label className="inventory-tool-check inventory-tool-check-compact">
            <input
              checked={newItemForm.stackable}
              type="checkbox"
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  maxStack: event.target.checked ? Math.max(2, currentForm.maxStack) : 1,
                  stackable: event.target.checked,
                }))
              }
            />
            Stack
          </label>
        </div>
        {newItemForm.stackable && (
          <label className="inventory-tool-field">
            <span>Max Stack</span>
            <input
              min={2}
              type="number"
              value={newItemForm.maxStack}
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  maxStack: Math.max(2, Number(event.target.value)),
                  quantity: clampNumber(
                    currentForm.quantity,
                    1,
                    Math.max(2, Number(event.target.value)),
                  ),
                }))
              }
            />
          </label>
        )}
        <div className="inventory-tool-row">
          <label className="inventory-tool-field">
            <span>Type</span>
            <select
              value={newItemForm.kind}
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  kind: event.target.value as ItemKind,
                }))
              }
            >
              <option value="armor">Armor</option>
              <option value="weapon">Weapon</option>
              <option value="tool">Tool</option>
              <option value="consumable">Consumable</option>
              <option value="treasure">Treasure</option>
            </select>
          </label>
          <label className="inventory-tool-field">
            <span>Color</span>
            <input
              type="color"
              value={newItemForm.color}
              onChange={(event) =>
                setNewItemForm((currentForm) => ({
                  ...currentForm,
                  color: event.target.value,
                }))
              }
            />
          </label>
        </div>
        <label className="inventory-tool-field">
          <span>Container</span>
          <select
            value={newItemForm.location}
            onChange={(event) =>
              setNewItemForm((currentForm) => ({
                ...currentForm,
                location: event.target.value,
              }))
            }
          >
            {containers.map((container) => (
              <option key={container.id} value={container.id}>
                {container.name}
              </option>
            ))}
          </select>
        </label>
        <label className="inventory-tool-field">
          <span>Equip Slot</span>
          <select
            value={newItemForm.equipmentSlot}
            onChange={(event) =>
              setNewItemForm((currentForm) => ({
                ...currentForm,
                equipmentSlot: event.target.value as NewItemForm["equipmentSlot"],
              }))
            }
          >
            <option value="none">None</option>
            {equipmentSlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {slot.label}
              </option>
            ))}
          </select>
        </label>
        <label className="inventory-tool-check">
          <input
            checked={newItemForm.requiresAttunement}
            type="checkbox"
            onChange={(event) =>
              setNewItemForm((currentForm) => ({
                ...currentForm,
                requiresAttunement: event.target.checked,
              }))
            }
          />
          Requires attunement
        </label>
        <div className="inventory-modal-actions">
          <button type="button" className="inventory-tool-button" onClick={createItem}>
            Add Item
          </button>
        </div>
      </>
    );
  }

  function renderActiveToolPanel() {
    switch (activeToolPanel) {
      case "selected":
        return renderSelectedPanel();
      case "share":
        return renderSharePanel();
      case "manage":
        return renderManagePanel();
      case "createChest":
        return renderCreateChestPanel();
      case "createItem":
        return renderCreateItemPanel();
      default:
        return null;
    }
  }

  return (
    <>
      {activeToolPanel &&
        typeof document !== "undefined" &&
        createPortal(
          <dialog
            open
            className="inventory-modal-backdrop"
            aria-label="Inventory tools"
            aria-modal="true"
            onCancel={() => setActiveToolPanel(null)}
          >
            <section
              className="inventory-modal"
              aria-labelledby="inventory-tool-modal-title"
            >
              <header className="inventory-modal-header">
                <div>
                  <span className="inventory-modal-kicker">Inventory Tools</span>
                  <h3 id="inventory-tool-modal-title">{modalTitle}</h3>
                </div>
                <button
                  type="button"
                  className="inventory-modal-close"
                  aria-label="Close inventory panel"
                  onClick={() => setActiveToolPanel(null)}
                >
                  <X size={18} />
                </button>
              </header>
              <div className="inventory-modal-body">{renderActiveToolPanel()}</div>
            </section>
          </dialog>,
          document.body,
        )}

      <div className="inventory-sidebar-summary">
        <div>
          <span className="inventory-sidebar-summary-label">Selected Item</span>
          <strong>{selectedItem?.name ?? "Nothing selected"}</strong>
          {selectedItem && getSelectedItemReferenceDescription(selectedItem) && (
            <p className="inventory-sidebar-summary-description">
              {getSelectedItemReferenceDescription(selectedItem)}
            </p>
          )}
          <p>{selectedItem ? `${selectedItem.kind} · ${selectedItem.rarity}` : "Choose an equipped or stored item."}</p>
        </div>
        {selectedItem && (
          <div className="selected-item-kind">
            <ItemIcon item={selectedItem} />
            <span>{selectedItem.kind}</span>
          </div>
        )}
      </div>

      {renderSelectedQuickActions("inventory-selected-actions-sidebar")}

      <div className="inventory-sidebar-action-grid">
        <InventorySidebarActionButton
          icon={<PackageOpen size={16} />}
          label="Edit details"
          onClick={() => setActiveToolPanel("selected")}
        />
        <InventorySidebarActionButton
          icon={<Archive size={16} />}
          label="Share"
          onClick={() => setActiveToolPanel("share")}
        />
        <InventorySidebarActionButton
          icon={<Backpack size={16} />}
          label="Manage"
          onClick={() => setActiveToolPanel("manage")}
        />
        <InventorySidebarActionButton
          icon={<Archive size={16} />}
          label="Create Chest"
          onClick={() => setActiveToolPanel("createChest")}
        />
        <InventorySidebarActionButton
          icon={<Plus size={16} />}
          label="Create Item"
          onClick={() => setActiveToolPanel("createItem")}
        />
        {backendEnabled && (
          <InventorySidebarActionButton
            icon={<Save size={16} />}
            label={backendSaving ? "Saving" : "Save DB"}
            onClick={() => {
              void saveToBackend();
            }}
          />
        )}
      </div>

      <section className="inventory-library-shell">
        <div className="inventory-library-section-header">
          <strong>Add Items</strong>
          <span>Reference equipment</span>
        </div>

        <label className="inventory-library-search">
          <span className="inventory-library-search-icon">
            <Search size={16} />
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Weapon, Longsword, Vorpal Longsword, etc."
          />
        </label>

        <div className="inventory-library-group">
          <h4>Filter By Type</h4>
          <div className="inventory-library-chip-grid">
            <button
              type="button"
              className={[
                "inventory-library-chip",
                activeLibraryType === "all" ? "inventory-library-chip-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setActiveLibraryType("all")}
            >
              All
            </button>
            {inventoryLibraryTypeOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                className={[
                  "inventory-library-chip",
                  activeLibraryType === option.id ? "inventory-library-chip-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setActiveLibraryType(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="inventory-library-checkbox-row">
          <label className="inventory-library-checkbox">
            <input
              checked={commonOnly}
              type="checkbox"
              onChange={(event) => setCommonOnly(event.target.checked)}
            />
            Common
          </label>
          <label className="inventory-library-checkbox">
            <input
              checked={magicalOnly}
              type="checkbox"
              onChange={(event) => setMagicalOnly(event.target.checked)}
            />
            Magical
          </label>
          <label className="inventory-library-checkbox">
            <input
              checked={containerOnly}
              type="checkbox"
              onChange={(event) => setContainerOnly(event.target.checked)}
            />
            Container
          </label>
        </div>

        <div className="inventory-library-group">
          <h4>Filter By Source Category</h4>
          <div className="inventory-library-chip-grid">
            <button
              type="button"
              className={[
                "inventory-library-chip",
                selectedSourceCategory === "all" ? "inventory-library-chip-active" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => setSelectedSourceCategory("all")}
            >
              All Sources
            </button>
            {sourceCategories.map((sourceCategory) => (
              <button
                key={sourceCategory}
                type="button"
                className={[
                  "inventory-library-chip",
                  selectedSourceCategory === sourceCategory ? "inventory-library-chip-active" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setSelectedSourceCategory(sourceCategory)}
              >
                {sourceCategory}
              </button>
            ))}
          </div>
        </div>

        <section className="inventory-library-results">
          <div className="inventory-library-results-header">
            <span>{equipmentLoading ? "Loading..." : `${filteredEquipment.length} results`}</span>
            <strong>{message}</strong>
          </div>

          {equipmentError ? (
            <div className="inventory-library-empty-state">{equipmentError}</div>
          ) : (
            <div className="inventory-library-result-list">
              {visibleEquipment.map((referenceItem) => (
                <article
                  key={referenceItem.index}
                  className={[
                    "inventory-library-result-card",
                    expandedEquipmentIndexes.includes(referenceItem.index)
                      ? "inventory-library-result-card-expanded"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="inventory-library-result-main">
                    <button
                      type="button"
                      className="inventory-library-result-toggle"
                      onClick={() =>
                        setExpandedEquipmentIndexes((currentIndexes) =>
                          currentIndexes.includes(referenceItem.index)
                            ? currentIndexes.filter((index) => index !== referenceItem.index)
                            : [...currentIndexes, referenceItem.index],
                        )
                      }
                    >
                      <div className="inventory-library-result-copy">
                        <strong>{referenceItem.name}</strong>
                        <span>
                          {formatReferenceEquipmentMeta(referenceItem)} ·{" "}
                          {inferReferenceSourceCategory(referenceItem)}
                        </span>
                        {summarizeReferenceEquipmentEffects(referenceItem).effectLines[0] ? (
                          <p>{summarizeReferenceEquipmentEffects(referenceItem).effectLines[0]}</p>
                        ) : null}
                      </div>
                      <span className="inventory-library-result-chevron" aria-hidden="true">
                        {expandedEquipmentIndexes.includes(referenceItem.index) ? "▴" : "▾"}
                      </span>
                    </button>
                    <button
                      type="button"
                      className="inventory-library-add-button"
                      onClick={() => addReferenceEquipment(referenceItem)}
                    >
                      Add
                    </button>
                  </div>

                  {expandedEquipmentIndexes.includes(referenceItem.index) && (
                    <div className="inventory-library-result-expanded">
                      {summarizeReferenceEquipmentEffects(referenceItem).effectLines.length > 0 ? (
                        <div className="inventory-library-result-effect-block">
                          <strong>Character Effect</strong>
                          <div className="inventory-library-result-effect-list">
                            {summarizeReferenceEquipmentEffects(referenceItem).effectLines.map((line) => (
                              <p key={line}>{line}</p>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {extractReferenceDescription(referenceItem) && (
                        <p>{extractReferenceDescription(referenceItem)}</p>
                      )}
                      <div className="inventory-library-result-detail-grid">
                        <span>
                          <strong>Type</strong>
                          {referenceItem.equipmentCategory ??
                            referenceItem.itemType ??
                            "Adventuring Gear"}
                        </span>
                        <span>
                          <strong>Weight</strong>
                          {referenceItem.weight != null ? `${referenceItem.weight} lb` : "Unknown"}
                        </span>
                        <span>
                          <strong>Cost</strong>
                          {referenceItem.costQuantity != null
                            ? `${referenceItem.costQuantity}${referenceItem.costUnit ? ` ${referenceItem.costUnit}` : ""}`
                            : "Unknown"}
                        </span>
                        <span>
                          <strong>Source</strong>
                          {inferReferenceSourceCategory(referenceItem)}
                        </span>
                      </div>
                    </div>
                  )}
                </article>
              ))}

              {!equipmentLoading && filteredEquipment.length === 0 && (
                <div className="inventory-library-empty-state">
                  No equipment matches the current filters.
                </div>
              )}

              {!equipmentLoading && hasMoreEquipment && (
                <button
                  type="button"
                  className="inventory-library-load-more"
                  onClick={() => setVisibleEquipmentCount((currentCount) => currentCount + 18)}
                >
                  Load more
                </button>
              )}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

function InventorySidebarActionButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="inventory-sidebar-action-button" onClick={onClick}>
      <span className="inventory-sidebar-action-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function InventoryWorkbench({
  carryingCapacity,
  controller,
  embedded = false,
  hideDetailsPanel = false,
}: InventoryWorkbenchProps) {
  const [activeContainerId, setActiveContainerId] = useState<string>("inventory");
  const {
    attunedItems,
    attunementLimit,
    containers,
    equippedItems,
    handleDragEnd,
    handleDragLeave,
    handleDragOver,
    handleDragStart,
    handleDrop,
    handleEquipmentDrop,
    handleItemDragLeave,
    handleItemDragOver,
    handleItemDrop,
    handleKeyboard,
    hoverPreview,
    items,
    mergeTargetId,
    message,
    rotateSelectedItem,
    selectedItem,
    selectedItemId,
    setSelectedItemId,
    discardItem,
  } = controller;
  const activeContainer = containers.find((container) => container.id === activeContainerId) ?? containers[0] ?? null;
  const inventoryTotals = useMemo(
    () => getInventoryTotals(items.filter((item) => item.location === "inventory" || item.location === "equipped")),
    [items],
  );

  useEffect(() => {
    if (!containers.some((container) => container.id === activeContainerId) && containers[0]) {
      setActiveContainerId(containers[0].id);
    }
  }, [activeContainerId, containers]);

  return (
    <section
      className={embedded ? "inventory-workbench inventory-workbench-embedded" : "inventory-workbench"}
      onKeyDown={handleKeyboard}
      tabIndex={-1}
    >
      {!embedded && (
        <header className="inventory-workbench-header">
          <div>
            <p className="eyebrow">Inventory Prototype</p>
            <h1>Drag and Drop Equipment</h1>
          </div>
          <div className="inventory-actions">
            <button type="button" className="inventory-action-button" onClick={rotateSelectedItem}>
              <RotateCw aria-hidden="true" size={16} />
              Rotate
            </button>
            <button
              type="button"
              className="inventory-action-button inventory-action-button-danger"
              disabled={!selectedItem}
              onClick={() => selectedItem && discardItem(selectedItem.id)}
            >
              <Trash2 aria-hidden="true" size={16} />
              Discard
            </button>
            <span className="inventory-status">{message}</span>
          </div>
        </header>
      )}

      <div className="inventory-layout">
        <div className="inventory-main-scroll">
          <section className="equipment-panel">
            <div className="inventory-panel-heading">
              <span>Character</span>
              <strong>Equipped Gear</strong>
            </div>

            <div
              className={
                carryingCapacity != null && inventoryTotals.weight > carryingCapacity
                  ? "inventory-total-summary inventory-total-summary-over"
                  : "inventory-total-summary"
              }
              aria-label="Carried inventory totals"
            >
              <span>{inventoryTotals.itemCount} items</span>
              <span>
                {formatInventoryNumber(inventoryTotals.weight)}
                {carryingCapacity != null ? ` / ${carryingCapacity}` : ""} lb
              </span>
              <span>{formatInventoryNumber(inventoryTotals.value)} gp</span>
            </div>

            <div className="attunement-meter">
              <div>
                <span>Attunement</span>
                <strong>
                  {attunedItems.length} / {attunementLimit}
                </strong>
              </div>
              <p>
                {attunedItems.length > 0
                  ? attunedItems.map((item) => item.name).join(", ")
                  : "No attuned items"}
              </p>
            </div>

            <div className="equipment-slot-grid">
              {equipmentSlots.map((slot) => {
                const item = equippedItems.get(slot.id);

                return (
                  <div
                    key={slot.id}
                    className={["equipment-slot", item ? "equipment-slot-filled" : ""].filter(Boolean).join(" ")}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleEquipmentDrop(event, slot.id)}
                  >
                    <span>{slot.label}</span>
                    {item ? (
                      <button
                        type="button"
                        className="equipment-slot-item"
                        draggable
                        onClick={() => setSelectedItemId(item.id)}
                        onDragStart={(event) => handleDragStart(event, item.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <ItemIcon item={item} />
                        {item.name}
                      </button>
                    ) : (
                      <>
                        <SlotIcon slotId={slot.id} />
                        <em className="equipment-slot-placeholder">{slot.accepts[0] ?? "Item"}</em>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <div className="inventory-focus-shell">
            <div className="inventory-focus-bar">
              {containers.map((container) => {
                const containerItems = items.filter((item) => item.location === container.id);
                const containerItemCount = containerItems.reduce(
                  (total, item) => total + item.quantity,
                  0,
                );

                return (
                  <button
                    key={container.id}
                    type="button"
                    className={[
                      "inventory-focus-tab",
                      activeContainer?.id === container.id ? "inventory-focus-tab-active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => setActiveContainerId(container.id)}
                  >
                    <strong>{container.name}</strong>
                    <span>
                      {container.columns} x {container.rows} · {containerItemCount} item
                      {containerItemCount === 1 ? "" : "s"}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="inventory-grid-stack inventory-grid-stack-focus">
              {activeContainer ? (
                <InventoryGrid
                  key={activeContainer.id}
                  container={activeContainer}
                  items={items.filter((item) => item.location === activeContainer.id)}
                  hoverPreview={
                    hoverPreview?.containerId === activeContainer.id ? hoverPreview : null
                  }
                  mergeTargetId={mergeTargetId}
                  onDragEnd={handleDragEnd}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onItemDragLeave={handleItemDragLeave}
                  onItemDragOver={handleItemDragOver}
                  onItemDrop={handleItemDrop}
                  onDragStart={handleDragStart}
                  onSelectItem={setSelectedItemId}
                  selectedItemId={selectedItemId}
                />
              ) : null}
            </div>
          </div>
        </div>

        {!hideDetailsPanel && (
          <aside className="inventory-details-panel">
            <InventoryDetailsContent controller={controller} />
          </aside>
        )}
      </div>
    </section>
  );
}

function InventoryDetailsSidebar({ controller, isOpen }: InventoryDetailsSidebarProps) {
  return (
    <aside
      className={
        isOpen
          ? "inventory-side-rail inventory-side-rail-open"
          : "inventory-side-rail inventory-side-rail-closed"
      }
    >
      <section className="inventory-side-placeholder" aria-hidden="true" />
      <section className="inventory-details-panel inventory-details-panel-rail" aria-hidden={!isOpen}>
        <InventoryDetailsContent controller={controller} isOpen={isOpen} />
      </section>
    </aside>
  );
}

type InventoryGridProps = {
  container: InventoryContainer;
  hoverPreview: HoverPreview | null;
  items: InventoryItem[];
  mergeTargetId: string | null;
  onDragEnd: () => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>, container: InventoryContainer) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>, container: InventoryContainer) => void;
  onDragStart: (event: DragEvent<HTMLElement>, itemId: string) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, container: InventoryContainer) => void;
  onItemDragLeave: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onItemDragOver: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onItemDrop: (event: DragEvent<HTMLElement>, targetItemId: string) => void;
  onSelectItem: (itemId: string) => void;
  selectedItemId: string;
};

function InventoryGrid({
  container,
  hoverPreview,
  items,
  mergeTargetId,
  onDragEnd,
  onDragLeave,
  onDragOver,
  onDragStart,
  onDrop,
  onItemDragLeave,
  onItemDragOver,
  onItemDrop,
  onSelectItem,
  selectedItemId,
}: InventoryGridProps) {
  const containerStats = getContainerStats(container, items);

  return (
    <section className="inventory-grid-panel">
      <div className="inventory-panel-heading">
        <span>
          {container.columns} x {container.rows} · {containerStats.usedCells}/{containerStats.totalCells} cells
        </span>
        <strong>
          {container.id === "inventory" ? <Backpack size={18} /> : <Archive size={18} />}
          {container.name}
        </strong>
      </div>
      <div className="inventory-grid-meta">
        <span>{containerStats.itemCount} items</span>
        <span>{formatInventoryNumber(containerStats.weight)} lb</span>
        <span>{formatInventoryNumber(containerStats.value)} gp</span>
      </div>

      <div
        className="inventory-grid"
        style={{
          "--inventory-columns": container.columns,
          "--inventory-rows": container.rows,
          gridTemplateColumns: `repeat(${container.columns}, var(--inventory-cell-size))`,
          gridTemplateRows: `repeat(${container.rows}, var(--inventory-cell-size))`,
        } as CSSProperties}
        onDragLeave={(event) => onDragLeave(event, container)}
        onDragOver={(event) => onDragOver(event, container)}
        onDrop={(event) => onDrop(event, container)}
      >
        {hoverPreview && (
          <div
            className={[
              "inventory-drop-preview",
              hoverPreview.valid ? "inventory-drop-preview-valid" : "inventory-drop-preview-invalid",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              gridColumn: `${hoverPreview.x + 1} / span ${hoverPreview.width}`,
              gridRow: `${hoverPreview.y + 1} / span ${hoverPreview.height}`,
            }}
          />
        )}

        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            draggable
            className={[
              "inventory-item",
              selectedItemId === item.id ? "inventory-item-selected" : "",
              mergeTargetId === item.id ? "inventory-item-merge-target" : "",
              item.rotated ? "inventory-item-rotated" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              "--item-color": item.color,
              gridColumn: `${item.x + 1} / span ${getItemWidth(item)}`,
              gridRow: `${item.y + 1} / span ${getItemHeight(item)}`,
            } as CSSProperties}
            onClick={() => onSelectItem(item.id)}
            onDragLeave={(event) => onItemDragLeave(event, item.id)}
            onDragOver={(event) => onItemDragOver(event, item.id)}
            onDragStart={(event) => onDragStart(event, item.id)}
            onDragEnd={onDragEnd}
            onDrop={(event) => onItemDrop(event, item.id)}
          >
            <span className="inventory-item-icon">
              <ItemIcon item={item} />
            </span>
            <span className="inventory-item-name">{item.name}</span>
            {item.stackable && item.quantity > 1 && (
              <span className="inventory-item-quantity">x{item.quantity}</span>
            )}
            <em>
              {getItemWidth(item)} x {getItemHeight(item)}
            </em>
          </button>
        ))}
      </div>
    </section>
  );
}

function getContainerStats(container: InventoryContainer, items: InventoryItem[]) {
  return items.reduce(
    (stats, item) => ({
      itemCount: stats.itemCount + item.quantity,
      totalCells: stats.totalCells,
      usedCells: stats.usedCells + getItemWidth(item) * getItemHeight(item),
      value: stats.value + convertCurrencyToGp(item.value * item.quantity, item.valueUnit),
      weight: stats.weight + item.weight * item.quantity,
    }),
    {
      itemCount: 0,
      totalCells: container.columns * container.rows,
      usedCells: 0,
      value: 0,
      weight: 0,
    },
  );
}

function getInventoryTotals(items: InventoryItem[]) {
  return items.reduce(
    (totals, item) => ({
      itemCount: totals.itemCount + item.quantity,
      value: totals.value + convertCurrencyToGp(item.value * item.quantity, item.valueUnit),
      weight: totals.weight + item.weight * item.quantity,
    }),
    {
      itemCount: 0,
      value: 0,
      weight: 0,
    },
  );
}

function convertCurrencyToGp(value: number, unit = "gp") {
  switch (unit.trim().toLowerCase()) {
    case "cp":
      return value / 100;
    case "sp":
      return value / 10;
    case "ep":
      return value / 2;
    case "pp":
      return value * 10;
    case "gp":
    default:
      return value;
  }
}

function formatInventoryNumber(value: number) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function mapBackendInventoryItemToGridItem(item: BackendCharacterInventoryItem): InventoryItem {
  const referenceItem: ReferenceEquipment = {
    costQuantity: item.equipment.costQuantity ?? null,
    costUnit: item.equipment.costUnit ?? null,
    description: item.equipment.description ?? null,
    equipmentCategory: item.equipment.equipmentCategory ?? null,
    index: item.equipment.index ?? item.equipmentIndex ?? item.id,
    itemType: item.equipment.itemType ?? null,
    name: item.equipment.name,
    sourceJson: item.equipment.sourceJson,
    weight:
      item.equipment.weight == null
        ? null
        : Number(item.equipment.weight),
  };
  const kind = inferReferenceItemKind(referenceItem);
  const equipmentSlot = inferReferenceEquipmentSlot(referenceItem);
  const effects = deriveReferenceEquipmentEffects(referenceItem);

  return {
    armorClassBonus: effects.armorClassBonus,
    attackBonus: effects.attackBonus,
    color: inferReferenceItemColor(referenceItem),
    damage: kind === "weapon" ? effects.damage || "1d6" : "",
    equipmentSlot,
    equippedSlot: item.equipped ? equipmentSlot : undefined,
    height: inferReferenceItemHeight(referenceItem),
    id: item.id,
    kind,
    location: item.equipped && equipmentSlot ? "equipped" : "inventory",
    maxStack: Math.max(1, item.quantity),
    name: item.customName?.trim() || item.equipment.name,
    notes: item.notes ?? extractReferenceDescription(referenceItem),
    quantity: item.quantity,
    rarity: isReferenceEquipmentMagical(referenceItem) ? "Magical" : "Common",
    referenceEquipmentIndex: item.equipment.index ?? item.equipmentIndex,
    rotated: false,
    speedPenalty: effects.speedPenalty,
    stackable: item.quantity > 1 || kind === "consumable",
    value: item.equipment.costQuantity ?? 0,
    valueUnit: item.equipment.costUnit ?? "gp",
    weight: Number(item.equipment.weight ?? 1),
    width: inferReferenceItemWidth(referenceItem),
    x: item.gridX ?? 0,
    y: item.gridY ?? 0,
  };
}

function mapGridItemToBackendInventoryItem(item: InventoryItem): CharacterInventorySaveItem | null {
  if (!item.referenceEquipmentIndex) {
    return null;
  }

  return {
    customName: item.name,
    equipped: item.location === "equipped",
    equipmentIndex: item.referenceEquipmentIndex,
    gridX: item.location === "equipped" ? null : item.x,
    gridY: item.location === "equipped" ? null : item.y,
    notes: item.notes,
    quantity: item.quantity,
  };
}

function getDropPosition(
  event: DragEvent<HTMLDivElement>,
  container: InventoryContainer,
  item: InventoryItem,
) {
  const rect = event.currentTarget.getBoundingClientRect();
  const columnWidth = rect.width / container.columns;
  const rowHeight = rect.height / container.rows;
  const width = getItemWidth(item);
  const height = getItemHeight(item);
  const x = Math.floor((event.clientX - rect.left) / columnWidth);
  const y = Math.floor((event.clientY - rect.top) / rowHeight);

  return {
    x: Math.max(0, Math.min(container.columns - width, x)),
    y: Math.max(0, Math.min(container.rows - height, y)),
  };
}

function ItemIcon({ item }: { item: InventoryItem }) {
  const Icon = getItemIcon(item);

  return <Icon aria-hidden="true" size={18} strokeWidth={2.3} />;
}

function SlotIcon({ slotId }: { slotId: EquipmentSlotId }) {
  const Icon = getSlotIcon(slotId);

  return <Icon aria-hidden="true" className="equipment-slot-icon" size={22} strokeWidth={1.9} />;
}

function getItemIcon(item: InventoryItem): LucideIcon {
  if (item.equipmentSlot === "offHand") {
    return Shield;
  }

  switch (item.kind) {
    case "armor":
      return Shirt;
    case "weapon":
      return Sword;
    case "tool":
      return PackageOpen;
    case "consumable":
      return Sparkles;
    case "treasure":
      return Gem;
  }
}

function getSlotIcon(slotId: EquipmentSlotId): LucideIcon {
  switch (slotId) {
    case "head":
      return Crown;
    case "body":
      return Shirt;
    case "mainHand":
      return Sword;
    case "offHand":
      return Shield;
    case "hands":
      return Hand;
    case "feet":
      return Footprints;
    case "accessory1":
    case "accessory2":
    case "accessory3":
      return Gem;
  }
}

function isAccessorySlot(slotId: EquipmentSlotId) {
  return slotId === "accessory1" || slotId === "accessory2" || slotId === "accessory3";
}

function canEquipItemInSlot(item: InventoryItem, slotId: EquipmentSlotId) {
  if (isAccessorySlot(slotId)) {
    return (
      item.equipmentSlot === "accessory1" ||
      (!item.equipmentSlot && (item.requiresAttunement || item.kind === "treasure"))
    );
  }

  if (
    (slotId === "mainHand" || slotId === "offHand") &&
    item.equipmentSlot === "mainHand" &&
    (item.kind === "weapon" || item.kind === "tool")
  ) {
    return true;
  }

  return item.equipmentSlot === slotId;
}

function getItemWidth(item: InventoryItem) {
  return item.rotated ? item.height : item.width;
}

function getItemHeight(item: InventoryItem) {
  return item.rotated ? item.width : item.height;
}

function canPlaceItem(
  candidate: InventoryItem,
  container: InventoryContainer,
  allItems: InventoryItem[],
) {
  const candidateWidth = getItemWidth(candidate);
  const candidateHeight = getItemHeight(candidate);

  if (
    candidate.x < 0 ||
    candidate.y < 0 ||
    candidate.x + candidateWidth > container.columns ||
    candidate.y + candidateHeight > container.rows
  ) {
    return false;
  }

  return allItems
    .filter((item) => item.location === container.id && item.id !== candidate.id)
    .every((item) => !itemsOverlap(candidate, item));
}

function canMergeItems(leftItem: InventoryItem, rightItem: InventoryItem) {
  return (
    leftItem.id !== rightItem.id &&
    leftItem.stackable &&
    rightItem.stackable &&
    leftItem.kind === rightItem.kind &&
    leftItem.name.trim().toLowerCase() === rightItem.name.trim().toLowerCase()
  );
}

function findFirstAvailableSlot(
  item: InventoryItem,
  container: InventoryContainer,
  allItems: InventoryItem[],
) {
  for (let y = 0; y <= container.rows - getItemHeight(item); y += 1) {
    for (let x = 0; x <= container.columns - getItemWidth(item); x += 1) {
      const candidate = {
        ...item,
        x,
        y,
      };

      if (canPlaceItem(candidate, container, allItems)) {
        return { x, y };
      }
    }
  }

  return null;
}

function inferReferenceItemKind(referenceItem: ReferenceEquipment): ItemKind {
  const referenceType = inferReferenceLibraryType(referenceItem);

  if (referenceType === "armor") {
    return "armor";
  }

  if (referenceType === "weapon") {
    return "weapon";
  }

  if (
    referenceType === "potion" ||
    referenceType === "scroll"
  ) {
    return "consumable";
  }

  if (
    referenceType === "staff" ||
    referenceType === "wand" ||
    referenceType === "rod" ||
    referenceType === "other"
  ) {
    return "tool";
  }

  return "treasure";
}

function inferReferenceEquipmentSlot(referenceItem: ReferenceEquipment): EquipmentSlotId | undefined {
  const text = `${referenceItem.name} ${referenceItem.equipmentCategory ?? ""} ${referenceItem.itemType ?? ""}`.toLowerCase();

  if (text.includes("shield")) {
    return "offHand";
  }

  if (
    text.includes("sword") ||
    text.includes("axe") ||
    text.includes("hammer") ||
    text.includes("mace") ||
    text.includes("dagger") ||
    text.includes("bow") ||
    text.includes("crossbow") ||
      text.includes("blowgun") ||
      text.includes("sling") ||
      text.includes("club") ||
      text.includes("dart") ||
      text.includes("flail") ||
      text.includes("glaive") ||
      text.includes("halberd") ||
      text.includes("javelin") ||
      text.includes("lance") ||
      text.includes("maul") ||
      text.includes("morningstar") ||
      text.includes("pike") ||
      text.includes("spear") ||
      text.includes("staff") ||
      text.includes("trident") ||
      text.includes("whip") ||
      text.includes("wand") ||
      text.includes("rod")
    ) {
    return "mainHand";
  }

  if (text.includes("helmet") || text.includes("helm") || text.includes("hat")) {
    return "head";
  }

  if (text.includes("boot")) {
    return "feet";
  }

  if (text.includes("glove") || text.includes("gauntlet")) {
    return "hands";
  }

  if (text.includes("ring")) {
    return "accessory1";
  }

  if (
    text.includes("cloak") ||
    text.includes("mantle") ||
    text.includes("amulet") ||
    text.includes("necklace") ||
    text.includes("brooch") ||
    text.includes("ioun stone")
  ) {
    return "accessory1";
  }

  if (text.includes("armor") || text.includes("mail") || text.includes("breastplate") || text.includes("plate")) {
    return "body";
  }

  return undefined;
}

function inferReferenceItemWidth(referenceItem: ReferenceEquipment) {
  const type = inferReferenceLibraryType(referenceItem);

  if (type === "weapon") {
    return 1;
  }

  if (type === "armor") {
    return 2;
  }

  if (isReferenceEquipmentContainer(referenceItem)) {
    return 3;
  }

  return 1;
}

function inferReferenceItemHeight(referenceItem: ReferenceEquipment) {
  const text = `${referenceItem.name} ${referenceItem.equipmentCategory ?? ""} ${referenceItem.itemType ?? ""}`.toLowerCase();
  const type = inferReferenceLibraryType(referenceItem);

  if (text.includes("longsword") || text.includes("longbow") || text.includes("polearm")) {
    return 3;
  }

  if (type === "armor") {
    return text.includes("shield") ? 2 : 3;
  }

  if (isReferenceEquipmentContainer(referenceItem)) {
    return 2;
  }

  return 1;
}

function inferReferenceItemColor(referenceItem: ReferenceEquipment) {
  const type = inferReferenceLibraryType(referenceItem);

  switch (type) {
    case "armor":
      return "#64748b";
    case "weapon":
      return "#f97316";
    case "potion":
      return "#ef4444";
    case "scroll":
      return "#cbd5e1";
    case "staff":
    case "wand":
    case "rod":
      return "#8b5cf6";
    case "ring":
    case "wondrous":
      return "#facc15";
    default:
      return "#38bdf8";
  }
}

function inferReferenceRequiresAttunement(referenceItem: ReferenceEquipment) {
  const text = [
    referenceItem.name,
    referenceItem.equipmentCategory ?? "",
    referenceItem.itemType ?? "",
    extractReferenceDescription(referenceItem),
  ]
    .join(" ")
    .toLowerCase();

  return text.includes("requires attunement") || text.includes("attunement");
}

function inferReferenceLibraryType(referenceItem: ReferenceEquipment): InventoryLibraryType {
  const text = `${referenceItem.name} ${referenceItem.equipmentCategory ?? ""} ${referenceItem.itemType ?? ""}`.toLowerCase();

  if (text.includes("armor") || text.includes("mail") || text.includes("breastplate") || text.includes("shield")) {
    return "armor";
  }

  if (text.includes("potion")) {
    return "potion";
  }

  if (text.includes("ring")) {
    return "ring";
  }

  if (text.includes("rod")) {
    return "rod";
  }

  if (text.includes("scroll")) {
    return "scroll";
  }

  if (text.includes("staff")) {
    return "staff";
  }

  if (text.includes("wand")) {
    return "wand";
  }

  if (
    text.includes("weapon") ||
    text.includes("sword") ||
    text.includes("axe") ||
    text.includes("hammer") ||
    text.includes("mace") ||
      text.includes("dagger") ||
      text.includes("bow") ||
      text.includes("crossbow") ||
      text.includes("blowgun") ||
      text.includes("sling") ||
      text.includes("club") ||
      text.includes("dart") ||
      text.includes("flail") ||
      text.includes("glaive") ||
      text.includes("halberd") ||
      text.includes("javelin") ||
      text.includes("lance") ||
      text.includes("maul") ||
      text.includes("morningstar") ||
      text.includes("pike") ||
      text.includes("spear") ||
      text.includes("staff") ||
      text.includes("trident") ||
      text.includes("whip")
    ) {
    return "weapon";
  }

  if (text.includes("wondrous")) {
    return "wondrous";
  }

  return "other";
}

function inferReferenceSourceCategory(referenceItem: ReferenceEquipment) {
  const sourceJson =
    referenceItem.sourceJson && typeof referenceItem.sourceJson === "object"
      ? (referenceItem.sourceJson as Record<string, unknown>)
      : null;
  const rawSource = [
    typeof sourceJson?.source === "string" ? sourceJson.source : "",
    typeof sourceJson?.sourceName === "string" ? sourceJson.sourceName : "",
  ]
    .join(" ")
    .trim()
    .toLowerCase();

  if (rawSource.includes("critical role")) {
    return "Critical Role";
  }

  if (rawSource.includes("expanded")) {
    return "5E Expanded Rules";
  }

  if (rawSource.includes("legacy") || rawSource.includes("noncore")) {
    return "Legacy/Noncore";
  }

  if (rawSource.includes("2024") || rawSource.includes("5.5")) {
    return "5.5E Core Rules";
  }

  return "5E Core Rules";
}

function isReferenceEquipmentMagical(referenceItem: ReferenceEquipment) {
  const text = `${referenceItem.name} ${referenceItem.itemType ?? ""} ${extractReferenceDescription(referenceItem)}`.toLowerCase();

  return (
    text.includes("magic") ||
    text.includes("magical") ||
    text.includes("spell") ||
    text.includes("wondrous") ||
    ["potion", "scroll", "wand", "rod", "ring"].includes(inferReferenceLibraryType(referenceItem))
  );
}

function isReferenceEquipmentContainer(referenceItem: ReferenceEquipment) {
  const text = `${referenceItem.name} ${referenceItem.equipmentCategory ?? ""} ${referenceItem.itemType ?? ""}`.toLowerCase();

  return (
    text.includes("container") ||
    text.includes("pack") ||
    text.includes("bag") ||
    text.includes("chest") ||
    text.includes("pouch") ||
    text.includes("case")
  );
}

function isReferenceEquipmentCommon(referenceItem: ReferenceEquipment) {
  return !isReferenceEquipmentMagical(referenceItem);
}

function extractReferenceDescription(referenceItem: ReferenceEquipment) {
  if (typeof referenceItem.description === "string" && referenceItem.description.trim().length > 0) {
    return referenceItem.description.trim();
  }

  const sourceJson =
    referenceItem.sourceJson && typeof referenceItem.sourceJson === "object"
      ? (referenceItem.sourceJson as Record<string, unknown>)
      : null;
  const desc = sourceJson?.desc;

  if (Array.isArray(desc)) {
    return desc.filter((entry): entry is string => typeof entry === "string").join(" ");
  }

  if (typeof desc === "string") {
    return desc;
  }

  return "";
}

function formatReferenceEquipmentMeta(referenceItem: ReferenceEquipment) {
  const left = referenceItem.equipmentCategory ?? referenceItem.itemType ?? "Adventuring Gear";
  const right =
    referenceItem.weight != null
      ? `${referenceItem.weight} lb`
      : referenceItem.costQuantity != null
        ? `${referenceItem.costQuantity}${referenceItem.costUnit ? ` ${referenceItem.costUnit}` : ""}`
        : referenceItem.name;

  return `${left} · ${right}`;
}

function summarizeInventoryItemEffects(item: InventoryItem) {
  const effectLines: string[] = [];

  if (item.requiresAttunement) {
    effectLines.push(
      item.attuned
        ? "Attunement is active, so this item's magical effects currently apply."
        : "This item needs attunement before its magical effects apply to the character.",
    );
  }

  if (item.armorClassBonus > 0) {
    effectLines.push(`Grants +${item.armorClassBonus} Armor Class while equipped.`);
  }

  if (item.attackBonus > 0) {
    effectLines.push(`Grants +${item.attackBonus} to attack rolls made with this item.`);
  }

  if (item.damage) {
    effectLines.push(`Uses ${item.damage} as its weapon damage profile.`);
  }

  if (item.speedPenalty > 0) {
    effectLines.push(`Reduces speed by ${item.speedPenalty} feet while equipped.`);
  }

  if (item.referenceEquipmentIndex) {
    const referenceSummary = summarizeReferenceEquipmentEffects({
      description: item.notes,
      index: item.referenceEquipmentIndex,
      name: item.name,
    });

    referenceSummary.effectLines.forEach((line) => {
      if (!effectLines.includes(line)) {
        effectLines.push(line);
      }
    });
  }

  return effectLines;
}

function getSelectedItemReferenceDescription(item: InventoryItem) {
  if (item.referenceEquipmentIndex) {
    return summarizeReferenceEquipmentEffects({
      description: item.notes,
      index: item.referenceEquipmentIndex,
      name: item.name,
    }).description;
  }

  return item.notes.trim();
}

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min;
  }

  return Math.max(min, Math.min(max, Math.trunc(value)));
}

function getInventoryStorageKey(storageScope: string) {
  if (storageScope === "sandbox") {
    return inventoryStorageKey;
  }

  return `${inventoryDashboardStoragePrefix}.${storageScope}`;
}

function enforceAttunementLimit(items: InventoryItem[], limit: number) {
  let attunedCount = 0;

  return items.map((item) => {
    if (!item.requiresAttunement || !item.attuned) {
      return item;
    }

    attunedCount += 1;

    return attunedCount <= limit
      ? item
      : {
          ...item,
          attuned: false,
        };
  });
}

function loadSavedInventoryState(storageKey = inventoryStorageKey): SavedInventoryState | null {
  try {
    const rawState = localStorage.getItem(storageKey);

    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState) as SavedInventoryState;

    if (!Array.isArray(parsedState.containers) || !Array.isArray(parsedState.items)) {
      return null;
    }

    return {
      containers: parsedState.containers,
      items: parsedState.items.map((item) => ({
        ...item,
        maxStack: item.maxStack ?? (item.stackable ? 999 : 1),
        quantity: item.quantity ?? 1,
        valueUnit: item.valueUnit ?? "gp",
      })),
      selectedItemId: parsedState.selectedItemId ?? parsedState.items[0]?.id ?? "",
      updatedAt: normalizeInventoryUpdatedAt(parsedState.updatedAt),
    };
  } catch {
    return null;
  }
}

function encodeInventoryState(state: SavedInventoryState) {
  const json = JSON.stringify(state);
  const bytes = new TextEncoder().encode(json);
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeInventoryState(code: string): SavedInventoryState | null {
  try {
    const normalizedCode = code.trim().replace(/-/g, "+").replace(/_/g, "/");
    const paddedCode = normalizedCode.padEnd(
      normalizedCode.length + ((4 - (normalizedCode.length % 4)) % 4),
      "=",
    );
    const binary = atob(paddedCode);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    const parsedState = JSON.parse(json) as SavedInventoryState;

    if (!Array.isArray(parsedState.containers) || !Array.isArray(parsedState.items)) {
      return null;
    }

    return {
      containers: parsedState.containers,
      items: parsedState.items.map((item) => ({
        ...item,
        maxStack: item.maxStack ?? (item.stackable ? 999 : 1),
        quantity: item.quantity ?? 1,
        valueUnit: item.valueUnit ?? "gp",
      })),
      selectedItemId: parsedState.selectedItemId ?? parsedState.items[0]?.id ?? "",
      updatedAt: normalizeInventoryUpdatedAt(parsedState.updatedAt),
    };
  } catch {
    return null;
  }
}

function normalizeInventoryUpdatedAt(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
}

function shouldPreferLocalInventoryState(
  localState: Pick<SavedInventoryState, "updatedAt"> | null,
  backendState: Pick<SavedInventoryState, "updatedAt"> | null,
) {
  const localUpdatedAt = localState?.updatedAt ?? 0;
  const backendUpdatedAt = backendState?.updatedAt ?? 0;

  return localUpdatedAt > 0 && localUpdatedAt > backendUpdatedAt;
}

function itemsOverlap(leftItem: InventoryItem, rightItem: InventoryItem) {
  return (
    leftItem.x < rightItem.x + getItemWidth(rightItem) &&
    leftItem.x + getItemWidth(leftItem) > rightItem.x &&
    leftItem.y < rightItem.y + getItemHeight(rightItem) &&
    leftItem.y + getItemHeight(leftItem) > rightItem.y
  );
}

export {
  canEquipItemInSlot,
  convertCurrencyToGp,
  enforceAttunementLimit,
  getInventoryTotals,
  InventoryDetailsSidebar,
  InventoryWorkbench,
  shouldPreferLocalInventoryState,
  useInventorySandboxController,
};
export type { EquipmentSlotId, InventoryItem, InventorySandboxController };
