import { type ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { AbilityScore } from "../../../types/character";
import type {
  AbilityAssignment,
  BackgroundOption,
  BuilderSelectionKind,
  ClassFeature,
  ClassOption,
  ClassSubclassOption,
  FeatureChoiceOption,
  FeatureChoiceSelections,
  HitPointSettings,
  SpeciesOption,
} from "../types/characterBuilder";
import {
  rollHitDie,
  synchronizeHitPointRolls,
} from "../utils/buildCharacterPreview";
import {
  getVisibleFeatureChoiceFields,
  pruneHiddenFeatureChoices,
} from "../utils/featureChoiceVisibility";
import type { HitPointPreview } from "../utils/buildCharacterPreview";

type CharacterBuilderSidebarProps = {
  abilityAssignments: AbilityAssignment[];
  abilityScores: AbilityScore[];
  background: BackgroundOption;
  characterLevel: number;
  classOption: ClassOption;
  hitPointPreview: HitPointPreview | null;
  onAbilityAssignmentChange: (slotId: string, nextAbilityIndex: string) => void;
  onApplyHitPointSettings: (nextSettings: HitPointSettings) => void;
  onFeatureChoicesChange: (
    updater: (currentChoices: FeatureChoiceSelections) => FeatureChoiceSelections,
  ) => void;
  onLevelChange: (nextLevel: number) => void;
  onOpenPanel: (kind: BuilderSelectionKind) => void;
  onRollAbility: (slotId: string) => void;
  onRollAllAbilities: () => void;
  onSubclassChange: (subclassIndex: string | null) => void;
  selectedChoices: FeatureChoiceSelections;
  selectedSubclassIndex: string | null;
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
  onLevelChange,
  onOpenPanel,
  onRollAbility,
  onRollAllAbilities,
  onSubclassChange,
  selectedChoices,
  selectedSubclassIndex: persistedSubclassIndex,
  species,
}: CharacterBuilderSidebarProps) {
  const [expandedFeatureIds, setExpandedFeatureIds] = useState<Record<string, boolean>>({});
  const [isHitPointPanelOpen, setIsHitPointPanelOpen] = useState(false);
  const [draftBonusHp, setDraftBonusHp] = useState("0");
  const [draftCalculationMode, setDraftCalculationMode] = useState<"fixed" | "rolled" | "override">("fixed");
  const [draftOverrideMaxHp, setDraftOverrideMaxHp] = useState("");
  const [draftRolledHitPoints, setDraftRolledHitPoints] = useState<number[]>([]);

  useEffect(() => {
    if (!hitPointPreview || !hitPointSettings || isHitPointPanelOpen) {
      return;
    }

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
            score: abilityScore.score,
          },
        ]),
      ),
    [abilityScores],
  );

  const selectedSubclassIndex = useMemo(
    () => getSelectedSubclassIndex(classOption, selectedChoices, persistedSubclassIndex, characterLevel),
    [characterLevel, classOption, persistedSubclassIndex, selectedChoices],
  );

  const visibleFeatures = useMemo(
    () =>
      classOption.features.flatMap((feature) =>
        getVisibleClassFeatures(feature, classOption.subclasses ?? [], selectedSubclassIndex),
      )
        .filter((feature) => !isCantripFeature(feature))
        .filter((feature) => feature.level <= characterLevel)
        .sort(compareVisibleFeatures),
    [characterLevel, classOption.features, classOption.subclasses, selectedSubclassIndex],
  );

  useEffect(() => {
    setExpandedFeatureIds((currentState) => {
      const visibleFeatureIds = new Set(visibleFeatures.map((feature) => feature.id));
      const nextStateEntries = Object.entries(currentState).filter(([featureId, isExpanded]) =>
        isExpanded && visibleFeatureIds.has(featureId)
      );

      if (nextStateEntries.length > 0) {
        return Object.fromEntries(nextStateEntries);
      }

      const firstFeatureId = visibleFeatures[0]?.id;

      return firstFeatureId ? { [firstFeatureId]: true } : {};
    });
  }, [visibleFeatures]);

  const selectedSkillProficiencyLabels = useMemo(
    () => getSelectedSkillProficiencyLabels(background, visibleFeatures, selectedChoices),
    [background, selectedChoices, visibleFeatures],
  );

  useEffect(() => {
    onFeatureChoicesChange((currentChoices) => {
      let changed = false;
      const nextChoices = { ...currentChoices };

      for (const feature of visibleFeatures) {
        for (const field of feature.choiceFields ?? []) {
          if (field.choiceKind !== "eldritch-invocation") {
            continue;
          }

          const choiceKey = `${feature.id}:${field.id}`;
          const selectedValue = currentChoices[choiceKey];

          if (!selectedValue) {
            continue;
          }

          const availableValues = new Set(
            getSelectableChoiceOptions(
              feature,
              field,
              visibleFeatures,
              currentChoices,
              selectedSkillProficiencyLabels,
            ).map((option) => option.value),
          );

          if (!availableValues.has(selectedValue)) {
            delete nextChoices[choiceKey];
            changed = true;
          }
        }
      }

      return changed ? nextChoices : currentChoices;
    });
  }, [onFeatureChoicesChange, selectedChoices, selectedSkillProficiencyLabels, visibleFeatures]);

  const featureCountLabel = useMemo(() => {
    const completedCount = visibleFeatures.filter((feature) =>
      isFeatureMarkedComplete(feature, selectedChoices),
    ).length;

    return `${completedCount} completed - levels 1-${characterLevel}`;
  }, [characterLevel, selectedChoices, visibleFeatures]);

  function toggleFeature(featureId: string) {
    setExpandedFeatureIds((currentState) => ({
      ...currentState,
      [featureId]: !currentState[featureId],
    }));
  }

  function updateChoice(
    featureId: string,
    fieldId: string,
    value: string,
    choiceFields: ClassFeature["choiceFields"] = [],
  ) {
    const field = choiceFields.find((choiceField) => choiceField.id === fieldId);

    if (field?.choiceKind === "subclass") {
      onSubclassChange(value || null);
    }

    onFeatureChoicesChange((currentChoices) => {
      const visibleChoiceFieldsBeforeUpdate = getVisibleChoiceFieldsForSelection(
        featureId,
        choiceFields,
        currentChoices,
      );
      const groupFields = field ? getChoiceGroupFields(visibleChoiceFieldsBeforeUpdate, field) : [];
      const allowDuplicateSelection = field?.choiceGroupId === "asi-score";
      const isDuplicateSelection = Boolean(
        !allowDuplicateSelection &&
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

      const nextChoices = {
        ...currentChoices,
        [`${featureId}:${fieldId}`]: value,
      };

      if (!value) {
        delete nextChoices[`${featureId}:${fieldId}`];
      }

      const prunedChoices = pruneHiddenFeatureChoices(featureId, choiceFields, nextChoices);
      const choiceKey = `${featureId}:${fieldId}`;
      const visibleChoiceFieldsAfterUpdate = getVisibleChoiceFieldsForSelection(
        featureId,
        choiceFields,
        nextChoices,
      );
      const groupFieldsAfterUpdate = field
        ? getChoiceGroupFields(visibleChoiceFieldsAfterUpdate, field)
        : [];
      const visibleGroupFieldIdsAfterUpdate = new Set(
        groupFieldsAfterUpdate.map((groupField) => groupField.id),
      );

      if (
        value &&
        field?.dependsOnFieldId &&
        nextChoices[choiceKey] &&
        !(choiceKey in prunedChoices)
      ) {
        prunedChoices[choiceKey] = nextChoices[choiceKey];
      }

      for (const groupField of groupFieldsAfterUpdate) {
        const groupChoiceKey = `${featureId}:${groupField.id}`;

        if (
          groupField.id !== fieldId &&
          visibleGroupFieldIdsAfterUpdate.has(groupField.id) &&
          currentChoices[groupChoiceKey] &&
          !(groupChoiceKey in prunedChoices)
        ) {
          prunedChoices[groupChoiceKey] = currentChoices[groupChoiceKey];
        }
      }

      return prunedChoices;
    });
  }

  function openHitPointPanel() {
    if (!hitPointPreview || !hitPointSettings) {
      return;
    }

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

    onApplyHitPointSettings({
      bonusHp: Number.isFinite(nextBonusHp) ? nextBonusHp : 0,
      calculationMode: overrideMaxHp === null ? draftCalculationMode : "override",
      overrideMaxHp,
      rolledHitPoints: synchronizeHitPointRolls(
        characterLevel,
        hitPointPreview?.hitDie ?? classOption.hitDie,
        draftRolledHitPoints,
      ),
    });

    closeHitPointPanel();
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
      normalized: synchronizeHitPointRolls(characterLevel, classOption.hitDie, draftRolledHitPoints),
    };
  }, [abilityAssignments, characterLevel, classOption.hitDie, draftRolledHitPoints, hitPointPreview]);

  const draftHitPointTotals = useMemo(() => {
    if (!draftHitPointPreview) {
      return null;
    }

    const preview = buildDraftHitPointPreview({
      bonusHp: draftBonusHp,
      constitutionScore: draftHitPointPreview.constitutionScore,
      hitDie: classOption.hitDie,
      level: characterLevel,
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
    draftOverrideMaxHp,
    characterLevel,
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
                <strong className="builder-ability-card-score">
                  {abilityOptionMap[assignment.abilityIndex]?.score ?? assignment.score}
                </strong>

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

        <div className="builder-sidebar-section">
          <label className="builder-feature-choice-field">
            <span>Character Level</span>
            <select
              className="builder-feature-select"
              value={String(characterLevel)}
              onChange={(event) => {
                const parsedLevel = Number.parseInt(event.target.value, 10);

                if (Number.isFinite(parsedLevel)) {
                  onLevelChange(parsedLevel);
                }
              }}
            >
              {Array.from({ length: 20 }, (_, index) => index + 1).map((levelOption) => (
                <option key={levelOption} value={levelOption}>
                  Level {levelOption}
                </option>
              ))}
            </select>
          </label>
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
            {visibleFeatures.map((feature) => {
              const isExpanded = Boolean(expandedFeatureIds[feature.id]);
              const isComplete = isFeatureMarkedComplete(feature, selectedChoices);

              return (
                <article
                  key={feature.id}
                  className={[
                    "builder-feature-item",
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
                      <span>{formatFeatureMeta(feature, selectedChoices)}</span>
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
                      {renderReadableFeatureText(
                        feature.summary,
                        "builder-feature-summary",
                        `${feature.id}-summary`,
                      )}

                      {feature.details?.map((detail) => (
                        renderReadableFeatureText(
                          detail,
                          "builder-feature-detail",
                          `${feature.id}-${detail}`,
                        )
                      ))}

                      {getVisibleChoiceFieldsForSelection(
                        feature.id,
                        feature.choiceFields,
                        selectedChoices,
                      ).length ? (
                        <div className="builder-feature-choice-list">
                          {getVisibleChoiceFieldsForSelection(
                            feature.id,
                            feature.choiceFields,
                            selectedChoices,
                          ).map((field) => {
                            const choiceKey = `${feature.id}:${field.id}`;
                            const selectedValue = selectedChoices[choiceKey] ?? "";
                            const visibleChoiceFields = getVisibleChoiceFieldsForSelection(
                              feature.id,
                              feature.choiceFields,
                              selectedChoices,
                            );
                            const selectableOptions = getSelectableChoiceOptions(
                              feature,
                              field,
                              visibleFeatures,
                              selectedChoices,
                              selectedSkillProficiencyLabels,
                            );
                            const selectedOption =
                              selectableOptions.find((option) => option.value === selectedValue) ??
                              null;
                            const groupFields = getChoiceGroupFields(visibleChoiceFields, field);
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
                                    <option value="">
                                      {`Choose ${field.label.toLowerCase()}`}
                                    </option>
                                    {selectableOptions.map((option) => (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                        disabled={
                                          field.choiceGroupId === "asi-score"
                                            ? false
                                            : isChoiceOptionSelectedElsewhere(
                                                option.value,
                                                selectedValue,
                                                groupSelectedValues,
                                              )
                                        }
                                      >
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                                {selectedOption && hasFeatureChoiceOptionDescription(selectedOption) ? (
                                  <div className="builder-feature-option-help-list">
                                    <div className="builder-feature-option-help builder-feature-option-help-selected">
                                      <strong>{selectedOption.label}</strong>
                                      {renderReadableFeatureText(
                                        selectedOption.description,
                                        "builder-feature-option-description",
                                        `${choiceKey}-${selectedOption.value}`,
                                      )}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {getFeatureChoiceSummaries(
                        feature.id,
                        feature.choiceFields,
                        selectedChoices,
                      ).length > 0 ? (
                        <div className="builder-feature-choice-list">
                          {getFeatureChoiceSummaries(
                            feature.id,
                            feature.choiceFields,
                            selectedChoices,
                          ).map((summary) => (
                            <p
                              key={summary.id}
                              className={
                                summary.status === "missing"
                                  ? "builder-feature-detail muted"
                                  : "builder-feature-detail"
                              }
                            >
                              <strong>{summary.label}:</strong> {summary.value}
                            </p>
                          ))}
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
                <div className="builder-hp-stat">
                  <span>Character Level</span>
                  <strong>{characterLevel}</strong>
                </div>

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
                    Pool: {characterLevel}d{draftHitPointTotals.hitDie}
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

function formatFeatureMeta(feature: ClassFeature, selectedChoices: Record<string, string>) {
  const choiceCount = getVisibleChoiceFieldsForSelection(
    feature.id,
    feature.choiceFields,
    selectedChoices,
  ).length;
  const parts: string[] = [];

  if (choiceCount > 0) {
    parts.push(`${choiceCount} ${choiceCount === 1 ? "Choice" : "Choices"}`);
  }

  parts.push(`${formatOrdinal(feature.level)} level`);

  return parts.join(" - ");
}

function isFeatureChoiceComplete(feature: ClassFeature, selectedChoices: Record<string, string>) {
  const visibleChoiceFields = getVisibleChoiceFieldsForSelection(
    feature.id,
    feature.choiceFields,
    selectedChoices,
  );

  if (!visibleChoiceFields.length) {
    return true;
  }

  return visibleChoiceFields.every((field) =>
    Boolean(selectedChoices[`${feature.id}:${field.id}`]),
  );
}

function featureRequiresSelection(feature: ClassFeature, selectedChoices: Record<string, string>) {
  return getVisibleChoiceFieldsForSelection(
    feature.id,
    feature.choiceFields,
    selectedChoices,
  ).length > 0;
}

function isFeatureMarkedComplete(
  feature: ClassFeature,
  selectedChoices: Record<string, string>,
) {
  if (featureRequiresSelection(feature, selectedChoices)) {
    return isFeatureChoiceComplete(feature, selectedChoices);
  }

  return true;
}

function getVisibleChoiceFieldsForSelection(
  featureId: string,
  choiceFields: ClassFeature["choiceFields"],
  selectedChoices: Record<string, string>,
) {
  return getVisibleFeatureChoiceFields(featureId, choiceFields, selectedChoices).filter(
    (field) => !isCantripChoiceField(field),
  );
}

function getFeatureChoiceSummaries(
  featureId: string,
  choiceFields: ClassFeature["choiceFields"],
  selectedChoices: Record<string, string>,
) {
  return getVisibleChoiceFieldsForSelection(featureId, choiceFields, selectedChoices)
    .filter((field) => isSummaryChoiceField(field))
    .map((field) => {
      const selectedValue = selectedChoices[`${featureId}:${field.id}`];
      const selectedOption = field.options.find((option) => option.value === selectedValue);

      return {
        id: `${featureId}:${field.id}`,
        label: field.choiceLabel ?? field.choiceGroupLabel ?? field.label,
        status: selectedOption ? "selected" as const : "missing" as const,
        value: selectedOption?.label ?? "Required choice missing",
      };
    });
}

function getSelectableChoiceOptions(
  feature: ClassFeature,
  field: NonNullable<ClassFeature["choiceFields"]>[number],
  visibleFeatures: ClassFeature[],
  selectedChoices: Record<string, string>,
  selectedSkillProficiencyLabels: Set<string>,
) {
  const choiceKey = `${feature.id}:${field.id}`;
  const containsSpellOptions = field.options.some((option) =>
    option.selectedOptionUrl?.includes("/spells/"),
  );

  if (field.choiceKind === "expertise") {
    const selectedExpertiseLabels = getSelectedExpertiseLabels(
      visibleFeatures,
      selectedChoices,
      choiceKey,
    );

    return field.options.filter((option) => {
      const normalizedLabel = normalizeSkillLabel(option.label);

      return (
        selectedSkillProficiencyLabels.has(normalizedLabel) &&
        !selectedExpertiseLabels.has(normalizedLabel)
      );
    });
  }

  if (field.choiceKind === "eldritch-invocation") {
    const selectedPactBoonIndex = getSelectedPactBoonIndex(visibleFeatures, selectedChoices);
    const selectedSpellIndexes = getSelectedSpellIndexes(
      visibleFeatures,
      selectedChoices,
      choiceKey,
    );

    return field.options.filter((option) =>
      invocationOptionMeetsRequirements(
        option,
        feature.level,
        selectedPactBoonIndex,
        selectedSpellIndexes,
      ),
    );
  }

  if (!containsSpellOptions) {
    return field.options;
  }

  const selectedSpellIndexes = getSelectedSpellIndexes(
    visibleFeatures,
    selectedChoices,
    choiceKey,
  );

  return field.options.filter((option) => {
    const spellIndex = getSpellIndexFromOption(option);

    return !spellIndex || !selectedSpellIndexes.has(spellIndex);
  });
}

function getSelectedSkillProficiencyLabels(
  background: BackgroundOption,
  visibleFeatures: ClassFeature[],
  selectedChoices: Record<string, string>,
) {
  const labels = new Set(
    background.skillProficiencies.map((skillName) => normalizeSkillLabel(skillName)),
  );

  for (const feature of visibleFeatures) {
    for (const field of getVisibleChoiceFieldsForSelection(
      feature.id,
      feature.choiceFields,
      selectedChoices,
    )) {
      if (field.choiceKind !== "skill-proficiency") {
        continue;
      }

      const selectedValue = selectedChoices[`${feature.id}:${field.id}`];
      const selectedOption = field.options.find((option) => option.value === selectedValue);

      if (selectedOption) {
        labels.add(normalizeSkillLabel(selectedOption.label));
      }
    }
  }

  return labels;
}

function getSelectedExpertiseLabels(
  visibleFeatures: ClassFeature[],
  selectedChoices: Record<string, string>,
  currentChoiceKey: string,
) {
  const labels = new Set<string>();

  for (const feature of visibleFeatures) {
    for (const field of getVisibleChoiceFieldsForSelection(
      feature.id,
      feature.choiceFields,
      selectedChoices,
    )) {
      if (field.choiceKind !== "expertise") {
        continue;
      }

      const choiceKey = `${feature.id}:${field.id}`;

      if (choiceKey === currentChoiceKey) {
        continue;
      }

      const selectedValue = selectedChoices[choiceKey];
      const selectedOption = field.options.find((option) => option.value === selectedValue);

      if (selectedOption) {
        labels.add(normalizeSkillLabel(selectedOption.label));
      }
    }
  }

  return labels;
}

function normalizeSkillLabel(value: string) {
  return value.replace(/^Skill:\s*/i, "").trim().toLowerCase();
}

function isCantripFeature(feature: ClassFeature) {
  const featureIdentity = `${feature.id} ${feature.title}`.toLowerCase();

  if (featureIdentity.includes("cantrip")) {
    return true;
  }

  const choiceFields = feature.choiceFields ?? [];

  return (
    choiceFields.length > 0 &&
    choiceFields.every((field) =>
      `${field.id} ${field.label} ${field.choiceKind ?? ""}`.toLowerCase().includes("cantrip"),
    )
  );
}

function isCantripChoiceField(field: NonNullable<ClassFeature["choiceFields"]>[number]) {
  if (field.id.startsWith("feat-magic-initiate-")) {
    return false;
  }

  return `${field.id} ${field.label} ${field.choiceKind ?? ""}`.toLowerCase().includes("cantrip");
}

function getSelectedPactBoonIndex(
  visibleFeatures: ClassFeature[],
  selectedChoices: Record<string, string>,
) {
  const pactBoonFeature = visibleFeatures.find((feature) => feature.id === "pact-boon");

  if (!pactBoonFeature) {
    return null;
  }

  const pactBoonField = getVisibleChoiceFieldsForSelection(
    pactBoonFeature.id,
    pactBoonFeature.choiceFields,
    selectedChoices,
  )[0];

  if (!pactBoonField) {
    return null;
  }

  return selectedChoices[`${pactBoonFeature.id}:${pactBoonField.id}`] ?? null;
}

function hasFeatureChoiceOptionDescription(option: FeatureChoiceOption) {
  return typeof option.description === "string" && option.description.trim().length > 0;
}

function invocationOptionMeetsRequirements(
  option: FeatureChoiceOption,
  featureLevel: number,
  selectedPactBoonIndex: string | null,
  selectedSpellIndexes: Set<string>,
) {
  const prerequisites = getInvocationPrerequisites(option.selectedRawJson);

  if (!prerequisites) {
    return true;
  }

  if (
    typeof prerequisites.minimumLevel === "number" &&
    featureLevel < prerequisites.minimumLevel
  ) {
    return false;
  }

  if (
    typeof prerequisites.requiredPactBoonIndex === "string" &&
    prerequisites.requiredPactBoonIndex.length > 0 &&
    selectedPactBoonIndex !== prerequisites.requiredPactBoonIndex
  ) {
    return false;
  }

  if (
    typeof prerequisites.requiredSpellIndex === "string" &&
    prerequisites.requiredSpellIndex.length > 0 &&
    !selectedSpellIndexes.has(prerequisites.requiredSpellIndex)
  ) {
    return false;
  }

  return true;
}

function getSelectedSpellIndexes(
  visibleFeatures: ClassFeature[],
  selectedChoices: Record<string, string>,
  excludedChoiceKey?: string,
) {
  const spellIndexes = new Set<string>();

  for (const feature of visibleFeatures) {
    for (const field of getVisibleChoiceFieldsForSelection(
      feature.id,
      feature.choiceFields,
      selectedChoices,
    )) {
      const choiceKey = `${feature.id}:${field.id}`;

      if (excludedChoiceKey && choiceKey === excludedChoiceKey) {
        continue;
      }

      const selectedValue = selectedChoices[`${feature.id}:${field.id}`];

      if (!selectedValue) {
        continue;
      }

      const selectedOption = field.options.find((option) => option.value === selectedValue);

      if (!selectedOption) {
        continue;
      }

      const spellIndex = getSpellIndexFromOption(selectedOption);

      if (spellIndex) {
        spellIndexes.add(spellIndex);
      }
    }
  }

  return spellIndexes;
}

function getSpellIndexFromOption(option: FeatureChoiceOption) {
  const selectedIndex = option.selectedOptionIndex?.trim().toLowerCase();
  const selectedUrl = option.selectedOptionUrl?.trim().toLowerCase();

  if (selectedIndex && selectedUrl?.includes("/spells/")) {
    return selectedIndex;
  }

  const spellMatch = selectedUrl?.match(/\/spells\/([^/?#]+)$/);

  return spellMatch?.[1] ?? null;
}

function getInvocationPrerequisites(selectedRawJson: unknown) {
  if (!selectedRawJson || typeof selectedRawJson !== "object" || Array.isArray(selectedRawJson)) {
    return null;
  }

  const prerequisites =
    "prerequisites" in selectedRawJson
      ? (selectedRawJson as { prerequisites?: unknown }).prerequisites
      : null;

  if (!prerequisites || typeof prerequisites !== "object" || Array.isArray(prerequisites)) {
    return null;
  }

  return prerequisites as {
    minimumLevel?: number;
    requiredPactBoonIndex?: string | null;
    requiredSpellIndex?: string | null;
  };
}

function isSummaryChoiceField(field: NonNullable<ClassFeature["choiceFields"]>[number]) {
  const containsSpellOptions = field.options.some((option) =>
    option.selectedOptionUrl?.includes("/spells/"),
  );

  return (
    field.choiceKind === "subclass" ||
    field.choiceKind === "skill-proficiency" ||
    field.choiceKind === "tool-proficiency" ||
    field.choiceKind === "armor-proficiency" ||
    field.choiceKind === "weapon-proficiency" ||
    field.choiceKind === "asi-feat" ||
    field.choiceKind === "epic-boon" ||
    field.choiceKind === "expertise" ||
    field.choiceKind === "scholar" ||
    field.choiceKind === "elemental-fury" ||
    field.choiceKind === "fighting-style" ||
    field.choiceKind === "metamagic" ||
    field.choiceKind === "pact-boon" ||
    field.choiceKind === "eldritch-invocation" ||
    field.choiceKind === "mystic-arcanum" ||
    field.choiceKind === "weapon-mastery" ||
    containsSpellOptions
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

function renderReadableFeatureText(
  text: string | null | undefined,
  className: string,
  keyPrefix: string,
): ReactNode[] {
  if (!text?.trim()) {
    return [];
  }

  return createReadableFeatureParagraphs(text).map((paragraph, index) => (
    <p key={`${keyPrefix}-${index}`} className={className}>
      {renderFeatureParagraphContent(paragraph)}
    </p>
  ));
}

function createReadableFeatureParagraphs(text: string) {
  const normalizedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
  const explicitParagraphs = normalizedText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return explicitParagraphs.flatMap((paragraph) =>
    paragraph.length > 260 ? splitLongFeatureParagraph(paragraph) : [paragraph],
  );
}

function splitLongFeatureParagraph(paragraph: string) {
  const sentences = paragraph.match(/[^.!?]+[.!?](?:\s+|$)|[^.!?]+$/g) ?? [paragraph];
  const paragraphs: string[] = [];
  let currentParagraph = "";

  for (const sentence of sentences.map((value) => value.trim()).filter(Boolean)) {
    const headingMatch = sentence.match(/^([^.!?]{3,46})[.!?]\s+/);
    const shouldStartNewParagraph =
      currentParagraph.length > 0 && headingMatch && isFeatureHeadingText(headingMatch[1]);

    if (shouldStartNewParagraph) {
      paragraphs.push(currentParagraph.trim());
      currentParagraph = sentence;
      continue;
    }

    currentParagraph = currentParagraph ? `${currentParagraph} ${sentence}` : sentence;
  }

  if (currentParagraph.trim()) {
    paragraphs.push(currentParagraph.trim());
  }

  return paragraphs.length > 0 ? paragraphs : [paragraph];
}

function renderFeatureParagraphContent(paragraph: string): ReactNode {
  const headingMatch = paragraph.match(/^([^.!?]{3,46})([.!?])\s+(.+)$/);

  if (!headingMatch || !isFeatureHeadingText(headingMatch[1])) {
    return paragraph;
  }

  return (
    <>
      <strong className="builder-feature-text-heading">
        {headingMatch[1]}
        {headingMatch[2]}
      </strong>{" "}
      {headingMatch[3]}
    </>
  );
}

function isFeatureHeadingText(value: string) {
  const normalizedValue = value.trim();
  const lowerValue = normalizedValue.toLowerCase();
  const sentenceStarters = new Set([
    "as",
    "at",
    "each",
    "for",
    "if",
    "immediately",
    "in",
    "once",
    "the",
    "this",
    "when",
    "whenever",
    "while",
    "you",
    "your",
  ]);
  const firstWord = lowerValue.split(/\s+/)[0] ?? "";

  if (sentenceStarters.has(firstWord)) {
    return false;
  }

  return /^[A-Z0-9][A-Za-z0-9'’/\-\s]+$/.test(normalizedValue);
}

function getSelectedSubclassIndex(
  classOption: ClassOption,
  selectedChoices: FeatureChoiceSelections,
  persistedSubclassIndex: string | null,
  characterLevel: number,
) {
  const subclassIndexes = new Set((classOption.subclasses ?? []).map((subclass) => subclass.index));

  if (
    persistedSubclassIndex &&
    subclassIndexes.has(persistedSubclassIndex) &&
    classOption.features.every(
      (feature) =>
        feature.level <= characterLevel ||
        !(feature.choiceFields ?? []).some(
          (field) =>
            field.choiceKind === "subclass" &&
            field.options.some(
              (option) =>
                option.value === persistedSubclassIndex ||
                option.selectedOptionIndex === persistedSubclassIndex,
            ),
        ),
    )
  ) {
    return persistedSubclassIndex;
  }

  for (const feature of classOption.features) {
    if (feature.level > characterLevel || !feature.choiceFields?.length) {
      continue;
    }

    for (const field of feature.choiceFields) {
      if (field.choiceKind !== "subclass" && !feature.id.includes("subclass")) {
        continue;
      }

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
  if (feature.subclassIndex) {
    return feature.subclassIndex === selectedSubclassIndex ? [feature] : [];
  }

  if (!feature.id.includes("subclass-feature")) {
    return [feature];
  }

  if (!selectedSubclassIndex) {
    return [];
  }

  const selectedSubclass = subclasses.find((subclass) => subclass.index === selectedSubclassIndex);

  if (!selectedSubclass) {
    return [];
  }

  const subclassFeaturesAtLevel = selectedSubclass.features.filter(
    (subclassFeature) => subclassFeature.level === feature.level,
  );

  if (subclassFeaturesAtLevel.length > 0) {
    return subclassFeaturesAtLevel.map((subclassFeature) => ({
      choiceFields: subclassFeature.choiceFields,
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
    return [];
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
  if (feature.choiceFields?.some((field) => field.choiceKind === "subclass")) {
    return 0;
  }

  if (feature.subclassIndex || feature.id.includes("subclass-feature")) {
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
