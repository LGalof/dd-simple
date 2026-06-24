import { useEffect } from "react";
import type { RollableResult } from "./Rollable";
import { formatRollBreakdown } from "../utils/diceRoller";

const localRollDismissDelayMs = 5000;

type LocalRollEntry = RollableResult & {
  id: string;
};

type LocalRollsPanelProps = {
  onDismiss: (rollId: string) => void;
  rolls: LocalRollEntry[];
  syncMessage?: string | null;
};

function LocalRollsPanel({ onDismiss, rolls, syncMessage }: LocalRollsPanelProps) {
  return (
    <section className="local-rolls-panel" aria-live="polite" aria-label="Recent local rolls">
      <header className="local-rolls-panel__header">
        <span>Recent Rolls</span>
      </header>
      {syncMessage ? <p className="local-rolls-sync-message">{syncMessage}</p> : null}
      <div className="local-rolls-list">
        {rolls.map((roll) => (
          <LocalRollItem key={roll.id} roll={roll} onDismiss={onDismiss} />
        ))}
      </div>
    </section>
  );
}

function LocalRollItem({
  onDismiss,
  roll,
}: {
  onDismiss: (rollId: string) => void;
  roll: LocalRollEntry;
}) {
  useEffect(() => {
    const dismissTimer = window.setTimeout(() => {
      onDismiss(roll.id);
    }, localRollDismissDelayMs);

    return () => window.clearTimeout(dismissTimer);
  }, [onDismiss, roll.id]);

  const isCritical = roll.naturalRoll === 20;
  const isFumble = roll.naturalRoll === 1;

  return (
    <article
      className={[
        "local-roll-item",
        isCritical ? "local-roll-item--critical" : "",
        isFumble ? "local-roll-item--fumble" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="local-roll-item__title">
        <div>
          <strong>{roll.label}</strong>
          {roll.source && roll.source !== roll.label ? <span>{roll.source}</span> : null}
        </div>
        <button
          type="button"
          className="local-roll-item__dismiss"
          onClick={() => onDismiss(roll.id)}
          aria-label={`Dismiss ${roll.label} roll`}
        >
          ×
        </button>
      </div>
      <div className="local-roll-item__result">
        <em className="local-roll-item__breakdown">{formatRollBreakdown(roll)}</em>
        <strong className="local-roll-item__total">
          {roll.parseable ? roll.total : "Unable"}
          {roll.damageType ? ` ${roll.damageType}` : ""}
        </strong>
      </div>
      <div className="local-roll-item__meta">
        {isCritical ? <span>Natural 20</span> : null}
        {isFumble ? <span>Natural 1</span> : null}
        {roll.damageType ? <span>{roll.damageType}</span> : null}
      </div>
    </article>
  );
}

export { LocalRollsPanel };
export type { LocalRollEntry };
