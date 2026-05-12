import { useMemo, useState } from "react";
import { AppLayout } from "../components/layout/AppLayout";
import { CharacterSummaryCard } from "../features/characters/components/CharacterSummaryCard";
import { CharactersEmptyState } from "../features/characters/components/CharactersEmptyState";
import { useCharacters } from "../features/characters/hooks/useCharacters";

function MyCharactersPage() {
  const { characters, loading, error } = useCharacters();
  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("created-oldest");
  const slotLimit = 6;

  const visibleCharacters = useMemo(() => {
    const normalizedQuery = searchValue.trim().toLowerCase();

    const filteredCharacters = characters.filter((character) => {
      if (!normalizedQuery) {
        return true;
      }

      const searchableValues = [
        character.name,
        character.species.name,
        character.class.name,
        `${character.level}`,
      ];

      return searchableValues.some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });

    return [...filteredCharacters].sort((leftCharacter, rightCharacter) => {
      switch (sortValue) {
        case "created-newest":
          return (
            new Date(rightCharacter.createdAt).getTime() -
            new Date(leftCharacter.createdAt).getTime()
          );
        case "name-asc":
          return leftCharacter.name.localeCompare(rightCharacter.name);
        case "level-desc":
          return rightCharacter.level - leftCharacter.level;
        case "created-oldest":
        default:
          return (
            new Date(leftCharacter.createdAt).getTime() -
            new Date(rightCharacter.createdAt).getTime()
          );
      }
    });
  }, [characters, searchValue, sortValue]);

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

          <button type="button" className="primary-button primary-button-uppercase">
            Create a Character
          </button>
        </div>

        <div className="characters-library-controls">
          <label className="characters-search-field">
            <span className="characters-control-label">Search</span>
            <div className="characters-search-input-shell">
              <span className="characters-search-icon" aria-hidden="true" />
              <input
                type="search"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                className="characters-search-input"
                placeholder="Search by name, level, class, or species"
              />
            </div>
          </label>

          <label className="characters-select-field">
            <span className="characters-control-label">Sort By</span>
            <select
              value={sortValue}
              onChange={(event) => setSortValue(event.target.value)}
              className="characters-select-input"
            >
              <option value="created-oldest">Created: Oldest</option>
              <option value="created-newest">Created: Newest</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="level-desc">Level: Highest</option>
            </select>
          </label>

          <button type="button" className="characters-settings-button">
            Settings
          </button>
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

        {!loading && !error && characters.length > 0 && visibleCharacters.length === 0 && (
          <div className="page-placeholder-card">
            <h2>No matching characters</h2>
            <p className="muted">
              Try a different search phrase or adjust the selected sort option.
            </p>
          </div>
        )}

        {!loading && !error && visibleCharacters.length > 0 && (
          <div className="character-summary-grid">
            {visibleCharacters.map((character) => (
              <CharacterSummaryCard key={character.id} character={character} />
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { MyCharactersPage };
