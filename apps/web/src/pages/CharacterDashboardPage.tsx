import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { Hero } from "../components/layout/Hero";
import { fetchCharacter } from "../features/characters/api/fetchCharacter";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import type { Character } from "../types/character";

function CharacterDashboardPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacter(characterId: string) {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchCharacter(characterId);
        setCharacter(data);
        localStorage.setItem("lastSelectedCharacterId", data.id);
      } catch (err) {
        setCharacter(null);
        setError(err instanceof Error ? err.message : "Character not found");
      } finally {
        setLoading(false);
      }
    }

    if (!characterId) {
      setCharacter(null);
      setError("Choose a character from your character list.");
      setLoading(false);
      return;
    }

    void loadCharacter(characterId);
  }, [characterId]);

  return (
    <AppLayout
      hero={
        <Hero
          eyebrow="University Software Project"
          title="D&D Simple"
          subtitle="Digital toolkit for Dungeons & Dragons sessions"
        />
      }
    >
      <section className="character-section">
        {loading && <p>Loading character...</p>}
        {error && (
          <div className="page-placeholder-card">
            <p className="error-message">Error: {error}</p>
            <Link to="/characters" className="characters-settings-button">
              Back to Characters
            </Link>
          </div>
        )}
        {!loading && !error && !character && (
          <div className="page-placeholder-card">
            <p>No character found.</p>
            <Link to="/characters" className="characters-settings-button">
              Back to Characters
            </Link>
          </div>
        )}
        {character && (
          <div className="character-sheet">
            <div className="characters-library-header">
              <div className="characters-library-title-group">
                <p className="eyebrow">Character Sheet</p>
                <h1 className="characters-library-title">{character.name}</h1>
              </div>

              <div className="character-summary-actions">
                <Link to="/characters" className="characters-settings-button">
                  Back
                </Link>
                <Link
                  to={`/characters/${character.id}/edit`}
                  className="primary-button primary-button-uppercase"
                >
                  Edit
                </Link>
              </div>
            </div>

            <CharacterSheet character={character} />
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { CharacterDashboardPage };
