import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../features/auth/AuthContext";
import {
  deleteRoom,
  getCreatedRooms,
  type CreatedRoomSummary,
} from "../features/rooms/api/roomsApi";
import { copyRoomInviteUrl } from "../features/rooms/utils/roomInvite";

function formatRoomDate(value: number) {
  return new Intl.DateTimeFormat("sl-SI", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MyRoomsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [rooms, setRooms] = useState<CreatedRoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingRoomCode, setDeletingRoomCode] = useState<string | null>(null);
  const [copiedRoomCode, setCopiedRoomCode] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadRooms() {
      if (!token) {
        setError("Authentication is required to load rooms.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await getCreatedRooms(token);

        if (!ignore) {
          setRooms(response.rooms);
          setError(null);
        }
      } catch (error) {
        if (!ignore) {
          setError(error instanceof Error ? error.message : "Failed to load rooms.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadRooms();

    return () => {
      ignore = true;
    };
  }, [token]);

  function handleRejoinRoom(room: CreatedRoomSummary) {
    const characterId = room.currentUserCharacterId ?? room.creatorCharacterId;

    navigate(`/room/${room.code}?characterId=${characterId}`);
  }

  async function handleCopyInvite(roomCode: string) {
    try {
      await copyRoomInviteUrl(roomCode);
      setCopiedRoomCode(roomCode);
      window.setTimeout(() => setCopiedRoomCode(null), 2000);
    } catch {
      setError("Invite link could not be copied. Check browser clipboard permission.");
    }
  }

  async function handleDeleteRoom(room: CreatedRoomSummary) {
    if (!token || !window.confirm(`Delete room ${room.code}? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingRoomCode(room.code);
      await deleteRoom(room.code, token);
      setRooms((currentRooms) => currentRooms.filter((candidate) => candidate.code !== room.code));
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete room.");
    } finally {
      setDeletingRoomCode(null);
    }
  }

  const hostedRoomCount = rooms.filter((room) => room.currentUserRole === "creator").length;
  const hasReachedRoomLimit = hostedRoomCount >= 3;

  return (
    <AppLayout>
      <section className="page-section rooms-page">
        <div className="rooms-page-header">
          <div>
            <p className="eyebrow">Shared Board</p>
            <h1>Rooms</h1>
            <p className="muted">
              Rooms you created or joined are listed here, with player counts, creator details, and
              a quick way back into the board.
            </p>
          </div>

          <div className="rooms-create-control">
            <span>{hostedRoomCount}/3 created rooms</span>
            {hasReachedRoomLimit ? (
              <button type="button" className="primary-button" disabled>
                Room limit reached
              </button>
            ) : (
              <Link to="/rooms/create" className="primary-button primary-button-uppercase">
                Create Room
              </Link>
            )}
          </div>
        </div>

        {loading && (
          <div className="page-placeholder-card">
            <p>Loading rooms...</p>
          </div>
        )}

        {error && (
          <div className="page-placeholder-card">
            <p className="error-message">Error: {error}</p>
          </div>
        )}

        {!loading && !error && rooms.length === 0 && (
          <div className="page-placeholder-card">
            <h2>No rooms yet</h2>
            <p className="muted">
              Create or join a room from one of your characters, then it will appear here.
            </p>
            <Link to="/rooms/create" className="primary-button">
              Create your first room
            </Link>
          </div>
        )}

        {!loading && !error && rooms.length > 0 && (
          <div className="rooms-grid">
            {rooms.map((room) => (
              <article key={room.code} className="room-summary-card">
                <div className="room-summary-card-header">
                  <div>
                    <span className="room-code-pill">{room.code}</span>
                    <h2>{room.creatorCharacterName}</h2>
                  </div>
                  <div className="room-summary-badges">
                    <span className="room-role-pill">
                      {room.currentUserRole === "creator" ? "Creator" : "Player"}
                    </span>
                    <span className="room-player-count">
                      {room.playerCount} player{room.playerCount === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <dl className="room-summary-meta">
                  <div>
                    <dt>Created by</dt>
                    <dd>{room.creatorDisplayName}</dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{formatRoomDate(room.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{formatRoomDate(room.updatedAt)}</dd>
                  </div>
                </dl>

                <div className="room-player-list">
                  <strong>Players</strong>
                  {room.players.length > 0 ? (
                    room.players.map((player) => (
                      <span key={`${room.code}-${player.userId}-${player.characterId}`}>
                        {player.characterName}
                        <small>{player.role === "creator" ? "Creator" : "Player"}</small>
                      </span>
                    ))
                  ) : (
                    <span>No players have joined yet.</span>
                  )}
                </div>

                <div className="room-card-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleRejoinRoom(room)}
                  >
                    Rejoin room
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleCopyInvite(room.code)}
                  >
                    {copiedRoomCode === room.code ? "Link copied" : "Copy invite"}
                  </button>
                  {room.currentUserRole === "creator" && (
                    <button
                      type="button"
                      className="room-delete-button"
                      disabled={deletingRoomCode === room.code}
                      onClick={() => void handleDeleteRoom(room)}
                    >
                      {deletingRoomCode === room.code ? "Deleting..." : "Delete"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </AppLayout>
  );
}

export { MyRoomsPage };
