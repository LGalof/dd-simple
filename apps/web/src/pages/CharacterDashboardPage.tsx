import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { CharacterBuilderSidebar } from "../features/characters/components/CharacterBuilderSidebar";
import { CharacterSelectionPanel } from "../features/characters/components/CharacterSelectionPanel";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import type { WorkspaceTab } from "../features/characters/components/CharacterSheet";
import { useCharacterBuilder } from "../features/characters/hooks/useCharacterBuilder";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
} from "../features/characters/utils/selectedCharacter";
import {
  InventoryDetailsSidebar,
  useInventorySandboxController,
} from "./InventorySandboxPage";

function CharacterDashboardPage() {
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<WorkspaceTab>("actions");
  const [isBuilderSidebarHidden, setIsBuilderSidebarHidden] = useState(false);
  const inventoryController = useInventorySandboxController();
  const { characters, loading, error } = useCharacters();
  const selectedCharacterId = getSelectedCharacterId();
  const selectedCharacter = useMemo(
    () =>
      selectedCharacterId
        ? characters.find((character) => character.id === selectedCharacterId)
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
    backgroundOptions,
    builderState,
    classOptions,
    closePanel,
    confirmSelection,
    featureChoices,
    applyHitPointConfiguration,
    applyCurrentHpAdjustment,
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
    selectedSpecies,
    setFeatureChoices,
    setTempHp,
    setSelection,
    speciesOptions,
    updateAbilityAssignment,
  } = useCharacterBuilder(character);

  return (
    <AppLayout variant="wide-left">
      <section className="character-section">
        {loading && <p>Loading character...</p>}
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && !character && <p>No characters found.</p>}
        {previewCharacter && builderState && (
          <div
            className={
              isBuilderSidebarHidden
                ? "dashboard-layout dashboard-layout-sidebar-hidden"
                : "dashboard-layout"
            }
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
                <CharacterBuilderSidebar
                  abilityAssignments={builderState.abilityAssignments}
                  abilityScores={previewCharacter.abilityScores}
                  background={selectedBackground}
                  characterLevel={previewCharacter.level}
                  classOption={selectedClass}
                  hitPointPreview={hitPointPreview}
                  onAbilityAssignmentChange={updateAbilityAssignment}
                  onApplyHitPointSettings={applyHitPointConfiguration}
                  onFeatureChoicesChange={setFeatureChoices}
                  onOpenPanel={openPanel}
                  onRollAbility={handleRollAbility}
                  onRollAllAbilities={handleRollAllAbilities}
                  selectedChoices={featureChoices}
                  species={selectedSpecies}
                  hitPointSettings={hitPointSettings}
                />
              </div>
            </div>

            <CharacterSheet
              activeTab={activeWorkspaceTab}
              character={previewCharacter}
              currentHp={builderState.currentHp}
              inventoryController={inventoryController}
              onActiveTabChange={setActiveWorkspaceTab}
              tempHp={builderState.tempHp}
              onApplyCurrentHpAdjustment={applyCurrentHpAdjustment}
              onSetTempHp={setTempHp}
            />

            <InventoryDetailsSidebar
              controller={inventoryController}
              isOpen={activeWorkspaceTab === "inventory"}
            />
          </div>
        )}
      </section>

      <CharacterSelectionPanel
        activePanel={activePanel}
        backgroundOptions={backgroundOptions}
        classOptions={classOptions}
        onClose={closePanel}
        onConfirm={confirmSelection}
        onSelect={setSelection}
        pendingSelection={pendingSelection}
        selectedOption={selectedPanelOption}
        speciesOptions={speciesOptions}
      />
    </AppLayout>
  );
}

export { CharacterDashboardPage };
