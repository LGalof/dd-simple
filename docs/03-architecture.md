# 03 Architecture

## Overview

D&D Simple is a TypeScript monorepo with a React/Vite frontend, an Express API, a Socket.IO realtime layer, a shared TypeScript package, and PostgreSQL persistence through Prisma. The application runs locally on Windows and Linux and is deployed publicly on Render.

```text
Browser
  -> React/Vite frontend
  -> REST requests to Express API
  -> Socket.IO connection for room board synchronization

API service
  -> Express routes
  -> Socket.IO events
  -> Prisma Client
  -> PostgreSQL
```

## Monorepo Structure

| Path | Role |
|---|---|
| `apps/web` | React frontend, routes, pages, feature modules, Vite build, and web tests. |
| `apps/api` | Express API, Socket.IO server, Prisma services, controllers, routes, and API tests. |
| `packages/shared` | Shared TypeScript package for reusable types and utilities. |
| `infra` | Local PostgreSQL Docker Compose configuration. |
| `scripts` | Development and deployment helper scripts. |
| `.github/workflows` | GitHub Actions CI workflow. |

## Frontend

The frontend is a React single-page application built with Vite. Routing is handled by React Router. Protected pages use the auth context to check the logged-in user and redirect unauthenticated users to registration/login flows.

Main frontend areas:

- authentication context and protected routes
- My Characters and Create Character pages
- Character Dashboard
- inventory workspace
- tactical board
- room creation and room joining pages
- Socket.IO room client

The frontend uses browser local storage for the auth token, selected character, dashboard UI preferences, character-builder drafts, standalone inventory state, and standalone tactical board saves.

## Backend

The backend is a Node.js service using Express and TypeScript. `apps/api/src/app.ts` configures middleware, static frontend serving, and route registration. `apps/api/src/index.ts` attaches Socket.IO to the HTTP server and starts the process.

Main backend areas:

- health route
- authentication routes
- reference-data routes
- character routes
- room routes
- character, room, inventory, and reference services
- Prisma database access

Character build and gameplay state is persisted through Prisma-backed services.

## Realtime Layer

Socket.IO is used for room board synchronization. Socket connections authenticate with the same bearer token used by REST calls. After joining a room with an owned character, clients can send board state updates and receive room and board updates from other connected users. Room-context character dice rolls also use the joined socket room: the dashboard announces a persisted dice-roll ID, and the server validates the saved roll's room association before broadcasting it to that room.

## Database

PostgreSQL stores application data. Prisma manages the schema, migrations, and generated client. The database separates reusable reference data from user-owned data such as users, characters, character state, inventory, dice rolls, rooms, players, and board state.

Database structure is applied through checked-in Prisma migrations. Runtime services operate on the generated Prisma Client models.

## Public Deployment

D&D Simple is deployed publicly on Render at:

[https://dd-simple.onrender.com](https://dd-simple.onrender.com)

The same Render service hosts the React frontend, Express API, and Socket.IO
server.

## CI

GitHub Actions runs on pushes to `main` and pull requests. The CI job uses PostgreSQL 16, installs dependencies, validates the Prisma schema, generates Prisma Client, applies migrations, runs API and web tests, and builds the shared, web, and API workspaces.

## Development Environment

Windows development is supported through PowerShell helper scripts in `scripts/`. Linux development is supported through direct npm workspace commands and Docker Compose. Both workflows use the same source code, package scripts, Prisma schema, and local PostgreSQL configuration.

## Runtime Flows

### Authentication

1. The user registers or logs in through the frontend.
2. The API validates credentials and returns a signed bearer token.
3. The frontend stores the token in browser local storage.
4. REST requests include the token in the `Authorization` header.
5. Socket.IO uses the token during connection authentication.

### Character Loading and Autosave

1. The frontend loads the active character through protected character endpoints.
2. The dashboard hydrates build, gameplay, and UI state.
3. User edits update dashboard state.
4. Autosave sends changes to the API after a short delay.
5. The API validates ownership and persists character state through Prisma.

### Inventory Persistence

1. The dashboard inventory loads character-scoped inventory state.
2. The frontend updates the local workspace after item movement, equipment changes, or custom item changes.
3. Inventory state is saved locally and synchronized to the backend for authenticated character inventory.
4. The backend stores full workspace state and normalized reference-item rows.

### Dice Persistence

1. The user rolls from the manual dice tool or from a rollable character-sheet value.
2. The frontend evaluates the dice formula.
3. Character-associated rolls are sent to the API.
4. The API stores the roll in PostgreSQL and includes roll history when character data is loaded. Room-context rolls store the room database ID on `DiceRoll.roomId`.
5. In room context, the dashboard announces the saved roll ID through Socket.IO after persistence succeeds.
6. The room board loads the latest ten public persisted rolls for that room and merges validated realtime roll broadcasts by dice-roll ID.

### Room Join

1. The user creates a room or enters an existing room code.
2. The API validates the authenticated user and selected character.
3. The room stores player and character participation.
4. The room board opens and the Socket.IO client joins the matching socket room.

### Board Synchronization

1. A room board loads the current room board state.
2. Board edits produce updated board state.
3. The frontend sends board updates through Socket.IO.
4. The server stores the updated board state and broadcasts it to connected clients in the room, including the sender.
