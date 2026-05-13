import type { AbilityAssignment } from "../types/characterBuilder";

type RolledAbilitySet = {
  dice: number[];
  score: number;
};

function rollAbilitySet(): RolledAbilitySet {
  const dice = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
  const sortedDice = [...dice].sort((left, right) => right - left);

  return {
    dice,
    score: sortedDice[0] + sortedDice[1] + sortedDice[2],
  };
}

function rollAbilityScore() {
  return rollAbilitySet().score;
}

function rerollAbilityAssignments(currentAssignments: AbilityAssignment[]): AbilityAssignment[] {
  return currentAssignments.map((assignment) => {
    const nextRoll = rollAbilitySet();

    return {
      ...assignment,
      dice: nextRoll.dice,
      score: nextRoll.score,
    };
  });
}

export { rerollAbilityAssignments, rollAbilityScore, rollAbilitySet };
