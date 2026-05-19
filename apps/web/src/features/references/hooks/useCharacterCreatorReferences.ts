import { useEffect, useState } from "react";
import type { CharacterCreatorReferences } from "../../../types/reference";
import { fetchCharacterCreatorReferences } from "../api/fetchReferences";

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

function useCharacterCreatorReferences(
  token?: string | null,
): UseCharacterCreatorReferencesResult {
  const [state, setState] = useState<UseCharacterCreatorReferencesResult>({
    references: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function loadReferences() {
      try {
        setState({
          references: await fetchCharacterCreatorReferences({
            token,
          }),
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

    void loadReferences();
  }, [token]);

  return state;
}

export { useCharacterCreatorReferences };
