# ADR-007: Persist Room Board State and Synchronize Snapshots

## Status

Accepted

## Context

Rooms and tactical boards are part of gameplay, not just active socket sessions. Room membership and board state need to survive API restarts, browser disconnects, and users leaving and returning to a room. At the same time, connected users need live board updates while playing.

## Decision

Persist rooms, room players, and the latest tactical board snapshot in PostgreSQL through Prisma. Store board state as a JSON snapshot on the room. Use REST endpoints for creating rooms, joining rooms, and loading room state. Use Socket.IO to propagate room updates and board snapshots to connected clients. Active socket membership is runtime state; durable room membership and board data are stored in PostgreSQL.

## Alternatives Considered

- Socket-only room state: simpler at runtime, but room state would disappear when sockets disconnect or the API restarts.
- Granular board events with revisions: can support finer conflict handling, but adds more protocol and merge complexity than the current board needs.

## Consequences

### Benefits

- Room state survives disconnects and server restarts.
- Joined characters can be represented as board tokens from persistent room data.
- REST and Socket.IO have clear responsibilities: durable loading and live propagation.

### Trade-offs

- Full board snapshots are simple but use last-write-wins behavior.
- More granular synchronization would require revisions, merge rules, and additional client/server protocol design.
