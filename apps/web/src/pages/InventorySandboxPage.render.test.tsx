import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  encodeInventoryState,
  InventoryDetailsSidebar,
  InventoryWorkbench,
  type InventoryContainer,
  type InventoryItem,
  type InventorySandboxController,
  useInventorySandboxController,
} from "./InventorySandboxPage";
import {
  fetchCharacterInventory,
  fetchCharacterInventoryState,
  saveCharacterFullInventory,
} from "../features/characters/api/characterInventory";

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({ token: "token" }),
}));

vi.mock("../features/references/api/fetchReferences", () => ({
  fetchEquipment: vi.fn(async () => [
    {
      costQuantity: 15,
      costUnit: "gp",
      description: "A sharp blade with a versatile grip.",
      equipmentCategory: "Weapon",
      index: "longsword",
      itemType: "Martial Weapon",
      name: "Longsword",
      sourceJson: { source: "2024 Core" },
      weight: 3,
    },
    {
      costQuantity: 10,
      costUnit: "gp",
      description: "Armor that requires attunement in this fixture.",
      equipmentCategory: "Armor",
      index: "shield",
      itemType: "Shield",
      name: "Shield",
      sourceJson: { source: "Critical Role" },
      weight: 6,
    },
  ]),
}));

vi.mock("../features/characters/api/characterInventory", () => ({
  fetchCharacterInventory: vi.fn(),
  fetchCharacterInventoryState: vi.fn(),
  saveCharacterFullInventory: vi.fn(),
}));

const mockedFetchCharacterInventory = vi.mocked(fetchCharacterInventory);
const mockedFetchCharacterInventoryState = vi.mocked(fetchCharacterInventoryState);
const mockedSaveCharacterFullInventory = vi.mocked(saveCharacterFullInventory);

function item(patch: Partial<InventoryItem> = {}): InventoryItem {
  return {
    armorClassBonus: 1,
    attackBonus: 1,
    attuned: true,
    color: "#64748b",
    damage: "1d8 slashing",
    height: 3,
    id: "sword",
    kind: "weapon",
    location: "inventory",
    maxStack: 5,
    name: "Steel Longsword",
    notes: "A reliable blade.",
    quantity: 2,
    rarity: "Magical",
    referenceEquipmentIndex: "longsword",
    requiresAttunement: true,
    rotated: false,
    speedPenalty: 0,
    stackable: true,
    value: 15,
    weight: 3,
    width: 1,
    x: 0,
    y: 0,
    ...patch,
  };
}

const containers: InventoryContainer[] = [
  { columns: 10, id: "inventory", name: "Character Inventory", rows: 6 },
  { columns: 8, id: "chest", name: "Ironbound Chest", rows: 5 },
];

function backendItem() {
  return {
    equipment: {
      costQuantity: 50,
      costUnit: "gp",
      description: "A potion ready to drink.",
      equipmentCategory: "Adventuring Gear",
      index: "potion-of-healing",
      itemType: "Potion",
      name: "Potion of Healing",
      sourceJson: { desc: ["A potion ready to drink."] },
      weight: 0.5,
    },
    equipmentIndex: "potion-of-healing",
    equipped: false,
    gridX: 1,
    gridY: 2,
    id: "backend-potion",
    notes: null,
    quantity: 2,
  };
}

function InventoryControllerProbe({
  backendCharacterId = "character-1",
  importCode = "",
  storageScope = "character-1",
}: {
  backendCharacterId?: string;
  importCode?: string;
  storageScope?: string;
}) {
  const controller = useInventorySandboxController(storageScope, backendCharacterId, 3);

  return (
    <div>
      <p>{controller.message}</p>
      <p aria-label="items">{controller.items.map((currentItem) => currentItem.name).join(", ")}</p>
      <p aria-label="share-code">{controller.shareCode}</p>
      <button type="button" onClick={() => void controller.saveToBackend()}>
        Save backend
      </button>
      <button
        type="button"
        onClick={() => {
          controller.setSplitAmount(1);
          controller.splitSelectedStack();
        }}
      >
        Split selected
      </button>
      <button type="button" onClick={controller.takeOneFromSelectedStack}>
        Take one selected
      </button>
      <button type="button" onClick={controller.createChest}>
        Create stash chest
      </button>
      <button type="button" onClick={controller.createItem}>
        Create custom item
      </button>
      <button type="button" onClick={() => controller.applyItemTemplate("healing-potion")}>
        Apply potion template
      </button>
      <button type="button" onClick={controller.exportShareCode}>
        Export inventory
      </button>
      <button type="button" onClick={() => controller.setShareCode(importCode)}>
        Set valid import
      </button>
      <button
        type="button"
        onClick={() => controller.setShareCode("not a real inventory code")}
      >
        Set invalid import
      </button>
      <button type="button" onClick={controller.importShareCode}>
        Import inventory
      </button>
      <button type="button" onClick={() => controller.updateSelectedItem({ attuned: true })}>
        Attune selected
      </button>
    </div>
  );
}

