import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CharacterDashboardPage } from "./CharacterDashboardPage";

const mocks = vi.hoisted(() => ({
  addCondition: vi.fn(async (id: string) => characterFixture),
  applyCurrentHpAdjustment: vi.fn(),
  applyHitPointConfiguration: vi.fn(),
  applyLongRest: vi.fn(),
  closePanel: vi.fn(),
  confirmSelection: vi.fn(),
  flushSave: vi.fn(),
  handleRollAbility: vi.fn(),
  handleRollAllAbilities: vi.fn(),
  onResourceStateChange: vi.fn(),
  openPanel: vi.fn(),
  announceDiceRoll: vi.fn(),
  recordDiceRoll: vi.fn(async () => ({ id: "roll-2" })),
  removeCondition: vi.fn(async (id: string) => characterFixture),
  replaceCharacter: vi.fn(),
  roomSocketError: null as string | null,
  setFeatureChoices: vi.fn(),
  setSelection: vi.fn(),
  setSubclassIndex: vi.fn(),
  setTempHp: vi.fn(),
  updateAbilityAssignment: vi.fn(),
  updateLevel: vi.fn(),
}));

const abilityDefinitions = {
  cha: { index: "cha", name: "CHA", fullName: "Charisma" },
  con: { index: "con", name: "CON", fullName: "Constitution" },
  dex: { index: "dex", name: "DEX", fullName: "Dexterity" },
  int: { index: "int", name: "INT", fullName: "Intelligence" },
  str: { index: "str", name: "STR", fullName: "Strength" },
  wis: { index: "wis", name: "WIS", fullName: "Wisdom" },
};

const characterFixture = {
  abilityScores: [
    { ability: abilityDefinitions.str, abilityIndex: "str", baseScore: 16, score: 16 },
    { ability: abilityDefinitions.dex, abilityIndex: "dex", baseScore: 14, score: 14 },
    { ability: abilityDefinitions.con, abilityIndex: "con", baseScore: 14, score: 14 },
    { ability: abilityDefinitions.int, abilityIndex: "int", baseScore: 10, score: 10 },
    { ability: abilityDefinitions.wis, abilityIndex: "wis", baseScore: 12, score: 12 },
    { ability: abilityDefinitions.cha, abilityIndex: "cha", baseScore: 8, score: 8 },
  ],
  alignment: "Neutral Good",
  backgroundIndex: "soldier",
  choices: [],
  classIndex: "fighter",
  conditions: [{ conditionIndex: "blinded", notes: "Until next turn" }],
  currentHp: 22,
  featureChoices: [],
  hitPointState: null,
  id: "character-1",
  level: 5,
  maxHp: 44,
  name: "Kael",
  resourceState: null,
  speciesIndex: "human",
  spellcastingState: null,
  subclassIndex: "champion",
  tempHp: 3,
};

const selectedClass = {
  description: "A fighter.",
  features: [
    {
      choiceFields: [
        {
          choiceKind: "subclass",
          id: "subclass",
          label: "Subclass",
          options: [{ label: "Champion", value: "champion" }],
        },
      ],
      id: "martial-archetype",
      level: 3,
      summary: "Choose archetype.",
      title: "Martial Archetype",
    },
    { id: "second-wind", level: 1, summary: "Heal.", title: "Second Wind" },
  ],
  hitDie: 10,
  index: "fighter",
  name: "Fighter",
  previewOverview: [],
  primaryAbility: "Strength",
  proficiencies: { armor: [], tools: [], weapons: [] },
  savingThrows: ["Strength", "Constitution"],
  skillChoices: { choose: 2, options: ["Athletics"] },
  startingEquipment: [],
  subclasses: [{ features: [], index: "champion", name: "Champion" }],
};

const selectedBackground = {
  description: "Soldier.",
  feature: "Savage Attacker",
  index: "soldier",
  name: "Soldier",
  previewSections: [],
  proficiencies: [],
  skillProficiencies: [],
  toolProficiencies: [],
};

const selectedSpecies = {
  creatureType: "Humanoid",
  description: "Human.",
  index: "human",
  languages: ["Common"],
  name: "Human",
  previewSections: [],
  size: "Medium",
  speed: 30,
  traits: ["Resourceful"],
};

vi.mock("../features/auth/AuthContext", () => ({
  useAuth: () => ({ logout: vi.fn(), token: "token", user: { email: "test@example.com" } }),
}));

