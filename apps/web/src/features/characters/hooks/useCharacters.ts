import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import type { Character } from "../../../types/character";
import { deleteCharacter } from "../api/deleteCharacter";
import { fetchCharacters } from "../api/fetchCharacters";
import { clearSelectedCharacterId } from "../utils/selectedCharacter";

function useCharacters() {
  const { token } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null);

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

  async function removeCharacter(characterId: string) {
    if (!token) {
      setError("You must be signed in to delete a character.");
      return;
    }

    setError(null);
    setDeletingCharacterId(characterId);

    try {
      await deleteCharacter(characterId, token);
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
