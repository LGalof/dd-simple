import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type {
  CharacterCreatorReferences,
  ReferenceAbilityScore,
  ReferenceBackground,
  ReferenceClass,
  ReferenceSkill,
  ReferenceSpecies,
} from "../../../types/reference";

type UseCharacterCreatorReferencesResult =
  | {
      references: null;
      loading: true;
      error: null;
    }
  | {
      references: CharacterCreatorReferences;
      loading: false;
      error: null;
    }
  | {
      references: null;
      loading: false;
      error: string;
    };

function useCharacterCreatorReferences(): UseCharacterCreatorReferencesResult {
  const [state, setState] = useState<UseCharacterCreatorReferencesResult>({
    references: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchReferences() {
      try {
        const [abilityScores, skills, species, classes, backgrounds] =
          await Promise.all([
            api.get<ReferenceAbilityScore[]>("/references/ability-scores"),
            api.get<ReferenceSkill[]>("/references/skills"),
            api.get<ReferenceSpecies[]>("/references/species"),
            api.get<ReferenceClass[]>("/references/classes"),
            api.get<ReferenceBackground[]>("/references/backgrounds"),
          ]);

        setState({
          references: {
            abilityScores,
            skills,
            species,
            classes,
            backgrounds,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        setState({
          references: null,
          loading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    fetchReferences();
  }, []);

  return state;
}

export { useCharacterCreatorReferences };