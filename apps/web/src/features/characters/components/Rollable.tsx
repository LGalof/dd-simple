import type { ReactNode } from "react";
import {
  rollDiceExpression,
  type DiceRollResult,
} from "../utils/diceRoller";

type RollableRollType =
  | "ability"
  | "saving_throw"
  | "skill"
  | "initiative"
  | "attack"
  | "damage"
  | "healing"
  | "custom";

type RollableResult = DiceRollResult & {
  damageType?: string;
  label: string;
  rolledAt: number;
  rollType: RollableRollType;
  source?: string;
};

type RollableProps = {
  children: ReactNode;
  className?: string;
  damageType?: string;
  disabled?: boolean;
  formula: string;
  label: string;
  onRoll?: (result: RollableResult) => void;
  rollType: RollableRollType;
  source?: string;
};

function Rollable({
  children,
  className,
  damageType,
  disabled = false,
  formula,
  label,
  onRoll,
  rollType,
  source,
}: RollableProps) {
  const buttonClassName = ["rollable-value", className].filter(Boolean).join(" ");
  const title = disabled ? undefined : `Roll ${label}: ${formula}`;

  function handleRoll() {
    if (disabled) {
      return;
    }

    const rollResult = rollDiceExpression(formula);

    onRoll?.({
      ...rollResult,
      damageType,
      label,
      rolledAt: Date.now(),
      rollType,
      source,
    });
  }

  return (
    <button
      type="button"
      className={buttonClassName}
      disabled={disabled}
      title={title}
      aria-label={title}
      onClick={handleRoll}
    >
      {children}
    </button>
  );
}

export { Rollable };
export type { RollableResult, RollableRollType };
