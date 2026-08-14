import assert from "node:assert/strict";
import test from "node:test";
import { normalizeHitPointStateInput } from "./character.service.js";

test("feature HP bonuses are calculated without becoming persistent manual bonuses", () => {
  const initialState = normalizeHitPointStateInput({
    constitutionScore: 10,
    data: {
      bonusHp: 0,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: [6],
      tempHp: 0,
    },
    featureBonusHp: 2,
    hitDie: 6,
    level: 1,
  });

  assert.equal(initialState.bonusHp, 0);
  assert.equal(initialState.maxHp, 8);

  const stateAfterAutosave = normalizeHitPointStateInput({
    constitutionScore: 10,
    data: initialState,
    fallback: initialState,
    featureBonusHp: 2,
    hitDie: 6,
    level: 1,
  });

  assert.equal(stateAfterAutosave.bonusHp, 0);
  assert.equal(stateAfterAutosave.maxHp, 8);
});

test("manual and feature HP bonuses are both included exactly once", () => {
  const state = normalizeHitPointStateInput({
    constitutionScore: 14,
    data: {
      bonusHp: 3,
      calculationMode: "fixed",
      overrideMaxHp: null,
      rolledHitPoints: [10, 6, 6],
      tempHp: 0,
    },
    featureBonusHp: 6,
    hitDie: 10,
    level: 3,
  });

  assert.equal(state.bonusHp, 3);
  assert.equal(state.maxHp, 37);
});
