import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { CharacterSummaryCard } from "../features/characters/components/CharacterSummaryCard";
import { CharactersEmptyState } from "../features/characters/components/CharactersEmptyState";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { setSelectedCharacterId } from "../features/characters/utils/selectedCharacter";
import type { Character } from "../types/character";

function MyCharactersPage() {
  const { characters, deletingCharacterId, loading, error, removeCharacter } = useCharacters();
  const navigate = useNavigate();
  const slotLimit = 6;

  function handleDeleteCharacter(character: Character) {
    const confirmed = window.confirm(`Delete ${character.name}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    void removeCharacter(character.id);
  }

  function handleSelectCharacter(character: Character) {
    setSelectedCharacterId(character.id);
    navigate("/");
  }

  return (
    <AppLayout>
      <section className="page-section my-characters-page">
        <div className="characters-library-header">
          <div className="characters-library-title-group">
            <p className="eyebrow">Character System</p>
            <h1 className="characters-library-title">My Characters</h1>
            <p className="characters-library-slots">
              Slots
              <span className="characters-library-slots-accent">
                {characters.length}/{slotLimit} Used
              </span>
            </p>
          </div>

          <Link to="/characters/new" className="primary-button primary-button-uppercase">
            Create a Character
          </Link>
        </div>

        {loading && (
          <div className="page-placeholder-card">
            <p>Loading characters...</p>
          </div>
        )}

        {error && (
          <div className="page-placeholder-card">
            <p className="error-message">Error: {error}</p>
          </div>
        )}

        {!loading && !error && characters.length === 0 && <CharactersEmptyState />}

        {!loading && !error && characters.length > 0 && (
          <div className="character-summary-grid">
            {characters.map((character) => (
              <CharacterSummaryCard
                key={character.id}
                character={character}
                deleting={deletingCharacterId === character.id}
                onDelete={handleDeleteCharacter}
                onSelect={handleSelectCharacter}
              />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { MyCharactersPage };
