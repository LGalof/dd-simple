import { useMemo, useState } from "react";
import { Card } from "../../../components/ui/Card";
import {
  InventoryWorkbench,
  type InventorySandboxController,
} from "../../../pages/InventorySandboxPage";
import type {
  ActionActivationType,
  CharacterActionEntry,
} from "../../../types/characterAction";
import type { Character } from "../../../types/character";
import type { SpeciesHeritageOption } from "../types/characterBuilder";
import { abilityModifier, formatModifier } from "../utils/characterFormat";

type CharacterSheetProps = {
  activeTab: WorkspaceTab;
  character: Character;
  conditionSummary: Array<{ label: string; value: string }>;
  currentHp: number;
  defenseSummary: Array<{ label: string; value: string }>;
  inventoryController: InventorySandboxController;
  normalizedActions: CharacterActionEntry[];
  normalizedActionsError: string | null;
  normalizedActionsLoading: boolean;
  onActiveTabChange: (tab: WorkspaceTab) => void;
  onOpenConditions: () => void;
  selectedHeritage?: SpeciesHeritageOption | null;
  tempHp: number;
  onApplyCurrentHpAdjustment: (mode: "heal" | "damage", amount: number) => void;
  onSetTempHp: (amount: number) => void;
};

type AbilityIndex = "str" | "dex" | "con" | "int" | "wis" | "cha";
type WorkspaceTab =
  | "actions"
  | "spells"
  | "inventory"
  | "features"
  | "background"
  | "notes"
  | "extras";

type SkillWithTotal = {
  ability: string;
  hasExpertise: boolean;
  isProficient: boolean;
  name: string;
  proficiencyMultiplier: number;
  total: number;
};

type ActionFilter = "all" | ActionActivationType;

type ActionDisplayRow = {
  activationType: ActionActivationType;
  damage: string;
  displayMode: "detail" | "table";
  hit: string;
  id: string;
  notes: string;
  range: string;
  subtitle: string;
  title: string;
};

type ReferenceItem = {
  index?: unknown;
  name?: unknown;
  url?: unknown;
};

type FeatureChoiceEffectSummary = {
  armorNames: string[];
  expertiseSkillIndexes: Set<string>;
  expertiseToolNames: string[];
  languageNames: string[];
  skillProficiencyIndexes: Set<string>;
  toolNames: string[];
  weaponNames: string[];
};

type ProficiencySourceJson = {
  proficiencies?: ReferenceItem[];
  proficiency_choices?: Array<{
    desc?: unknown;
  }>;
};

type LanguageSourceJson = {
  languages?: ReferenceItem[];
  language_options?: {
    desc?: unknown;
  };
};

type TrainingReferenceCharacter = Character & {
  background: Character["background"] & {
    proficiencyGrants?: Array<{
      grantType: string;
      proficiencyIndex: string;
      sourceLabel?: string | null;
      proficiency?: {
        name: string;
      } | null;
    }>;
    sourceJson?: unknown;
    toolProficiencies?: string[];
  };
  class: Character["class"] & {
    proficiencies?: {
      armor: string[];
      tools: string[];
      weapons: string[];
    };
    sourceJson?: unknown;
  };
  species: Character["species"] & {
    sourceJson?: unknown;
  };
};

type LiveInventoryItem = InventorySandboxController["items"][number];

const abilityOrder: AbilityIndex[] = ["str", "dex", "con", "int", "wis", "cha"];
const skillOrder = [
  "Acrobatics",
  "Animal Handling",
  "Arcana",
  "Athletics",
  "Deception",
  "History",
  "Insight",
  "Intimidation",
  "Investigation",
  "Medicine",
  "Nature",
  "Perception",
  "Performance",
  "Persuasion",
  "Religion",
  "Sleight of Hand",
  "Stealth",
  "Survival",
];
const unavailableTrainingValue = "Not available from current reference data";

