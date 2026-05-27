# 03 Architecture

## Overview

D&D Simple uses a monorepo architecture with separate frontend, backend, shared package, documentation, infrastructure, and CI areas.

The architecture is designed to support incremental development by a student team. The system currently focuses on character management, reference data, authentication, character building, inventory prototyping, and tactical board prototyping.

## Repository Layers

- `apps/web`: user-facing React application
- `apps/api`: backend API service using Express
- `packages/shared`: shared TypeScript definitions and utilities
- `docs`: project documentation and architecture records
- `infra`: local infrastructure support files
- `.github/workflows`: automated build validation

## Architectural Intent

This structure supports:

- separation of concerns
- easier collaboration in a student team
- consistent TypeScript tooling
- independent frontend and backend development
- shared domain types where useful
- future expansion into additional packages or services
- clear documentation of decisions and implementation progress

---

## Runtime Architecture

The current runtime architecture contains:

1. Browser-based React frontend
2. Express backend API
3. PostgreSQL database
4. Prisma ORM layer
5. Local Docker infrastructure for development
6. GitHub Actions CI for build validation

Current local development flow:

```text
User Browser
  -> React/Vite frontend
  -> Express API
  -> Prisma Client
  -> PostgreSQL database
```

---

## Frontend Architecture

## Technology

The frontend is implemented with:

- React
- TypeScript
- Vite
- React Router
- lucide-react icons

## Main frontend responsibilities

The frontend is responsible for:

- rendering the user interface
- routing between pages
- managing authentication state
- protecting authenticated pages
- calling backend APIs
- displaying character data
- managing character builder state
- showing live character sheet previews
- prototyping inventory interactions
- prototyping tactical board interactions

## Main frontend pages

The current frontend includes:

- `/prijava` – login page
- `/registracija` – registration page
- `/characters` – My Characters page
- `/characters/new` – Create Character page
- `/` – Character Dashboard page
- `/inventory` – Inventory Sandbox page
- `/board` – Tactical Board prototype

## Authentication flow

The frontend uses an `AuthProvider` to store authentication state.

Current behavior:

- token is stored in browser local storage
- current user is loaded from `/auth/me`
- invalid tokens are cleared automatically
- protected routes redirect unauthenticated users to `/prijava`

## Character state flow

The Character Dashboard uses a builder hook to manage local builder state.

Current flow:

```text
Loaded Character
  -> Builder State
  -> User changes class/species/background/ability/HP values
  -> Preview Character is recalculated
  -> Character Sheet updates
  -> User clicks Save Build
  -> Backend PATCH /characters/:id
```

Auto-save is planned, but the current implementation uses manual build saving.

---

## Backend Architecture

## Technology

The backend is implemented with:

- Node.js
- TypeScript
- Express
- Prisma
- PostgreSQL

## Backend structure

The backend follows a layered structure:

```text
src/index.ts
  starts the API server

src/app.ts
  configures Express, middleware, and route modules

src/routes/
  defines HTTP routes

src/controllers/
  handles request validation and HTTP responses

src/services/
  contains business logic and database operations

src/middleware/
  contains reusable Express middleware

src/lib/
  contains shared backend helpers such as Prisma Client
```

## Current backend routes

The backend currently exposes:

- `GET /health`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /references/ability-scores`
- `GET /references/skills`
- `GET /references/species`
- `GET /references/classes`
- `GET /references/backgrounds`
- `GET /references/proficiencies`
- `GET /references/equipment`
- `GET /references/rules/:category`
- `GET /references/rules/:category/:index`
- `GET /characters`
- `GET /characters/:id`
- `POST /characters`
- `PATCH /characters/:id`
- `DELETE /characters/:id`

Character routes are protected by authentication middleware.

## Authentication architecture

The original product vision plans Google SSO/OAuth.

The current implementation uses local email/password authentication for MVP development.

Current authentication behavior:

- users register with email, password, and optional display name
- passwords are hashed with scrypt
- login returns a signed token
- the frontend sends the token as a bearer token
- `requireAuth` middleware verifies the token and attaches the authenticated user to the request

This approach is sufficient for local MVP development. Google SSO/OAuth remains a planned future improvement.

---

## Database Architecture

## Technology

The database layer uses:

- PostgreSQL
- Prisma ORM
- Prisma migrations
- Prisma seed scripts

Local PostgreSQL is provided through Docker Compose.

## Data model groups

The current Prisma schema can be divided into two main groups:

1. User-owned data
2. Reference data

## User-owned data

User-owned data includes:

- `User`
- `Character`
- `CharacterAbilityScore`
- `CharacterSkill`
- `CharacterProficiency`
- `CharacterInventory`
- `CharacterChoice`
- `DiceRoll`

These tables represent data created by or connected to a specific user.

## Reference data

Reference data includes:

- `RefAbilityScore`
- `RefSkill`
- `RefSpecies`
- `RefClass`
- `RefBackground`
- `RefProficiency`
- `RefEquipment`
- `RefRuleDocument`

These tables represent reusable D&D-inspired game data that can be referenced by many characters.

## Data separation principle

The database separates reusable game definitions from user character data.

Example:

```text
RefClass
  describes a reusable class definition

