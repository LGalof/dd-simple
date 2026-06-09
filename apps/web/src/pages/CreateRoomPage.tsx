import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { useAuth } from "../features/auth/AuthContext";
import { createRoom } from "../features/rooms/api/roomsApi";

function CreateRoomPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { characters, loading, error } = useCharacters();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");

  useEffect(() => {
    if (characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, selectedCharacterId]);
  const [selectedError, setSelectedError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  async function handleCreateRoom() {
    setSelectedError(null);
    setServerError(null);

    if (!selectedCharacterId) {
      setSelectedError("Choose a character before creating a room.");
      return;
    }

    if (!token) {
      setServerError("Authentication is required to create a room.");
      return;
    }

    try {
      setIsCreating(true);
      const response = await createRoom(selectedCharacterId, token);
      navigate(`/room/${response.room.code}?characterId=${selectedCharacterId}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to create room.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-section">
        <h1>Create a Room</h1>
        <p>Choose one of your characters and create a room code you can share with other players.</p>

        {loading && <p>Loading characters…</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && characters.length === 0 && (
          <p>You need at least one character before creating a room.</p>
        )}

        {!loading && characters.length > 0 && (
          <div className="form-group">
            <label htmlFor="character">Select character</label>
            <select
              id="character"
              value={selectedCharacterId}
              onChange={(event) => setSelectedCharacterId(event.target.value)}
            >
              {characters.map((character) => (
                <option key={character.id} value={character.id}>
                  {character.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedError ? <p className="error-message">{selectedError}</p> : null}
        {serverError ? <p className="error-message">{serverError}</p> : null}

        <button
          type="button"
          className="primary-button"
          disabled={isCreating || loading || characters.length === 0}
          onClick={handleCreateRoom}
        >
          {isCreating ? "Creating room…" : "Create room"}
        </button>
      </section>
    </AppLayout>
  );
}

export { CreateRoomPage };
