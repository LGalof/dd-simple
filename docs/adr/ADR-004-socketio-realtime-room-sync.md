# ADR-004: Use Socket.IO for Realtime Room Synchronization

## Status

Accepted

## Context

Room-based tabletop play needs connected users to see room membership and board changes without repeatedly refreshing the page. REST remains useful for creating rooms, joining rooms, and loading durable room state, but live board updates need a bidirectional channel.

## Decision

Use Socket.IO for realtime room synchronization. The Socket.IO server is attached to the Express HTTP server. Socket connections authenticate with the same bearer token model as REST. Clients join room-specific socket rooms, receive `room:update` events, send board snapshots with `board:state`, and receive board changes through `board:update`. REST remains responsible for initial and durable room loading.

## Alternatives Considered

- Polling: simpler to host, but creates delayed updates and unnecessary repeated requests for active board play.
- Plain WebSocket: lower-level and flexible, but would require more custom connection, room, reconnect, and event handling.

## Consequences

### Benefits

- The board can update connected room clients in near real time.
- Socket authentication reuses the existing token approach.
- Socket.IO room primitives match the room-code model used by the application.

### Trade-offs

- The realtime layer must be kept consistent with REST-loaded durable room state.
- Socket.IO adds a runtime dependency and deployment considerations for persistent connections.
