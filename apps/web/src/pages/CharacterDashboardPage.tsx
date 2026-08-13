import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  Backpack,
  BookOpen,
  Grid2X2,
  NotebookPen,
  ScrollText,
  Settings2,
  Shield,
  Sparkles,
  Swords,
  X,
} from "lucide-react";
import { AppLayout } from "../components/layout/AppLayout";
import { secureRandomId } from "../lib/secureRandom";
import {
  createDefaultConditionState,
  getConditionSummaryEntries,
  type ConditionId,
  type ConditionState,
} from "../features/characters/components/ConditionsSidebar";
import { CharacterBuilderSidebar } from "../features/characters/components/CharacterBuilderSidebar";
import { CharacterDashboardRightRail } from "../features/characters/components/CharacterDashboardRightRail";
import { CharacterSelectionPanel } from "../features/characters/components/CharacterSelectionPanel";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import { type LocalRollEntry } from "../features/characters/components/LocalRollsPanel";
import type { RollableResult } from "../features/characters/components/Rollable";
import type {
  DashboardSheetSection,
  ResourceActionSummary,
  WorkspaceTab,
} from "../features/characters/components/CharacterSheet";
import { useCharacterBuilder } from "../features/characters/hooks/useCharacterBuilder";
import { useCharacterDerivedState } from "../features/characters/hooks/useCharacterDerivedState";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import {
  formatDashboardSaveStatus,
  useDashboardAutosave,
  type DashboardAutosaveSaveOptions,
} from "../features/characters/hooks/useDashboardAutosave";
import { updateCharacter } from "../features/characters/api/updateCharacter";
import type { CharacterPreviewQuery } from "../features/characters/api/characterPreviewQuery";
import { useAuth } from "../features/auth/AuthContext";
import type {
  BackgroundOption,
  ClassFeature,
  ClassOption,
  FeatureChoiceSelections,
  SpeciesOption,
} from "../features/characters/types/characterBuilder";
import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
} from "../features/characters/utils/selectedCharacter";
import { getSelectedFeatIndexesForPreview } from "../features/characters/utils/buildCharacterPreview";
import { getSpellcastingSummary as getDashboardSpellcastingSummary } from "../features/characters/utils/dashboardSpellcasting";
import {
  buildGenericBackgroundFeatureChoices,
  buildGenericClassFeatureChoices,
  buildGenericSpeciesFeatureChoices,
} from "../features/characters/utils/buildFeatureChoiceSelections";
import type {
  AbilityScores,
  Character,
  CharacterFeatureChoiceSelection,
  CharacterResourceState,
  CharacterFeatureSelection,
  CharacterSavePayload,
  CharacterSpellcastingState,
} from "../types/character";
import type {
  CharacterDerivedState,
  CharacterSpellEntry,
} from "../types/characterDerived";
import {
  useInventorySandboxController,
} from "./InventorySandboxPage";

const abilityScoreIndexes = ["str", "dex", "con", "int", "wis", "cha"] as const;
const backgroundAbilityPlanThreeScores = "increase-all-three-by-1";
const maxLocalRollCount = 3;
const dashboardUiStateStoragePrefix = "dd-simple.dashboardUiState";
const emptyCharacterPreviewQuery: CharacterPreviewQuery = {};
const abilityScoreIndexAliases: Record<string, keyof AbilityScores> = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

type PersistedDashboardUiState = {
  activeWorkspaceTab: WorkspaceTab;
  isBuilderSidebarHidden: boolean;
  rightRailMode: "conditions" | "inventory" | "spells" | null;
  resourceState: CharacterResourceState;
  spellcastingState: CharacterSpellcastingState;
  version: 1 | 2;
};

type CompactDashboardSection = DashboardSheetSection | "builder";

function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    const updateMatch = () => setMatches(mediaQuery.matches);

    updateMatch();
    mediaQuery.addEventListener("change", updateMatch);

    return () => mediaQuery.removeEventListener("change", updateMatch);
  }, [query]);

  return matches;
}

