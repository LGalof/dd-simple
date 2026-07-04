import { useMemo, useState } from "react";
import type { RollableResult } from "./Rollable";
import {
  formatDiceFormula,
  rollDiceExpression,
} from "../utils/diceRoller";

const standardDiceSizes = [4, 6, 8, 10, 12, 20, 100] as const;
const quantityMinimum = 1;
const quantityMaximum = 20;
const modifierMinimum = -100;
const modifierMaximum = 100;

type ManualDiceRollerProps = {
  onRoll: (result: RollableResult) => void;
};

function ManualDiceRoller({ onRoll }: ManualDiceRollerProps) {
  const [quantityInput, setQuantityInput] = useState("1");
  const [modifierInput, setModifierInput] = useState("0");
  const [labelInput, setLabelInput] = useState("");
  const [previewDieSize, setPreviewDieSize] = useState<(typeof standardDiceSizes)[number]>(20);

  const quantity = useMemo(
    () => parseIntegerInput(quantityInput, quantityMinimum, quantityMaximum),
    [quantityInput],
  );
  const modifier = useMemo(
    () => parseIntegerInput(modifierInput, modifierMinimum, modifierMaximum, 0),
    [modifierInput],
  );
  const formulaPreview =
    quantity !== null && modifier !== null
      ? formatDiceFormula(quantity, previewDieSize, modifier)
      : "Invalid roll";
  const canRoll = quantity !== null && modifier !== null;

  function rollManualDie(sides: (typeof standardDiceSizes)[number]) {
    setPreviewDieSize(sides);

    if (quantity === null || modifier === null) {
      return;
    }

    const formula = formatDiceFormula(quantity, sides, modifier);
    const rollResult = rollDiceExpression(formula);
    const label = labelInput.trim();

    onRoll({
      ...rollResult,
      label: label ? `${label}: ${rollResult.normalizedFormula}` : `Manual Roll: ${rollResult.normalizedFormula}`,
      rolledAt: Date.now(),
      rollType: "custom",
    });
  }

  return (
    <section className="manual-dice-roller" aria-label="Dice Roller">
      <header className="manual-dice-roller__header">
        <span>Dice Roller</span>
        <strong>{formulaPreview}</strong>
      </header>

      <div className="manual-dice-roller__fields">
        <label className="manual-dice-roller__field">
          <span>Qty</span>
          <input
            type="number"
            min={quantityMinimum}
            max={quantityMaximum}
            step="1"
            inputMode="numeric"
            value={quantityInput}
            aria-invalid={quantity === null}
            onBlur={() => {
              if (quantity === null) {
                setQuantityInput(String(quantityMinimum));
              }
            }}
            onChange={(event) => setQuantityInput(event.target.value)}
          />
        </label>

        <label className="manual-dice-roller__field">
          <span>Mod</span>
          <input
            type="number"
            min={modifierMinimum}
            max={modifierMaximum}
            step="1"
            inputMode="numeric"
            value={modifierInput}
            aria-invalid={modifier === null}
            onBlur={() => {
              if (modifier === null || modifierInput.trim() === "") {
                setModifierInput("0");
              }
            }}
            onChange={(event) => setModifierInput(event.target.value)}
          />
        </label>
      </div>

      <label className="manual-dice-roller__label-field">
        <span>Label</span>
        <input
          type="text"
          maxLength={80}
          value={labelInput}
          placeholder="Optional"
          onChange={(event) => setLabelInput(event.target.value)}
        />
      </label>

      <div className="manual-dice-roller__dice-grid" aria-label="Roll a die">
        {standardDiceSizes.map((sides) => (
          <button
            key={sides}
            type="button"
            className={
              previewDieSize === sides
                ? "manual-dice-roller__die manual-dice-roller__die-active"
                : "manual-dice-roller__die"
            }
            disabled={!canRoll}
            title={
              canRoll
                ? `Roll ${formatDiceFormula(quantity ?? 1, sides, modifier ?? 0)}`
                : "Enter a valid quantity and modifier"
            }
            onClick={() => rollManualDie(sides)}
          >
            d{sides}
          </button>
        ))}
      </div>
    </section>
  );
}

function parseIntegerInput(
  value: string,
  minimum: number,
  maximum: number,
  emptyValue?: number,
) {
  const trimmedValue = value.trim();

  if (trimmedValue.length === 0 && emptyValue !== undefined) {
    return emptyValue;
  }

  if (!/^-?\d+$/.test(trimmedValue)) {
    return null;
  }

  const parsedValue = Number.parseInt(trimmedValue, 10);

  if (parsedValue < minimum || parsedValue > maximum) {
    return null;
  }

  return parsedValue;
}

export { ManualDiceRoller };
