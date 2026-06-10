import { useEffect, useState } from "react";
import type {
  BackgroundOption,
  BuilderSelectionKind,
  ClassOption,
  SpeciesOption,
} from "../types/characterBuilder";

const backgroundAbilityPlanThreeScores = "increase-all-three-by-1";
const abilityScoreIndexAliases: Record<string, string> = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

type CharacterSelectionPanelProps = {
  activePanel: BuilderSelectionKind | null;
  backgroundSelectionValues: Record<string, string>;
  backgroundOptions: BackgroundOption[];
  classOptions: ClassOption[];
  onClose: () => void;
  onConfirm: (nextOptions?: {
    backgroundChoices?: Record<string, string>;
    speciesChoices?: Record<string, string>;
  }) => void;
  onSelect: (nextSelection: string) => void;
  pendingSelection: string | null;
  selectedOption: BackgroundOption | ClassOption | SpeciesOption | null;
  speciesSelectionValues: Record<string, string>;
  speciesOptions: SpeciesOption[];
};

function CharacterSelectionPanel({
  activePanel,
  backgroundSelectionValues,
  backgroundOptions,
  classOptions,
  onClose,
  onConfirm,
  onSelect,
  pendingSelection,
  selectedOption,
  speciesSelectionValues,
  speciesOptions,
}: CharacterSelectionPanelProps) {
  const [expandedPreviewFeatureIds, setExpandedPreviewFeatureIds] = useState<string[]>([]);
  const [expandedBackgroundSectionIds, setExpandedBackgroundSectionIds] = useState<string[]>([]);
  const [expandedSpeciesSectionIds, setExpandedSpeciesSectionIds] = useState<string[]>([]);
  const [backgroundPreviewChoices, setBackgroundPreviewChoices] = useState<Record<string, string>>(
    {},
  );
  const [speciesPreviewChoices, setSpeciesPreviewChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    if (activePanel === "class" && selectedOption && "features" in selectedOption) {
      setExpandedPreviewFeatureIds(selectedOption.features[0]?.id ? [selectedOption.features[0].id] : []);
      setExpandedBackgroundSectionIds([]);
      setExpandedSpeciesSectionIds([]);
      setBackgroundPreviewChoices({});
      setSpeciesPreviewChoices({});
      return;
    }

    if (activePanel === "background" && selectedOption && "previewSections" in selectedOption) {
      setExpandedPreviewFeatureIds([]);
      setExpandedBackgroundSectionIds([]);
      setExpandedSpeciesSectionIds([]);
      setBackgroundPreviewChoices(backgroundSelectionValues);
      setSpeciesPreviewChoices({});
      return;
    }

    if (activePanel === "species" && selectedOption && isSpeciesOption(selectedOption)) {
      setExpandedPreviewFeatureIds([]);
      setExpandedBackgroundSectionIds([]);
      setExpandedSpeciesSectionIds(getInitialExpandedSpeciesSectionIds(selectedOption));
      setBackgroundPreviewChoices({});
      setSpeciesPreviewChoices(speciesSelectionValues);
      return;
    }

    setExpandedPreviewFeatureIds([]);
    setExpandedBackgroundSectionIds([]);
    setExpandedSpeciesSectionIds([]);
    setBackgroundPreviewChoices({});
    setSpeciesPreviewChoices({});
  }, [activePanel, backgroundSelectionValues, selectedOption, speciesSelectionValues]);

  if (!activePanel || !selectedOption) {
    return null;
  }

  const options =
    activePanel === "species"
      ? speciesOptions
      : activePanel === "background"
        ? backgroundOptions
        : classOptions;

  const actionLabel =
    activePanel === "class"
      ? "Add Class"
      : activePanel === "species"
        ? "Add Species"
        : "Add Background";

  const isBackgroundPreview = activePanel === "background" && "previewSections" in selectedOption;
  const isSpeciesPreview = activePanel === "species" && "previewSections" in selectedOption;
  const backgroundPreviewOption =
    isBackgroundPreview && isBackgroundOption(selectedOption) ? selectedOption : null;
  const speciesPreviewOption =
    isSpeciesPreview && isSpeciesOption(selectedOption) ? selectedOption : null;

  return (
    <div className="selection-panel-backdrop" role="presentation" onClick={onClose}>
      <section
        className={
          isBackgroundPreview
            ? "selection-panel selection-panel-background"
            : isSpeciesPreview
              ? "selection-panel selection-panel-species"
              : "selection-panel"
        }
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="selection-panel-sidebar">
          <p className="eyebrow">Selection Panel</p>
          <h2>Select {activePanel}</h2>
          <div className="selection-option-list">
            {options.map((option) => (
              <button
                key={option.index}
                type="button"
                className={
                  option.index === pendingSelection
                    ? "selection-option-button selection-option-button-active"
                    : "selection-option-button"
                }
                onClick={() => onSelect(option.index)}
              >
                <strong>{option.name}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="selection-panel-preview">
          <div
            className={
              isBackgroundPreview
                ? "selection-panel-preview-scroll selection-panel-preview-scroll-background"
                : isSpeciesPreview
                  ? "selection-panel-preview-scroll selection-panel-preview-scroll-species"
                : "selection-panel-preview-scroll"
            }
          >
            <p className="builder-section-label">Preview Mode</p>
            <h3>
              {"hitDie" in selectedOption
                ? selectedOption.features[0]?.title ?? selectedOption.name
                : isBackgroundPreview
                  ? "Choose Origin: Background"
                  : isSpeciesPreview
                    ? selectedOption.name
                  : selectedOption.name}
            </h3>
            {backgroundPreviewOption ? (
              <div className="background-preview-shell">
                <div className="background-preview-header">
                  <label className="background-preview-select-shell">
                    <span className="background-preview-select-label">Background</span>
                    <select
                      className="background-preview-select"
                      value={backgroundPreviewOption.index}
                      onChange={(event) => onSelect(event.target.value)}
                    >
                      {backgroundOptions.map((option) => (
                        <option key={option.index} value={option.index}>
                          {option.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <p className="background-preview-description">{backgroundPreviewOption.description}</p>

                <div className="background-preview-meta">
                  <p>
                    <strong>Skill Proficiencies:</strong>{" "}
                    {backgroundPreviewOption.skillProficiencies.join(", ")}
                  </p>
                  <p>
                    <strong>Tool Proficiencies:</strong>{" "}
                    {backgroundPreviewOption.toolProficiencies.join(", ")}
                  </p>
                </div>

                <div className="background-preview-accordion">
                  {backgroundPreviewOption.previewSections.map((section) => {
                    const isExpanded = expandedBackgroundSectionIds.includes(section.id);

                    return (
                      <article key={section.id} className="background-preview-card">
                        <button
                          type="button"
                          className="background-preview-trigger"
                          onClick={() =>
                            setExpandedBackgroundSectionIds((currentSectionIds) =>
                              currentSectionIds.includes(section.id)
                                ? currentSectionIds.filter((sectionId) => sectionId !== section.id)
                                : [...currentSectionIds, section.id],
                            )
                          }
                        >
                          <div className="background-preview-trigger-copy">
                            <strong>{section.title}</strong>
                            <span>{section.subtitle}</span>
                          </div>
                          <span
                            aria-hidden="true"
                            className={
                              isExpanded
                                ? "background-preview-chevron background-preview-chevron-open"
                                : "background-preview-chevron"
                            }
                          >
                            ^
                          </span>
                        </button>

                        {isExpanded ? (
                          <div className="background-preview-body">
                            {section.details.map((detail) => (
                              <p key={`${section.id}-${detail}`}>{detail}</p>
                            ))}

                            {section.choiceFields?.length ? (
                              <div className="background-preview-choice-list">
                                {getVisibleBackgroundChoiceFields(
                                  backgroundPreviewOption.index,
                                  section.id,
                                  section.choiceFields,
                                  backgroundPreviewChoices,
                                ).map((field) => {
                                  const choiceKey = `${backgroundPreviewOption.index}:${section.id}:${field.id}`;

                                  return (
                                    <label
                                      key={choiceKey}
                                      className="background-preview-choice-field"
                                    >
                                      <select
                                        className="background-preview-choice-select"
                                        value={backgroundPreviewChoices[choiceKey] ?? ""}
                                        onChange={(event) =>
                                          setBackgroundPreviewChoices((currentChoices) => ({
                                            ...currentChoices,
                                            [choiceKey]: event.target.value,
                                          }))
                                        }
                                      >
                                        <option value="">{field.label}</option>
                                        {field.options.map((option) => {
                                          const disabled = isDuplicateBackgroundAbilityOption(
                                            backgroundPreviewOption.index,
                                            section.id,
                                            field.id,
                                            option.value,
                                            backgroundPreviewChoices,
                                          );

                                          return (
                                            <option
                                              key={option.value}
                                              value={option.value}
                                              disabled={disabled}
                                            >
                                              {option.label}
                                            </option>
                                          );
                                        })}
                                      </select>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : speciesPreviewOption ? (
              <div className="species-preview-shell">
                <div className="species-preview-header">
                  <div className="species-preview-copy">
                    <p className="species-preview-description">{speciesPreviewOption.description}</p>

                    <div className="species-preview-meta">
                      <p>
                        <strong>{speciesPreviewOption.name} Traits</strong>
                      </p>
                      <p>{speciesPreviewOption.traits.join(", ")}</p>
                    </div>
                  </div>

                  <div className="species-preview-aside">
                    <div className="species-preview-crest" aria-hidden="true">
                      {speciesPreviewOption.name.slice(0, 2).toUpperCase()}
                    </div>
                    <button type="button" className="species-preview-link-button" onClick={onClose}>
                      Change Species
                    </button>
                  </div>
                </div>

                <div className="species-preview-accordion">
                  {speciesPreviewOption.previewSections.map((section) => {
                    const isExpanded = expandedSpeciesSectionIds.includes(section.id);

                    return (
                      <article key={section.id} className="species-preview-card">
                        <button
                          type="button"
                          className="species-preview-trigger"
                          onClick={() =>
                            setExpandedSpeciesSectionIds((currentSectionIds) =>
                              currentSectionIds.includes(section.id)
                                ? currentSectionIds.filter((sectionId) => sectionId !== section.id)
                                : [...currentSectionIds, section.id],
                            )
                          }
                        >
                          <div className="species-preview-trigger-copy">
                            <strong>{section.title}</strong>
                            {section.subtitle ? <span>{section.subtitle}</span> : null}
                          </div>
                          <span
                            aria-hidden="true"
                            className={
                              isExpanded
                                ? "species-preview-chevron species-preview-chevron-open"
                                : "species-preview-chevron"
                            }
                          >
                            ^
                          </span>
                        </button>

                        {isExpanded ? (
                          <div className="species-preview-body">
                            {section.details.map((detail) => (
                              <p key={`${section.id}-${detail}`}>{detail}</p>
                            ))}

                            {section.choiceFields?.length ? (
                              <div className="species-preview-choice-list">
                                {section.choiceFields.map((field) => {
                                  const choiceKey = `${speciesPreviewOption.index}:${section.id}:${field.id}`;

                                  return (
                                    <label key={choiceKey} className="species-preview-choice-field">
                                      <select
                                        className="species-preview-choice-select"
                                        value={speciesPreviewChoices[choiceKey] ?? ""}
                                        onChange={(event) =>
                                          setSpeciesPreviewChoices((currentChoices) => ({
                                            ...currentChoices,
                                            [choiceKey]: event.target.value,
                                          }))
                                        }
                                      >
                                        <option value="">{field.label}</option>
                                        {field.options.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </div>
            ) : "hitDie" in selectedOption ? null : (
              <p className="selection-panel-description">{selectedOption.description}</p>
            )}

            {isSpeciesOption(selectedOption) && !speciesPreviewOption && (
              <div className="selection-panel-stack">
                <h4>Traits</h4>
                <ul className="selection-bullet-list">
                  {selectedOption.traits.map((trait) => (
                    <li key={trait}>{trait}</li>
                  ))}
                </ul>
              </div>
            )}

            {!isBackgroundPreview && "feature" in selectedOption && (
              <div className="selection-panel-stack">
                <h4>Proficiencies</h4>
                <ul className="selection-bullet-list">
                  {selectedOption.proficiencies.map((proficiency) => (
                    <li key={proficiency}>{proficiency}</li>
                  ))}
                </ul>
                <p className="muted">Feature: {selectedOption.feature}</p>
              </div>
            )}

            {"hitDie" in selectedOption && (
              <>
                <div className="selection-class-overview-table" role="table" aria-label="Class overview">
                  {selectedOption.previewOverview.map((row) => (
                    <div key={row.label} className="selection-class-overview-row" role="row">
                      <div className="selection-class-overview-label" role="cell">
                        {row.label}
                      </div>
                      <div className="selection-class-overview-value" role="cell">
                        {row.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="selection-panel-stack">
                  <h4>Levels 1-20</h4>
                  <div className="selection-feature-accordion">
                    {selectedOption.features.map((feature) => (
                      <article
                        key={`${selectedOption.index}-${feature.id}`}
                        className="selection-level-card selection-feature-card"
                      >
                        <button
                          type="button"
                          className="selection-feature-trigger"
                          onClick={() =>
                            setExpandedPreviewFeatureIds((currentFeatureIds) =>
                              currentFeatureIds.includes(feature.id)
                                ? currentFeatureIds.filter((featureId) => featureId !== feature.id)
                                : [...currentFeatureIds, feature.id],
                            )
                          }
                        >
                          <div className="selection-feature-trigger-copy">
                            <strong>{feature.title}</strong>
                            <div className="selection-level-card-header">
                              <span>Level {feature.level}</span>
                              {feature.choiceFields?.length ? (
                                <em>{formatChoiceCount(feature.choiceFields.length)}</em>
                              ) : null}
                            </div>
                          </div>
                          <span
                            aria-hidden="true"
                            className={
                              expandedPreviewFeatureIds.includes(feature.id)
                                ? "selection-feature-chevron selection-feature-chevron-open"
                                : "selection-feature-chevron"
                            }
                          >
                            ^
                          </span>
                        </button>

                        {expandedPreviewFeatureIds.includes(feature.id) ? (
                          <div className="selection-feature-body">
                            <p>{feature.summary}</p>

                            {feature.details?.map((detail) => (
                              <p
                                key={`${feature.id}-${detail}`}
                                className="selection-feature-detail"
                              >
                                {detail}
                              </p>
                            ))}

                            {feature.choiceFields?.length ? (
                              <div className="selection-feature-choice-preview-list">
                                {feature.choiceFields.map((field) => (
                                  <article
                                    key={`${feature.id}-${field.id}`}
                                    className="selection-feature-choice-preview"
                                  >
                                    <strong>{field.label}</strong>
                                    <span>
                                      {field.options.length} options available in the builder
                                    </span>
                                  </article>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="selection-panel-actions">
            <button
              type="button"
              className="primary-button primary-button-uppercase"
              onClick={() =>
                onConfirm(
                  speciesPreviewOption
                    ? {
                        speciesChoices: Object.fromEntries(
                          Object.entries(speciesPreviewChoices).filter(([key]) =>
                            key.startsWith(`${speciesPreviewOption.index}:`),
                          ),
                        ),
                      }
                    : backgroundPreviewOption
                      ? {
                          backgroundChoices: Object.fromEntries(
                            Object.entries(backgroundPreviewChoices).filter(([key]) =>
                              key.startsWith(`${backgroundPreviewOption.index}:`),
                            ),
                          ),
                        }
                    : undefined,
                )
              }
            >
              {actionLabel}
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatChoiceCount(count: number) {
  return `${count} ${count === 1 ? "choice" : "choices"}`;
}

function getVisibleBackgroundChoiceFields(
  backgroundIndex: string,
  sectionId: string,
  fields: NonNullable<BackgroundOption["previewSections"][number]["choiceFields"]>,
  selectedChoices: Record<string, string>,
) {
  if (!sectionId.endsWith("ability-scores")) {
    return fields;
  }

  const planKey = `${backgroundIndex}:${sectionId}:score-plan`;
  const selectedPlan = selectedChoices[planKey];

  if (selectedPlan === backgroundAbilityPlanThreeScores) {
    const planField = fields.find((field) => field.id === "score-plan");

    return planField ? [planField] : fields;
  }

  return fields.filter((field) => field.id !== "score-c");
}

function isDuplicateBackgroundAbilityOption(
  backgroundIndex: string,
  sectionId: string,
  fieldId: string,
  optionValue: string,
  selectedChoices: Record<string, string>,
) {
  if (fieldId !== "score-a" && fieldId !== "score-b") {
    return false;
  }

  const planKey = `${backgroundIndex}:${sectionId}:score-plan`;

  if (selectedChoices[planKey] === backgroundAbilityPlanThreeScores) {
    return false;
  }

  const siblingFieldId = fieldId === "score-a" ? "score-b" : "score-a";
  const siblingValue = selectedChoices[`${backgroundIndex}:${sectionId}:${siblingFieldId}`];

  return Boolean(
    siblingValue &&
      canonicalAbilityScoreIndex(siblingValue) === canonicalAbilityScoreIndex(optionValue),
  );
}

function canonicalAbilityScoreIndex(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue = value
    .toLowerCase()
    .replace(/^ability-/, "")
    .replace(/-score$/, "");

  return abilityScoreIndexAliases[normalizedValue] ?? null;
}

function getInitialExpandedSpeciesSectionIds(speciesOption: SpeciesOption) {
  const choiceSection = speciesOption.previewSections.find(
    (section) => (section.choiceFields?.length ?? 0) > 0,
  );

  if (choiceSection?.id) {
    return [choiceSection.id];
  }

  const firstSectionId = speciesOption.previewSections[0]?.id;

  return firstSectionId ? [firstSectionId] : [];
}

function isBackgroundOption(
  option: BackgroundOption | ClassOption | SpeciesOption,
): option is BackgroundOption {
  return "skillProficiencies" in option && "toolProficiencies" in option;
}

function isSpeciesOption(
  option: BackgroundOption | ClassOption | SpeciesOption,
): option is SpeciesOption {
  return "creatureType" in option && "traits" in option;
}

export { CharacterSelectionPanel };
