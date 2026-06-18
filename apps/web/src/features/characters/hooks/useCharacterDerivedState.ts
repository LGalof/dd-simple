import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchCharacterDerivedState } from "../api/fetchCharacterDerivedState";
import type { CharacterDerivedState } from "../../../types/characterDerived";

type CharacterDerivedPreviewState = {
  classIndex?: string;
  level?: number;
  speciesIndex?: string;
  subclassIndex?: string;
  subspeciesIndex?: string;
};

function useCharacterDerivedState(
  characterId: string | null,
  previewState: CharacterDerivedPreviewState = {},
) {
  const { token } = useAuth();
  const [derivedState, setDerivedState] = useState<CharacterDerivedState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDerivedState() {
      if (!token || !characterId) {
        setDerivedState(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextState = await fetchCharacterDerivedState(characterId, token, previewState);
        setDerivedState(nextState);
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : "Failed to load character derived state";

        if (message.includes("status 404")) {
          setDerivedState(null);
          setError(null);
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadDerivedState();
  }, [
    characterId,
    previewState.classIndex,
    previewState.level,
    previewState.speciesIndex,
    previewState.subclassIndex,
    previewState.subspeciesIndex,
    token,
  ]);

  return {
    derivedState,
    error,
    loading,
  };
}

export { useCharacterDerivedState };
