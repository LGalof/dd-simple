import { useEffect, useState } from "react";
import type { Character } from "../../../types/character";
import { fetchCharacters } from "../api/fetchCharacters";

function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacters() {
      try {
        const data = await fetchCharacters();
        setCharacters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void loadCharacters();
  }, []);

  return {
    characters,
    loading,
    error,
  };
}

export { useCharacters };
