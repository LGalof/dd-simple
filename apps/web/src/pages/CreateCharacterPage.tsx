import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useCharacterCreatorReferences } from "../features/references/hooks/useCharacterCreatorReferences";

function CreateCharacterPage() {
  const { references, loading, error } = useCharacterCreatorReferences();

  const [name, setName] = useState("");
  const [speciesIndex, setSpeciesIndex] = useState("");
  const [classIndex, setClassIndex] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState("");
  const [selectedSkillIndexes, setSelectedSkillIndexes] = useState<string[]>([]);

  const selectedClass = useMemo(
    () => references?.classes.find((item: { index: string }) => item.index === classIndex),
    [references, classIndex],
  );

  const selectedSpecies = useMemo(
    () => references?.species.find((item: { index: string }) => item.index === speciesIndex),
    [references, speciesIndex],
  );

  const selectedBackground = useMemo(
    () => references?.backgrounds.find((item: { index: string }) => item.index === backgroundIndex),
    [references, backgroundIndex],
  );

  function toggleSkill(skillIndex: string) {
    setSelectedSkillIndexes((currentSkills) => {
      if (currentSkills.includes(skillIndex)) {
        return currentSkills.filter((currentSkill) => currentSkill !== skillIndex);
      }

      return [...currentSkills, skillIndex];
    });
  }

  return (
    <AppLayout>
      <section className="page-section">
        <div className="characters-library-header">
          <div className="characters-library-title-group">
            <p className="eyebrow">Character Creator</p>
            <h1 className="characters-library-title">Create a Character</h1>
            <p className="muted">
              Choose basic character options from the 5e reference database.
            </p>
          </div>

          <Link to="/characters" className="characters-settings-button">
            Back to Characters
          </Link>
        </div>

        {loading && (
          <div className="page-placeholder-card">
            <p>Loading 5e reference data...</p>
          </div>
        )}

        {error && (
          <div className="page-placeholder-card">
            <p className="error-message">Error: {error}</p>
          </div>
        )}

        {!loading && !error && references && (
          <div className="page-placeholder-card">
            <div className="character-creator-form">
              <label className="characters-search-field">
                <span className="characters-control-label">Character Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="characters-search-input"
                  placeholder="Example: Kael Shadowstep"
                />
              </label>

              <label className="characters-select-field">
                <span className="characters-control-label">Species</span>
                <select
                  value={speciesIndex}
                  onChange={(event) => setSpeciesIndex(event.target.value)}
                  className="characters-select-input"
                >
                  <option value="">Choose species</option>
                  {references.species.map((species: { index: string; name: string }) => (
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
                >
                  <option value="">Choose class</option>
                  {references.classes.map((characterClass: { index: string; name: string }) => (
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
                >
                  <option value="">Choose background</option>
                  {references.backgrounds.map((background: { index: string; name: string }) => (
                    <option key={background.index} value={background.index}>
                      {background.name}
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <span className="characters-control-label">Skill Proficiencies</span>
                <div className="character-summary-grid">
                  {references.skills.map((skill: { index: string; name: string; ability: { name: string } }) => (
                    <label key={skill.index} className="page-placeholder-card">
                      <input
                        type="checkbox"
                        checked={selectedSkillIndexes.includes(skill.index)}
                        onChange={() => toggleSkill(skill.index)}
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
                  <strong>Name:</strong> {name || "Not selected"}
                </p>
                <p>
                  <strong>Species:</strong> {selectedSpecies?.name ?? "Not selected"}
                </p>
                <p>
                  <strong>Class:</strong>{" "}
                  {selectedClass
                    ? `${selectedClass.name} (d${selectedClass.hitDie})`
                    : "Not selected"}
                </p>
                <p>
                  <strong>Background:</strong>{" "}
                  {selectedBackground?.name ?? "Not selected"}
                </p>
                <p>
                  <strong>Selected skills:</strong>{" "}
                  {selectedSkillIndexes.length > 0
                    ? selectedSkillIndexes.join(", ")
                    : "None"}
                </p>
              </div>

              <button type="button" className="primary-button primary-button-uppercase">
                Save Character Later
              </button>
            </div>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { CreateCharacterPage };