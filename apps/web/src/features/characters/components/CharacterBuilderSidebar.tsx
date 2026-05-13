import { useEffect, useMemo, useState } from "react";
import type { AbilityScore } from "../../../types/character";
import type {
  AbilityAssignment,
  BackgroundOption,
  BuilderSelectionKind,
  ClassFeature,
  ClassOption,
  SpeciesOption,
} from "../types/characterBuilder";

type CharacterBuilderSidebarProps = {
  abilityAssignments: AbilityAssignment[];
  abilityScores: AbilityScore[];
  background: BackgroundOption;
  characterLevel: number;
  classOption: ClassOption;
  onAbilityAssignmentChange: (slotId: string, nextAbilityIndex: string) => void;
  onOpenPanel: (kind: BuilderSelectionKind) => void;
  onRollAbility: (slotId: string) => void;
  onRollAllAbilities: () => void;
  species: SpeciesOption;
};

function CharacterBuilderSidebar({
  abilityAssignments,
  abilityScores,
  background,
  characterLevel,
  classOption,
  onAbilityAssignmentChange,
  onOpenPanel,
  onRollAbility,
  onRollAllAbilities,
  species,
}: CharacterBuilderSidebarProps) {
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});

  useEffect(() => {
    setExpandedFeatureId(classOption.features[0]?.id ?? null);
    setSelectedChoices({});
  }, [classOption.index]);

  const featureCountLabel = useMemo(() => {
    const availableNow = classOption.features.filter(
      (feature) => feature.level <= characterLevel,
    ).length;

    return `${availableNow} unlocked - levels 1-20`;
  }, [characterLevel, classOption.features]);

  const abilityOptionMap = useMemo(
    () =>
      Object.fromEntries(
        abilityScores.map((abilityScore) => [
          abilityScore.abilityIndex,
          {
            label: abilityScore.ability.name,
            fullLabel: abilityScore.ability.fullName ?? abilityScore.ability.name,
          },
        ]),
      ),
    [abilityScores],
  );

  function toggleFeature(featureId: string) {
    setExpandedFeatureId((currentFeatureId) =>
      currentFeatureId === featureId ? null : featureId,
    );
  }

  function updateChoice(featureId: string, fieldId: string, value: string) {
    setSelectedChoices((currentChoices) => ({
      ...currentChoices,
      [`${featureId}:${fieldId}`]: value,
    }));
  }

  return (
    <aside className="builder-sidebar">
      <div className="builder-sidebar-section">
        <div className="builder-selection-grid">
          <BuilderSelectionButton
            label="Species"
            value={species.name}
            onClick={() => onOpenPanel("species")}
          />
          <BuilderSelectionButton
            label="Background"
            value={background.name}
            onClick={() => onOpenPanel("background")}
          />
          <BuilderSelectionButton
            label="Class"
            value={classOption.name}
            onClick={() => onOpenPanel("class")}
          />
        </div>
      </div>

      <div className="builder-sidebar-section">
        <div className="builder-section-header">
          <div>
            <p className="builder-section-label">Ability Scores</p>
          </div>

          <button type="button" className="builder-roll-button" onClick={onRollAllAbilities}>
            Roll All
          </button>
        </div>

        <div className="builder-ability-list">
          {abilityAssignments.map((assignment) => (
            <div key={assignment.id} className="builder-ability-card">
              <strong className="builder-ability-card-score">{assignment.score}</strong>

              <div className="builder-ability-dice-row">
                {(assignment.dice.length > 0 ? assignment.dice : [assignment.score]).map(
                  (dieValue, index) => (
                    <span key={`${assignment.id}-die-${index}`} className="builder-ability-die">
                      {dieValue}
                    </span>
                  ),
                )}
              </div>

              <div className="builder-ability-card-controls">
                <select
                  className="builder-ability-select"
                  value={assignment.abilityIndex}
                  onChange={(event) =>
                    onAbilityAssignmentChange(assignment.id, event.target.value)
                  }
                >
                  {abilityScores.map((abilityScore) => (
                    <option key={abilityScore.abilityIndex} value={abilityScore.abilityIndex}>
                      {abilityScore.ability.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  className="builder-roll-single-button"
                  onClick={() => onRollAbility(assignment.id)}
                >
                  Roll
                </button>
              </div>

              <span className="builder-ability-card-label">
                {abilityOptionMap[assignment.abilityIndex]?.fullLabel ??
                  abilityOptionMap[assignment.abilityIndex]?.label ??
                  assignment.abilityIndex.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="builder-sidebar-section builder-sidebar-scroll-section">
        <div className="builder-section-header">
          <div>
            <p className="builder-section-label">Class Features</p>
            <h3>{classOption.name}</h3>
            <span className="builder-feature-overview">{featureCountLabel}</span>
          </div>
        </div>

        <div className="builder-feature-accordion">
          {classOption.features.map((feature) => {
            const isExpanded = expandedFeatureId === feature.id;
            const isFutureFeature = feature.level > characterLevel;
            const isComplete = isFeatureComplete(feature, selectedChoices);

            return (
              <article
                key={feature.id}
                className={[
                  "builder-feature-item",
                  isFutureFeature ? "builder-feature-item-future" : "",
                  isComplete ? "builder-feature-item-complete" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <button
                  type="button"
                  className="builder-feature-trigger"
                  onClick={() => toggleFeature(feature.id)}
                >
                  <div className="builder-feature-trigger-copy">
                    <strong>{feature.title}</strong>
                    <span>{formatFeatureMeta(feature)}</span>
                  </div>
                  <span
                    aria-hidden="true"
                    className={
                      isExpanded
                        ? "builder-feature-chevron builder-feature-chevron-open"
                        : "builder-feature-chevron"
                    }
                  >
                    ^
                  </span>
                </button>

                {isExpanded && (
                  <div className="builder-feature-body">
                    <p className="builder-feature-summary">{feature.summary}</p>

                    {feature.details?.map((detail) => (
                      <p key={`${feature.id}-${detail}`} className="builder-feature-detail">
                        {detail}
                      </p>
                    ))}

                    {feature.choiceFields?.length ? (
                      <div className="builder-feature-choice-list">
                        {feature.choiceFields.map((field) => {
                          const choiceKey = `${feature.id}:${field.id}`;

                          return (
                            <label key={choiceKey} className="builder-feature-choice-field">
                              <span>{field.label}</span>
                              <select
                                className="builder-feature-select"
                                value={selectedChoices[choiceKey] ?? ""}
                                onChange={(event) =>
                                  updateChoice(feature.id, field.id, event.target.value)
                                }
                              >
                                <option value="">Choose {field.label.toLowerCase()}</option>
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
                )}
              </article>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

type BuilderSelectionButtonProps = {
  label: string;
  onClick: () => void;
  value: string;
};

function BuilderSelectionButton({ label, onClick, value }: BuilderSelectionButtonProps) {
  return (
    <button type="button" className="builder-selection-button" onClick={onClick}>
      <span>{label}</span>
      <strong>{value}</strong>
    </button>
  );
}

function formatFeatureMeta(feature: ClassFeature) {
  const choiceCount = feature.choiceFields?.length ?? 0;
  const parts: string[] = [];

  if (choiceCount > 0) {
    parts.push(`${choiceCount} ${choiceCount === 1 ? "Choice" : "Choices"}`);
  }

  parts.push(`${formatOrdinal(feature.level)} level`);

  return parts.join(" - ");
}

function isFeatureComplete(feature: ClassFeature, selectedChoices: Record<string, string>) {
  if (!feature.choiceFields?.length) {
    return false;
  }

  return feature.choiceFields.every((field) =>
    Boolean(selectedChoices[`${feature.id}:${field.id}`]),
  );
}

function formatOrdinal(value: number) {
  if (value % 100 >= 11 && value % 100 <= 13) {
    return `${value}th`;
  }

  switch (value % 10) {
    case 1:
      return `${value}st`;
    case 2:
      return `${value}nd`;
    case 3:
      return `${value}rd`;
    default:
      return `${value}th`;
  }
}

export { CharacterBuilderSidebar };
