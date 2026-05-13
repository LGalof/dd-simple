import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { createCharacter } from "../features/characters/api/createCharacter";
import { AbilityScoreStepper } from "../features/characters/components/AbilityScoreStepper";
import {
  getBackgroundSkillIndexes,
  getClassSkillChoice,
  getSkillName,
} from "../features/characters/utils/skillProficiencyOptions";
import { useCharacterCreatorReferences } from "../features/references/hooks/useCharacterCreatorReferences";

type AbilityScoreKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

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

function CreateCharacterPage() {
  const { references, loading, error } = useCharacterCreatorReferences();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [speciesIndex, setSpeciesIndex] = useState("");
  const [classIndex, setClassIndex] = useState("");
  const [backgroundIndex, setBackgroundIndex] = useState("");
  const [alignment, setAlignment] = useState("");
  const [selectedSkillIndexes, setSelectedSkillIndexes] = useState<string[]>([]);
  const [abilityScores, setAbilityScores] = useState<Record<AbilityScoreKey, number>>({
    str: 10,
    dex: 10,
    con: 10,
    int: 10,
    wis: 10,
    cha: 10,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const selectedAlignment = useMemo(
    () => references?.alignments.find((item) => item.index === alignment),
    [references, alignment],
  );
  const classSkillChoice = useMemo(
    () => getClassSkillChoice(selectedClass),
    [selectedClass],
  );
  const backgroundSkillIndexes = useMemo(
    () => getBackgroundSkillIndexes(selectedBackground),
    [selectedBackground],
  );
  const backgroundSkillIndexSet = useMemo(
    () => new Set(backgroundSkillIndexes),
    [backgroundSkillIndexes],
  );
  const classSkillOptionIndexSet = useMemo(
    () => new Set(classSkillChoice?.options.map((option) => option.skillIndex) ?? []),
    [classSkillChoice],
  );
  const selectedClassSkillCount = classSkillChoice
    ? selectedSkillIndexes.filter((skillIndex) =>
        classSkillOptionIndexSet.has(skillIndex) &&
        !backgroundSkillIndexSet.has(skillIndex),
      ).length
    : selectedSkillIndexes.length;

  const conModifier = Math.floor((abilityScores.con - 10) / 2);
  const dexModifier = Math.floor((abilityScores.dex - 10) / 2);
  const previewMaxHp = selectedClass
    ? Math.max(1, selectedClass.hitDie + conModifier)
    : null;
  const previewArmorClass = 10 + dexModifier;

  useEffect(() => {
    setSelectedSkillIndexes((currentSkillIndexes) => {
      const manualSkillIndexes = currentSkillIndexes.filter(
        (skillIndex) => !backgroundSkillIndexSet.has(skillIndex),
      );
      const nextSkillIndexes = classSkillChoice
        ? manualSkillIndexes
            .filter((skillIndex) => classSkillOptionIndexSet.has(skillIndex))
            .slice(0, classSkillChoice.choose)
        : manualSkillIndexes;

      if (
        nextSkillIndexes.length === currentSkillIndexes.length &&
        nextSkillIndexes.every((skillIndex, index) => skillIndex === currentSkillIndexes[index])
      ) {
        return currentSkillIndexes;
      }

      return nextSkillIndexes;
    });
  }, [backgroundSkillIndexSet, classSkillChoice, classSkillOptionIndexSet]);

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

      if (
        classSkillChoice &&
        classSkillOptionIndexSet.has(skillIndex) &&
        currentSkills.filter((currentSkill) =>
          classSkillOptionIndexSet.has(currentSkill) &&
          !backgroundSkillIndexSet.has(currentSkill),
        ).length >= classSkillChoice.choose
      ) {
        return currentSkills;
      }

      return [...currentSkills, skillIndex];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);

    if (!name.trim() || !speciesIndex || !classIndex || !backgroundIndex) {
      setSaveError("Choose a name, species, class, and background before creating the character.");
      return;
    }

    setSaving(true);

    try {
      const submittedSkillIndexes = new Set([
        ...(classSkillChoice
          ? selectedSkillIndexes.filter((skillIndex) =>
              classSkillOptionIndexSet.has(skillIndex),
            )
          : selectedSkillIndexes),
        ...backgroundSkillIndexes,
      ]);

      await createCharacter({
        name: name.trim(),
        speciesIndex,
        classIndex,
        backgroundIndex,
        alignment: alignment || null,
        skillIndexes: [...submittedSkillIndexes],
        abilityScores,
      });

      navigate("/characters");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Failed to create character");
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
            <form className="character-creator-form" onSubmit={handleSubmit}>
              <label className="characters-search-field">
                <span className="characters-control-label">Character Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="characters-search-input"
                  placeholder="Example: Kael Shadowstep"
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
                  disabled={saving}
                  required
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
                  disabled={saving}
                  required
                >
                  <option value="">Choose background</option>
                  {references.backgrounds.map((background: { index: string; name: string }) => (
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
                    <AbilityScoreStepper
                      key={abilityScoreField.key}
                      label={abilityScoreField.label}
                      value={abilityScores[abilityScoreField.key]}
                      onChange={(value) =>
                        updateAbilityScore(abilityScoreField.key, value)
                      }
                      disabled={saving}
                    />
                  ))}
                </div>
              </div>

              <div>
                <span className="characters-control-label">Skill Proficiencies</span>
                {backgroundSkillIndexes.length > 0 && references && (
                  <div className="page-placeholder-card">
                    <strong>Granted by Background</strong>
                    <p className="muted">
                      {backgroundSkillIndexes
                        .map((skillIndex) => getSkillName(skillIndex, references.skills))
                        .join(", ")}
                    </p>
                  </div>
                )}
                {classSkillChoice && (
                  <p className="muted">
                    {classSkillChoice.description} ({selectedClassSkillCount}/
                    {classSkillChoice.choose} selected)
                  </p>
                )}
                <div className="character-summary-grid">
                  {(classSkillChoice
                    ? classSkillChoice.options.map((option) => {
                        const skill = references.skills.find(
                          (referenceSkill) => referenceSkill.index === option.skillIndex,
                        );

                        return skill ?? {
                          index: option.skillIndex,
                          name: option.name,
                          ability: {
                            name: "Skill",
                          },
                        };
                      })
                    : references.skills
                  ).map((skill: { index: string; name: string; ability: { name: string } }) => {
                    const isGrantedByBackground = backgroundSkillIndexSet.has(skill.index);
                    const isAtClassLimit =
                      Boolean(classSkillChoice) &&
                      selectedClassSkillCount >= (classSkillChoice?.choose ?? 0) &&
                      !selectedSkillIndexes.includes(skill.index);

                    const isSelected =
                      selectedSkillIndexes.includes(skill.index) ||
                      isGrantedByBackground;

                    return (
                    <label key={skill.index} className="skill-option-card">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSkill(skill.index)}
                        disabled={saving || isGrantedByBackground || isAtClassLimit}
                      />
                      <span className="skill-option-copy">
                        <strong>{skill.name}</strong>
                        <span className="muted">{skill.ability.name}</span>
                      </span>
                      <span className="skill-option-status">
                        {isGrantedByBackground ? "Background" : isSelected ? "Selected" : ""}
                      </span>
                    </label>
                  );
                  })}
                </div>
                {!classSkillChoice && (
                  <p className="muted">
                    No structured class skill options were found, so all skills are available.
                  </p>
                )}
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
                  <strong>Alignment:</strong>{" "}
                  {selectedAlignment?.name ?? "None"}
                </p>
                <p>
                  <strong>HP:</strong>{" "}
                  {previewMaxHp === null ? "Choose a class" : previewMaxHp}
                </p>
                <p>
                  <strong>Armor Class:</strong> {previewArmorClass}
                </p>
                <p>
                  <strong>Selected skills:</strong>{" "}
                  {selectedSkillIndexes.length + backgroundSkillIndexes.length > 0
                    ? [...new Set([...selectedSkillIndexes, ...backgroundSkillIndexes])]
                        .join(", ")
                    : "None"}
                </p>
              </div>

              {saveError && <p className="error-message">Error: {saveError}</p>}

              <button
                type="submit"
                className="primary-button primary-button-uppercase"
                disabled={saving}
              >
                {saving ? "Creating Character..." : "Create Character"}
              </button>
            </form>
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { CreateCharacterPage };
