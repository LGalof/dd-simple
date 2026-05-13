import { useEffect, useState } from "react";
import type { Character } from "../../../types/character";
import { deleteCharacter } from "../api/deleteCharacter";
import { fetchCharacters } from "../api/fetchCharacters";
import { clearSelectedCharacterId } from "../utils/selectedCharacter";

function useCharacters() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null);

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

  async function removeCharacter(characterId: string) {
    setError(null);
    setDeletingCharacterId(characterId);

    try {
      await deleteCharacter(characterId);
      setCharacters((currentCharacters) =>
        currentCharacters.filter((character) => character.id !== characterId),
      );
      clearSelectedCharacterId(characterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete character");
    } finally {
      setDeletingCharacterId(null);
    }
  }

  return {
    characters,
    deletingCharacterId,
    loading,
    error,
    removeCharacter,
  };
}

export { useCharacters };
