import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { AbilityScore } from "../../../types/character";
import type {
  AbilityAssignment,
  BackgroundOption,
  BuilderSelectionKind,
  ClassFeature,
  ClassOption,
  ClassSubclassOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import {
  rollHitDie,
  synchronizeHitPointRolls,
} from "../utils/buildCharacterPreview";
import type { HitPointPreview } from "../utils/buildCharacterPreview";

type CharacterBuilderSidebarProps = {
  abilityAssignments: AbilityAssignment[];
  abilityScores: AbilityScore[];
  background: BackgroundOption;
  characterLevel: number;
  classOption: ClassOption;
  hitPointPreview: HitPointPreview | null;
  onAbilityAssignmentChange: (slotId: string, nextAbilityIndex: string) => void;
  onApplyHitPointSettings: (nextLevel: number, nextSettings: HitPointSettings) => void;
  onFeatureChoicesChange: (
    updater: (currentChoices: FeatureChoiceSelections) => FeatureChoiceSelections,
  ) => void;
  onOpenPanel: (kind: BuilderSelectionKind) => void;
  onRollAbility: (slotId: string) => void;
  onRollAllAbilities: () => void;
  selectedChoices: FeatureChoiceSelections;
  species: SpeciesOption;
  hitPointSettings: HitPointSettings | null;
};

function CharacterBuilderSidebar({
  abilityAssignments,
  abilityScores,
  background,
  characterLevel,
  classOption,
  hitPointPreview,
  hitPointSettings,
  onAbilityAssignmentChange,
  onApplyHitPointSettings,
  onFeatureChoicesChange,
  onOpenPanel,
  onRollAbility,
  onRollAllAbilities,
  selectedChoices,
  species,
}: CharacterBuilderSidebarProps) {
  const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);
  const [isHitPointPanelOpen, setIsHitPointPanelOpen] = useState(false);
  const [draftLevel, setDraftLevel] = useState(1);
  const [draftBonusHp, setDraftBonusHp] = useState("0");
  const [draftCalculationMode, setDraftCalculationMode] = useState<"fixed" | "rolled" | "override">("fixed");
  const [draftOverrideMaxHp, setDraftOverrideMaxHp] = useState("");
  const [draftRolledHitPoints, setDraftRolledHitPoints] = useState<number[]>([]);

  useEffect(() => {
    setExpandedFeatureId(classOption.features[0]?.id ?? null);
  }, [classOption.features, classOption.index]);

  useEffect(() => {
    if (!hitPointPreview || !hitPointSettings || isHitPointPanelOpen) {
      return;
    }

    setDraftLevel(characterLevel);
    setDraftBonusHp(String(hitPointPreview.bonusHp));
    setDraftCalculationMode(hitPointSettings.calculationMode === "override" ? "fixed" : hitPointSettings.calculationMode);
    setDraftOverrideMaxHp(
      hitPointPreview.overrideMaxHp === null ? "" : String(hitPointPreview.overrideMaxHp),
    );
    setDraftRolledHitPoints(hitPointSettings.rolledHitPoints);
  }, [
    characterLevel,
    hitPointSettings,
    hitPointPreview?.bonusHp,
    hitPointPreview?.overrideMaxHp,
    isHitPointPanelOpen,
    hitPointPreview,
  ]);

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

  const selectedSubclassIndex = useMemo(
    () => getSelectedSubclassIndex(classOption, selectedChoices),
    [classOption, selectedChoices],
  );

  const visibleFeatures = useMemo(
    () =>
      classOption.features.flatMap((feature) =>
        getVisibleClassFeatures(feature, classOption.subclasses ?? [], selectedSubclassIndex),
      ).sort(compareVisibleFeatures),
    [classOption.features, classOption.subclasses, selectedSubclassIndex],
  );

  const featureCountLabel = useMemo(() => {
    const availableNow = visibleFeatures.filter(
      (feature) => feature.level <= characterLevel,
    ).length;

    return `${availableNow} unlocked - levels 1-20`;
  }, [characterLevel, visibleFeatures]);

  const lastCompletedFeatureIndex = useMemo(
    () =>
      visibleFeatures.reduce((lastCompletedIndex, feature, featureIndex) => {
        if (isFeatureComplete(feature, selectedChoices)) {
          return featureIndex;
        }

        return lastCompletedIndex;
      }, -1),
    [selectedChoices, visibleFeatures],
  );

  function toggleFeature(featureId: string) {
    setExpandedFeatureId((currentFeatureId) =>
      currentFeatureId === featureId ? null : featureId,
    );
  }

  function updateChoice(
    featureId: string,
    fieldId: string,
    value: string,
    choiceFields: ClassFeature["choiceFields"] = [],
  ) {
    onFeatureChoicesChange((currentChoices) => {
      const field = choiceFields.find((choiceField) => choiceField.id === fieldId);
      const groupFields = field ? getChoiceGroupFields(choiceFields, field) : [];
      const isDuplicateSelection = Boolean(
        value &&
          groupFields.some(
            (groupField) =>
              groupField.id !== fieldId &&
              currentChoices[`${featureId}:${groupField.id}`] === value,
          ),
      );

      if (isDuplicateSelection) {
        return currentChoices;
      }

      return {
        ...currentChoices,
        [`${featureId}:${fieldId}`]: value,
      };
    });
  }

  function openHitPointPanel() {
    if (!hitPointPreview || !hitPointSettings) {
      return;
    }

    setDraftLevel(characterLevel);
    setDraftBonusHp(String(hitPointPreview.bonusHp));
    setDraftCalculationMode(hitPointSettings.calculationMode === "override" ? "fixed" : hitPointSettings.calculationMode);
    setDraftOverrideMaxHp(
      hitPointPreview.overrideMaxHp === null ? "" : String(hitPointPreview.overrideMaxHp),
    );
    setDraftRolledHitPoints(
      synchronizeHitPointRolls(characterLevel, hitPointPreview.hitDie, hitPointSettings.rolledHitPoints),
    );
    setIsHitPointPanelOpen(true);
  }

  function closeHitPointPanel() {
    setIsHitPointPanelOpen(false);
  }

  function applyHitPointChanges() {
    const nextBonusHp = Number.parseInt(draftBonusHp, 10);
    const nextOverrideMaxHp = Number.parseInt(draftOverrideMaxHp, 10);

    const overrideMaxHp =
      draftOverrideMaxHp.trim().length === 0 || !Number.isFinite(nextOverrideMaxHp)
        ? null
        : Math.max(1, nextOverrideMaxHp);

    onApplyHitPointSettings(draftLevel, {
      bonusHp: Number.isFinite(nextBonusHp) ? nextBonusHp : 0,
      calculationMode: overrideMaxHp === null ? draftCalculationMode : "override",
      overrideMaxHp,
      rolledHitPoints: synchronizeHitPointRolls(
        draftLevel,
        hitPointPreview?.hitDie ?? classOption.hitDie,
        draftRolledHitPoints,
      ),
    });

    closeHitPointPanel();
  }

  function updateDraftLevel(nextValue: string) {
    const parsedLevel = Number.parseInt(nextValue, 10);
    const nextLevel = Number.isFinite(parsedLevel) ? Math.max(1, Math.min(20, parsedLevel)) : 1;

    setDraftLevel(nextLevel);
    setDraftRolledHitPoints((currentRolls) =>
      synchronizeHitPointRolls(nextLevel, classOption.hitDie, currentRolls),
    );
  }

  function rerollHitPointDieAtIndex(index: number) {
    setDraftRolledHitPoints((currentRolls) =>
      currentRolls.map((dieValue, dieIndex) =>
        dieIndex === index ? rollHitDie(classOption.hitDie) : dieValue,
      ),
    );
  }

  const draftHitPointPreview = useMemo(() => {
    if (!hitPointPreview) {
      return null;
    }

    const constitutionScore =
      abilityAssignments.find((assignment) => assignment.abilityIndex === "con")?.score ?? 10;

    return {
      constitutionScore,
      normalized: synchronizeHitPointRolls(draftLevel, classOption.hitDie, draftRolledHitPoints),
    };
  }, [abilityAssignments, classOption.hitDie, draftLevel, draftRolledHitPoints, hitPointPreview]);

  const draftHitPointTotals = useMemo(() => {
    if (!draftHitPointPreview) {
      return null;
    }

    const preview = buildDraftHitPointPreview({
      bonusHp: draftBonusHp,
      constitutionScore: draftHitPointPreview.constitutionScore,
      hitDie: classOption.hitDie,
      level: draftLevel,
      mode: draftCalculationMode,
      overrideMaxHp: draftOverrideMaxHp,
      rolledHitPoints: draftHitPointPreview.normalized,
    });

    return preview;
  }, [
    classOption.hitDie,
    draftBonusHp,
    draftCalculationMode,
    draftHitPointPreview,
    draftLevel,
    draftOverrideMaxHp,
  ]);

  return (
    <>
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

        {hitPointPreview ? (
          <div className="builder-sidebar-section builder-hit-points-section">
            <div className="builder-hit-points-card">
              <div className="builder-hit-points-copy">
                <p>
                  Max Hit Points: <strong>{hitPointPreview.maxHp}</strong>
                </p>
                <p>
                  Hit Dice:{" "}
                  <strong>
                    {characterLevel}d{hitPointPreview.hitDie}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                className="builder-manage-hit-points-button"
                onClick={openHitPointPanel}
              >
                Manage HP
              </button>
            </div>
          </div>
        ) : null}

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
            {visibleFeatures.map((feature, featureIndex) => {
              const isExpanded = expandedFeatureId === feature.id;
              const isFutureFeature = feature.level > characterLevel;
              const isChoiceComplete = isFeatureComplete(feature, selectedChoices);
              const isAutoComplete =
                !feature.choiceFields?.length &&
                lastCompletedFeatureIndex >= 0 &&
                featureIndex < lastCompletedFeatureIndex;
              const isComplete = isChoiceComplete || isAutoComplete;

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
                            const selectedValue = selectedChoices[choiceKey] ?? "";
                            const groupFields = getChoiceGroupFields(feature.choiceFields, field);
                            const groupSelectedValues = getChoiceGroupSelectedValues(
                              feature.id,
                              groupFields,
                              selectedChoices,
                            );
                            const isFirstGroupField = groupFields[0]?.id === field.id;

                            return (
                              <div key={choiceKey} className="builder-feature-choice-field">
                                {field.choiceGroupLabel && isFirstGroupField ? (
                                  <span>
                                    {field.choiceGroupLabel} - {groupSelectedValues.length} /{" "}
                                    {field.choiceGroupLimit ?? groupFields.length} selected
                                  </span>
                                ) : null}
                                <label className="builder-feature-choice-field">
                                  <span>{field.label}</span>
                                  <select
                                    className="builder-feature-select"
                                    value={selectedValue}
                                    onChange={(event) =>
                                      updateChoice(
                                        feature.id,
                                        field.id,
                                        event.target.value,
                                        feature.choiceFields,
                                      )
                                    }
                                  >
                                    <option value="">Choose {field.label.toLowerCase()}</option>
                                    {field.options.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={isChoiceOptionSelectedElsewhere(
                                          option.value,
                                          selectedValue,
                                          groupSelectedValues,
                                        )}
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              </div>
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

      {isHitPointPanelOpen && hitPointPreview && draftHitPointTotals
        ? createPortal(
        <div className="builder-hp-modal-backdrop" onClick={closeHitPointPanel}>
          <section
            className="builder-hp-modal"
            onClick={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
          >
            <header className="builder-hp-modal-header">
              <h3>Manage Hit Points</h3>
              <button
                type="button"
                className="builder-hp-modal-close"
                onClick={closeHitPointPanel}
                aria-label="Close hit point panel"
              >
                ×
              </button>
            </header>

            <div className="builder-hp-modal-scroll">
              <div className="builder-hp-modal-summary">
                <span>Maximum Hit Points</span>
                <strong>{draftHitPointTotals.maxHp}</strong>
              </div>

              <div className="builder-hp-input-grid">
                <label className="builder-hp-input-field">
                  <span>Character Level</span>
                  <select
                    className="builder-hp-input"
                    value={String(draftLevel)}
                    onChange={(event) => updateDraftLevel(event.target.value)}
                  >
                    {Array.from({ length: 20 }, (_, index) => index + 1).map((levelOption) => (
                      <option key={levelOption} value={levelOption}>
                        Level {levelOption}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="builder-hp-stat">
                  <span>{draftCalculationMode === "rolled" ? "Rolled HP" : "Fixed HP"}</span>
                  <strong>
                    {draftCalculationMode === "rolled"
                      ? draftHitPointTotals.rolledClassHp
                      : draftHitPointTotals.fixedClassHp}
                  </strong>
                </div>

                <label className="builder-hp-input-field">
                  <span>HP Modifier</span>
                  <input
                    type="number"
                    className="builder-hp-input"
                    value={draftBonusHp}
                    onChange={(event) => setDraftBonusHp(event.target.value)}
                    placeholder="0"
                  />
                </label>

                <label className="builder-hp-input-field">
                  <span>Override HP</span>
                  <input
                    type="number"
                    className="builder-hp-input"
                    value={draftOverrideMaxHp}
                    onChange={(event) => setDraftOverrideMaxHp(event.target.value)}
                    placeholder="--"
                  />
                </label>
              </div>

              <div className="builder-hp-mode-toggle">
                <button
                  type="button"
                  className={
                    draftCalculationMode === "fixed"
                      ? "builder-hp-mode-button builder-hp-mode-button-active"
                      : "builder-hp-mode-button"
                  }
                  onClick={() => setDraftCalculationMode("fixed")}
                >
                  Fixed HP
                </button>
                <button
                  type="button"
                  className={
                    draftCalculationMode === "rolled"
                      ? "builder-hp-mode-button builder-hp-mode-button-active"
                      : "builder-hp-mode-button"
                  }
                  onClick={() => setDraftCalculationMode("rolled")}
                >
                  Roll Hit Dice
                </button>
              </div>

              <div className="builder-hp-bonuses">
                <h4>Hit Point Bonuses</h4>
                <p>{formatSignedNumber(draftHitPointTotals.constitutionBonus)} from Constitution</p>
                {draftHitPointTotals.bonusHp !== 0 ? (
                  <p>{formatSignedNumber(draftHitPointTotals.bonusHp)} miscellaneous HP modifier</p>
                ) : null}
              </div>

              {draftCalculationMode === "rolled" ? (
                <div className="builder-hp-roll-list">
                  <h4>Hit Dice Rolls</h4>
                  <p className="builder-hp-roll-help">
                    Reroll any die as many times as you want. This also covers cases where you want
                    to roll with advantage manually.
                  </p>
                  <div className="builder-hp-roll-grid">
                    {draftHitPointTotals.rolledHitPoints.map((dieValue, index) => (
                      <div key={`hp-die-${index}`} className="builder-hp-roll-card">
                        <span>Level {index + 1}</span>
                        <strong>{dieValue}</strong>
                        <button
                          type="button"
                          className="builder-roll-single-button"
                          onClick={() => rerollHitPointDieAtIndex(index)}
                        >
                          Reroll
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="builder-hp-detail-grid">
                <div className="builder-hp-detail-card">
                  <h4>Hit Dice</h4>
                  <p>
                    {classOption.name}: d{draftHitPointTotals.hitDie}
                  </p>
                  <p>
                    Pool: {draftLevel}d{draftHitPointTotals.hitDie}
                  </p>
                </div>

                <div className="builder-hp-detail-card">
                  <h4>Potential Values</h4>
                  <p>Total Fixed Value HP: {draftHitPointTotals.totalFixedHp}</p>
                  <p>Total Average HP: {draftHitPointTotals.averageHp}</p>
                  <p>Total Possible HP: {draftHitPointTotals.possibleHp}</p>
                </div>
              </div>

              <div className="builder-hp-copy-section">
                <h4>Max Hit Points</h4>
                <p>
                  Your maximum HP is based on your hit die, character level, Constitution bonus,
                  and any additional modifier you add here.
                </p>
              </div>

              <div className="builder-hp-copy-section">
                <h4>Bonus Hit Points</h4>
                <p>
                  Use HP Modifier for any miscellaneous hit points you want to add on top of the
                  normal class and Constitution total.
                </p>
              </div>

              <div className="builder-hp-copy-section">
                <h4>Override Hit Points</h4>
                <p>
                  Use Override HP if you want the sheet to display a custom maximum instead of the
                  calculated total.
                </p>
              </div>
            </div>

            <footer className="builder-hp-modal-actions">
              <button
                type="button"
                className="builder-hp-modal-button builder-hp-modal-button-secondary"
                onClick={closeHitPointPanel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="builder-hp-modal-button builder-hp-modal-button-primary"
                onClick={applyHitPointChanges}
              >
                Apply
              </button>
            </footer>
          </section>
        </div>,
        document.body,
      )
        : null}
    </>
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

function getChoiceGroupFields(
  choiceFields: ClassFeature["choiceFields"],
  field: NonNullable<ClassFeature["choiceFields"]>[number],
) {
  if (!choiceFields?.length || !field.choiceGroupId) {
    return [field];
  }

  return choiceFields.filter((choiceField) => choiceField.choiceGroupId === field.choiceGroupId);
}

function getChoiceGroupSelectedValues(
  featureId: string,
  groupFields: NonNullable<ClassFeature["choiceFields"]>,
  selectedChoices: Record<string, string>,
) {
  return [
    ...new Set(
      groupFields
        .map((field) => selectedChoices[`${featureId}:${field.id}`])
        .filter((value): value is string => Boolean(value)),
    ),
  ];
}

function isChoiceOptionSelectedElsewhere(
  optionValue: string,
  selectedValue: string,
  groupSelectedValues: string[],
) {
  return optionValue !== selectedValue && groupSelectedValues.includes(optionValue);
}

function getSelectedSubclassIndex(
  classOption: ClassOption,
  selectedChoices: FeatureChoiceSelections,
) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  for (const feature of classOption.features) {
    if (!feature.id.includes("subclass") || !feature.choiceFields?.length) {
      continue;
    }

    for (const field of feature.choiceFields) {
      const selectedValue = selectedChoices[`${feature.id}:${field.id}`];

      if (selectedValue && subclassIndexes.has(selectedValue)) {
        return selectedValue;
      }
    }
  }

  return null;
}

function getVisibleClassFeatures(
  feature: ClassFeature,
  subclasses: ClassSubclassOption[],
  selectedSubclassIndex: string | null,
) : ClassFeature[] {
  if (!selectedSubclassIndex || !feature.id.includes("subclass-feature")) {
    return [feature];
  }

  const selectedSubclass = subclasses.find((subclass) => subclass.index === selectedSubclassIndex);

  if (!selectedSubclass) {
    return [feature];
  }

  const subclassFeaturesAtLevel = selectedSubclass.features.filter(
    (subclassFeature) => subclassFeature.level === feature.level,
  );

  if (subclassFeaturesAtLevel.length > 0) {
    return subclassFeaturesAtLevel.map((subclassFeature) => ({
      id: `${feature.id}:${slugifyFeatureName(subclassFeature.name)}`,
      level: feature.level,
      title: subclassFeature.name,
      summary: subclassFeature.description,
    }));
  }

  const filteredDescriptions = [feature.summary, ...(feature.details ?? [])]
    .map((description) => stripSubclassPrefix(description, selectedSubclass.name))
    .filter((description): description is string => description !== null);

  if (filteredDescriptions.length === 0) {
    return [feature];
  }

  return [
    {
      ...feature,
      title: `${selectedSubclass.name} Feature`,
      summary: filteredDescriptions[0],
      details: filteredDescriptions.slice(1),
    },
  ];
}

function stripSubclassPrefix(value: string, subclassName: string) {
  const normalizedValue = value.trim();
  const subclassPrefix = `${subclassName}:`;

  if (normalizedValue.startsWith(subclassPrefix)) {
    return normalizedValue.slice(subclassPrefix.length).trim();
  }

  return normalizedValue.includes(":") ? null : normalizedValue;
}

function slugifyFeatureName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function compareVisibleFeatures(left: ClassFeature, right: ClassFeature) {
  if (left.level !== right.level) {
    return left.level - right.level;
  }

  const leftPriority = visibleFeaturePriority(left);
  const rightPriority = visibleFeaturePriority(right);

  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return left.title.localeCompare(right.title);
}

function visibleFeaturePriority(feature: ClassFeature) {
  if (feature.choiceFields?.length && feature.id.includes("subclass")) {
    return 0;
  }

  if (feature.id.includes("subclass-feature")) {
    return 1;
  }

  return 2;
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

function formatSignedNumber(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function buildDraftHitPointPreview({
  bonusHp,
  constitutionScore,
  hitDie,
  level,
  mode,
  overrideMaxHp,
  rolledHitPoints,
}: {
  bonusHp: string;
  constitutionScore: number;
  hitDie: number;
  level: number;
  mode: "fixed" | "rolled" | "override";
  overrideMaxHp: string;
  rolledHitPoints: number[];
}) {
  const parsedBonusHp = Number.parseInt(bonusHp, 10);
  const parsedOverrideMaxHp = Number.parseInt(overrideMaxHp, 10);
  const normalizedOverrideMaxHp =
    overrideMaxHp.trim().length === 0 || !Number.isFinite(parsedOverrideMaxHp)
      ? null
      : Math.max(1, parsedOverrideMaxHp);

  return buildHitPointPreviewLikeModel({
    constitutionScore,
    hitDie,
    level,
    settings: {
      bonusHp: Number.isFinite(parsedBonusHp) ? parsedBonusHp : 0,
      calculationMode: normalizedOverrideMaxHp === null ? mode : "override",
      overrideMaxHp: normalizedOverrideMaxHp,
      rolledHitPoints,
    },
  });
}

function buildHitPointPreviewLikeModel({
  constitutionScore,
  hitDie,
  level,
  settings,
}: {
  constitutionScore: number;
  hitDie: number;
  level: number;
  settings: HitPointSettings;
}) {
  const normalizedLevel = Math.max(1, Math.floor(level));
  const normalizedHitDie = Math.max(1, Math.floor(hitDie));
  const constitutionModifier = Math.floor((constitutionScore - 10) / 2);
  const constitutionBonus = constitutionModifier * normalizedLevel;
  const fixedGainPerLevel = Math.floor(normalizedHitDie / 2) + 1;
  const fixedClassHp = normalizedHitDie + (normalizedLevel - 1) * fixedGainPerLevel;
  const rolledClassHp = settings.rolledHitPoints.reduce((total, dieValue) => total + dieValue, 0);
  const bonusHp = settings.bonusHp;
  const totalFixedHp = Math.max(1, fixedClassHp + constitutionBonus + bonusHp);
  const totalRolledHp = Math.max(1, rolledClassHp + constitutionBonus + bonusHp);
  const averageHp = Math.max(
    1,
    Math.floor(
      normalizedHitDie +
        (normalizedLevel - 1) * ((normalizedHitDie + 1) / 2) +
        constitutionBonus +
        bonusHp,
    ),
  );
  const possibleHp = Math.max(
    1,
    normalizedHitDie * normalizedLevel + constitutionBonus + bonusHp,
  );
  const maxHp =
    settings.calculationMode === "override" && settings.overrideMaxHp !== null
      ? settings.overrideMaxHp
      : settings.calculationMode === "rolled"
        ? totalRolledHp
        : totalFixedHp;

  return {
    averageHp,
    bonusHp,
    constitutionBonus,
    fixedClassHp,
    hitDie: normalizedHitDie,
    maxHp,
    possibleHp,
    rolledClassHp,
    rolledHitPoints: settings.rolledHitPoints,
    totalFixedHp,
    totalRolledHp,
  };
}

export { CharacterBuilderSidebar };
