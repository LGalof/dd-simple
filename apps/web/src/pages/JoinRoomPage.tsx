import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { useAuth } from "../features/auth/AuthContext";
import { joinRoom, normalizeRoomCodeInput } from "../features/rooms/api/roomsApi";

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
      setRoomCode(normalizeRoomCodeInput(roomCodeFromParams));
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
      const normalizedRoomCode = normalizeRoomCodeInput(roomCode);
      const response = await joinRoom(normalizedRoomCode, selectedCharacterId, token);
      navigate(`/room/${response.room.code}?characterId=${selectedCharacterId}`);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to join room.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <AppLayout>
      <section className="page-section room-flow-page">
        <header className="room-flow-hero room-flow-hero-join">
          <div className="room-flow-hero-icon" aria-hidden="true">
            ↗
          </div>
          <div>
            <p className="eyebrow">Shared Board</p>
            <h1>Join a room</h1>
            <p>
              Enter the room code from your invite and bring one of your characters into the shared
              session.
            </p>
          </div>
          <ol className="room-flow-steps" aria-label="Join room steps">
            <li className="room-flow-step room-flow-step-active">
              <span>1</span>
              Enter the code
            </li>
            <li className="room-flow-step">
              <span>2</span>
              Choose a character
            </li>
            <li className="room-flow-step">
              <span>3</span>
              Join the board
            </li>
          </ol>
        </header>

        <div className="room-flow-layout">
          <form
            className="room-flow-card room-flow-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleJoinRoom();
            }}
          >
            <div className="room-flow-card-heading">
              <div>
                <span className="room-flow-kicker">Your invitation</span>
                <h2>Enter room details</h2>
              </div>
              <span className="room-flow-limit">Up to 6 joined rooms</span>
            </div>

            <label className="room-flow-field" htmlFor="roomCode">
              <span>Room code</span>
              <input
                id="roomCode"
                className="room-flow-code-input"
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                onBlur={(event) => setRoomCode(normalizeRoomCodeInput(event.target.value))}
                placeholder="ABC123"
                autoComplete="off"
              />
              <small>Paste the code from the invite link, or type it manually.</small>
            </label>

            {loading && <div className="room-flow-notice">Loading your characters…</div>}
            {error && <p className="room-flow-alert room-flow-alert-error">{error}</p>}

            {!loading && characters.length === 0 && (
              <div className="room-flow-empty">
                <strong>You need a character first.</strong>
                <span>Create one before joining the party.</span>
                <Link to="/characters" className="secondary-button">
                  Go to my characters
                </Link>
              </div>
            )}

            {!loading && characters.length > 0 && (
              <label className="room-flow-field" htmlFor="character">
                <span>Character joining the room</span>
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
              </label>
            )}

            {serverError ? <p className="room-flow-alert room-flow-alert-error">{serverError}</p> : null}

            <button
              type="submit"
              className="primary-button room-flow-submit"
              disabled={isJoining || loading || characters.length === 0}
            >
              <span>{isJoining ? "Joining…" : "Join room"}</span>
              {!isJoining && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <aside className="room-flow-aside room-flow-aside-join">
            <span className="room-flow-kicker">Before you join</span>
            <h2>Everything stays connected</h2>
            <ul className="room-flow-benefits">
              <li>
                <span aria-hidden="true">01</span>
                The room owner shares a code or an invite link with you.
              </li>
              <li>
                <span aria-hidden="true">02</span>
                Your selected character is linked only to this session.
              </li>
              <li>
                <span aria-hidden="true">03</span>
                Board updates, initiative, and tokens sync as the encounter runs.
              </li>
            </ul>
            <Link to="/rooms/create" className="room-flow-text-link">
              Want to host instead? Create a room <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>
    </AppLayout>
  );
}

export { JoinRoomPage };