function CharacterSheet({
  activeTab,
  character,
  conditionSummary,
  currentHp,
  defenseSummary,
  inventoryController,
  normalizedActions,
  normalizedActionsError,
  normalizedActionsLoading,
  onActiveTabChange,
  onOpenConditions,
  selectedHeritage,
  tempHp,
  onApplyCurrentHpAdjustment,
  onSetTempHp,
}: CharacterSheetProps) {
  const [isCurrentHpModalOpen, setIsCurrentHpModalOpen] = useState(false);
  const [isTempHpModalOpen, setIsTempHpModalOpen] = useState(false);
  const [activeActionFilter, setActiveActionFilter] = useState<ActionFilter>("all");
  const [hitPointAmountInput, setHitPointAmountInput] = useState("");
  const [tempHpInput, setTempHpInput] = useState("");
  const equippedItems = character.inventory.filter((item) => item.equipped);
  const liveEquippedInventoryItems = useMemo(
    () => inventoryController.items.filter((item) => item.location === "equipped"),
    [inventoryController.items],
  );
  const sortedAbilityScores = useMemo(
    () =>
      [...character.abilityScores].sort(
        (left, right) =>
          abilityOrder.indexOf(left.abilityIndex as AbilityIndex) -
          abilityOrder.indexOf(right.abilityIndex as AbilityIndex),
      ),
    [character.abilityScores],
  );
  const abilityScoreMap = useMemo(
    () =>
      new Map(
        sortedAbilityScores.map((abilityScore) => [abilityScore.abilityIndex, abilityScore]),
      ),
    [sortedAbilityScores],
  );
  const dexterityScore = abilityScoreMap.get("dex")?.score ?? 10;
  const strengthScore = abilityScoreMap.get("str")?.score ?? 10;
  const constitutionScore = abilityScoreMap.get("con")?.score ?? 10;
  const wisdomScore = abilityScoreMap.get("wis")?.score ?? 10;
  const dexterityModifier = abilityModifier(dexterityScore);
  const strengthModifier = abilityModifier(strengthScore);
  const constitutionModifier = abilityModifier(constitutionScore);
  const wisdomModifier = abilityModifier(wisdomScore);
  const proficiencyBonus =
    character.level <= 4
      ? 2
      : character.level <= 8
        ? 3
        : character.level <= 12
          ? 4
          : character.level <= 16
            ? 5
            : 6;
  const featureChoiceEffects = useMemo(
    () => getFeatureChoiceEffects(character),
    [character.featureChoices, character.level],
  );
  const skillTotals = useMemo(
    () =>
      character.skills
        .map((characterSkill) => {
          const abilityScore = abilityScoreMap.get(characterSkill.skill.ability.index);
          const baseModifier = abilityScore ? abilityModifier(abilityScore.score) : 0;
          const skillIndex = canonicalSkillIndex(characterSkill.skillIndex);
          const isProficient =
            characterSkill.isProficient ||
            featureChoiceEffects.skillProficiencyIndexes.has(skillIndex);
          const hasExpertise =
            isProficient && featureChoiceEffects.expertiseSkillIndexes.has(skillIndex);
          const proficiencyMultiplier = hasExpertise ? 2 : isProficient ? 1 : 0;
          const proficiencyModifier = proficiencyBonus * proficiencyMultiplier;

          return {
            ability: characterSkill.skill.ability.index.toUpperCase(),
            hasExpertise,
            isProficient,
            name: characterSkill.skill.name,
            proficiencyMultiplier,
            total: baseModifier + proficiencyModifier + characterSkill.customBonus,
          };
        })
        .sort(compareSkills),
    [abilityScoreMap, character.skills, featureChoiceEffects, proficiencyBonus],
  );
  const sizeLabel = useMemo(() => getCreatureSize(character.species.name), [character.species.name]);
  const saveProficiencies = getSavingThrowProficiencies(character.class.name);
  const savingThrows = sortedAbilityScores.map((abilityScore) => {
    const modifier = abilityModifier(abilityScore.score);
    const hasSaveProficiency = saveProficiencies.includes(abilityScore.abilityIndex as AbilityIndex);

    return {
      shortLabel: abilityScore.ability.name,
      total: modifier + (hasSaveProficiency ? proficiencyBonus : 0),
    };
  });
  const passiveStats = [
    { label: "Passive Perception", value: 10 + getSkillTotal(skillTotals, "Perception") },
    { label: "Passive Investigation", value: 10 + getSkillTotal(skillTotals, "Investigation") },
    { label: "Passive Insight", value: 10 + getSkillTotal(skillTotals, "Insight") },
  ];
  const training = getTrainingProfile(character, featureChoiceEffects);
  const weaponActions = getWeaponActions(
    liveEquippedInventoryItems,
    equippedItems,
    dexterityModifier,
    strengthModifier,
    proficiencyBonus,
    training.weapons,
  );
  const actionFilterOptions: Array<{ id: ActionFilter; label: string }> = [
    { id: "all", label: "All" },
    { id: "action", label: "Action" },
    { id: "bonus_action", label: "Bonus Action" },
    { id: "reaction", label: "Reaction" },
    { id: "other", label: "Other" },
  ];
  const actionRows = useMemo<ActionDisplayRow[]>(
    () => [
      ...weaponActions.map((action, index) => ({
        activationType: "attack" as const,
        damage: action.damage,
        displayMode: "table" as const,
        hit: action.hit,
        id: `weapon-${index}-${action.name.toLowerCase().replace(/\s+/g, "-")}`,
        notes: action.notes,
        range: action.range,
        subtitle: action.type,
        title: action.name,
      })),
      ...normalizedActions.map((action) => ({
        activationType: action.activationType,
        damage: "--",
        displayMode: "detail" as const,
        hit: "--",
        id: action.id,
        notes: action.description,
        range: "--",
        subtitle: getReadableActionSubtitle(action),
        title: action.title,
      })),
    ],
    [normalizedActions, weaponActions],
  );
  const filteredActionRows = useMemo(
    () =>
      actionRows.filter((action) => {
        if (activeActionFilter === "all") {
          return true;
        }

        if (activeActionFilter === "action") {
          return action.activationType === "action" || action.activationType === "attack";
        }

        return action.activationType === activeActionFilter;
      }),
    [actionRows, activeActionFilter],
  );
  const attackActionRows = useMemo(
    () => filteredActionRows.filter((action) => action.displayMode === "table"),
    [filteredActionRows],
  );
  const detailActionRows = useMemo(
    () => filteredActionRows.filter((action) => action.displayMode === "detail"),
    [filteredActionRows],
  );
  const shouldShowActionsInCombat =
    (activeActionFilter === "all" ||
      activeActionFilter === "attack" ||
      activeActionFilter === "action") &&
    attackActionRows.length > 0;
  const hasVisibleActionContent = attackActionRows.length > 0 || detailActionRows.length > 0;
  const featureHighlights = getFeatureHighlights(
    character.class.name,
    character.background.name,
    character.species.name,
    character.level,
  );
  const savedFeatureChoices = character.featureChoices ?? [];
  const heritageSenseDetails = getHeritageSenseDetails(selectedHeritage);
  const workspaceTabs: Array<{ id: WorkspaceTab; label: string }> = [
    { id: "actions", label: "Actions" },
    { id: "spells", label: "Spells" },
    { id: "inventory", label: "Inventory" },
    { id: "features", label: "Features & Traits" },
    { id: "background", label: "Background" },
    { id: "notes", label: "Notes" },
    { id: "extras", label: "Extras" },
  ];

  function openCurrentHpModal() {
    setHitPointAmountInput("");
    setIsCurrentHpModalOpen(true);
  }

  function closeCurrentHpModal() {
    setIsCurrentHpModalOpen(false);
    setHitPointAmountInput("");
  }

  function applyCurrentHpChange(mode: "heal" | "damage") {
    const amount = Number.parseInt(hitPointAmountInput, 10);

    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }

    onApplyCurrentHpAdjustment(mode, amount);
    closeCurrentHpModal();
  }

  function openTempHpModal() {
    setTempHpInput(tempHp > 0 ? String(tempHp) : "");
    setIsTempHpModalOpen(true);
  }

  function closeTempHpModal() {
    setIsTempHpModalOpen(false);
    setTempHpInput("");
  }

  function applyTempHpChange() {
    const amount = Number.parseInt(tempHpInput, 10);

    onSetTempHp(Number.isFinite(amount) && amount > 0 ? amount : 0);
    closeTempHpModal();
  }

  return (
    <div className="character-sheet character-sheet-reference">
      <section className="character-dashboard-toolbar">
        <div className="character-dashboard-summary-row">
          <div className="character-dashboard-summary-chip character-dashboard-summary-chip-name">
            <span>Character Name</span>
            <strong>{character.name}</strong>
          </div>
        </div>

        <div className="character-dashboard-toolbar-actions">
          <button type="button" className="character-hit-points-action">
            Rest
          </button>
          <button
            type="button"
            className="character-hit-points-action"
            onClick={onOpenConditions}
          >
            Add Condition
          </button>
          <button
            type="button"
            className="character-hit-points-action character-hit-points-action-muted"
          >
            Add Custom Buff
          </button>
        </div>
      </section>

      <section className="character-dashboard-top-grid">
        <div className="character-primary-stats">
          <div className="character-primary-ability-grid">
            {sortedAbilityScores.map((abilityScore) => (
              <div key={abilityScore.abilityIndex} className="character-primary-stat-card">
                <span>{abilityScore.ability.fullName ?? abilityScore.ability.name}</span>
                <strong>{formatModifier(abilityModifier(abilityScore.score))}</strong>
                <em>{abilityScore.score}</em>
              </div>
            ))}
          </div>

          <div className="character-primary-utility-grid">
            <div className="character-primary-metric-card">
              <span>Proficiency</span>
              <strong>{formatModifier(proficiencyBonus)}</strong>
              <em>Bonus</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Walking</span>
              <strong>{character.speed} ft</strong>
              <em>Speed</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Initiative</span>
              <strong>{formatModifier(dexterityModifier)}</strong>
              <em>Modifier</em>
            </div>

            <div className="character-primary-metric-card">
              <span>Armor</span>
              <strong>{character.armorClass}</strong>
              <em>Class</em>
            </div>
          </div>
        </div>

        <div className="character-hit-points-panel">
          <div className="character-hit-points-actions">
            <button
              type="button"
              className="character-hit-points-action"
              onClick={openCurrentHpModal}
            >
              Heal
            </button>
            <button
              type="button"
              className="character-hit-points-action"
              onClick={openCurrentHpModal}
            >
              Damage
            </button>
          </div>

          <div className="character-hit-points-metrics">
            <div className="character-hit-points-stat">
              <span>Current</span>
              <strong>{currentHp}</strong>
            </div>
            <div className="character-hit-points-separator">/</div>
            <div className="character-hit-points-stat">
              <span>Max</span>
              <strong>{character.maxHp}</strong>
            </div>
            <button
              type="button"
              className="character-hit-points-stat character-hit-points-stat-muted character-hit-points-stat-button"
              onClick={openTempHpModal}
            >
              <span>Temp</span>
              <strong>{tempHp > 0 ? tempHp : "--"}</strong>
            </button>
          </div>

          <div className="character-hit-points-footer">Hit Points</div>
        </div>
      </section>

      <section className="character-dashboard-main-grid">
        <div className="character-dashboard-reference-columns">
          <aside className="character-dashboard-left-stack">
            <section className="character-reference-card">
              <div className="character-reference-card-header">
                <h3>Saving Throws</h3>
              </div>

              <div className="character-saving-throw-grid">
                {savingThrows.map((savingThrow) => (
                  <div key={savingThrow.shortLabel} className="character-save-pill">
                    <span>{savingThrow.shortLabel}</span>
                    <strong>{formatModifier(savingThrow.total)}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="character-reference-card">
              <div className="character-reference-card-header">
                <h3>Senses</h3>
              </div>

              <div className="character-passive-list">
                {passiveStats.map((stat) => (
                  <div key={stat.label} className="character-passive-row">
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                ))}
              </div>

              <p className="character-reference-note">
                {[training.senses, ...heritageSenseDetails].join(" - ")}
              </p>
            </section>

          <section className="character-reference-card character-reference-card-training">
            <div className="character-reference-card-header">
              <h3>Proficiencies &amp; Training</h3>
            </div>

              <div className="character-training-stack">
                <TrainingBlock label="Armor" values={training.armor} />
                <TrainingBlock label="Weapons" values={training.weapons} />
                <TrainingBlock label="Tools" values={training.tools} />
                <TrainingBlock label="Languages" values={training.languages} />
              </div>
            </section>
          </aside>

          <section className="character-skills-board">
            <div className="character-skills-board-header">
              <span>Prof</span>
              <span>Mod</span>
              <h3>Skill</h3>
              <span>Bonus</span>
            </div>

            <div className="character-skills-table">
              {skillTotals.map((skill) => (
                <div key={skill.name} className="character-skill-table-row">
                  <span
                    className={
                      skill.isProficient
                        ? "character-skill-marker character-skill-marker-active"
                        : "character-skill-marker"
                    }
                  />
                  <em>{skill.ability}</em>
                  <span className="character-skill-name">
                    {skill.name}
                    {skill.hasExpertise ? " (Expertise)" : ""}
                  </span>
                  <strong className="character-skill-bonus-pill">{formatModifier(skill.total)}</strong>
                </div>
              ))}
            </div>

            <div className="character-skills-board-footer">Additional Skills</div>
          </section>

          <div className="character-dashboard-support-grid">
            <div className="character-status-panel">
              <h3>Defenses</h3>
              <div className="character-status-list">
                {defenseSummary.length > 0 ? (
                  defenseSummary.map((entry) => (
                    <div key={entry.label} className="character-status-row">
                      <span>{entry.label}</span>
                      <strong>{entry.value}</strong>
                    </div>
                  ))
                ) : (
                  <p className="muted">No active defenses</p>
                )}
              </div>
            </div>

            <button
              type="button"
              className="character-status-panel character-status-panel-interactive"
              onClick={onOpenConditions}
            >
              <h3>Conditions</h3>
              {conditionSummary.length > 0 ? (
                <p className="character-status-summary">
                  {conditionSummary.map(formatConditionSummaryEntry).join(", ")}
                </p>
              ) : (
                <p className="muted">No active conditions</p>
              )}
            </button>
          </div>
        </div>

        <section className="character-main-workspace">
          <section className="character-workspace-panel character-workspace-panel-reference">
            <div className="character-tab-bar character-tab-bar-reference">
              {workspaceTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={
                    activeTab === tab.id
                      ? "character-tab-button character-tab-button-active"
                      : "character-tab-button"
                  }
                  onClick={() => onActiveTabChange(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="character-tab-panel character-tab-panel-reference">
              {activeTab === "actions" && (
                <div className="character-actions-stage character-tab-scroll-stage">
                  <div className="character-action-filter-bar">
                    {actionFilterOptions.map((filter) => (
                      <button
                        key={filter.id}
                        type="button"
                        className={
                          activeActionFilter === filter.id
                            ? "character-action-filter-pill character-action-filter-pill-active"
                            : "character-action-filter-pill"
                        }
                        onClick={() => setActiveActionFilter(filter.id)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>

                  <div className="character-actions-meta">
                    <span>Actions - Attacks per Action: 1</span>
                    <button type="button" className="character-inline-button">
                      Manage Custom
                    </button>
                  </div>

                  {attackActionRows.length > 0 ? (
                    <div className="character-actions-table">
                      <div className="character-actions-table-header">
                        <span>Attack</span>
                        <span>Range</span>
                        <span>Hit / DC</span>
                        <span>Damage</span>
                        <span>Notes</span>
                      </div>

                      {attackActionRows.map((action) => (
                        <div key={action.id} className="character-actions-table-row">
                          <div className="character-actions-cell character-actions-cell-main">
                            <strong>{action.title}</strong>
                            <em>{action.subtitle}</em>
                          </div>
                          <span>{action.range}</span>
                          <strong>{action.hit}</strong>
                          <strong>{action.damage}</strong>
                          <span>{action.notes}</span>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {normalizedActionsLoading ? (
                    <p className="muted">Loading normalized actions...</p>
                  ) : null}
                  {normalizedActionsError ? (
                    <p className="error-message">Actions unavailable: {normalizedActionsError}</p>
                  ) : null}

                  {!normalizedActionsLoading && !normalizedActionsError && !hasVisibleActionContent ? (
                    <p className="muted">
                      {activeActionFilter === "all"
                        ? "No action entries are currently available."
                        : `No ${formatActivationLabel(activeActionFilter).toLowerCase()} entries are currently available.`}
                    </p>
                  ) : null}

                  {shouldShowActionsInCombat ? (
                    <div className="character-actions-combat">
                      <strong>Actions in Combat</strong>
                      <p>
                        Attack, Dash, Disengage, Dodge, Grapple, Help, Hide, Improvise,
                        Influence, Magic, Ready, Search, Shove, Study, Utilize
                      </p>
                      <div className="character-actions-combat-entry">
                        <strong>Unarmed Strike</strong>
                        <p>
                          You make a melee attack that involves using your body to deal one of the
                          following effects:
                        </p>
                        <p>
                          <em>Damage.</em> You make an attack roll against the creature, and on a
                          hit, you deal 1 + STR Bludgeoning damage.
                        </p>
                        <p>
                          <em>Grapple.</em> The target must succeed on a Str./Dex. (it chooses
                          which) saving throw (DC = 8 + Prof. Bonus + Str.) or it has the
                          Grappled condition.
                        </p>
                        <p>
                          <em>Shove.</em> The target must succeed on a Str./Dex. (it chooses which)
                          saving throw (DC = 8 + Prof. Bonus + Str.) or you can either push it 5
                          ft. away or cause it to have the Prone condition.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {detailActionRows.length > 0 ? (
                    <div className="character-actions-detail-list">
                      {detailActionRows.map((action) => (
                        <article key={action.id} className="character-actions-detail-card">
                          <div className="character-actions-detail-card-header">
                            <div className="character-actions-cell character-actions-cell-main">
                              <strong>{action.title}</strong>
                              <em>{action.subtitle}</em>
                            </div>
                            <span className="character-actions-detail-tag">
                              {formatActivationLabel(action.activationType)}
                            </span>
                          </div>
                          <p>{action.notes}</p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {activeTab === "spells" && (
                <div className="character-tab-scroll-stage">
                  <Card title="Spells">
                    <p className="muted">
                      Spell management will live here later. This area is reserved for spell slots,
                      prepared spells, and casting references.
                    </p>
                  </Card>
                </div>
              )}

              {activeTab === "inventory" && (
                <InventoryWorkbench controller={inventoryController} embedded hideDetailsPanel />
              )}

              {activeTab === "features" && (
                <div className="character-tab-scroll-stage">
                  <div className="workspace-card-grid">
                    <Card title="Class Features">
                      <div className="list">
                        {featureHighlights.map((highlight) => (
                          <div key={highlight.title} className="character-feature-entry">
                            <strong>{highlight.title}</strong>
                            <p>{highlight.description}</p>
                          </div>
                        ))}
                      </div>
                    </Card>

                    {selectedHeritage ? (
                      <Card title="Selected Heritage">
                        <div className="list">
                          <div className="character-feature-entry">
                            <strong>{selectedHeritage.name}</strong>
                            {selectedHeritage.traits?.length ? (
                              selectedHeritage.traits.map((trait) => (
                                <p key={trait.index}>
                                  <span>{trait.name}</span>
                                  {trait.description ? ` - ${trait.description}` : ""}
                                </p>
                              ))
                            ) : selectedHeritage.damageType &&
                              selectedHeritage.damageType !== "Unknown" ? (
                              <p>{selectedHeritage.damageType} ancestry traits are selected.</p>
                            ) : (
                              <p className="muted">No heritage trait details are available.</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ) : null}

                    {savedFeatureChoices.length > 0 && (
                      <Card title="Saved Feature Choices">
                        <div className="list">
                          {savedFeatureChoices.map((choice) => (
                            <div
                              key={`${choice.sourceType}:${choice.sourceIndex}:${choice.choicePath}`}
                              className="character-feature-entry"
                            >
                              <strong>
                                {choice.choiceLabel ?? choice.choiceKey ?? choice.choicePath}
                              </strong>
                              <p>
                                {choice.selectedOptionName ??
                                  choice.selectedOptionIndex ??
                                  choice.selectedOptionType}
                                {choice.level ? ` - Level ${choice.level}` : ""}
                              </p>
                              <p className="muted">
                                {getSavedFeatureChoiceStatus(choice, featureChoiceEffects, character)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    <Card title="Origin">
                      <div className="list">
                        <div className="list-row">
                          <span>Species</span>
                          <strong>{character.species.name}</strong>
                        </div>
                        <div className="list-row">
                          <span>Class</span>
                          <strong>{character.class.name}</strong>
                        </div>
                        <div className="list-row">
                          <span>Background</span>
                          <strong>{character.background.name}</strong>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "background" && (
                <div className="character-tab-scroll-stage">
                  <div className="workspace-card-grid">
                    <Card title="Character Profile">
                      <div className="list">
                        <div className="list-row">
                          <span>Name</span>
                          <strong>{character.name}</strong>
                        </div>
                        <div className="list-row">
                          <span>Alignment</span>
                          <strong>{character.alignment ?? "Unaligned"}</strong>
                        </div>
                        <div className="list-row">
                          <span>Size</span>
                          <strong>{sizeLabel}</strong>
                        </div>
                      </div>
                    </Card>

                    <Card title="Background Hooks">
                      <p className="muted">
                        {character.background.name} informs tool access, social flavor, and quest
                        hooks. This panel is reserved for deeper campaign-facing notes later on.
                      </p>
                    </Card>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="character-tab-scroll-stage">
                  <Card title="Notes">
                    <p className="muted">
                      Use this area later for session notes, encounter reminders, and party plans.
                    </p>
                  </Card>
                </div>
              )}

              {activeTab === "extras" && (
                <div className="character-tab-scroll-stage">
                  <div className="workspace-card-grid">
                    <Card title="Recent Dice Rolls">
                      <div className="list">
                        {character.diceRolls.map((roll) => (
                          <div key={roll.id} className="list-row">
                            <span>
                              {roll.reason ?? roll.rollType}{" "}
                              <span className="muted">({roll.formula})</span>
                            </span>
                            <strong>{roll.total}</strong>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card title="Quick Summary">
                      <div className="list">
                        <div className="list-row">
                          <span>Speed</span>
                          <strong>{character.speed} ft</strong>
                        </div>
                        <div className="list-row">
                          <span>Proficiency</span>
                          <strong>{formatModifier(proficiencyBonus)}</strong>
                        </div>
                        <div className="list-row">
                          <span>Hit Points</span>
                          <strong>
                            {currentHp}/{character.maxHp}
                          </strong>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>
      </section>
      {isCurrentHpModalOpen ? (
        <div className="character-hp-modal-backdrop" onClick={closeCurrentHpModal}>
          <section
            className="character-hp-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="character-hp-modal-header">
              <h3>Adjust Current HP</h3>
              <button
                type="button"
                className="character-hp-modal-close"
                onClick={closeCurrentHpModal}
                aria-label="Close current HP dialog"
              >
              </button>
            </header>

            <div className="character-hp-modal-body">
              <label className="character-hp-modal-field">
                <span>Amount</span>
                <input
                  type="number"
                  min="1"
                  className="character-hp-modal-input"
                  value={hitPointAmountInput}
                  onChange={(event) => setHitPointAmountInput(event.target.value)}
                  placeholder="Enter HP amount"
                />
              </label>
            </div>

            <footer className="character-hp-modal-actions">
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-secondary"
                onClick={closeCurrentHpModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="character-hp-modal-button"
                onClick={() => applyCurrentHpChange("heal")}
              >
                Heal
              </button>
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-danger"
                onClick={() => applyCurrentHpChange("damage")}
              >
                Damage
              </button>
            </footer>
          </section>
        </div>
      ) : null}

      {isTempHpModalOpen ? (
        <div className="character-hp-modal-backdrop" onClick={closeTempHpModal}>
          <section
            className="character-hp-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <header className="character-hp-modal-header">
              <h3>Set Temporary HP</h3>
              <button
                type="button"
                className="character-hp-modal-close"
                onClick={closeTempHpModal}
                aria-label="Close temporary HP dialog"
              >
              </button>
            </header>

            <div className="character-hp-modal-body">
              <label className="character-hp-modal-field">
                <span>Temporary Hit Points</span>
                <input
                  type="number"
                  min="0"
                  className="character-hp-modal-input"
                  value={tempHpInput}
                  onChange={(event) => setTempHpInput(event.target.value)}
                  placeholder="Enter temp HP"
                />
              </label>
            </div>

            <footer className="character-hp-modal-actions">
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-secondary"
                onClick={closeTempHpModal}
              >
                Cancel
              </button>
              <button
                type="button"
                className="character-hp-modal-button character-hp-modal-button-secondary"
                onClick={() => {
                  onSetTempHp(0);
                  closeTempHpModal();
                }}
              >
                Clear
              </button>
              <button
                type="button"
                className="character-hp-modal-button"
                onClick={applyTempHpChange}
              >
                Apply
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </div>
  );
}

type TrainingBlockProps = {
  label: string;
  values: string[];
};

function TrainingBlock({ label, values }: TrainingBlockProps) {
  return (
    <div className="character-training-block">
      <span>{label}</span>
      <p>{values.join(", ")}</p>
    </div>
  );
}

function getCreatureSize(speciesName: string) {
  switch (speciesName.toLowerCase()) {
    case "halfling":
      return "Small";
    case "dwarf":
    case "human":
    case "elf":
    case "tiefling":
    default:
      return "Medium";
  }
}

function getSavingThrowProficiencies(className: string): AbilityIndex[] {
  switch (className.toLowerCase()) {
    case "fighter":
      return ["str", "con"];
    case "rogue":
      return ["dex", "int"];
    case "wizard":
      return ["int", "wis"];
    case "cleric":
      return ["wis", "cha"];
    case "ranger":
      return ["str", "dex"];
    case "bard":
      return ["dex", "cha"];
    default:
      return ["str", "dex"];
  }
}

function getSkillTotal(skills: SkillWithTotal[], name: string) {
  return skills.find((skill) => skill.name === name)?.total ?? 0;
}

function getHeritageSenseDetails(heritage: SpeciesHeritageOption | null | undefined) {
  return (heritage?.traits ?? [])
    .filter((trait) =>
      `${trait.name} ${trait.description ?? ""}`.toLowerCase().includes("darkvision"),
    )
    .map((trait) => trait.description ?? trait.name);
}

function getActionSubtitle(action: CharacterActionEntry) {
  const sourceLabel = action.sourceType === "class_feature" ? "Class Feature" : "Species Trait";
  const activationLabel = formatActivationLabel(action.activationType);
  const levelLabel = action.level ? `Level ${action.level}` : null;

  return [activationLabel, sourceLabel, levelLabel].filter(isPresent).join(" â€˘ ");
}

function getReadableActionSubtitle(action: CharacterActionEntry) {
  const sourceLabel = action.sourceType === "class_feature" ? "Class Feature" : "Species Trait";
  const activationLabel = formatActivationLabel(action.activationType);
  const levelLabel = action.level ? `Level ${action.level}` : null;

  return [activationLabel, sourceLabel, levelLabel].filter(isPresent).join(" - ");
}

function formatConditionSummaryEntry(entry: { label: string; value: string }) {
  return entry.label === "Exhaustion" ? `${entry.label} ${entry.value}` : entry.label;
}

function formatActivationLabel(activationType: ActionActivationType) {
  switch (activationType) {
    case "attack":
      return "Attack";
    case "action":
      return "Action";
    case "bonus_action":
      return "Bonus Action";
    case "reaction":
      return "Reaction";
    case "other":
    default:
      return "Other";
  }
}

function compareSkills(left: SkillWithTotal, right: SkillWithTotal) {
  const leftIndex = skillOrder.indexOf(left.name);
  const rightIndex = skillOrder.indexOf(right.name);

  if (leftIndex !== -1 || rightIndex !== -1) {
    return (leftIndex === -1 ? Number.POSITIVE_INFINITY : leftIndex) -
      (rightIndex === -1 ? Number.POSITIVE_INFINITY : rightIndex);
  }

  return left.name.localeCompare(right.name);
}

function getTrainingProfile(
  character: Character,
  featureChoiceEffects: FeatureChoiceEffectSummary,
) {
  const trainingCharacter = character as TrainingReferenceCharacter;
  const classSourceJson = getProficiencySourceJson(trainingCharacter.class.sourceJson);
  const backgroundSourceJson = getProficiencySourceJson(trainingCharacter.background.sourceJson);
  const speciesSourceJson = getLanguageSourceJson(trainingCharacter.species.sourceJson);
  const groupedClassProficiencies = groupClassProficiencies(
    getReferenceNames(classSourceJson.proficiencies),
  );
  const persistedTraining = getPersistedTrainingProficiencies(character);
  const armor = withUnavailableFallback(
    mergeTrainingValues(
      groupedClassProficiencies.armor.length > 0
        ? groupedClassProficiencies.armor
        : trainingCharacter.class.proficiencies?.armor ?? [],
      persistedTraining.armor,
      featureChoiceEffects.armorNames,
    ),
  );
  const weapons = withUnavailableFallback(
    mergeTrainingValues(
      groupedClassProficiencies.weapons.length > 0
        ? groupedClassProficiencies.weapons
        : trainingCharacter.class.proficiencies?.weapons ?? [],
      persistedTraining.weapons,
      featureChoiceEffects.weaponNames,
    ),
  );
  const classTools =
    groupedClassProficiencies.tools.length > 0
      ? groupedClassProficiencies.tools
      : trainingCharacter.class.proficiencies?.tools ?? [];
  const backgroundTools = getToolProficiencies(backgroundSourceJson);
  const normalizedBackgroundTools = getNormalizedBackgroundToolProficiencies(
    trainingCharacter.background,
  );
  const mappedBackgroundTools = filterConcreteToolProficiencies(
    trainingCharacter.background.toolProficiencies ?? [],
  );
  const concreteBackgroundTools = filterConcreteToolProficiencies(backgroundTools);
  const tools = withUnavailableFallback(
    mergeTrainingValues(
      classTools,
      normalizedBackgroundTools.length > 0
        ? normalizedBackgroundTools
        : concreteBackgroundTools.length > 0
          ? concreteBackgroundTools
          : mappedBackgroundTools,
      persistedTraining.tools,
      featureChoiceEffects.toolNames,
      featureChoiceEffects.expertiseToolNames.map((toolName) => `${toolName} (Expertise)`),
    ),
  );
  const languages = withUnavailableFallback(
    mergeTrainingValues(
      trainingCharacter.languages?.length
        ? trainingCharacter.languages.map((language) => language.language.name)
        : getLanguages(speciesSourceJson),
      featureChoiceEffects.languageNames,
    ),
  );

  return {
    armor,
    languages,
    senses: unavailableTrainingValue,
    tools,
    weapons,
  };
}

function getFeatureChoiceEffects(character: Character): FeatureChoiceEffectSummary {
  const effects: FeatureChoiceEffectSummary = {
    armorNames: [],
    expertiseSkillIndexes: new Set(),
    expertiseToolNames: [],
    languageNames: [],
    skillProficiencyIndexes: new Set(),
    toolNames: [],
    weaponNames: [],
  };

  for (const choice of character.featureChoices ?? []) {
    if (isInactiveFeatureChoice(choice, character.level) || isEquipmentChoice(choice)) {
      continue;
    }

    const reference = getSelectedChoiceReference(choice);

    if (!reference) {
      continue;
    }

    const category = classifyChoiceReference(reference);

    if (!category) {
      continue;
    }

    if (isExpertiseFeatureChoice(choice)) {
      if (category === "skill") {
        const skillIndex = canonicalSkillIndex(reference.index ?? reference.name);

        if (skillIndex) {
          effects.expertiseSkillIndexes.add(skillIndex);
        }
      } else if (category === "tool") {
        effects.expertiseToolNames.push(stripReferencePrefix(reference.name));
      }

      continue;
    }

    switch (category) {
      case "armor":
        effects.armorNames.push(stripReferencePrefix(reference.name));
        break;
      case "language":
        effects.languageNames.push(stripReferencePrefix(reference.name));
        break;
      case "skill": {
        const skillIndex = canonicalSkillIndex(reference.index ?? reference.name);

        if (skillIndex) {
          effects.skillProficiencyIndexes.add(skillIndex);
        }
        break;
      }
      case "tool":
        effects.toolNames.push(stripReferencePrefix(reference.name));
        break;
      case "weapon":
        effects.weaponNames.push(stripReferencePrefix(reference.name));
        break;
    }
  }

  return {
    ...effects,
    armorNames: uniqueTrainingValues(effects.armorNames),
    expertiseToolNames: uniqueTrainingValues(effects.expertiseToolNames),
    languageNames: uniqueTrainingValues(effects.languageNames),
    toolNames: uniqueTrainingValues(effects.toolNames),
    weaponNames: uniqueTrainingValues(effects.weaponNames),
  };
}

function getSavedFeatureChoiceStatus(
  choice: NonNullable<Character["featureChoices"]>[number],
  effects: FeatureChoiceEffectSummary,
  character: Character,
) {
  const reference = getSelectedChoiceReference(choice);
  const category = !isInactiveFeatureChoice(choice, character.level) &&
    !isEquipmentChoice(choice) &&
    reference
    ? classifyChoiceReference(reference)
    : null;

  if (isInactiveFeatureChoice(choice, character.level)) {
    return `${choice.selectedOptionType} - Saved choice; inactive until level ${choice.level}.`;
  }

  if (isExpertiseFeatureChoice(choice)) {
    if (category === "skill") {
      const skillIndex = canonicalSkillIndex(reference?.index ?? reference?.name);

      return skillIndex &&
        effects.expertiseSkillIndexes.has(skillIndex) &&
        isCharacterProficientInSkill(character, effects, skillIndex)
        ? `${choice.selectedOptionType} - Expertise applied where proficient.`
        : `${choice.selectedOptionType} - Saved Expertise choice; inactive until proficient.`;
    }

    if (category === "tool") {
      return `${choice.selectedOptionType} - Saved Expertise choice; tool roll mechanics not automated yet.`;
    }
  }

  if (category) {
    return `${choice.selectedOptionType} - Applied as ${category} proficiency.`;
  }

  return `${choice.selectedOptionType} - Saved choice; mechanics not automated yet.`;
}

function isCharacterProficientInSkill(
  character: Character,
  effects: FeatureChoiceEffectSummary,
  skillIndex: string,
) {
  return (
    effects.skillProficiencyIndexes.has(skillIndex) ||
    character.skills.some(
      (skill) => skill.isProficient && canonicalSkillIndex(skill.skillIndex) === skillIndex,
    )
  );
}

function getSelectedChoiceReference(
  choice: NonNullable<Character["featureChoices"]>[number],
): { index: string | null; name: string; url: string | null } | null {
  const rawReference = getRawReference(choice.selectedRawJson);
  const name =
    rawReference?.name ??
    choice.selectedOptionName ??
    choice.selectedOptionIndex ??
    null;

  if (!name) {
    return null;
  }

  return {
    index: rawReference?.index ?? choice.selectedOptionIndex ?? null,
    name,
    url: rawReference?.url ?? choice.selectedOptionUrl ?? null,
  };
}

function getRawReference(value: unknown): { index?: string; name?: string; url?: string } | null {
  if (!isRecord(value)) {
    return null;
  }

  const item = isRecord(value.item) ? value.item : isRecord(value.of) ? value.of : null;

  if (!item) {
    return null;
  }

  return {
    index: stringValue(item.index) ?? undefined,
    name: stringValue(item.name) ?? undefined,
    url: stringValue(item.url) ?? undefined,
  };
}

function classifyChoiceReference(reference: { index: string | null; name: string; url: string | null }) {
  const index = reference.index?.toLowerCase() ?? "";
  const name = reference.name.toLowerCase();
  const url = reference.url?.toLowerCase() ?? "";
  const isProficiencyReference = url.includes("/proficiencies/");
  const isLanguageReference = url.includes("/languages/") || name.startsWith("language:");

  if (isProficiencyReference && (name.startsWith("skill:") || index.startsWith("skill-"))) {
    return "skill";
  }

  if (name.startsWith("saving throw:") || index.startsWith("saving-throw-")) {
    return null;
  }

  if (isLanguageReference || index.startsWith("language-")) {
    return "language";
  }

  if (!isProficiencyReference) {
    return null;
  }

  if (
    name.startsWith("armor:") ||
    index.includes("armor") ||
    index === "shields" ||
    name === "shields"
  ) {
    return "armor";
  }

  if (
    name.startsWith("weapon:") ||
    index.includes("weapon") ||
    index.includes("weapons") ||
    isWeaponLikeProficiency(index, name)
  ) {
    return "weapon";
  }

  if (
    name.startsWith("tool:") ||
    index.includes("tools") ||
    url.includes("/proficiencies/tool-") ||
    isToolLikeProficiency(index, name)
  ) {
    return "tool";
  }

  return "tool";
}

function isInactiveFeatureChoice(
  choice: NonNullable<Character["featureChoices"]>[number],
  characterLevel: number,
) {
  return typeof choice.level === "number" && choice.level > characterLevel;
}

function isEquipmentChoice(choice: NonNullable<Character["featureChoices"]>[number]) {
  if (getRawReference(choice.selectedRawJson)?.url?.includes("/equipment")) {
    return true;
  }

  return [
    choice.choicePath,
    choice.choiceKey,
    choice.choiceLabel,
    choice.sourceIndex,
  ]
    .filter(isPresent)
    .some((value) => {
      const normalizedValue = value.toLowerCase();

      return (
        normalizedValue.includes("starting_equipment") ||
        normalizedValue.includes("equipment_options") ||
        normalizedValue.includes("starting-equipment")
      );
    });
}

function isWeaponLikeProficiency(index: string, name: string) {
  return [
    "axe",
    "blowgun",
    "bow",
    "club",
    "crossbow",
    "dagger",
    "dart",
    "flail",
    "glaive",
    "halberd",
    "hammer",
    "javelin",
    "lance",
    "mace",
    "net",
    "pike",
    "rapier",
    "scimitar",
    "sickle",
    "sling",
    "spear",
    "staff",
    "sword",
    "trident",
    "war-pick",
    "whip",
  ].some((keyword) => index.includes(keyword) || name.includes(keyword.replace(/-/g, " ")));
}

function isToolLikeProficiency(index: string, name: string) {
  return [
    "bagpipes",
    "cards",
    "chess",
    "dice",
    "drum",
    "dulcimer",
    "flute",
    "horn",
    "lute",
    "lyre",
    "pan-flute",
    "shawm",
    "viol",
    "supplies",
    "tools",
    "utensils",
    "kit",
    "instrument",
    "vehicle",
  ].some((keyword) => index.includes(keyword) || name.includes(keyword.replace(/-/g, " ")));
}

function isExpertiseFeatureChoice(choice: NonNullable<Character["featureChoices"]>[number]) {
  return [
    choice.sourceIndex,
    choice.featureIndex,
    choice.choiceLabel,
    choice.choicePath,
    choice.choiceKey,
  ]
    .filter(isPresent)
    .some((value) => value.toLowerCase().includes("expertise"));
}

function canonicalSkillIndex(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return stripReferencePrefix(value)
    .toLowerCase()
    .replace(/^skill-/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPersistedTrainingProficiencies(character: Character) {
  return (character.proficiencies ?? []).reduce(
    (groups, entry) => {
      const reference = {
        index: entry.proficiency.index,
        name: entry.proficiency.name,
        url: `/proficiencies/${entry.proficiency.index}`,
      };
      const category = classifyChoiceReference(reference);
      const label = stripReferencePrefix(entry.proficiency.name);

      if (category === "armor") {
        groups.armor.push(label);
      } else if (category === "tool") {
        groups.tools.push(label);
      } else if (category === "weapon") {
        groups.weapons.push(label);
      }

      return groups;
    },
    {
      armor: [] as string[],
      tools: [] as string[],
      weapons: [] as string[],
    },
  );
}

function mergeTrainingValues(...valueGroups: string[][]) {
  return uniqueTrainingValues(
    valueGroups
      .flat()
      .filter((value) => value !== unavailableTrainingValue),
  );
}

function getProficiencySourceJson(sourceJson: unknown): ProficiencySourceJson {
  return typeof sourceJson === "object" && sourceJson !== null
    ? sourceJson as ProficiencySourceJson
    : {};
}

function getLanguageSourceJson(sourceJson: unknown): LanguageSourceJson {
  return typeof sourceJson === "object" && sourceJson !== null
    ? sourceJson as LanguageSourceJson
    : {};
}

function getReferenceNames(references: ReferenceItem[] | undefined) {
  return (references ?? []).map((reference) => stringValue(reference.name)).filter(isPresent);
}

function groupClassProficiencies(proficiencies: string[]) {
  return proficiencies.reduce(
    (groups, proficiency) => {
      const normalizedName = stripReferencePrefix(proficiency);
      const normalizedKey = normalizedName.toLowerCase();

      if (proficiency.startsWith("Saving Throw:") || proficiency.startsWith("Skill:")) {
        return groups;
      }

      if (proficiency.startsWith("Tool:")) {
        groups.tools.push(normalizedName);
        return groups;
      }

      if (normalizedKey.includes("armor") || normalizedKey === "shields") {
        groups.armor.push(normalizedName);
        return groups;
      }

      groups.weapons.push(normalizedName);
      return groups;
    },
    {
      armor: [] as string[],
      tools: [] as string[],
      weapons: [] as string[],
    },
  );
}

function getToolProficiencies(sourceJson: ProficiencySourceJson) {
  return [
    ...getReferenceNames(sourceJson.proficiencies)
      .filter((proficiency) => proficiency.startsWith("Tool:"))
      .map(stripReferencePrefix),
    ...(sourceJson.proficiency_choices ?? [])
      .map((choice) => stringValue(choice.desc))
      .filter(isPresent),
  ];
}

function getNormalizedBackgroundToolProficiencies(
  background: TrainingReferenceCharacter["background"],
) {
  return (background.proficiencyGrants ?? [])
    .filter((grant) => grant.grantType === "TOOL")
    .map((grant) => grant.sourceLabel ?? grant.proficiency?.name ?? grant.proficiencyIndex)
    .filter(isPresent)
    .map(stripReferencePrefix);
}

function filterConcreteToolProficiencies(values: string[]) {
  return values.filter((value) => {
    const normalizedValue = value.toLowerCase();

    return (
      !normalizedValue.startsWith("choose ") &&
      !normalizedValue.includes("(see equipment)") &&
      !normalizedValue.includes(" of your choice")
    );
  });
}

function getLanguages(sourceJson: LanguageSourceJson) {
  return [
    ...getReferenceNames(sourceJson.languages),
    stringValue(sourceJson.language_options?.desc),
  ].filter(isPresent);
}

function withUnavailableFallback(values: string[]) {
  const uniqueValues = uniqueTrainingValues(values);

  return uniqueValues.length > 0 ? uniqueValues : [unavailableTrainingValue];
}

function uniqueTrainingValues(values: string[]) {
  const seenValues = new Set<string>();
  const uniqueValues: string[] = [];

  for (const value of values) {
    const trimmedValue = value.trim();
    const normalizedValue = trimmedValue.toLowerCase();

    if (!trimmedValue || seenValues.has(normalizedValue)) {
      continue;
    }

    seenValues.add(normalizedValue);
    uniqueValues.push(trimmedValue);
  }

  return uniqueValues;
}

function stripReferencePrefix(value: string) {
  return value.replace(/^Skill: /, "").replace(/^Tool: /, "").replace(/^Saving Throw: /, "");
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getWeaponActions(
  liveEquippedItems: LiveInventoryItem[],
  equippedItems: Character["inventory"],
  dexterityModifier: number,
  strengthModifier: number,
  proficiencyBonus: number,
  weaponProficiencies: string[],
) {
  const unarmedStrikeAction = {
    damage: `1 + ${Math.max(1, strengthModifier)}`,
    hit: formatModifier(strengthModifier + proficiencyBonus),
    name: "Unarmed Strike",
    notes: "Melee",
    range: "5 ft.",
    type: "Melee Attack",
  };

  const liveAttackItems = liveEquippedItems.filter(isLiveAttackItem);

  if (liveAttackItems.length > 0) {
    return [
      ...liveAttackItems.map((item) => {
        const profile = getAttackProfile(
          item.name,
          dexterityModifier,
          strengthModifier,
          proficiencyBonus,
          weaponProficiencies,
        );
        const attackBonus = profile.attackBonus + item.attackBonus;
        const damage = formatInventoryDamage(
          item.damage,
          profile.damageModifier,
        );
        const notes = item.notes || profile.notes;

        return {
          damage,
          hit: formatModifier(attackBonus),
          name: item.name,
          notes,
          range: profile.range,
          type: profile.type,
        };
      }),
      unarmedStrikeAction,
    ];
  }

  const attackItems = equippedItems.filter((item) => isAttackItem(item.equipment.name));
  const actions = attackItems.map((item) => {
    const profile = getAttackProfile(
      item.equipment.name,
      dexterityModifier,
      strengthModifier,
      proficiencyBonus,
      weaponProficiencies,
    );

    return {
      damage: profile.damage,
      hit: formatModifier(profile.attackBonus),
      name: item.equipment.name,
      notes: profile.notes,
      range: profile.range,
      type: profile.type,
    };
  });

  if (actions.length > 0) {
    return [...actions, unarmedStrikeAction];
  }

  return [unarmedStrikeAction];
}

function isAttackItem(name: string) {
  const normalizedName = name.toLowerCase();

  return getWeaponKind(normalizedName) !== null;
}

function getAttackProfile(
  itemName: string,
  dexterityModifier: number,
  strengthModifier: number,
  proficiencyBonus: number,
  weaponProficiencies: string[],
) {
  const normalizedName = itemName.toLowerCase();
  const weaponKind = getWeaponKind(normalizedName) ?? "simpleMelee";
  const isProficient = hasWeaponProficiency(normalizedName, weaponKind, weaponProficiencies);

  if (weaponKind === "bow") {
    return {
      attackBonus: dexterityModifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d6 ${formatInlineModifier(dexterityModifier)}`,
      damageModifier: dexterityModifier,
      notes: "Ranged weapon",
      range: normalizedName.includes("longbow") ? "150/600 ft." : "80/320 ft.",
      type: "Ranged Attack",
    };
  }

  if (weaponKind === "crossbow") {
    return {
      attackBonus: dexterityModifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d6 ${formatInlineModifier(dexterityModifier)}`,
      damageModifier: dexterityModifier,
      notes: "Ranged weapon",
      range: normalizedName.includes("hand") ? "30/120 ft." : "80/320 ft.",
      type: "Ranged Attack",
    };
  }

  if (weaponKind === "dagger") {
    const modifier = Math.max(dexterityModifier, strengthModifier);

    return {
      attackBonus: modifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d4 ${formatInlineModifier(modifier)}`,
      damageModifier: modifier,
      notes: "Finesse, light, thrown",
      range: "20/60 ft.",
      type: "Melee / Thrown",
    };
  }

  if (weaponKind === "finesseMelee") {
    const modifier = Math.max(dexterityModifier, strengthModifier);

    return {
      attackBonus: modifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d8 ${formatInlineModifier(modifier)}`,
      damageModifier: modifier,
      notes: "Finesse",
      range: "5 ft.",
      type: "Melee Attack",
    };
  }

  if (weaponKind === "sling") {
    return {
      attackBonus: dexterityModifier + (isProficient ? proficiencyBonus : 0),
      damage: `1d4 ${formatInlineModifier(dexterityModifier)}`,
      damageModifier: dexterityModifier,
      notes: "Ranged weapon",
      range: "30/120 ft.",
      type: "Ranged Attack",
    };
  }

  return {
    attackBonus: strengthModifier + (isProficient ? proficiencyBonus : 0),
    damage: `1d6 ${formatInlineModifier(strengthModifier)}`,
    damageModifier: strengthModifier,
    notes: "Weapon attack",
    range: "5 ft.",
    type: "Melee Attack",
  };
}

function isLiveAttackItem(item: LiveInventoryItem) {
  return item.kind === "weapon" && item.damage.trim().length > 0 && !item.name.toLowerCase().includes("shield");
}

function getWeaponKind(normalizedName: string) {
  if (normalizedName.includes("shield")) {
    return null;
  }

  if (normalizedName.includes("longbow") || normalizedName.includes("shortbow")) {
    return "bow";
  }

  if (normalizedName.includes("crossbow")) {
    return "crossbow";
  }

  if (normalizedName.includes("dagger")) {
    return "dagger";
  }

  if (
    normalizedName.includes("rapier") ||
    normalizedName.includes("shortsword")
  ) {
    return "finesseMelee";
  }

  if (normalizedName.includes("sling")) {
    return "sling";
  }

  if (
    ["sword", "warhammer", "hammer", "mace", "axe", "staff", "club", "spear"].some((keyword) =>
      normalizedName.includes(keyword),
    )
  ) {
    return "simpleMelee";
  }

  return null;
}

function hasWeaponProficiency(
  normalizedName: string,
  weaponKind: string,
  weaponProficiencies: string[],
) {
  const proficiencies = weaponProficiencies.map((entry) => entry.toLowerCase());

  if (
    proficiencies.some((entry) =>
      normalizedName.includes(entry) || entry.includes(normalizedName),
    )
  ) {
    return true;
  }

  if (
    ["dagger", "sling", "bow", "crossbow", "simpleMelee"].includes(weaponKind) &&
    proficiencies.some((entry) => entry.includes("simple weapon"))
  ) {
    return true;
  }

  if (
    ["finesseMelee"].includes(weaponKind) &&
    proficiencies.some((entry) => entry.includes("martial weapon"))
  ) {
    return true;
  }

  if (
    normalizedName.includes("warhammer") &&
    proficiencies.some((entry) => entry.includes("martial weapon"))
  ) {
    return true;
  }

  return false;
}

function formatInlineModifier(value: number) {
  return value >= 0 ? `+ ${value}` : `- ${Math.abs(value)}`;
}

function formatInventoryDamage(baseDamage: string, modifier: number) {
  const trimmedDamage = baseDamage.trim();

  if (!trimmedDamage) {
    return `1 ${formatInlineModifier(modifier)}`;
  }

  const diceMatch = trimmedDamage.match(/\d+d\d+/i);
  const damagePrefix = diceMatch ? diceMatch[0] : trimmedDamage;

  return `${damagePrefix} ${formatInlineModifier(modifier)}`;
}

function getFeatureHighlights(
  className: string,
  backgroundName: string,
  speciesName: string,
  level: number,
) {
  const classKey = className.toLowerCase();
  const backgroundKey = backgroundName.toLowerCase();
  const speciesKey = speciesName.toLowerCase();
  const entries = [];

  if (classKey === "rogue") {
    entries.push({
      description:
        "Deliver extra damage once per turn when you have advantage or an allied threat nearby.",
      title: `Sneak Attack ${Math.max(1, Math.ceil(level / 2))}d6`,
    });
    entries.push({
      description: "Dash, Disengage, or Hide as a bonus action to reposition safely.",
      title: "Cunning Action",
    });
  } else if (classKey === "fighter") {
    entries.push({
      description: "Take one additional action on your turn when the moment matters most.",
      title: "Action Surge",
    });
    entries.push({
      description: "Recover a small burst of hit points as a bonus action.",
      title: "Second Wind",
    });
  } else {
    entries.push({
      description: "Core class features will appear here as the rules layer expands.",
      title: `${className} Core Features`,
    });
  }

  entries.push({
    description: `${backgroundName} informs roleplay hooks, tool access, and narrative context.`,
    title: `${backgroundName} Background`,
  });

  entries.push({
    description:
      speciesKey === "elf" || speciesKey === "dwarf" || speciesKey === "tiefling"
        ? `${speciesName} grants ancestry flavor and a distinct exploration edge.`
        : `${speciesName} grants flexible ancestry flavor for this build.`,
    title: `${speciesName} Heritage`,
  });

  return entries;
}

export { CharacterSheet };
export type { WorkspaceTab };
