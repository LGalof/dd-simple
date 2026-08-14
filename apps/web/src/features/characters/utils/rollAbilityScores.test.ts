import { describe, expect, it, vi } from "vitest";

import { secureRandomInt } from "../../../lib/secureRandom";
import {
  rerollAbilityAssignments,
  rollAbilityScore,
  rollAbilitySet,
} from "./rollAbilityScores";

vi.mock("../../../lib/secureRandom", () => ({
  secureRandomInt: vi.fn(),
}));

const mockedSecureRandomInt = vi.mocked(secureRandomInt);

function mockRolls(values: number[]) {
  mockedSecureRandomInt.mockImplementation(() => {
    const nextValue = values.shift();
    return nextValue ?? 0;
  });
}

describe("rollAbilityScores", () => {
  it("rolls four dice and sums the highest three values", () => {
    mockRolls([0, 5, 3, 2]);

    expect(rollAbilitySet()).toEqual({
      dice: [1, 6, 4, 3],
      score: 13,
    });
  });

  it("rolls a single score and rerolls existing assignments", () => {
    mockRolls([1, 1, 1, 1, 5, 4, 3, 2]);

    expect(rollAbilityScore()).toBe(6);
    expect(
      rerollAbilityAssignments([
        { ability: "str", dice: [1, 1, 1, 1], score: 4 },
      ]),
    ).toEqual([
      {
        ability: "str",
        dice: [6, 5, 4, 3],
        score: 15,
      },
    ]);
  });
});
