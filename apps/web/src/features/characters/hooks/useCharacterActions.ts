import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchCharacterActions } from "../api/fetchCharacterActions";
import type { CharacterActionEntry } from "../../../types/characterAction";

type CharacterActionPreviewState = {
  classIndex?: string;
  level?: number;
  subspeciesIndex?: string;
  speciesIndex?: string;
};

function useCharacterActions(
  characterId: string | null,
  previewState: CharacterActionPreviewState = {},
) {
  const { token } = useAuth();
  const [actions, setActions] = useState<CharacterActionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacterActions() {
      if (!token || !characterId) {
        setActions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextActions = await fetchCharacterActions(characterId, token, previewState);
        setActions(nextActions);
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : "Failed to load character actions";

        if (message.includes("status 404")) {
          setActions([]);
          setError(null);
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadCharacterActions();
  }, [
    characterId,
    previewState.classIndex,
    previewState.level,
    previewState.speciesIndex,
    previewState.subspeciesIndex,
    token,
  ]);

  return {
    actions,
    error,
    loading,
  };
}

export { useCharacterActions };