function buildController(): InventorySandboxController {
  const selectedItem = item();
  const equipped = item({
    equippedSlot: "offHand",
    id: "shield",
    kind: "armor",
    location: "equipped",
    name: "Shield",
    quantity: 1,
    stackable: false,
  });

  return {
    activeContainerId: "inventory",
    addReferenceEquipment: vi.fn(),
    applyItemTemplate: vi.fn(),
    attunedItems: [selectedItem],
    attunementLimit: 3,
    backendEnabled: true,
    backendSaving: false,
    clearContainer: vi.fn(),
    containers,
    createChest: vi.fn(),
    createItem: vi.fn(),
    deleteContainer: vi.fn(),
    discardItem: vi.fn(),
    equipmentSlots: [],
    equippedItems: new Map([["offHand", equipped]]),
    exportShareCode: vi.fn(),
    handleDiscardDrop: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDragOver: vi.fn(),
    handleDragStart: vi.fn(),
    handleDrop: vi.fn(),
    handleEquipmentDrop: vi.fn(),
    handleItemDragLeave: vi.fn(),
    handleItemDragOver: vi.fn(),
    handleItemDrop: vi.fn(),
    handleKeyboard: vi.fn(),
    hoverPreview: null,
    importShareCode: vi.fn(),
    items: [selectedItem, equipped],
    mergeTargetId: null,
    message: "Ready",
    newChestColumns: 4,
    newChestName: "Gem Chest",
    newChestRows: 4,
    newItemForm: {
      color: "#38bdf8",
      equipmentSlot: "mainHand",
      height: 2,
      kind: "weapon",
      location: "inventory",
      maxStack: 5,
      name: "Custom Wand",
      quantity: 2,
      requiresAttunement: true,
      stackable: true,
      width: 1,
    },
    persistedItems: [],
    renameContainer: vi.fn(),
    resizeContainer: vi.fn(),
    rotateSelectedItem: vi.fn(),
    saveToBackend: vi.fn(),
    selectedItem,
    selectedItemId: "sword",
    setActiveContainerId: vi.fn(),
    setNewChestColumns: vi.fn(),
    setNewChestName: vi.fn(),
    setNewChestRows: vi.fn(),
    setNewItemForm: vi.fn(),
    setSelectedItemId: vi.fn(),
    setShareCode: vi.fn(),
    setSplitAmount: vi.fn(),
    shareCode: "share-code",
    splitAmount: 1,
    splitSelectedStack: vi.fn(),
    takeOneFromSelectedStack: vi.fn(),
    updateSelectedItem: vi.fn(),
  } as InventorySandboxController;
}

