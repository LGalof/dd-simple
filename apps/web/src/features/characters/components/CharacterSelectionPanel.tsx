import type {
  BackgroundOption,
  BuilderSelectionKind,
  ClassOption,
  SpeciesOption,
} from "../types/characterBuilder";

type CharacterSelectionPanelProps = {
  activePanel: BuilderSelectionKind | null;
  backgroundOptions: BackgroundOption[];
  classOptions: ClassOption[];
  onClose: () => void;
  onConfirm: () => void;
  onSelect: (nextSelection: string) => void;
  pendingSelection: string | null;
  selectedOption: BackgroundOption | ClassOption | SpeciesOption | null;
  speciesOptions: SpeciesOption[];
};

function CharacterSelectionPanel({
  activePanel,
  backgroundOptions,
  classOptions,
  onClose,
  onConfirm,
  onSelect,
  pendingSelection,
  selectedOption,
  speciesOptions,
}: CharacterSelectionPanelProps) {
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

  return (
    <div className="selection-panel-backdrop" role="presentation">
      <section className="selection-panel" role="dialog" aria-modal="true">
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
          <p className="builder-section-label">Preview Mode</p>
          <h3>{selectedOption.name}</h3>
          <p className="selection-panel-description">{selectedOption.description}</p>

          {"traits" in selectedOption && (
            <div className="selection-panel-stack">
              <h4>Traits</h4>
              <ul className="selection-bullet-list">
                {selectedOption.traits.map((trait) => (
                  <li key={trait}>{trait}</li>
                ))}
              </ul>
            </div>
          )}

          {"proficiencies" in selectedOption && (
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

          {"features" in selectedOption && (
            <div className="selection-panel-stack">
              <h4>Levels 1-20</h4>
              <div className="selection-level-list">
                {selectedOption.features.map((feature) => (
                  <article
                    key={`${selectedOption.index}-${feature.level}`}
                    className="selection-level-card"
                  >
                    <span>Level {feature.level}</span>
                    <strong>{feature.title}</strong>
                    <p>{feature.summary}</p>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="selection-panel-actions">
            <button type="button" className="primary-button primary-button-uppercase" onClick={onConfirm}>
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

export { CharacterSelectionPanel };
