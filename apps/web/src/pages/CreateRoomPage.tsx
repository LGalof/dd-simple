import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useCharacters } from "../features/characters/hooks/useCharacters";
import { useAuth } from "../features/auth/AuthContext";
import { createRoom, getCreatedRooms } from "../features/rooms/api/roomsApi";

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
  const [hasReachedRoomLimit, setHasReachedRoomLimit] = useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    void getCreatedRooms(token)
      .then(({ rooms }) => {
        setHasReachedRoomLimit(
          rooms.filter((room) => room.currentUserRole === "creator").length >= 3,
        );
      })
      .catch(() => undefined);
  }, [token]);

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
      <section className="page-section room-flow-page">
        <header className="room-flow-hero">
          <div className="room-flow-hero-icon" aria-hidden="true">
            +
          </div>
          <div>
            <p className="eyebrow">Shared Board</p>
            <h1>Create a room</h1>
            <p>
              Start a shared encounter space, then send the invite link to the players you want at
              the table.
            </p>
          </div>
          <ol className="room-flow-steps" aria-label="Create room steps">
            <li className="room-flow-step room-flow-step-active">
              <span>1</span>
              <span>Choose a character</span>
            </li>
            <li className="room-flow-step">
              <span>2</span>
              <span>Share the invite</span>
            </li>
            <li className="room-flow-step">
              <span>3</span>
              <span>Open the board</span>
            </li>
          </ol>
        </header>

        <div className="room-flow-layout">
          <form
            className="room-flow-card room-flow-form"
            onSubmit={(event) => {
              event.preventDefault();
              void handleCreateRoom();
            }}
          >
            <div className="room-flow-card-heading">
              <div>
                <span className="room-flow-kicker">Your seat at the table</span>
                <h2>Choose your character</h2>
              </div>
              <span className="room-flow-limit">Up to 3 hosted rooms</span>
            </div>

            {loading && <div className="room-flow-notice">Loading your characters…</div>}
            {error && <p className="room-flow-alert room-flow-alert-error">{error}</p>}

            {!loading && characters.length === 0 && (
              <div className="room-flow-empty">
                <strong>You need a character first.</strong>
                <span>Create one before opening a room for the party.</span>
                <Link to="/characters" className="secondary-button">
                  Go to my characters
                </Link>
              </div>
            )}

            {!loading && characters.length > 0 && (
              <label className="room-flow-field" htmlFor="character">
                <span>Character entering as host</span>
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

            {selectedError ? <p className="room-flow-alert room-flow-alert-error">{selectedError}</p> : null}
            {serverError ? <p className="room-flow-alert room-flow-alert-error">{serverError}</p> : null}
            {hasReachedRoomLimit && (
              <p className="room-flow-alert room-flow-alert-error">
                You already have 3 rooms. Delete one from the Rooms page before creating another.
              </p>
            )}

            <button
              type="submit"
              className="primary-button room-flow-submit"
              disabled={isCreating || loading || characters.length === 0 || hasReachedRoomLimit}
            >
              <span>{isCreating ? "Creating room…" : "Create room"}</span>
              {!isCreating && <span aria-hidden="true">→</span>}
            </button>
          </form>

          <aside className="room-flow-aside">
            <span className="room-flow-kicker">After you create it</span>
            <h2>Your room is ready to share</h2>
            <ul className="room-flow-benefits">
              <li>
                <span aria-hidden="true">01</span>
                <span>A room code and private invite link are generated.</span>
              </li>
              <li>
                <span aria-hidden="true">02</span>
                <span>Players pick one of their own characters when joining.</span>
              </li>
              <li>
                <span aria-hidden="true">03</span>
                <span>Everyone sees changes on the encounter board in real time.</span>
              </li>
            </ul>
            <Link to="/rooms" className="room-flow-text-link">
              View my existing rooms <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>
    </AppLayout>
  );
}

export { CreateRoomPage };