function CharacterDashboardPage() {
  const { token } = useAuth();
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>("actions");
  const [compactSection, setCompactSection] =
    useState<CompactDashboardSection>("overview");
  const [isSectionLauncherOpen, setIsSectionLauncherOpen] = useState(false);
  const [isBuilderSidebarHidden, setIsBuilderSidebarHidden] = useState(false);
  const [rightRailMode, setRightRailMode] = useState<"conditions" | "inventory" | "spells" | null>(null);
  const [selectedSpellEntry, setSelectedSpellEntry] = useState<CharacterSpellEntry | null>(null);
  const rightRailRef = useRef<HTMLDivElement | null>(null);
  const isCompactDashboard = useMediaQuery("(max-width: 1680px)");
  const [conditionState, setConditionState] = useState<ConditionState>(createDefaultConditionState);
  const [diceRollSaveError, setDiceRollSaveError] = useState<string | null>(null);
  const [localRolls, setLocalRolls] = useState<LocalRollEntry[]>([]);
  const [spellcastingState, setSpellcastingState] = useState<CharacterSpellcastingState>({
    learnedSpellIds: [],
    preparedSpellIds: [],
    slotUsageByLevel: {},
  });
  const [resourceState, setResourceState] = useState<CharacterResourceState>({
    activeByResourceKey: {},
    customMaxByResourceKey: {},
    usageByResourceKey: {},
  });
  const {
    addCondition,
    characters,
    error,
    loading,
    removeCondition,
    recordDiceRoll,
    saveError,
    savingCharacterId,
    replaceCharacter,
  } = useCharacters();
  const selectedCharacterId = getSelectedCharacterId();
  const selectedCharacter = useMemo(
    () =>
      selectedCharacterId
        ? characters.find((entry) => entry.id === selectedCharacterId)
        : undefined,
    [characters, selectedCharacterId],
  );
  const character = selectedCharacter ?? characters[0];

  useEffect(() => {
    if (!loading && selectedCharacterId && characters.length > 0 && !selectedCharacter) {
      clearSelectedCharacterId(selectedCharacterId);
    }
  }, [characters.length, loading, selectedCharacter, selectedCharacterId]);

  const {
    activePanel,
    applyCurrentHpAdjustment,
    applyHitPointConfiguration,
    applyLongRest,
    backgroundChoices,
    backgroundOptions,
    builderState,
    classOptions,
    closePanel,
    confirmSelection,
    featureChoices,
    handleRollAbility,
    handleRollAllAbilities,
    hitPointPreview,
    hitPointSettings,
    openPanel,
    pendingSelection,
    previewCharacter,
    selectedBackground,
    selectedClass,
    selectedPanelOption,
    selectedSkillIndexes,
    selectedSpecies,
    setFeatureChoices,
    setSelection,
    setSubclassIndex,
    setTempHp,
    speciesChoices,
    speciesOptions,
    updateAbilityAssignment,
    updateLevel,
  } = useCharacterBuilder(character);
  const resolvedSubclassIndex = useMemo(
    () => {
      if (!selectedClass) {
        return null;
      }

      return getSelectedSubclassIndexForSave(
        builderState?.subclassIndex ?? character?.subclassIndex ?? null,
        selectedClass,
        featureChoices,
        builderState?.level ?? character?.level ?? 1,
      );
    },
    [
      builderState?.level,
      builderState?.subclassIndex,
      character?.subclassIndex,
      character?.level,
      featureChoices,
      selectedClass,
    ],
  );
  const resolvedFeatureChoiceSelections = useMemo<CharacterFeatureChoiceSelection[]>(
    () => {
      if (!builderState || !selectedBackground || !selectedClass || !selectedSpecies) {
        return [];
      }

      return buildGenericClassFeatureChoices(
        builderState.classIndex,
        selectedClass,
        builderState.level,
        featureChoices,
        resolvedSubclassIndex,
      ).concat(
        buildGenericBackgroundFeatureChoices(selectedBackground, backgroundChoices),
        buildGenericSpeciesFeatureChoices(selectedSpecies, speciesChoices),
      );
    },
    [
      backgroundChoices,
      builderState,
      featureChoices,
      resolvedSubclassIndex,
      selectedBackground,
      selectedClass,
      selectedSpecies,
      speciesChoices,
    ],
  );

  const builderActionPreview = useMemo<CharacterPreviewQuery>(
    () => {
      if (!builderState || !selectedBackground || !selectedClass || !selectedSpecies) {
        return emptyCharacterPreviewQuery;
      }

      return {
        abilityScores: Object.fromEntries(
            builderState.abilityAssignments.map((assignment) => [
              assignment.abilityIndex,
              assignment.score,
            ]),
          ),
        backgroundIndex: builderState.backgroundIndex,
        classIndex: builderState.classIndex,
        featIndexes: getSelectedFeatIndexesForPreview(
          selectedClass,
          featureChoices,
          builderState.level,
        ),
        featureChoices: resolvedFeatureChoiceSelections,
        level: builderState.level,
        resourceState,
        speciesIndex: builderState.speciesIndex,
        subclassIndex: resolvedSubclassIndex ?? undefined,
        subspeciesIndex: getSelectedSpeciesHeritageIndex(selectedSpecies, speciesChoices),
      };
    },
    [
      builderState?.abilityAssignments,
      builderState?.backgroundIndex,
      builderState?.classIndex,
      builderState?.level,
      builderState?.speciesIndex,
      featureChoices,
      resolvedFeatureChoiceSelections,
      resolvedSubclassIndex,
      resourceState,
      selectedBackground,
      selectedClass,
      selectedSpecies,
      speciesChoices,
    ],
  );
  const selectedHeritage = useMemo(
    () => getSelectedSpeciesHeritage(selectedSpecies ?? undefined, speciesChoices),
    [selectedSpecies, speciesChoices],
  );
  const selectedSubclass = useMemo(
    () =>
      selectedClass?.subclasses?.find(
        (subclass) => subclass.index === resolvedSubclassIndex,
      ) ?? null,
    [resolvedSubclassIndex, selectedClass],
  );
  const hydratedDashboardCharacterId =
    character &&
    builderState &&
    previewCharacter &&
    selectedBackground &&
    selectedClass &&
    selectedSpecies
      ? character.id
      : null;
  const inventoryController = useInventorySandboxController(
    hydratedDashboardCharacterId ? `character-${hydratedDashboardCharacterId}` : "dashboard",
    hydratedDashboardCharacterId ?? undefined,
    getDashboardAttunementLimit(
      builderState?.level ?? 1,
      selectedClass?.index ?? "",
      selectedSubclass?.index ?? null,
    ),
  );
  const effectiveSpellLibraryClassIndex =
    selectedClass?.index === "rogue" && selectedSubclass?.index === "arcane-trickster"
      ? "arcane-trickster"
      : selectedClass?.index ?? "";
  const spellcastingSummary = useMemo(
    () =>
      previewCharacter && builderState && selectedClass
        ? getDashboardSpellcastingSummary(previewCharacter, selectedClass, selectedSubclass)
        : null,
    [builderState, previewCharacter, selectedClass, selectedSubclass],
  );
  const fallbackResourceActionSummaries = useMemo(
    () =>
      builderState && selectedClass
        ? getResourceActionSummaries(
            selectedClass,
            builderState.level,
            getSelectedFeatIndexesForPreview(selectedClass, featureChoices, builderState.level),
          )
        : [],
    [builderState, featureChoices, selectedClass],
  );
  const {
    derivedState: characterDerivedStateWithPreview,
    error: characterDerivedStateErrorWithPreview,
    loading: characterDerivedStateLoadingWithPreview,
  } = useCharacterDerivedState(hydratedDashboardCharacterId, builderActionPreview);
  const resourceActionSummaries = useMemo(
    () =>
      mergeResourceActionSummaries(
        characterDerivedStateWithPreview?.resources ?? [],
        fallbackResourceActionSummaries,
      ),
    [characterDerivedStateWithPreview?.resources, fallbackResourceActionSummaries],
  );
  const defenseSummary = useMemo(
    () => summarizeDefenses(characterDerivedStateWithPreview?.defenses ?? []),
    [characterDerivedStateWithPreview?.defenses],
  );
  const conditionSummary = useMemo(
    () => getConditionSummaryEntries(conditionState),
    [conditionState],
  );
  const isSavingBuild = Boolean(character && savingCharacterId === character.id);
  const dashboardSavePayload = useMemo(
    () =>
      character && builderState && selectedBackground && selectedClass && selectedSpecies
        ? buildCharacterSavePayload(
            character,
            builderState,
            selectedClass,
            selectedBackground,
            selectedSpecies,
            selectedSkillIndexes,
            featureChoices,
            spellcastingState,
            resourceState,
            backgroundChoices,
            speciesChoices,
          )
        : null,
    [
      backgroundChoices,
      builderState,
      character,
      featureChoices,
      selectedBackground,
      selectedClass,
      selectedSpecies,
      selectedSkillIndexes,
      speciesChoices,
      spellcastingState,
      resourceState,
    ],
  );
  const saveDashboardCharacter = useCallback(
    async (
      characterId: string,
      payload: CharacterSavePayload,
      options: DashboardAutosaveSaveOptions,
    ) => {
      if (!token) {
        throw new Error("You must be signed in to save a character.");
      }

      return updateCharacter(characterId, payload, token, {
        keepalive: options.keepalive && isKeepaliveSafePayload(payload),
      });
    },
    [token],
  );
  const getSavedDashboardPayload = useCallback(
    (updatedCharacter: Character, requestPayload: CharacterSavePayload) =>
      builderState && selectedBackground && selectedClass && selectedSpecies
        ? buildCharacterSavePayload(
            updatedCharacter,
            builderState,
            selectedClass,
            selectedBackground,
            selectedSpecies,
            selectedSkillIndexes,
            featureChoices,
            spellcastingState,
            resourceState,
            backgroundChoices,
            speciesChoices,
          )
        : requestPayload,
    [
      backgroundChoices,
      builderState,
      featureChoices,
      selectedBackground,
      selectedClass,
      selectedSpecies,
      selectedSkillIndexes,
      speciesChoices,
      spellcastingState,
      resourceState,
    ],
  );
  const dashboardAutosave = useDashboardAutosave({
    characterId: character?.id ?? null,
    getSavedPayload: getSavedDashboardPayload,
    onSaved: replaceCharacter,
    payload: dashboardSavePayload,
    saveCharacter: saveDashboardCharacter,
  });
  const toggleConditionsRail = useCallback(() => {
    setSelectedSpellEntry(null);
    setRightRailMode((currentMode) => (currentMode === "conditions" ? null : "conditions"));
  }, []);

  useEffect(() => {
    if (!rightRailMode || rightRailMode === "inventory") {
      return;
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      if (rightRailRef.current?.contains(target)) {
        return;
      }

      if (target.closest("[data-right-rail-trigger]")) {
        return;
      }

      setSelectedSpellEntry(null);
      setRightRailMode(null);
    }

    document.addEventListener("pointerdown", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
    };
  }, [rightRailMode]);

  useEffect(() => {
    if (activeWorkspaceTab === "inventory" && !isCompactDashboard) {
      setRightRailMode("inventory");
      return;
    }

    setRightRailMode((currentMode) =>
      currentMode === "inventory" || (currentMode === "spells" && activeWorkspaceTab !== "spells")
        ? null
        : currentMode,
    );
    if (activeWorkspaceTab !== "spells") {
      setSelectedSpellEntry(null);
    }
  }, [activeWorkspaceTab, isCompactDashboard]);

  useEffect(() => {
    if (!isCompactDashboard) {
      setIsSectionLauncherOpen(false);
    }
  }, [isCompactDashboard]);

  useEffect(() => {
    setConditionState(buildConditionStateFromCharacter(character));
  }, [character]);

  useEffect(() => {
    if (!character?.id) {
      setActiveWorkspaceTab("actions");
      setCompactSection("overview");
      setIsSectionLauncherOpen(false);
      setIsBuilderSidebarHidden(false);
      setRightRailMode(null);
      setSelectedSpellEntry(null);
      setSpellcastingState({
        learnedSpellIds: [],
        preparedSpellIds: [],
        slotUsageByLevel: {},
      });
      setResourceState({
        activeByResourceKey: {},
        customMaxByResourceKey: {},
        usageByResourceKey: {},
      });
      return;
    }

    const persistedUiState = loadDashboardUiState(character.id);

    setActiveWorkspaceTab(
      normalizePersistedWorkspaceTab(persistedUiState?.activeWorkspaceTab),
    );
    setIsBuilderSidebarHidden(persistedUiState?.isBuilderSidebarHidden ?? false);
    setRightRailMode(persistedUiState?.rightRailMode ?? null);
    setSelectedSpellEntry(null);
    setSpellcastingState(
      persistedUiState?.spellcastingState ?? {
        learnedSpellIds: character.spellcastingState?.learnedSpellIds ?? [],
        preparedSpellIds: character.spellcastingState?.preparedSpellIds ?? [],
        slotUsageByLevel: character.spellcastingState?.slotUsageByLevel ?? {},
      },
    );
    setResourceState(
      persistedUiState?.resourceState ?? {
        activeByResourceKey: character.resourceState?.activeByResourceKey ?? {},
        customMaxByResourceKey: character.resourceState?.customMaxByResourceKey ?? {},
        usageByResourceKey: character.resourceState?.usageByResourceKey ?? {},
      },
    );
  }, [character]);

  useEffect(() => {
    if (!character?.id) {
      return;
    }

    saveDashboardUiState(character.id, {
      activeWorkspaceTab,
      isBuilderSidebarHidden,
      rightRailMode,
      resourceState,
      spellcastingState,
      version: 2,
    });
  }, [
    activeWorkspaceTab,
    character?.id,
    isBuilderSidebarHidden,
    rightRailMode,
    resourceState,
    spellcastingState,
  ]);

  function handleSaveBuild() {
    void dashboardAutosave.flushSave();
  }

  const handleWorkspaceTabChange = useCallback(
    (tab: WorkspaceTab) => {
      setActiveWorkspaceTab(tab);
      setCompactSection(tab);
      setIsSectionLauncherOpen(false);

      if (isCompactDashboard) {
        setSelectedSpellEntry(null);
        setRightRailMode(null);
      }
    },
    [isCompactDashboard],
  );

  const handleCompactSectionChange = useCallback(
    (section: CompactDashboardSection) => {
      setCompactSection(section);
      setIsSectionLauncherOpen(false);
      setSelectedSpellEntry(null);
      setRightRailMode(null);

      if (section !== "overview" && section !== "builder") {
        setActiveWorkspaceTab(section);
      }
    },
    [],
  );

  const handleOpenConditionsFromLauncher = useCallback(() => {
    setIsSectionLauncherOpen(false);
    setSelectedSpellEntry(null);
    setRightRailMode("conditions");
  }, []);

  const handleToggleSectionLauncher = useCallback(() => {
    const willOpen = !isSectionLauncherOpen;

    setIsSectionLauncherOpen(willOpen);
    if (willOpen) {
      setSelectedSpellEntry(null);
      setRightRailMode(null);
    }
  }, [isSectionLauncherOpen]);

  const handleCloseRightRail = useCallback(() => {
    setSelectedSpellEntry(null);
    setRightRailMode(null);
  }, []);

  const handleOpenSpellLibrary = useCallback(() => {
    setSelectedSpellEntry(null);
    setRightRailMode((currentMode) =>
      currentMode === "spells" && selectedSpellEntry === null ? null : "spells",
    );
  }, [selectedSpellEntry]);

  const handleSelectSpellEntry = useCallback((entry: CharacterSpellEntry) => {
    setActiveWorkspaceTab("spells");
    setCompactSection("spells");
    setSelectedSpellEntry(entry);
    setRightRailMode("spells");
  }, []);

  async function toggleCondition(conditionId: ConditionId) {
    if (!character) {
      return;
    }

    const isActive = conditionState.activeConditions[conditionId];
    const updatedCharacter = isActive
      ? await removeCondition(character.id, conditionId)
      : await addCondition(character.id, conditionId);

    if (updatedCharacter) {
      setConditionState(buildConditionStateFromCharacter(updatedCharacter));
    }
  }

  function handleLocalRoll(result: RollableResult) {
    const id = secureRandomId();

    setLocalRolls((currentRolls) =>
      [
        {
          ...result,
          id,
        },
        ...currentRolls,
      ].slice(0, maxLocalRollCount),
    );

    setDiceRollSaveError(null);

    if (!character || !result.parseable) {
      return;
    }

    void recordDiceRoll(character.id, {
      formula: result.normalizedFormula,
      modifier: result.modifier,
      reason: buildDiceRollReason(result),
      rollMode: "normal",
      rollType: result.rollType,
      rollValues: result.dice.map((die) => ({
        discarded: die.discarded,
        sides: die.sides,
        value: die.value,
      })),
      total: result.total,
      visibility: "private",
    }).then((diceRoll) => {
      if (!diceRoll) {
        setDiceRollSaveError("Roll saved locally; history sync failed.");
      }
    });
  }

  const dismissLocalRoll = useCallback((rollId: string) => {
    setLocalRolls((currentRolls) => currentRolls.filter((roll) => roll.id !== rollId));
  }, []);

  return (
    <AppLayout variant="wide-left">
      <section className="character-section">
        {loading && <p>Loading character...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && !character && <p>No characters found.</p>}

        {previewCharacter &&
        builderState &&
        selectedBackground &&
        selectedClass &&
        selectedSpecies ? (
          <>
            <div
              className={`dashboard-layout dashboard-compact-section-${compactSection}${
                isBuilderSidebarHidden ? " dashboard-layout-sidebar-hidden" : ""
              }`}
            >
            <div
              className={
                isBuilderSidebarHidden
                  ? "dashboard-builder-shell dashboard-builder-shell-hidden"
                  : "dashboard-builder-shell dashboard-builder-shell-open"
              }
            >
              <button
                type="button"
                className="dashboard-sidebar-toggle"
                aria-label={isBuilderSidebarHidden ? "Show sidebar" : "Hide sidebar"}
                onClick={() => setIsBuilderSidebarHidden((currentValue) => !currentValue)}
              >
                <span className="dashboard-sidebar-toggle-icon" aria-hidden="true">
                  {isBuilderSidebarHidden ? "\u203A\u203A" : "\u2039\u2039"}
                </span>
              </button>

              <div className="dashboard-builder-panel">
                {dashboardAutosave.saveStatus === "saving" ||
                dashboardAutosave.saveStatus === "error" ? (
                  <p
                    className={dashboardAutosave.saveStatus === "error" ? "error-message" : "muted"}
                    data-testid="dashboard-autosave-status"
                  >
                    {formatDashboardSaveStatus(
                      dashboardAutosave.saveStatus,
                      dashboardAutosave.lastSavedAt,
                    )}
                  </p>
                ) : null}
                {dashboardAutosave.saveError ? (
                  <p className="error-message">{dashboardAutosave.saveError}</p>
                ) : null}
                {dashboardAutosave.saveStatus === "error" ? (
                  <button
                    type="button"
                    className="primary-button primary-button-uppercase"
                    data-testid="dashboard-retry-save"
                    disabled={isSavingBuild}
                    onClick={handleSaveBuild}
                  >
                    Retry save
                  </button>
                ) : null}
                {saveError ? <p className="error-message">{saveError}</p> : null}

                <CharacterBuilderSidebar
                  abilityAssignments={builderState.abilityAssignments}
                  abilityScores={previewCharacter.abilityScores}
                  background={selectedBackground}
                  characterLevel={previewCharacter.level}
                  classOption={selectedClass}
                  hitPointPreview={hitPointPreview}
                  hitPointSettings={hitPointSettings}
                  onAbilityAssignmentChange={updateAbilityAssignment}
                  onApplyHitPointSettings={applyHitPointConfiguration}
                  onFeatureChoicesChange={setFeatureChoices}
                  onLevelChange={updateLevel}
                  onOpenPanel={openPanel}
                  onRollAbility={handleRollAbility}
                  onRollAllAbilities={handleRollAllAbilities}
                  onSubclassChange={setSubclassIndex}
                  selectedChoices={featureChoices}
                  selectedSubclassIndex={builderState.subclassIndex}
                  species={selectedSpecies}
                />
              </div>
            </div>

            <CharacterSheet
              activeTab={activeWorkspaceTab}
              backgroundChoices={backgroundChoices}
              character={previewCharacter}
              compactSection={compactSection === "builder" ? "overview" : compactSection}
              conditionSummary={conditionSummary}
              currentHp={builderState.currentHp}
              defenseSummary={defenseSummary}
              derivedState={characterDerivedStateWithPreview}
              derivedStateError={characterDerivedStateErrorWithPreview}
              derivedStateLoading={characterDerivedStateLoadingWithPreview}
              featureChoices={featureChoices}
              inventoryController={inventoryController}
              onActiveTabChange={handleWorkspaceTabChange}
              onLocalRoll={handleLocalRoll}
              onResourceStateChange={setResourceState}
              onSpellcastingStateChange={setSpellcastingState}
              resolvedFeatureChoices={resolvedFeatureChoiceSelections}
              resourceState={resourceState}
              resourceActionSummaries={resourceActionSummaries}
              selectedHeritage={selectedHeritage}
              spellcastingSummary={spellcastingSummary}
              spellcastingState={spellcastingState}
              onApplyCurrentHpAdjustment={applyCurrentHpAdjustment}
              onApplyLongRest={applyLongRest}
              onOpenConditions={toggleConditionsRail}
              onOpenSpellLibrary={handleOpenSpellLibrary}
              onSelectSpellEntry={handleSelectSpellEntry}
              onSetTempHp={setTempHp}
              selectedBackground={selectedBackground}
              selectedClass={selectedClass}
              selectedSpecies={selectedSpecies}
              speciesChoices={speciesChoices}
              tempHp={builderState.tempHp}
            />
            <div
              ref={rightRailRef}
              className={
                rightRailMode
                  ? "dashboard-right-rail-shell dashboard-right-rail-shell-open"
                  : "dashboard-right-rail-shell"
              }
            >
              <button
                type="button"
                className="dashboard-right-rail-close"
                onClick={handleCloseRightRail}
              >
                <X aria-hidden="true" />
                <span>Close panel</span>
              </button>
              <CharacterDashboardRightRail
                conditionState={conditionState}
                diceRollSaveError={diceRollSaveError}
                inventoryController={inventoryController}
                localRolls={localRolls}
                onDismissLocalRoll={dismissLocalRoll}
                onManualRoll={handleLocalRoll}
                onSetExhaustionLevel={(level) =>
                  setConditionState((currentState) => ({
                    ...currentState,
                    exhaustionLevel: level as ConditionState["exhaustionLevel"],
                  }))
                }
                onSpellcastingStateChange={setSpellcastingState}
                onToggleCondition={(conditionId) => {
                  void toggleCondition(conditionId);
                }}
                rightRailMode={rightRailMode}
                selectedSpellEntry={selectedSpellEntry}
                selectedClassIndex={effectiveSpellLibraryClassIndex}
                selectedClassName={selectedClass.name}
                spellEntries={characterDerivedStateWithPreview?.spells ?? []}
                spellcastingState={spellcastingState}
                spellcastingSummary={spellcastingSummary}
              />
            </div>
          </div>
          <div
            className={
              isSectionLauncherOpen
                ? "dashboard-section-launcher dashboard-section-launcher-open"
                : "dashboard-section-launcher"
            }
          >
            {isSectionLauncherOpen ? (
              <button
                type="button"
                className="dashboard-section-launcher-backdrop"
                aria-label="Close dashboard menu"
                onClick={() => setIsSectionLauncherOpen(false)}
              />
            ) : null}

            <div
              className="dashboard-section-menu"
              role="dialog"
              aria-label="Dashboard sections"
              aria-hidden={!isSectionLauncherOpen}
            >
              <div className="dashboard-section-menu-header">
                <div>
                  <span>Character dashboard</span>
                  <strong>Choose a section</strong>
                </div>
                <button
                  type="button"
                  aria-label="Close dashboard menu"
                  onClick={() => setIsSectionLauncherOpen(false)}
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              <div className="dashboard-section-menu-grid">
                <button
                  type="button"
                  className={compactSection === "overview" ? "is-active" : undefined}
                  onClick={() => handleCompactSectionChange("overview")}
                >
                  <Activity aria-hidden="true" />
                  <span>Overview</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "actions" ? "is-active" : undefined}
                  onClick={() => handleWorkspaceTabChange("actions")}
                >
                  <Swords aria-hidden="true" />
                  <span>Actions</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "spells" ? "is-active" : undefined}
                  onClick={() => handleWorkspaceTabChange("spells")}
                >
                  <Sparkles aria-hidden="true" />
                  <span>Spells</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "inventory" ? "is-active" : undefined}
                  onClick={() => handleWorkspaceTabChange("inventory")}
                >
                  <Backpack aria-hidden="true" />
                  <span>Inventory</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "features" ? "is-active" : undefined}
                  onClick={() => handleWorkspaceTabChange("features")}
                >
                  <ScrollText aria-hidden="true" />
                  <span>Features &amp; traits</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "notes" ? "is-active" : undefined}
                  onClick={() => handleWorkspaceTabChange("notes")}
                >
                  <NotebookPen aria-hidden="true" />
                  <span>Notes</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "extras" ? "is-active" : undefined}
                  onClick={() => handleWorkspaceTabChange("extras")}
                >
                  <BookOpen aria-hidden="true" />
                  <span>Extras</span>
                </button>
                <button
                  type="button"
                  className={compactSection === "builder" ? "is-active" : undefined}
                  onClick={() => handleCompactSectionChange("builder")}
                >
                  <Settings2 aria-hidden="true" />
                  <span>Character builder</span>
                </button>
                <button
                  type="button"
                  data-right-rail-trigger
                  className={rightRailMode === "conditions" ? "is-active" : undefined}
                  onClick={handleOpenConditionsFromLauncher}
                >
                  <Shield aria-hidden="true" />
                  <span>Conditions</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              className="dashboard-section-launcher-toggle"
              aria-label={
                isSectionLauncherOpen ? "Close dashboard menu" : "Open dashboard menu"
              }
              aria-expanded={isSectionLauncherOpen}
              onClick={handleToggleSectionLauncher}
            >
              {isSectionLauncherOpen ? <X aria-hidden="true" /> : <Grid2X2 aria-hidden="true" />}
              <span>{isSectionLauncherOpen ? "Close" : "Sections"}</span>
            </button>
            </div>
          </>
        ) : null}
      </section>

      <CharacterSelectionPanel
        activePanel={activePanel}
        backgroundSelectionValues={backgroundChoices}
        backgroundOptions={backgroundOptions}
        classOptions={classOptions}
        onClose={closePanel}
        onConfirm={confirmSelection}
        onSelect={setSelection}
        pendingSelection={pendingSelection}
        selectedOption={selectedPanelOption}
        speciesSelectionValues={speciesChoices}
        speciesOptions={speciesOptions}
      />
    </AppLayout>
  );
}

