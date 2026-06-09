import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "../components/layout/AppLayout";
import { useAuth } from "../features/auth/AuthContext";
import { getRoom } from "../features/rooms/api/roomsApi";
import { useRoomSocket } from "../features/rooms/hooks/useRoomSocket";

type RoomPlayer = {
  userId: string;
  characterId: string;
  characterName: string;
  joinedAt: number;
};

type RoomDetails = {
  code: string;
  createdAt: number;
  players: RoomPlayer[];
};

function RoomPage() {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [room, setRoom] = useState<RoomDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const roomCharacterId = searchParams.get("characterId");
  const {
    connected: socketConnected,
    error: socketError,
    room: socketRoom,
  } = useRoomSocket(roomCode, roomCharacterId, token);
  const activeRoom = socketRoom ?? room;

  useEffect(() => {
    const code = roomCode;
    const authToken = token;

    if (!code || !authToken) {
      setLoading(false);
      setRoom(null);
      return;
    }

    async function loadRoom(roomCode: string, token: string) {
      setLoading(true);
      setError(null);

      try {
        const response = await getRoom(roomCode, token);
        setRoom(response.room);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to load room.");
      } finally {
        setLoading(false);
      }
    }

    void loadRoom(code, authToken);
  }, [roomCode, token]);

  return (
    <AppLayout>
      <section className="page-section">
        <h1>Room {roomCode}</h1>

        {socketError && <p className="error-message">{socketError}</p>}
        {loading && <p>Loading room data…</p>}
        {error && <p className="error-message">{error}</p>}

        {!roomCharacterId && (
          <p>
            You can view the room state, but real-time updates are enabled only after
            joining with a character. <Link to={`/rooms/join?roomCode=${roomCode}`}>Join room</Link> to sync live.
          </p>
        )}

        {roomCharacterId && socketConnected && (
          <p className="muted">Connected for live sync as your selected character.</p>
        )}

        {!(loading || error) && activeRoom && (
          <>
            <p>Share this link with other players to let them join the same room.</p>
            <div className="room-summary">
              <p>
                <strong>Room code:</strong> {activeRoom.code}
              </p>
              <p>
                <strong>Created:</strong> {new Date(activeRoom.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Players in room:</strong> {activeRoom.players.length}
              </p>
            </div>

            <div className="room-players">
              {activeRoom.players.map((player) => (
                <div key={`${player.userId}-${player.characterId}`} className="room-player-card">
                  <p>
                    <strong>{player.characterName}</strong>
                  </p>
                  <p className="muted">Joined {new Date(player.joinedAt).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </AppLayout>
  );
}

export { RoomPage };
