import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../features/auth/AuthContext";
import { createCharacter } from "../features/characters/api/createCharacter";
import { setSelectedCharacterId } from "../features/characters/utils/selectedCharacter";
import { useCharacterCreatorReferences } from "../features/references/hooks/useCharacterCreatorReferences";
import type { AbilityScores } from "../types/character";

const defaultAbilityScores: AbilityScores = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

function CreateCharacterPage() {
  const { loading: authLoading, token } = useAuth();
  const { references, loading, error } = useCharacterCreatorReferences(token);
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [speciesIndex, setSpeciesIndex] = useState("");
  const [classIndex, setClassIndex] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState("");
  const [alignment, setAlignment] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (!token) {
      setSaveError("You must be signed in to create a character.");
      return;
    }

    if (!name.trim() || !speciesIndex || !classIndex || !backgroundIndex) {
      setSaveError("Choose a name, species, class, and background before creating the character.");
      return;
    }

    setSaving(true);

    try {
      const createdCharacter = await createCharacter(
        {
          name: name.trim(),
          speciesIndex,
          classIndex,
          backgroundIndex,
          alignment: alignment || null,
          skillIndexes: [],
          abilityScores: defaultAbilityScores,
        },
        token,
      );

      setSelectedCharacterId(createdCharacter.id);
      navigate("/");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to create character");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-section">
        <div className="characters-library-header">
          <div className="characters-library-title-group">
            <p className="eyebrow">Character Creator</p>
            <h1 className="characters-library-title">Create a Character</h1>
            <p className="muted">Choose character basics and save them to your account.</p>
          </div>

          <Link to="/characters" className="characters-settings-button">
            Back to Characters
          </Link>
        </div>

        {(authLoading || loading) && (
          <div className="page-placeholder-card">
            <p>Loading reference data...</p>
          </div>
        )}

        {!authLoading && error && (
          <div className="page-placeholder-card">
            <p className="error-message">Error: {error}</p>
          </div>
        )}

        {!authLoading && !loading && !error && references && (
          <form onSubmit={handleSubmit}>
            <label className="characters-search-field page-placeholder-card">
              <span className="characters-control-label">Character Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="characters-search-input characters-select-input"
                placeholder="Example: Kael Shadowstep"
                disabled={saving}
                required
              />
            </label>

            <div className="characters-library-controls">
              <label className="characters-select-field">
                <span className="characters-control-label">Species</span>
                <select
                  value={speciesIndex}
                  onChange={(event) => setSpeciesIndex(event.target.value)}
                  className="characters-select-input"
                  disabled={saving}
                  required
                >
                  <option value="">Choose species</option>
                  {references.species.map((species) => (
                    <option key={species.index} value={species.index}>
                      {species.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="characters-select-field">
                <span className="characters-control-label">Class</span>
                <select
                  value={classIndex}
                  onChange={(event) => setClassIndex(event.target.value)}
                  className="characters-select-input"
                  disabled={saving}
                  required
                >
                  <option value="">Choose class</option>
                  {references.classes.map((characterClass) => (
                    <option key={characterClass.index} value={characterClass.index}>
                      {characterClass.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="characters-select-field">
                <span className="characters-control-label">Background</span>
                <select
                  value={backgroundIndex}
                  onChange={(event) => setBackgroundIndex(event.target.value)}
                  className="characters-select-input"
                  disabled={saving}
                  required
                >
                  <option value="">Choose background</option>
                  {references.backgrounds.map((background) => (
                    <option key={background.index} value={background.index}>
                      {background.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="characters-select-field">
              <span className="characters-control-label">Alignment</span>
              <select
                value={alignment}
                onChange={(event) => setAlignment(event.target.value)}
                className="characters-select-input"
                disabled={saving}
              >
                <option value="">No alignment</option>
                {references.alignments.map((alignmentOption) => (
                  <option key={alignmentOption.index} value={alignmentOption.index}>
                    {alignmentOption.name ?? alignmentOption.index}
                  </option>
                ))}
              </select>
            </label>

            {saveError && <p className="error-message">Error: {saveError}</p>}

            <button
              type="submit"
              className="primary-button primary-button-uppercase"
              disabled={saving}
            >
              {saving ? "Creating Character..." : "Create Character"}
            </button>
          </form>
        )}
      </section>
    </AppLayout>
  );
}

export { CreateCharacterPage };
