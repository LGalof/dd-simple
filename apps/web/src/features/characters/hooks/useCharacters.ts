import { useEffect, useState } from "react";
import { useAuth } from "../../auth/AuthContext";
import type { Character } from "../../../types/character";
import { deleteCharacter } from "../api/deleteCharacter";
import { fetchCharacters } from "../api/fetchCharacters";
import { updateCharacter } from "../api/updateCharacter";
import { clearSelectedCharacterId } from "../utils/selectedCharacter";
import type { CharacterSavePayload } from "../../../types/character";

function useCharacters() {
  const { token } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingCharacterId, setDeletingCharacterId] = useState<string | null>(null);
  const [savingCharacterId, setSavingCharacterId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  async function saveCharacter(characterId: string, payload: CharacterSavePayload) {
    if (!token) {
      setSaveError("You must be signed in to save a character.");
      return null;
    }

    setSaveError(null);
    setSavingCharacterId(characterId);

    try {
      const updatedCharacter = await updateCharacter(characterId, payload, token);

      setCharacters((currentCharacters) =>
        currentCharacters.map((character) =>
          character.id === characterId ? updatedCharacter : character,
        ),
      );

      return updatedCharacter;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save character");
      return null;
    } finally {
      setSavingCharacterId(null);
    }
  }

  return {
    characters,
    deletingCharacterId,
    loading,
    error,
    removeCharacter,
    saveCharacter,
    saveError,
    savingCharacterId,
  };
}

export { useCharacters };
