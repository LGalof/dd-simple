import { AppLayout } from "../components/layout/AppLayout";
import { Hero } from "../components/layout/Hero";
import { CharacterSheet } from "../features/characters/components/CharacterSheet";
import { useCharacters } from "../features/characters/hooks/useCharacters";

function CharacterDashboardPage() {
  const { characters, loading, error } = useCharacters();
  const character = characters[0];

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
        {error && <p className="error-message">Error: {error}</p>}
        {!loading && !error && !character && <p>No characters found.</p>}
        {character && <CharacterSheet character={character} />}
      </section>
    </AppLayout>
  );
}

export { CharacterDashboardPage };
