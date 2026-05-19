import { useEffect, useMemo } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { CharacterBuilderSidebar } from "../features/characters/components/CharacterBuilderSidebar";
import { CharacterSelectionPanel } from "../features/characters/components/CharacterSelectionPanel";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import { useCharacterBuilder } from "../features/characters/hooks/useCharacterBuilder";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import {
  clearSelectedCharacterId,
  getSelectedCharacterId,
} from "../features/characters/utils/selectedCharacter";

function CharacterDashboardPage() {
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
    handleRollAbility,
    handleRollAllAbilities,
    openPanel,
    pendingSelection,
    previewCharacter,
    selectedBackground,
    selectedClass,
    selectedPanelOption,
    selectedSpecies,
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
          <div className="dashboard-layout">
            <CharacterBuilderSidebar
              abilityAssignments={builderState.abilityAssignments}
              abilityScores={previewCharacter.abilityScores}
              background={selectedBackground}
              characterLevel={previewCharacter.level}
              classOption={selectedClass}
              onAbilityAssignmentChange={updateAbilityAssignment}
              onOpenPanel={openPanel}
              onRollAbility={handleRollAbility}
              onRollAllAbilities={handleRollAllAbilities}
              species={selectedSpecies}
            />

            <CharacterSheet character={previewCharacter} />
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
