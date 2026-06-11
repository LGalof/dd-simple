import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import { fetchCharacterDefenses } from "../api/fetchCharacterDefenses";
import type { CharacterDefenseEntry } from "../../../types/characterDefense";

type CharacterDefensePreviewState = {
  classIndex?: string;
  level?: number;
  subspeciesIndex?: string;
  speciesIndex?: string;
};

function useCharacterDefenses(
  characterId: string | null,
  previewState: CharacterDefensePreviewState = {},
) {
  const { token } = useAuth();
  const [defenses, setDefenses] = useState<CharacterDefenseEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacterDefenses() {
      if (!token || !characterId) {
        setDefenses([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const nextDefenses = await fetchCharacterDefenses(characterId, token, previewState);
        setDefenses(nextDefenses);
      } catch (nextError) {
        const message =
          nextError instanceof Error ? nextError.message : "Failed to load character defenses";

        if (message.includes("status 404")) {
          setDefenses([]);
          setError(null);
          return;
        }

        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void loadCharacterDefenses();
  }, [
    characterId,
    previewState.classIndex,
    previewState.level,
    previewState.speciesIndex,
    previewState.subspeciesIndex,
    token,
  ]);

  return {
    defenses,
    error,
    loading,
  };
}

export { useCharacterDefenses };
