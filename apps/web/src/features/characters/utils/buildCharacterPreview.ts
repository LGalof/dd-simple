import type { Character } from "../../../types/character";
import type {
  BackgroundOption,
  CharacterBuilderState,
  ClassOption,
  SpeciesOption,
} from "../types/characterBuilder";
import { abilityModifier } from "./characterFormat";

type BuildCharacterPreviewOptions = {
  background: BackgroundOption;
  character: Character;
  classOption: ClassOption;
  species: SpeciesOption;
  state: CharacterBuilderState;
};

function buildCharacterPreview({
  background,
  character,
  classOption,
  species,
  state,
}: BuildCharacterPreviewOptions): Character {
  const assignedScores = Object.fromEntries(
    state.abilityAssignments.map((assignment) => [assignment.abilityIndex, assignment.score]),
  );

  const nextAbilityScores = character.abilityScores.map((abilityScore) => ({
    ...abilityScore,
    score: assignedScores[abilityScore.abilityIndex] ?? abilityScore.score,
  }));

  const dexterityScore =
    nextAbilityScores.find((abilityScore) => abilityScore.abilityIndex === "dex")?.score ?? 10;
  const constitutionScore =
    nextAbilityScores.find((abilityScore) => abilityScore.abilityIndex === "con")?.score ?? 10;

  const dexterityModifier = abilityModifier(dexterityScore);
  const constitutionModifier = abilityModifier(constitutionScore);
  const nextMaxHp = Math.max(1, classOption.hitDie + constitutionModifier);

  return {
    ...character,
    level: state.level,
    maxHp: nextMaxHp,
    currentHp: Math.min(nextMaxHp, character.currentHp),
    armorClass: 10 + dexterityModifier,
    speed: species.speed,
    species: {
      name: species.name,
    },
    class: {
      name: classOption.name,
    },
    background: {
      name: background.name,
    },
    abilityScores: nextAbilityScores,
  };
}

export { buildCharacterPreview };
