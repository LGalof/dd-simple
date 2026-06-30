# ADR-007 Persistent Room Board Sync

## Status

Proposed

## Context

Rooms and tactical board state must survive API restarts and browser disconnects so players can continue a game later.

## Decision

Store rooms, room players, and the latest tactical board snapshot in PostgreSQL through Prisma. Use Socket.IO for live room updates and board snapshot broadcasts, while keeping REST endpoints as the initial room loading path.

## Consequences

- room membership no longer depends on active socket connections
- joined player characters are represented as player tokens on the room board
- board synchronization is last-write-wins and can be refined later with smaller events or conflict handling