describe("InventorySandboxPage render surfaces", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders the workbench and opens inventory tool panels", async () => {
    const controller = buildController();

    render(<InventoryWorkbench controller={controller} />);

    expect(screen.getByText("Drag and Drop Equipment")).toBeTruthy();
    expect(screen.getByText("Equipped Gear")).toBeTruthy();
    expect(screen.getAllByText("Steel Longsword").length).toBeGreaterThan(0);
    expect(screen.getByText("1 / 3")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Rotate" }));
    expect(controller.rotateSelectedItem).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    expect(screen.getByRole("dialog", { name: "Inventory tools" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(controller.exportShareCode).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Close inventory panel"));

    fireEvent.click(screen.getByRole("button", { name: "Create Item" }));
    fireEvent.change(screen.getByDisplayValue("Custom Wand"), {
      target: { value: "Custom Staff" },
    });
    expect(controller.setNewItemForm).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));
    expect(controller.createItem).toHaveBeenCalled();

    expect(await screen.findByText("Longsword")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("Weapon, Longsword, Vorpal Longsword, etc."), {
      target: { value: "shield" },
    });
    expect(screen.getAllByText("Shield").length).toBeGreaterThan(0);
  });

  it("renders the rail details view and edits selected item fields", async () => {
    const controller = buildController();

    render(<InventoryDetailsSidebar controller={controller} isOpen />);

    expect(screen.getByText("Selected Item")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
    expect(screen.getByText("Reference Description")).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("Steel Longsword"), {
      target: { value: "Renamed Longsword" },
    });
    expect(controller.updateSelectedItem).toHaveBeenCalledWith({ name: "Renamed Longsword" });

    fireEvent.click(screen.getByRole("button", { name: "Take One" }));
    expect(controller.takeOneFromSelectedStack).toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Split" }));
    expect(controller.splitSelectedStack).toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText("Close inventory panel"));
    fireEvent.click(screen.getByRole("button", { name: "Manage" }));
    expect(screen.getByDisplayValue("Ironbound Chest")).toBeTruthy();

    expect(await screen.findByText("Longsword")).toBeTruthy();
  });

  it("loads fallback backend inventory and saves the full inventory state", async () => {
    mockedFetchCharacterInventoryState.mockResolvedValueOnce({
      stateCode: null,
      updatedAt: null,
    });
    mockedFetchCharacterInventory.mockResolvedValueOnce([backendItem()]);
    mockedSaveCharacterFullInventory.mockResolvedValueOnce({
      items: [],
      stateCode: "saved",
      updatedAt: "now",
    });

    render(<InventoryControllerProbe />);

    expect(await screen.findByText("Inventory loaded from character database.")).toBeTruthy();
    expect(screen.getByLabelText("items").textContent).toContain("Potion of Healing");

    fireEvent.click(screen.getByRole("button", { name: "Split selected" }));
    expect(await screen.findByText("Split 1 Potion of Healing.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Take one selected" }));
    expect(await screen.findByText("Potion of Healing discarded.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Create stash chest" }));
    expect(await screen.findByText("Stash Chest created.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Create custom item" }));
    expect(await screen.findByText("Custom Relic added to Stash Chest.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Apply potion template" }));
    expect(await screen.findByText("Healing Potion template loaded.")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Save backend" }));

    await waitFor(() =>
      expect(mockedSaveCharacterFullInventory).toHaveBeenCalledWith(
        "character-1",
        expect.arrayContaining([
          expect.objectContaining({
            equipmentIndex: "potion-of-healing",
            quantity: 1,
          }),
        ]),
        expect.any(String),
        "token",
      ),
    );
    expect(await screen.findByText("Saved full inventory layout to the character database.")).toBeTruthy();
  });

  it("recovers newer local inventory state and reports invalid imports", async () => {
    const localState = {
      containers,
      items: [item({ id: "local-scroll", name: "Local Scroll", quantity: 1 })],
      selectedItemId: "local-scroll",
      updatedAt: Date.now() + 10_000,
    };
    const remoteState = {
      containers,
      items: [item({ id: "remote-gem", name: "Remote Gem", quantity: 1 })],
      selectedItemId: "remote-gem",
      updatedAt: Date.now() - 10_000,
    };
    const importedState = {
      containers,
      items: [item({ id: "imported-map", name: "Imported Map", quantity: 1 })],
      selectedItemId: "imported-map",
      updatedAt: Date.now() + 20_000,
    };

    localStorage.setItem(
      "dd-simple.character-inventory.v1.character-recovery",
      JSON.stringify(localState),
    );
    mockedFetchCharacterInventoryState.mockResolvedValueOnce({
      stateCode: encodeInventoryState(remoteState),
      updatedAt: "remote",
    });
    mockedSaveCharacterFullInventory.mockResolvedValueOnce({
      items: [],
      stateCode: "recovered",
      updatedAt: "now",
    });

    render(
      <InventoryControllerProbe
        backendCharacterId="character-recovery"
        importCode={encodeInventoryState(importedState)}
        storageScope="character-recovery"
      />,
    );

    expect(
      await screen.findByText("Recovered and saved the latest local inventory changes."),
    ).toBeTruthy();
    expect(screen.getByLabelText("items").textContent).toContain("Local Scroll");

    fireEvent.click(screen.getByRole("button", { name: "Export inventory" }));
    expect(screen.getByLabelText("share-code").textContent).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Set valid import" }));
    fireEvent.click(screen.getByRole("button", { name: "Import inventory" }));
    expect(screen.getByText("Inventory imported from share code.")).toBeTruthy();
    expect(screen.getByLabelText("items").textContent).toContain("Imported Map");
    fireEvent.click(screen.getByRole("button", { name: "Set invalid import" }));
    fireEvent.click(screen.getByRole("button", { name: "Import inventory" }));
    expect(screen.getByText("Import code is not valid.")).toBeTruthy();
  });
});