function getDashboardAttunementLimit(
  characterLevel: number,
  classIndex: string,
  subclassIndex: string | null,
) {
  if (classIndex === "rogue" && subclassIndex === "thief" && characterLevel >= 13) {
    return 4;
  }

  return 3;
}

export function buildCharacterSavePayload(
  character: Character,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
  classOption: ClassOption,
  backgroundOption: BackgroundOption,
  speciesOption: SpeciesOption,
  selectedSkillIndexes: string[],
  featureChoices: FeatureChoiceSelections,
  spellcastingState: CharacterSpellcastingState,
  resourceState: CharacterResourceState,
  backgroundChoices: Record<string, string>,
  speciesChoices: Record<string, string>,
): CharacterSavePayload {
  return {
    name: character.name,
    speciesIndex: builderState.speciesIndex,
    classIndex: builderState.classIndex,
    subclassIndex: getSelectedSubclassIndexForSave(
      builderState.subclassIndex,
      classOption,
      featureChoices,
      builderState.level,
    ),
    backgroundIndex: builderState.backgroundIndex,
    alignment: character.alignment,
    level: builderState.level,
    currentHp: builderState.currentHp,
    hitPointState: {
      ...builderState.hitPointSettings,
      tempHp: builderState.tempHp,
    },
    spellcastingState,
    resourceState,
    skillIndexes: [...new Set(selectedSkillIndexes)],
    choices: mergeCharacterChoices(
      character.choices,
      [
        ...buildClassSkillChoices(builderState.classIndex, classOption, featureChoices),
        ...buildSpeciesLanguageChoices(builderState.speciesIndex, speciesChoices),
        ...buildSpeciesHeritageChoices(builderState.speciesIndex, speciesChoices),
        ...buildBackgroundAbilityChoices(builderState.backgroundIndex, backgroundChoices),
      ],
      builderState,
    ),
    featureChoices: mergeCurrentBuildFeatureChoices(
      getCurrentBuildFeatureChoices(character.featureChoices, builderState),
      buildGenericClassFeatureChoices(
        builderState.classIndex,
        classOption,
        builderState.level,
        featureChoices,
        getSelectedSubclassIndexForSave(
          builderState.subclassIndex,
          classOption,
          featureChoices,
          builderState.level,
        ),
      ).concat(
        buildGenericBackgroundFeatureChoices(backgroundOption, backgroundChoices),
        buildGenericSpeciesFeatureChoices(speciesOption, speciesChoices),
      ),
    ),
    abilityScores: buildAbilityScorePayload(character, builderState),
  };
}

