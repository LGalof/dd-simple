import { Rollable, type RollableResult } from "../Rollable";
import type { ActionActivationType } from "../../../../types/characterAction";

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

type DamageRollDisplay = {
  damageType?: string;
  formula: string;
} | null;

type ActionsTabProps = {
  actionFilterOptions: Array<{ id: ActionFilter; label: string }>;
  activeActionFilter: ActionFilter;
  attackActionRows: ActionDisplayRow[];
  derivedStateError: string | null;
  derivedStateLoading: boolean;
  detailActionRows: ActionDisplayRow[];
  formatActivationLabel: (activationType: ActionActivationType) => string;
  getDamageRollFromDisplay: (value: string) => DamageRollDisplay;
  getD20FormulaFromDisplayModifier: (value: string) => string | null;
  hasVisibleActionContent: boolean;
  onActiveActionFilterChange: (filter: ActionFilter) => void;
  onLocalRoll: (result: RollableResult) => void;
  shouldShowActionsInCombat: boolean;
};

function ActionsTab({
  actionFilterOptions,
  activeActionFilter,
  attackActionRows,
  derivedStateError,
  derivedStateLoading,
  detailActionRows,
  formatActivationLabel,
  getDamageRollFromDisplay,
  getD20FormulaFromDisplayModifier,
  hasVisibleActionContent,
  onActiveActionFilterChange,
  onLocalRoll,
  shouldShowActionsInCombat,
}: ActionsTabProps) {
  return (
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
            onClick={() => onActiveActionFilterChange(filter.id)}
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

          {attackActionRows.map((action) => {
            const hitFormula = getD20FormulaFromDisplayModifier(action.hit);
            const damageRoll = getDamageRollFromDisplay(action.damage);

            return (
              <div key={action.id} className="character-actions-table-row">
                <div className="character-actions-cell character-actions-cell-main">
                  <strong>{action.title}</strong>
                  <em>{action.subtitle}</em>
                </div>
                <span>{action.range}</span>
                {hitFormula ? (
                  <Rollable
                    className="character-actions-roll-value"
                    formula={hitFormula}
                    label={`${action.title} Attack`}
                    rollType="attack"
                    source={action.title}
                    onRoll={onLocalRoll}
                  >
                    {action.hit}
                  </Rollable>
                ) : (
                  <strong>{action.hit}</strong>
                )}
                {damageRoll ? (
                  <Rollable
                    className="character-actions-roll-value"
                    damageType={damageRoll.damageType}
                    formula={damageRoll.formula}
                    label={`${action.title} Damage`}
                    rollType="damage"
                    source={action.title}
                    onRoll={onLocalRoll}
                  >
                    {action.damage}
                  </Rollable>
                ) : (
                  <strong>{action.damage}</strong>
                )}
                <span>{action.notes}</span>
              </div>
            );
          })}
        </div>
      ) : null}

      {derivedStateLoading ? <p className="muted">Loading normalized actions...</p> : null}
      {derivedStateError ? (
        <p className="error-message">Actions unavailable: {derivedStateError}</p>
      ) : null}

      {!derivedStateLoading && !derivedStateError && !hasVisibleActionContent ? (
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
            Attack, Dash, Disengage, Dodge, Grapple, Help, Hide, Improvise, Influence,
            Magic, Ready, Search, Shove, Study, Utilize
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
              <em>Grapple.</em> The target must succeed on a Str./Dex. (it chooses which)
              saving throw (DC = 8 + Prof. Bonus + Str.) or it has the Grappled
              condition.
            </p>
            <p>
              <em>Shove.</em> The target must succeed on a Str./Dex. (it chooses which)
              saving throw (DC = 8 + Prof. Bonus + Str.) or you can either push it 5 ft.
              away or cause it to have the Prone condition.
            </p>
          </div>
        </div>
      ) : null}

      {detailActionRows.length > 0 ? (
        <div className="character-actions-detail-list">
          {detailActionRows.map((action) => {
            const actionStats = getDetailActionStats(action);

            return (
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
                {actionStats.length > 0 ? (
                  <dl className="character-actions-detail-stats">
                    {actionStats.map((stat) => (
                      <div key={stat.label}>
                        <dt>{stat.label}</dt>
                        <dd>{stat.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
                <p>{action.notes}</p>
              </article>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function getDetailActionStats(action: ActionDisplayRow) {
  return [
    { label: "Range", value: action.range },
    { label: "Hit / DC", value: action.hit },
    { label: "Damage / Healing", value: action.damage },
  ].filter((stat) => stat.value.trim().length > 0 && stat.value !== "--");
}

export { ActionsTab };
