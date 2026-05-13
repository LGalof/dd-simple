import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { fetchCharacter } from "../features/characters/api/fetchCharacter";
import { updateCharacter } from "../features/characters/api/updateCharacter";
import { useCharacterCreatorReferences } from "../features/references/hooks/useCharacterCreatorReferences";
import type { CharacterAbilityScoresInput } from "../types/character";

type AbilityScoreKey = keyof CharacterAbilityScoresInput;

const abilityScoreFields: { key: AbilityScoreKey; label: string }[] = [
  {
    key: "str",
    label: "STR",
  },
  {
    key: "dex",
    label: "DEX",
  },
  {
    key: "con",
    label: "CON",
  },
  {
    key: "int",
    label: "INT",
  },
  {
    key: "wis",
    label: "WIS",
  },
  {
    key: "cha",
    label: "CHA",
  },
];

const defaultAbilityScores: CharacterAbilityScoresInput = {
  str: 10,
  dex: 10,
  con: 10,
  int: 10,
  wis: 10,
  cha: 10,
};

function EditCharacterPage() {
  const { characterId } = useParams<{ characterId: string }>();
  const navigate = useNavigate();
  const { references, loading: referencesLoading, error: referencesError } =
    useCharacterCreatorReferences();

  const [loadingCharacter, setLoadingCharacter] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [speciesIndex, setSpeciesIndex] = useState("");
  const [classIndex, setClassIndex] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState("");
  const [alignment, setAlignment] = useState("");
  const [selectedSkillIndexes, setSelectedSkillIndexes] = useState<string[]>([]);
  const [abilityScores, setAbilityScores] =
    useState<CharacterAbilityScoresInput>(defaultAbilityScores);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacter(characterId: string) {
      setLoadingCharacter(true);
      setLoadError(null);

      try {
        const character = await fetchCharacter(characterId);
        const nextAbilityScores = { ...defaultAbilityScores };

        character.abilityScores.forEach((abilityScore) => {
          if (abilityScore.abilityIndex in nextAbilityScores) {
            nextAbilityScores[abilityScore.abilityIndex as AbilityScoreKey] =
              abilityScore.score;
          }
        });

        setName(character.name);
        setSpeciesIndex(character.speciesIndex);
        setClassIndex(character.classIndex);
        setBackgroundIndex(character.backgroundIndex);
        setAlignment(character.alignment ?? "");
        setSelectedSkillIndexes(
          character.skills
            .filter((characterSkill) => characterSkill.isProficient)
            .map((characterSkill) => characterSkill.skillIndex),
        );
        setAbilityScores(nextAbilityScores);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : "Failed to load character");
      } finally {
        setLoadingCharacter(false);
      }
    }

    if (!characterId) {
      setLoadError("Choose a character to edit.");
      setLoadingCharacter(false);
      return;
    }

    void loadCharacter(characterId);
  }, [characterId]);

  const selectedClass = useMemo(
    () => references?.classes.find((item) => item.index === classIndex),
    [references, classIndex],
  );

  const conModifier = Math.floor((abilityScores.con - 10) / 2);
  const dexModifier = Math.floor((abilityScores.dex - 10) / 2);
  const previewMaxHp = selectedClass
    ? Math.max(1, selectedClass.hitDie + conModifier)
    : null;
  const previewArmorClass = 10 + dexModifier;

  function updateAbilityScore(ability: AbilityScoreKey, value: number) {
    const nextValue = Number.isNaN(value) ? 10 : Math.min(20, Math.max(3, value));

    setAbilityScores((currentScores) => ({
      ...currentScores,
      [ability]: nextValue,
    }));
  }

  function toggleSkill(skillIndex: string) {
    setSelectedSkillIndexes((currentSkills) => {
      if (currentSkills.includes(skillIndex)) {
        return currentSkills.filter((currentSkill) => currentSkill !== skillIndex);
      }

      return [...currentSkills, skillIndex];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (!characterId) {
      setSaveError("Choose a character to edit.");
      return;
    }

    if (!name.trim() || !speciesIndex || !classIndex || !backgroundIndex) {
      setSaveError("Choose a name, species, class, and background before saving.");
      return;
    }

    setSaving(true);

    try {
      const character = await updateCharacter(characterId, {
        name: name.trim(),
        speciesIndex,
        classIndex,
        backgroundIndex,
        alignment: alignment || null,
        skillIndexes: selectedSkillIndexes,
        abilityScores,
      });

      navigate(`/characters/${character.id}`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to update character");
    } finally {
      setSaving(false);
    }
  }

  const loading = referencesLoading || loadingCharacter;
  const error = referencesError ?? loadError;

  return (
    <AppLayout>
      <section className="page-section">
        <div className="characters-library-header">
          <div className="characters-library-title-group">
            <p className="eyebrow">Character Editor</p>
            <h1 className="characters-library-title">Edit Character</h1>
            <p className="muted">Adjust the same core choices used during creation.</p>
          </div>

          <Link
            to={characterId ? `/characters/${characterId}` : "/characters"}
            className="characters-settings-button"
          >
            Back to Sheet
          </Link>
        </div>

        {loading && (
          <div className="page-placeholder-card">
            <p>Loading character...</p>
          </div>
        )}

        {error && (
          <div className="page-placeholder-card">
            <p className="error-message">Error: {error}</p>
            <Link to="/characters" className="characters-settings-button">
              Back to Characters
            </Link>
          </div>
        )}

        {!loading && !error && references && (
          <div className="page-placeholder-card">
            <form className="character-creator-form" onSubmit={handleSubmit}>
              <label className="characters-search-field">
                <span className="characters-control-label">Character Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="characters-search-input"
                  disabled={saving}
                  required
                />
              </label>

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

              <div>
                <span className="characters-control-label">Ability Scores</span>
                <div className="character-summary-grid">
                  {abilityScoreFields.map((abilityScoreField) => (
                    <label key={abilityScoreField.key} className="characters-search-field">
                      <span className="characters-control-label">
                        {abilityScoreField.label}
                      </span>
                      <input
                        type="number"
                        min={3}
                        max={20}
                        value={abilityScores[abilityScoreField.key]}
                        onChange={(event) =>
                          updateAbilityScore(
                            abilityScoreField.key,
                            event.currentTarget.valueAsNumber,
                          )
                        }
                        className="characters-search-input"
                        disabled={saving}
                        required
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="characters-control-label">Skill Proficiencies</span>
                <div className="character-summary-grid">
                  {references.skills.map((skill) => (
                    <label key={skill.index} className="page-placeholder-card">
                      <input
                        type="checkbox"
                        checked={selectedSkillIndexes.includes(skill.index)}
                        onChange={() => toggleSkill(skill.index)}
                        disabled={saving}
                      />
                      <strong>{skill.name}</strong>
                      <span className="muted"> ({skill.ability.name})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="page-placeholder-card">
                <h2>Preview</h2>
                <p>
                  <strong>HP:</strong>{" "}
                  {previewMaxHp === null ? "Choose a class" : previewMaxHp}
                </p>
                <p>
                  <strong>Armor Class:</strong> {previewArmorClass}
                </p>
              </div>

              {saveError && <p className="error-message">Error: {saveError}</p>}

              <button
                type="submit"
                className="primary-button primary-button-uppercase"
                disabled={saving}
              >
                {saving ? "Saving Character..." : "Save Character"}
              </button>
            </form>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { EditCharacterPage };