function mergeCharacterChoices(
  persistedChoices: Character["choices"] | undefined,
  nextChoices: CharacterFeatureSelection[],
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
) {
  const choicesByKey = new Map<string, CharacterFeatureSelection>();

  for (const choice of persistedChoices ?? []) {
    if (isCurrentBuildCharacterChoice(choice, builderState)) {
      choicesByKey.set(getCharacterChoiceKey(choice), choice);
    }
  }

  for (const choice of nextChoices) {
    choicesByKey.set(getCharacterChoiceKey(choice), choice);
  }

  return [...choicesByKey.values()];
}

function isCurrentBuildCharacterChoice(
  choice: CharacterFeatureSelection,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
) {
  if (!choice.sourceType || !choice.choiceType || !choice.sourceIndex) {
    return false;
  }

  const [sourceIndex] = choice.sourceIndex.split(":");

  if (
    choice.sourceType === "class" &&
    choice.choiceType === "class-skill-choice"
  ) {
    return sourceIndex === builderState.classIndex;
  }

  if (
    choice.sourceType === "species" &&
    (choice.choiceType === "species-language-choice" ||
      choice.choiceType === "species-heritage-choice")
  ) {
    return sourceIndex === builderState.speciesIndex;
  }

  if (
    choice.sourceType === "background" &&
    (choice.choiceType === "background-ability-plan" ||
      choice.choiceType === "background-ability-score-choice")
  ) {
    return sourceIndex === builderState.backgroundIndex;
  }

  return false;
}

