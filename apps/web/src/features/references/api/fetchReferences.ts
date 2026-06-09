import { api } from "../../../lib/api";
import type {
  CharacterCreatorReferences,
  ReferenceAbilityScore,
  ReferenceAlignment,
  ReferenceBackground,
  ReferenceClass,
  ReferenceEquipment,
  ReferenceRuleDocument,
  ReferenceSkill,
  ReferenceSpecies,
} from "../../../types/reference";

type FetchReferenceOptions = {
  token?: string | null;
};

async function fetchAbilityScores(options: FetchReferenceOptions = {}) {
  return api.get<ReferenceAbilityScore[]>("/references/ability-scores", options);
}

async function fetchSkills(options: FetchReferenceOptions = {}) {
  return api.get<ReferenceSkill[]>("/references/skills", options);
}

async function fetchSpecies(options: FetchReferenceOptions = {}) {
  return api.get<ReferenceSpecies[]>("/references/species", options);
}

async function fetchClasses(options: FetchReferenceOptions = {}) {
  return api.get<ReferenceClass[]>("/references/classes", options);
}

async function fetchBackgrounds(options: FetchReferenceOptions = {}) {
  return api.get<ReferenceBackground[]>("/references/backgrounds", options);
}

async function fetchEquipment(options: FetchReferenceOptions = {}) {
  return api.get<ReferenceEquipment[]>("/references/equipment", options);
}

async function fetchAlignments(options: FetchReferenceOptions = {}) {
  try {
    return await api.get<ReferenceAlignment[]>("/references/alignments", options);
  } catch {
    return api.get<ReferenceAlignment[]>("/references/rules/alignments", options);
  }
}

async function fetchRuleDocuments(category: string, options: FetchReferenceOptions = {}) {
  return api.get<ReferenceRuleDocument[]>(
    `/references/rules/${encodeURIComponent(category)}`,
    options,
  );
}

async function fetchCharacterCreatorReferences(
  options: FetchReferenceOptions = {},
): Promise<CharacterCreatorReferences> {
  const [species, classes, backgrounds, alignments] = await Promise.all([
    fetchSpecies(options),
    fetchClasses(options),
    fetchBackgrounds(options),
    fetchAlignments(options),
  ]);

  return {
    species,
    classes,
    backgrounds,
    alignments,
  };
}

export {
  fetchAbilityScores,
  fetchAlignments,
  fetchBackgrounds,
  fetchCharacterCreatorReferences,
  fetchClasses,
  fetchEquipment,
  fetchRuleDocuments,
  fetchSkills,
  fetchSpecies,
};
