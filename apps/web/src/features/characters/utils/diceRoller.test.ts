import { describe, expect, it } from "vitest";
import {
  formatDiceFormula,
  rollDiceExpression,
} from "./diceRoller";

function sequenceRandom(values: number[]) {
  let index = 0;

  return () => values[index++] ?? 0;
}

describe("diceRoller", () => {
  it.each([
    [4, 1],
    [6, 2],
    [8, 3],
    [10, 4],
    [12, 5],
    [20, 6],
  ])("rolls a standard d%s", (sides, expectedValue) => {
    const result = rollDiceExpression(`1d${sides}`, {
      random: sequenceRandom([(expectedValue - 1) / sides]),
    });

    expect(result.parseable).toBe(true);
    expect(result.dice).toEqual([{ sides, value: expectedValue }]);
    expect(result.total).toBe(expectedValue);
  });

  it("adds quantity and positive modifiers", () => {
    const result = rollDiceExpression("2d6 + 3", {
      random: sequenceRandom([0, 5 / 6]),
    });

    expect(result.parseable).toBe(true);
    expect(result.normalizedFormula).toBe("2d6 + 3");
    expect(result.dice.map((die) => die.value)).toEqual([1, 6]);
    expect(result.modifier).toBe(3);
    expect(result.total).toBe(10);
  });

  it("supports negative modifiers", () => {
    const result = rollDiceExpression("1d20 - 1", {
      random: sequenceRandom([0.5]),
    });

    expect(result.parseable).toBe(true);
    expect(result.normalizedFormula).toBe("1d20 - 1");
    expect(result.dice[0]?.value).toBe(11);
    expect(result.modifier).toBe(-1);
    expect(result.total).toBe(10);
  });

  it("rejects invalid dice quantities", () => {
    expect(rollDiceExpression("0d6").parseable).toBe(false);
    expect(rollDiceExpression("101d6").parseable).toBe(false);
  });

  it("formats manual dice formulas with signed modifiers", () => {
    expect(formatDiceFormula(1, 4, 1)).toBe("1d4 + 1");
    expect(formatDiceFormula(2, 6, 3)).toBe("2d6 + 3");
    expect(formatDiceFormula(1, 20, -1)).toBe("1d20 - 1");
    expect(formatDiceFormula(1, 12, 0)).toBe("1d12");
  });
});