function getCharacterChoiceKey(choice: CharacterFeatureSelection) {
  return [
    choice.sourceType ?? "",
    choice.choiceType ?? "",
    choice.sourceIndex ?? "",
    choice.selectedType ?? "",
  ].join(":");
}

function getCurrentBuildFeatureChoices(
  featureChoices: Character["featureChoices"] | undefined,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
) {
  return (featureChoices ?? []).filter((choice) =>
    isCurrentBuildFeatureChoice(choice, builderState),
  );
}

function mergeCurrentBuildFeatureChoices(
  persistedSelections: CharacterFeatureChoiceSelection[],
  nextSelections: CharacterFeatureChoiceSelection[],
) {
  const replacedFeatureKeys = new Set(nextSelections.map(getFeatureChoiceFeatureKey));
  const mergedSelections = new Map<string, CharacterFeatureChoiceSelection>();

  for (const selection of persistedSelections) {
    if (!replacedFeatureKeys.has(getFeatureChoiceFeatureKey(selection))) {
      mergedSelections.set(getFeatureChoiceSelectionKey(selection), selection);
    }
  }

  for (const selection of nextSelections) {
    mergedSelections.set(getFeatureChoiceSelectionKey(selection), selection);
  }

  return [...mergedSelections.values()];
}

function getFeatureChoiceFeatureKey(
  selection: Pick<
    CharacterFeatureChoiceSelection,
    "featureIndex" | "sourceIndex" | "sourceType"
  >,
) {
  return [
    selection.sourceType,
    selection.sourceIndex,
    selection.featureIndex ?? selection.sourceIndex,
  ].join(":");
}

