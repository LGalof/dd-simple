import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import type { Character } from "../../../types/character";
import { fetchCharacters } from "../api/fetchCharacters";

function useCharacters() {
  const { token } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCharacters() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await fetchCharacters(token);
        setCharacters(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    void loadCharacters();
  }, [token]);

  return {
    characters,
    loading,
    error,
  };
}

export { useCharacters };
