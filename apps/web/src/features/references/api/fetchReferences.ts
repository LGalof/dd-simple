import { api } from "../../../lib/api";
import type {
  CharacterCreatorReferences,
  ReferenceAbilityScore,
  ReferenceBackground,
  ReferenceClass,
  ReferenceSkill,
  ReferenceSpecies,
} from "../../../types/reference";

async function fetchAbilityScores() {
  return api.get<ReferenceAbilityScore[]>("/references/ability-scores");
}

async function fetchSkills() {
  return api.get<ReferenceSkill[]>("/references/skills");
}

async function fetchSpecies() {
  return api.get<ReferenceSpecies[]>("/references/species");
}

async function fetchClasses() {
  return api.get<ReferenceClass[]>("/references/classes");
}

async function fetchBackgrounds() {
  return api.get<ReferenceBackground[]>("/references/backgrounds");
}

async function fetchCharacterCreatorReferences(): Promise<CharacterCreatorReferences> {
  const [abilityScores, skills, species, classes, backgrounds] = await Promise.all([
    fetchAbilityScores(),
    fetchSkills(),
    fetchSpecies(),
    fetchClasses(),
    fetchBackgrounds(),
  ]);

  return {
    abilityScores,
    skills,
    species,
    classes,
    backgrounds,
  };
}

export {
  fetchAbilityScores,
  fetchBackgrounds,
  fetchCharacterCreatorReferences,
  fetchClasses,
  fetchSkills,
  fetchSpecies,
};