function getFeatureChoiceSelectionKey(
  selection: Pick<CharacterFeatureChoiceSelection, "choicePath" | "sourceIndex" | "sourceType">,
) {
  return `${selection.sourceType}:${selection.sourceIndex}:${selection.choicePath}`;
}

function isCurrentBuildFeatureChoice(
  choice: CharacterFeatureChoiceSelection,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
) {
  if (typeof choice.level === "number" && choice.level > builderState.level) {
    return false;
  }

  if (choice.subclassIndex && choice.subclassIndex !== builderState.subclassIndex) {
    return false;
  }

  const sourceType = choice.sourceType.toUpperCase();

  if (sourceType === "CLASS") {
    return choice.sourceIndex === builderState.classIndex;
  }

  if (sourceType === "FEATURE") {
    return choice.classIndex === builderState.classIndex;
  }

  if (sourceType === "BACKGROUND") {
    return choice.sourceIndex === builderState.backgroundIndex;
  }

  if (sourceType === "SPECIES") {
    return choice.sourceIndex === builderState.speciesIndex;
  }

  return false;
}

function isKeepaliveSafePayload(payload: CharacterSavePayload) {
  return JSON.stringify(payload).length <= 60_000;
}

function buildDiceRollReason(result: RollableResult) {
  if (result.source && result.source !== result.label) {
    return `${result.label} - ${result.source}`;
  }

  return result.label;
}

function getSelectedSubclassIndexForSave(
  subclassIndex: string | null,
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
  characterLevel: number,
) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (
    subclassIndex &&
    subclassIndexes.has(subclassIndex) &&
    !shouldClearSubclassForLevel(classOption, subclassIndex, characterLevel)
  ) {
    return subclassIndex;
  }

  for (const feature of classOption.features) {
    if (feature.level > characterLevel) {
      continue;
    }

    for (const field of feature.choiceFields ?? []) {
      if (field.choiceKind !== "subclass") {
        continue;
      }

      const selectedValue = featureChoices[`${feature.id}:${field.id}`];
      const selectedOption = field.options.find((option) => option.value === selectedValue);
      const selectedSubclassIndex = selectedOption?.selectedOptionIndex ?? selectedOption?.value;

      if (selectedSubclassIndex && subclassIndexes.has(selectedSubclassIndex)) {
        return selectedSubclassIndex;
      }
    }
  }

  return null;
}

function shouldClearSubclassForLevel(
  classOption: ClassOption,
  subclassIndex: string,
  characterLevel: number,
) {
  const subclassChoiceFeature = classOption.features.find(
    (feature) =>
      feature.level > characterLevel &&
      (feature.choiceFields ?? []).some(
        (field) =>
          field.choiceKind === "subclass" &&
          field.options.some(
            (option) =>
              (option.selectedOptionIndex ?? option.value) === subclassIndex,
          ),
      ),
  );

  return Boolean(subclassChoiceFeature);
}

function getResourceActionSummaries(
  classOption: ClassOption,
  characterLevel: number,
  selectedFeatIndexes: string[] = [],
): ResourceActionSummary[] {
  const summaries = [
    ...classOption.features
      .filter((feature) => feature.level <= characterLevel)
      .map((feature) => getResourceActionSummary(feature, characterLevel))
      .filter((summary): summary is ResourceActionSummary => Boolean(summary)),
    ...selectedFeatIndexes
      .map((featIndex) => getFeatResourceActionSummary(featIndex, characterLevel))
      .filter((summary): summary is ResourceActionSummary => Boolean(summary)),
  ];
  const byName = new Map<string, ResourceActionSummary>();

  for (const summary of summaries) {
    const existing = byName.get(summary.name);

    if (!existing || getNullableLevel(existing) <= getNullableLevel(summary)) {
      byName.set(summary.name, summary);
    }
  }

  return [...byName.values()].sort((left, right) => getNullableLevel(left) - getNullableLevel(right) || left.name.localeCompare(right.name));
}

function mergeResourceActionSummaries(
  derivedResources: ResourceActionSummary[],
  fallbackResources: ResourceActionSummary[],
) {
  const byName = new Map<string, ResourceActionSummary>();

  for (const resource of [...fallbackResources, ...derivedResources]) {
    byName.set(resource.name, resource);
  }

  return [...byName.values()].sort(
    (left, right) =>
      getNullableLevel(left) - getNullableLevel(right) ||
      left.name.localeCompare(right.name),
  );
}

function getNullableLevel(value: { level: number | null }) {
  return value.level ?? Number.POSITIVE_INFINITY;
}

function getFeatResourceActionSummary(
  featIndex: string,
  characterLevel: number,
): ResourceActionSummary | null {
  if (featIndex !== "lucky") {
    return null;
  }

  return {
    automationNote: "Track Luck Points for Advantage and Disadvantage uses.",
    category: "resource",
    id: "resource:feat:lucky",
    level: null,
    maxUses: "Uses equal Proficiency Bonus",
    maxUsesValue: getProficiencyBonus(characterLevel),
    name: "Luck Points",
    recharge: "Long Rest",
    resourceKey: "lucky",
    sourceFeature: "Lucky",
    trackingMode: "uses",
  };
}

