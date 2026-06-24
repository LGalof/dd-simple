type RollMode = "normal" | "advantage" | "disadvantage";

type DiceRollDie = {
  sides: number;
  value: number;
  discarded?: boolean;
};

type DiceRollResult = {
  originalFormula: string;
  normalizedFormula: string;
  dice: DiceRollDie[];
  modifier: number;
  total: number;
  naturalRoll: number | null;
  discardedDie: number | null;
  parseable: boolean;
  error?: string;
};

type RollDiceExpressionOptions = {
  mode?: RollMode;
  random?: () => number;
};

type ParsedDiceExpression = {
  count: number;
  sides: number;
  modifier: number;
};

const diceExpressionPattern = /^\s*(\d*)d(\d+)(?:\s*([+-])\s*(\d+))?\s*$/i;
const maxDiceCount = 100;
const maxDieSides = 1000;

function rollDiceExpression(
  expression: string,
  options: RollDiceExpressionOptions = {},
): DiceRollResult {
  const originalFormula = expression;
  const parsedExpression = parseDiceExpression(expression);

  if (!parsedExpression) {
    return createUnparseableResult(originalFormula, "Use a simple dice formula like d20, 1d8 + 3, or 2d6 - 1.");
  }

  const random = options.random ?? Math.random;
  const mode = options.mode ?? "normal";
  const usesD20Mode =
    parsedExpression.count === 1 &&
    parsedExpression.sides === 20 &&
    (mode === "advantage" || mode === "disadvantage");
  const dice = usesD20Mode
    ? rollD20Mode(parsedExpression.sides, mode, random)
    : rollDice(parsedExpression.count, parsedExpression.sides, random);
  const keptDice = dice.filter((die) => !die.discarded);
  const diceTotal = keptDice.reduce((total, die) => total + die.value, 0);
  const total = diceTotal + parsedExpression.modifier;
  const naturalRoll =
    parsedExpression.count === 1 && parsedExpression.sides === 20
      ? keptDice[0]?.value ?? null
      : null;
  const discardedDie = dice.find((die) => die.discarded)?.value ?? null;

  return {
    originalFormula,
    normalizedFormula: normalizeDiceExpression(parsedExpression),
    dice,
    modifier: parsedExpression.modifier,
    total,
    naturalRoll,
    discardedDie,
    parseable: true,
  };
}

function rollD20(modifier: number, mode: RollMode = "normal") {
  return rollDiceExpression(formatD20Formula(modifier), { mode });
}

function canParseDiceExpression(expression: string) {
  return parseDiceExpression(expression) !== null;
}

function formatRollBreakdown(result: DiceRollResult) {
  if (!result.parseable) {
    return result.error ?? "Could not roll this formula.";
  }

  const keptDice = result.dice.filter((die) => !die.discarded).map((die) => die.value);
  const diceText = keptDice.length > 1 ? `(${keptDice.join(" + ")})` : `${keptDice[0] ?? 0}`;
  const modifierText = formatSignedModifier(result.modifier);
  const discardedText = result.discardedDie !== null ? ` (discarded ${result.discardedDie})` : "";

  return `${result.normalizedFormula} = ${diceText}${modifierText} = ${result.total}${discardedText}`;
}

function parseDiceExpression(expression: string): ParsedDiceExpression | null {
  const match = expression.match(diceExpressionPattern);

  if (!match) {
    return null;
  }

  const count = match[1] ? Number.parseInt(match[1], 10) : 1;
  const sides = Number.parseInt(match[2], 10);
  const modifierValue = match[4] ? Number.parseInt(match[4], 10) : 0;
  const modifier = match[3] === "-" ? -modifierValue : modifierValue;

  if (
    !Number.isInteger(count) ||
    !Number.isInteger(sides) ||
    count < 1 ||
    count > maxDiceCount ||
    sides < 2 ||
    sides > maxDieSides
  ) {
    return null;
  }

  return {
    count,
    sides,
    modifier,
  };
}

function rollDice(count: number, sides: number, random: () => number): DiceRollDie[] {
  return Array.from({ length: count }, () => ({
    sides,
    value: rollSingleDie(sides, random),
  }));
}

function rollD20Mode(sides: number, mode: Exclude<RollMode, "normal">, random: () => number) {
  const firstRoll = rollSingleDie(sides, random);
  const secondRoll = rollSingleDie(sides, random);
  const keepFirst =
    mode === "advantage" ? firstRoll >= secondRoll : firstRoll <= secondRoll;

  return [
    {
      sides,
      value: firstRoll,
      discarded: !keepFirst,
    },
    {
      sides,
      value: secondRoll,
      discarded: keepFirst,
    },
  ];
}

function rollSingleDie(sides: number, random: () => number) {
  return Math.floor(random() * sides) + 1;
}

function normalizeDiceExpression(parsedExpression: ParsedDiceExpression) {
  const baseFormula = `${parsedExpression.count}d${parsedExpression.sides}`;

  return `${baseFormula}${formatSignedModifier(parsedExpression.modifier)}`;
}

function formatSignedModifier(modifier: number) {
  if (modifier > 0) {
    return ` + ${modifier}`;
  }

  if (modifier < 0) {
    return ` - ${Math.abs(modifier)}`;
  }

  return "";
}

function formatD20Formula(modifier: number) {
  return `1d20${formatSignedModifier(Math.trunc(modifier))}`;
}

function createUnparseableResult(originalFormula: string, error: string): DiceRollResult {
  return {
    originalFormula,
    normalizedFormula: originalFormula.trim(),
    dice: [],
    modifier: 0,
    total: 0,
    naturalRoll: null,
    discardedDie: null,
    parseable: false,
    error,
  };
}

export {
  canParseDiceExpression,
  formatD20Formula,
  formatRollBreakdown,
  rollD20,
  rollDiceExpression,
};
export type { DiceRollDie, DiceRollResult, RollMode };
