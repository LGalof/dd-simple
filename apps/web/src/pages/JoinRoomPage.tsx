import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { useAuth } from "../features/auth/AuthContext";
import { joinRoom } from "../features/rooms/api/roomsApi";

function JoinRoomPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const { characters, loading, error } = useCharacters();
  const [roomCode, setRoomCode] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("");
  const [serverError, setServerError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const roomCodeFromParams = searchParams.get("roomCode");

    if (roomCodeFromParams) {
      setRoomCode(roomCodeFromParams.toUpperCase());
    }

    if (characters.length > 0 && !selectedCharacterId) {
      setSelectedCharacterId(characters[0].id);
    }
  }, [characters, searchParams, selectedCharacterId]);

  async function handleJoinRoom() {
    setServerError(null);

    if (!roomCode.trim()) {
      setServerError("Enter a room code to join.");
      return;
    }

    if (!selectedCharacterId) {
      setServerError("Select a character before joining a room.");
      return;
    }

    if (!token) {
      setServerError("Authentication is required to join a room.");
      return;
    }

    try {
      setIsJoining(true);
      const response = await joinRoom(roomCode.trim().toUpperCase(), selectedCharacterId, token);
      navigate(`/room/${response.room.code}?characterId=${selectedCharacterId}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to join room.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-section">
        <h1>Join a Room</h1>
        <p>Paste a room code and select a character to enter the shared session.</p>

        <div className="form-group">
          <label htmlFor="roomCode">Room code</label>
          <input
            id="roomCode"
            type="text"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
            placeholder="ABC123"
          />
        </div>

        {loading && <p>Loading characters…</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && characters.length === 0 && (
          <p>You need at least one character to join a room.</p>
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

        {serverError ? <p className="error-message">{serverError}</p> : null}

        <button
          type="button"
          className="primary-button"
          disabled={isJoining || loading || characters.length === 0}
          onClick={handleJoinRoom}
        >
          {isJoining ? "Joining…" : "Join room"}
        </button>
      </section>
    </AppLayout>
  );
}

export { JoinRoomPage };