function getResourceActionSummary(
  feature: ClassFeature,
  characterLevel: number,
): ResourceActionSummary | null {
  const key = `${feature.id} ${feature.title}`.toLowerCase();
  const resourceKey = feature.id.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const base = {
    id: `resource:${feature.id}`,
    level: feature.level,
    resourceKey,
    sourceFeature: feature.title,
  };

  if (key.includes("rage")) {
    return {
      ...base,
      automationNote: "Summary only; damage, resistance, and duration automation are not implemented.",
      category: "bonus action",
      maxUsesValue: getRageUseCount(characterLevel),
      maxUses: "Uses follow class progression",
      name: "Rage",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("bardic-inspiration")) {
    return {
      ...base,
      automationNote: "Summary only; die size and target tracking are not automated.",
      category: "bonus action",
      maxUsesValue: getProficiencyBonus(characterLevel),
      maxUses: "Uses follow class progression",
      name: "Bardic Inspiration",
      recharge: "Long Rest / feature-based recovery",
      trackingMode: "uses",
    };
  }

  if (key.includes("channel-divinity")) {
    return {
      ...base,
      automationNote: "Summary only; subclass Channel Divinity effects are not automated.",
      category: "resource",
      maxUsesValue: getChannelDivinityUses(characterLevel),
      maxUses: "Uses follow class progression",
      name: "Channel Divinity",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("cunning-action")) {
    return {
      ...base,
      automationNote: "Display only; action economy reminders are not automated.",
      category: "bonus action",
      maxUses: "At will",
      name: "Cunning Action",
      trackingMode: "none",
    };
  }

  if (key.includes("cunning-strike")) {
    return {
      ...base,
      automationNote: "Summary only; Sneak Attack tradeoffs and save DCs are not automated.",
      category: "passive",
      name: key.includes("improved") ? "Improved Cunning Strike" : "Cunning Strike",
      trackingMode: "none",
    };
  }

  if (key.includes("arcane-recovery")) {
    return {
      ...base,
      automationNote: "Summary only; recovered slot selection is not automated.",
      category: "resource",
      maxUsesValue: 1,
      name: "Arcane Recovery",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("divine-intervention")) {
    return {
      ...base,
      automationNote: "Summary only; intervention outcome automation is not implemented.",
      category: "resource",
      maxUsesValue: 1,
      maxUses: "1 use",
      name: "Divine Intervention",
      recharge: "Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("stroke-of-luck")) {
    return {
      ...base,
      automationNote: "Summary only; automatic hit/check conversion is not automated.",
      category: "resource",
      maxUsesValue: 1,
      maxUses: "1 use",
      name: "Stroke of Luck",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  if (key.includes("arcane-shot")) {
    return {
      ...base,
      automationNote: "Summary only; shot effect riders are not automated.",
      category: "resource",
      maxUsesValue: 2,
      maxUses: "2 uses",
      name: "Arcane Shot",
      recharge: "Short or Long Rest",
      trackingMode: "uses",
    };
  }

  return null;
}

function getRageUseCount(level: number) {
  if (level >= 17) {
    return 6;
  }
  if (level >= 12) {
    return 5;
  }
  if (level >= 6) {
    return 4;
  }
  if (level >= 3) {
    return 3;
  }
  return 2;
}

function getChannelDivinityUses(level: number) {
  if (level >= 18) {
    return 3;
  }
  if (level >= 6) {
    return 2;
  }
  return 1;
}

function getProficiencyBonus(level: number) {
  return level <= 4
    ? 2
    : level <= 8
      ? 3
      : level <= 12
        ? 4
        : level <= 16
          ? 5
          : 6;
}

function buildClassSkillChoices(
  classIndex: string,
  classOption: ClassOption,
  featureChoices: FeatureChoiceSelections,
): CharacterFeatureSelection[] {
  return Object.entries(featureChoices)
    .filter(
      ([choiceKey, selectedIndex]) =>
        selectedIndex.startsWith("skill-") &&
        isClassSkillChoiceFieldByKey(classOption, choiceKey),
    )
    .map(([choiceKey, selectedIndex]) => {
      const [featureId, fieldId] = choiceKey.split(":");

      return {
        choiceType: "class-skill-choice",
        featureId,
        fieldId,
        sourceType: "class",
        sourceIndex: `${classIndex}:${featureId}:${fieldId}`,
        selectedType: "skill",
        selectedIndex,
      };
    });
}

function isClassSkillChoiceFieldByKey(
  classOption: ClassOption,
  choiceKey: string,
) {
  const [featureId, fieldId] = choiceKey.split(":");
  const feature = classOption.features.find((classFeature) => classFeature.id === featureId);
  const field = feature?.choiceFields?.find((choiceField) => choiceField.id === fieldId);

  return field?.choiceGroupId === "class-skill-choice";
}

function buildSpeciesLanguageChoices(
  speciesIndex: string,
  speciesChoices: Record<string, string>,
): CharacterFeatureSelection[] {
  return Object.entries(speciesChoices)
    .filter(([choiceKey, selectedIndex]) => {
      const [choiceSpeciesIndex, , fieldId] = choiceKey.split(":");

      return (
        choiceSpeciesIndex === speciesIndex &&
        fieldId === "language" &&
        selectedIndex.trim().length > 0
      );
    })
    .map(([choiceKey, selectedIndex]) => {
      const [, featureId, fieldId] = choiceKey.split(":");

      return {
        choiceType: "species-language-choice",
        featureId,
        fieldId,
        sourceType: "species",
        sourceIndex: `${speciesIndex}:${featureId}:${fieldId}`,
        selectedType: "language",
        selectedIndex,
      };
    });
}

function buildSpeciesHeritageChoices(
  speciesIndex: string,
  speciesChoices: Record<string, string>,
): CharacterFeatureSelection[] {
  return Object.entries(speciesChoices)
    .filter(([choiceKey, selectedIndex]) => {
      const [choiceSpeciesIndex, , fieldId] = choiceKey.split(":");

      return (
        choiceSpeciesIndex === speciesIndex &&
        fieldId === "heritage" &&
        selectedIndex.trim().length > 0
      );
    })
    .map(([choiceKey, selectedIndex]) => {
      const [, featureId, fieldId] = choiceKey.split(":");

      return {
        choiceType: "species-heritage-choice",
        featureId,
        fieldId,
        sourceType: "species",
        sourceIndex: `${speciesIndex}:${featureId}:${fieldId}`,
        selectedType: "subspecies",
        selectedIndex,
      };
    });
}

function buildBackgroundAbilityChoices(
  backgroundIndex: string,
  backgroundChoices: Record<string, string>,
): CharacterFeatureSelection[] {
  return Object.entries(backgroundChoices)
    .filter(([choiceKey, selectedIndex]) => {
      const [choiceBackgroundIndex, featureId, fieldId] = choiceKey.split(":");
      const planKey = `${choiceBackgroundIndex}:${featureId}:score-plan`;
      const selectedPlan = backgroundChoices[planKey];

      return (
        choiceBackgroundIndex === backgroundIndex &&
        fieldId.startsWith("score-") &&
        (fieldId === "score-plan" || selectedPlan !== backgroundAbilityPlanThreeScores) &&
        selectedIndex.trim().length > 0
      );
    })
    .map(([choiceKey, selectedIndex]) => {
      const [, featureId, fieldId] = choiceKey.split(":");
      const isPlanChoice = fieldId === "score-plan";
      const normalizedSelectedIndex =
        isPlanChoice ? selectedIndex : canonicalAbilityScoreIndex(selectedIndex) ?? selectedIndex;

      return {
        choiceType: isPlanChoice ? "background-ability-plan" : "background-ability-score-choice",
        featureId,
        fieldId,
        sourceType: "background",
        sourceIndex: `${backgroundIndex}:${featureId}:${fieldId}`,
        selectedType: isPlanChoice ? "ability-plan" : "ability-score",
        selectedIndex: normalizedSelectedIndex,
      };
    });
}

function buildAbilityScorePayload(
  character: Character,
  builderState: NonNullable<ReturnType<typeof useCharacterBuilder>["builderState"]>,
): AbilityScores {
  const abilityScores = Object.fromEntries(
    abilityScoreIndexes.map((abilityIndex) => [
      abilityIndex,
      character.abilityScores.find((abilityScore) => abilityScore.abilityIndex === abilityIndex)
        ?.score ?? 10,
    ]),
  ) as AbilityScores;

  builderState.abilityAssignments.forEach((assignment) => {
    if (isAbilityScoreIndex(assignment.abilityIndex)) {
      abilityScores[assignment.abilityIndex] = assignment.score;
    }
  });

  return abilityScores;
}

function isAbilityScoreIndex(value: string): value is keyof AbilityScores {
  return abilityScoreIndexes.some((abilityIndex) => abilityIndex === value);
}

function canonicalAbilityScoreIndex(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .toLowerCase()
    .replace(/^ability-/, "")
    .replace(/-score$/, "");

  return abilityScoreIndexAliases[normalizedValue] ?? null;
}

function getSelectedSpeciesHeritage(
  species: SpeciesOption | undefined,
  speciesChoices: Record<string, string>,
) {
  if (!species?.heritageOptions?.length) {
    return null;
  }

  const selectedIndex = getSelectedSpeciesHeritageIndex(species, speciesChoices);

  return species.heritageOptions.find((option) => option.index === selectedIndex) ?? null;
}

function getSelectedSpeciesHeritageIndex(
  species: SpeciesOption | undefined,
  speciesChoices: Record<string, string>,
) {
  if (!species) {
    return undefined;
  }

  const choiceKey = `${species.index}:${species.index}-heritage-choice:heritage`;

  return speciesChoices[choiceKey];
}

function buildConditionStateFromCharacter(character: Character | undefined): ConditionState {
  const nextState = createDefaultConditionState();

  if (!character?.conditions?.length) {
    return nextState;
  }

  for (const condition of character.conditions) {
    const normalizedIndex = condition.conditionIndex.toLowerCase() as ConditionId;

    if (normalizedIndex in nextState.activeConditions) {
      nextState.activeConditions[normalizedIndex] = true;
    }
  }

  return nextState;
}

function summarizeDefenses(
  defenses: CharacterDerivedState["defenses"],
) {
  const groupedValues = defenses.reduce(
    (groups, entry) => {
      switch (entry.kind) {
        case "resistance":
          groups.resistances.push(entry.target);
          break;
        case "immunity":
          groups.immunities.push(entry.target);
          break;
        case "vulnerability":
          groups.vulnerabilities.push(entry.target);
          break;
        case "condition_immunity":
          groups.conditionImmunities.push(entry.target);
          break;
        case "damage_reduction":
          groups.damageReductions.push(entry.target);
          break;
        default:
          break;
      }

      return groups;
    },
    {
      conditionImmunities: [] as string[],
      damageReductions: [] as string[],
      immunities: [] as string[],
      resistances: [] as string[],
      vulnerabilities: [] as string[],
    },
  );

  return [
    createDefenseSummaryRow("Resistances", groupedValues.resistances),
    createDefenseSummaryRow("Immunities", groupedValues.immunities),
    createDefenseSummaryRow("Vulnerabilities", groupedValues.vulnerabilities),
    createDefenseSummaryRow("Condition Immunities", groupedValues.conditionImmunities),
    createDefenseSummaryRow("Damage Reduction", groupedValues.damageReductions),
  ].filter((entry): entry is { label: string; value: string } => entry !== null);
}

function createDefenseSummaryRow(label: string, values: string[]) {
  const uniqueValues = [...new Set(values)];

  if (uniqueValues.length === 0) {
    return null;
  }

  return {
    label,
    value: uniqueValues.join(", "),
  };
}

function getDashboardUiStateStorageKey(characterId: string) {
  return `${dashboardUiStateStoragePrefix}:${characterId}`;
}

function loadDashboardUiState(characterId: string) {
  try {
    const rawState = window.localStorage.getItem(getDashboardUiStateStorageKey(characterId));

    if (!rawState) {
      return null;
    }

    const parsedState = JSON.parse(rawState) as PersistedDashboardUiState;

    if (!parsedState || (parsedState.version !== 1 && parsedState.version !== 2)) {
      return null;
    }

    return {
      ...parsedState,
      resourceState: normalizeResourceState(
        (parsedState as PersistedDashboardUiState & { resourceState?: unknown }).resourceState,
      ),
      spellcastingState: normalizeSpellcastingState(parsedState.spellcastingState),
    };
  } catch {
    return null;
  }
}

function saveDashboardUiState(characterId: string, state: PersistedDashboardUiState) {
  try {
    window.localStorage.setItem(
      getDashboardUiStateStorageKey(characterId),
      JSON.stringify(state),
    );
  } catch {
    // Ignore storage failures so the dashboard keeps working normally.
  }
}

function normalizeSpellcastingState(
  value: unknown,
): CharacterSpellcastingState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      learnedSpellIds: [],
      preparedSpellIds: [],
      slotUsageByLevel: {},
    };
  }

  const normalizedValue = value as Partial<CharacterSpellcastingState>;

  return {
    learnedSpellIds: normalizeStringArray(normalizedValue.learnedSpellIds),
    preparedSpellIds: normalizeStringArray(normalizedValue.preparedSpellIds),
    slotUsageByLevel: normalizeNumericRecord(normalizedValue.slotUsageByLevel),
  };
}

function normalizeResourceState(
  value: unknown,
): CharacterResourceState {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      activeByResourceKey: {},
      customMaxByResourceKey: {},
      usageByResourceKey: {},
    };
  }

  const normalizedValue = value as Partial<CharacterResourceState>;

  return {
    activeByResourceKey: normalizeBooleanRecord(normalizedValue.activeByResourceKey),
    customMaxByResourceKey: normalizeNumericRecord(
      normalizedValue.customMaxByResourceKey,
    ),
    usageByResourceKey: normalizeNumericRecord(normalizedValue.usageByResourceKey),
  };
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  ];
}

function normalizeNumericRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, number>;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entryValue]) =>
      typeof key === "string" &&
      typeof entryValue === "number" &&
      Number.isFinite(entryValue) &&
      entryValue >= 0
        ? [[key, Math.floor(entryValue)] as const]
        : [],
    ),
  ) as Record<string, number>;
}

function normalizeBooleanRecord(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, boolean>;
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entryValue]) =>
      typeof key === "string" &&
      key.trim().length > 0 &&
      typeof entryValue === "boolean"
        ? [[key, entryValue] as const]
        : [],
    ),
  ) as Record<string, boolean>;
}

function normalizePersistedWorkspaceTab(value: unknown): WorkspaceTab {
  if (
    value === "actions" ||
    value === "spells" ||
    value === "inventory" ||
    value === "features" ||
    value === "notes" ||
    value === "extras"
  ) {
    return value;
  }

  if (value === "background") {
    return "features";
  }

  return "actions";
}

export { CharacterDashboardPage };