Character
  stores which class a user selected
```

This avoids duplicating class/species/background data for every user character.

---

## Reference Data Architecture

The backend contains reference endpoints for retrieving ability scores, skills, species, classes, backgrounds, proficiencies, equipment, and rule documents.

Seed scripts populate the reference tables from JSON data.

The frontend Character Builder uses reference data to build selection options for:

- species
- background
- class
- class features

If reference data is unavailable, the frontend can fall back to built-in builder reference data.

---

## Character System Architecture

## Backend character flow

Character API requests follow this flow:

```text
HTTP Request
  -> Character Route
  -> requireAuth Middleware
  -> Character Controller
  -> Character Service
  -> Prisma Client
  -> PostgreSQL
```

The controller validates incoming request bodies.

The service performs business logic such as:

- checking that referenced species/class/background records exist
- validating skill indexes
- calculating ability modifiers
- calculating max HP
- calculating armor class
- setting speed from species
- storing ability scores
- storing skill proficiency records
- storing class saving throw proficiencies

## Frontend character flow

Character-related frontend work is split across:

- character pages
- character hooks
- character components
- character API helpers
- character utility functions
- shared character types

The Character Dashboard constructs a preview character from persisted character data and local builder state. This allows the sheet to update immediately before the user saves the build.

---

## Inventory Architecture

The current inventory system exists mainly as a frontend prototype.

It supports:

- item containers
- item dimensions
- equipment slots
- drag/drop-style item movement
- item metadata
- local browser storage
- dashboard inventory workspace integration

The Prisma schema already contains `CharacterInventory`, which can support backend persistence later.

Future work should connect the frontend inventory prototype to the backend persistence layer.

---

## Tactical Board Architecture

The current tactical board exists as a frontend prototype.

It supports:

- a grid board
- terrain types
- draggable tokens
- token HP
- token initiative
- initiative ordering
- saved board states in browser local storage
- synchronization between browser tabs through storage events

This is not yet a full realtime virtual tabletop.

Future work should introduce:

- backend session state
- WebSocket synchronization
- shared board state
- user roles
- player/DM permissions

---

## CI Architecture

The project uses GitHub Actions for build validation.

The current CI workflow:

1. checks out the repository
2. sets up Node.js 22
3. installs dependencies
4. builds the frontend workspace
5. builds the backend workspace

This ensures that TypeScript/build errors are detected when changes are pushed or submitted through pull requests.

---

## Current Architectural Gaps

The current architecture is functional for local development and MVP prototyping, but the following gaps remain:

- Google SSO/OAuth is planned but not yet implemented
- auto-save is planned but the current builder uses manual Save Build
- inventory persistence is modeled but not fully connected to the frontend inventory prototype
- tactical board is local-only and not backed by sessions or WebSockets
- production deployment configuration is not yet complete
- full dice rolling workflow is not yet implemented
- full rule engine behavior is not yet implemented
- API documentation still needs to be expanded
- UML diagrams still need to be aligned with the current implementation

---

## Future Architecture Direction

The planned architecture should evolve toward:

```text
Browser Client
  -> React Web App
  -> Express REST API
  -> PostgreSQL via Prisma
  -> WebSocket Realtime Layer
  -> Shared Session / Tabletop State
```

Planned future improvements:

- Google SSO/OAuth integration
- production hosting for frontend and backend
- managed PostgreSQL database
- WebSocket server for realtime tabletop synchronization
- persistent inventory system
- dice rolling API and history
- session system with join codes
- role-based session permissions
- more complete automated rule calculations