vi.mock("../components/layout/AppLayout", () => ({
  AppLayout: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("../features/characters/utils/selectedCharacter", () => ({
  clearSelectedCharacterId: vi.fn(),
  getSelectedCharacterId: () => null,
}));

vi.mock("../features/characters/hooks/useCharacters", () => ({
  useCharacters: () => ({
    addCondition: mocks.addCondition,
    characters: [characterFixture],
    error: null,
    loading: false,
    recordDiceRoll: mocks.recordDiceRoll,
    removeCondition: mocks.removeCondition,
    replaceCharacter: mocks.replaceCharacter,
    saveError: null,
    savingCharacterId: null,
  }),
}));

vi.mock("../features/rooms/hooks/useRoomSocket", () => ({
  useRoomSocket: () => ({
    announceDiceRoll: mocks.announceDiceRoll,
    error: mocks.roomSocketError,
  }),
}));

vi.mock("../features/characters/hooks/useCharacterBuilder", () => ({
  useCharacterBuilder: () => ({
    activePanel: "class",
    applyCurrentHpAdjustment: mocks.applyCurrentHpAdjustment,
    applyHitPointConfiguration: mocks.applyHitPointConfiguration,
    applyLongRest: mocks.applyLongRest,
    backgroundChoices: {},
    backgroundOptions: [selectedBackground],
    builderState: {
      abilityAssignments: [
        { abilityIndex: "str", dice: [6, 5, 4], id: "slot-str", score: 16 },
        { abilityIndex: "dex", dice: [5, 4, 3], id: "slot-dex", score: 14 },
      ],
      backgroundIndex: "soldier",
      classIndex: "fighter",
      currentHp: 22,
      hitPointSettings: {
        bonusHp: 0,
        calculationMode: "fixed",
        overrideMaxHp: null,
        rolledHitPoints: [10, 6, 6, 5, 7],
      },
      level: 5,
      speciesIndex: "human",
      subclassIndex: "champion",
      tempHp: 3,
    },
    classOptions: [selectedClass],
    closePanel: mocks.closePanel,
    confirmSelection: mocks.confirmSelection,
    featureChoices: { "martial-archetype:subclass": "champion" },
    handleRollAbility: mocks.handleRollAbility,
    handleRollAllAbilities: mocks.handleRollAllAbilities,
    hitPointPreview: { bonusHp: 0, hitDie: 10, maxHp: 44 },
    hitPointSettings: {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: [10, 6, 6, 5, 7],
    },
    openPanel: mocks.openPanel,
    pendingSelection: "fighter",
    previewCharacter: characterFixture,
    selectedBackground,
    selectedClass,
    selectedPanelOption: selectedClass,
    selectedSkillIndexes: ["athletics"],
    selectedSpecies,
    setFeatureChoices: mocks.setFeatureChoices,
    setSelection: mocks.setSelection,
    setSubclassIndex: mocks.setSubclassIndex,
    setTempHp: mocks.setTempHp,
    speciesChoices: {},
    speciesOptions: [selectedSpecies],
    updateAbilityAssignment: mocks.updateAbilityAssignment,
    updateLevel: mocks.updateLevel,
  }),
}));

vi.mock("../features/characters/hooks/useCharacterDerivedState", () => ({
  useCharacterDerivedState: () => ({
    derivedState: {
      actions: [],
      activeSources: [],
      defenses: [{ id: "resist", label: "Resistances", value: "Poison" }],
      resources: [{ id: "second-wind", level: 1, name: "Second Wind" }],
      selectedSubclassIndex: "champion",
      selectedSubspeciesIndex: null,
      spells: [{ id: "fire-bolt", isCantrip: true, spellLevel: 0, title: "Fire Bolt" }],
      stats: {},
    },
    error: null,
    loading: false,
  }),
}));

vi.mock("../features/characters/hooks/useDashboardAutosave", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/characters/hooks/useDashboardAutosave")>();

  return {
    ...actual,
    useDashboardAutosave: () => ({
      flushSave: mocks.flushSave,
      lastSavedAt: null,
      saveError: "Could not save",
      saveStatus: "error",
    }),
  };
});

vi.mock("../features/characters/components/CharacterBuilderSidebar", () => ({
  CharacterBuilderSidebar: ({ onOpenPanel, onRollAllAbilities }: { onOpenPanel: (kind: string) => void; onRollAllAbilities: () => void }) => (
    <section>
      <strong>Builder Mock</strong>
      <button type="button" onClick={() => onOpenPanel("class")}>Open Class</button>
      <button type="button" onClick={onRollAllAbilities}>Roll Mock</button>
    </section>
  ),
}));

vi.mock("../features/characters/components/CharacterSheet", () => ({
  CharacterSheet: ({
    onActiveTabChange,
    onLocalRoll,
    onOpenConditions,
    onOpenSpellLibrary,
    onSelectSpellEntry,
  }: {
    onActiveTabChange: (tab: string) => void;
    onLocalRoll: (result: unknown) => void;
    onOpenConditions: () => void;
    onOpenSpellLibrary: () => void;
    onSelectSpellEntry: (entry: unknown) => void;
  }) => (
    <section>
      <strong>Sheet Mock</strong>
      <button type="button" onClick={() => onActiveTabChange("spells")}>Show Spells</button>
      <button type="button" onClick={onOpenConditions}>Open Conditions</button>
      <button type="button" onClick={onOpenSpellLibrary}>Open Spell Library</button>
      <button type="button" onClick={() => onSelectSpellEntry({ id: "fire-bolt", title: "Fire Bolt" })}>Select Spell</button>
      <button
        type="button"
        onClick={() =>
          onLocalRoll({
            dice: [{ discarded: false, sides: 20, value: 12 }],
            label: "Attack",
            modifier: 5,
            normalizedFormula: "1d20+5",
            parseable: true,
            rollType: "attack",
            source: "Longsword",
            total: 17,
          })
        }
      >
        Roll Local
      </button>
    </section>
  ),
}));

vi.mock("../features/characters/components/CharacterDashboardRightRail", () => ({
  CharacterDashboardRightRail: ({
    diceRollSaveError,
    rightRailMode,
  }: {
    diceRollSaveError?: string | null;
    rightRailMode: string | null;
  }) => (
    <aside>
      Right Rail: {rightRailMode ?? "closed"}
      {diceRollSaveError ? <p>{diceRollSaveError}</p> : null}
    </aside>
  ),
}));

vi.mock("../features/characters/components/CharacterSelectionPanel", () => ({
  CharacterSelectionPanel: ({ activePanel, onConfirm }: { activePanel: string | null; onConfirm: () => void }) => (
    <section>
      Selection Mock: {activePanel ?? "none"}
      <button type="button" onClick={onConfirm}>Confirm Selection</button>
    </section>
  ),
}));

vi.mock("./InventorySandboxPage", () => ({
  useInventorySandboxController: () => ({
    activeContainerId: "inventory",
    containers: [],
    equipmentSlots: [],
    items: [],
    persistedItems: [],
    selectedItem: null,
    selectedItemId: "",
  }),
}));

function renderDashboard(initialEntry = "/characters") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/room/:roomCode/character" element={<CharacterDashboardPage />} />
        <Route path="*" element={<CharacterDashboardPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CharacterDashboardPage render", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    mocks.roomSocketError = null;
    vi.clearAllMocks();
  });

  it("renders dashboard layout and wires major interactions", async () => {
    renderDashboard();

    expect(screen.getByText("Builder Mock")).toBeTruthy();
    expect(screen.getByText("Sheet Mock")).toBeTruthy();
    expect(screen.getByTestId("dashboard-autosave-status")).toBeTruthy();
    expect(screen.getByText("Could not save")).toBeTruthy();

    fireEvent.click(screen.getByTestId("dashboard-retry-save"));
    expect(mocks.flushSave).toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open Class" }));
    expect(mocks.openPanel).toHaveBeenCalledWith("class");

    fireEvent.click(screen.getByRole("button", { name: "Open Conditions" }));
    expect(screen.getByText("Right Rail: conditions")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Open Spell Library" }));
    expect(screen.getByText("Right Rail: spells")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Roll Local" }));
    await waitFor(() => expect(mocks.recordDiceRoll).toHaveBeenCalled());
    expect(mocks.recordDiceRoll).toHaveBeenLastCalledWith(
      "character-1",
      expect.objectContaining({
        roomCode: null,
        visibility: "public",
      }),
    );
    expect(mocks.announceDiceRoll).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open dashboard menu" }));
    expect(screen.getByRole("dialog", { name: "Dashboard sections" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Character builder" }));
    expect(screen.getByText("Selection Mock: class")).toBeTruthy();
  });

  it("saves room-context rolls with room metadata and announces the saved roll id", async () => {
    mocks.recordDiceRoll.mockResolvedValueOnce({ id: "room-roll-1" });

    renderDashboard("/room/ABC123/character?characterId=character-1");

    fireEvent.click(screen.getByRole("button", { name: "Roll Local" }));

    await waitFor(() =>
      expect(mocks.recordDiceRoll).toHaveBeenCalledWith(
        "character-1",
        expect.objectContaining({
          roomCode: "ABC123",
          visibility: "public",
        }),
      ),
    );
    await waitFor(() => expect(mocks.announceDiceRoll).toHaveBeenCalledWith("room-roll-1"));
  });

  it("does not announce room-context rolls when the save fails", async () => {
    mocks.recordDiceRoll.mockResolvedValueOnce(null);

    renderDashboard("/room/ABC123/character?characterId=character-1");

    fireEvent.click(screen.getByRole("button", { name: "Roll Local" }));

    await waitFor(() =>
      expect(screen.getByText("Roll saved locally; history sync failed.")).toBeTruthy(),
    );
    expect(mocks.announceDiceRoll).not.toHaveBeenCalled();
  });

  it("shows room socket errors only in room context", () => {
    mocks.roomSocketError = "Room socket failed";

    renderDashboard("/room/ABC123/character?characterId=character-1");

    expect(screen.getByText("Room socket failed")).toBeTruthy();
  });
});
