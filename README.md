# D&D Simple

D&D Simple is a software project for building a web application that supports Dungeons & Dragons gameplay. The system is planned as a digital toolkit for character management, session support, inventory management, dice rolling, and virtual tabletop workflows.

The current implementation already includes a working monorepo setup, a React frontend, an Express backend, PostgreSQL persistence through Prisma, local authentication, character CRUD, reference-data APIs, a character dashboard/builder, an inventory prototype, and a tactical board prototype.

## Repository Structure

```text
apps/
  web/        React + TypeScript + Vite frontend
  api/        Node.js + TypeScript + Express backend
packages/
  shared/     Shared types and utilities
docs/
  uml/        UML diagrams
  adr/        Architecture decision records
infra/        Infrastructure support files
.github/
  workflows/  CI workflows
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the backend environment file:
   ```bash
   copy apps\api\.env.example apps\api\.env
   ```
3. Start PostgreSQL:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```
4. Generate the Prisma client:
   ```bash
   npm run prisma:generate --workspace @dd-simple/api
   ```
5. Run Prisma migrations:
   ```bash
   npm run prisma:migrate --workspace @dd-simple/api
   ```
6. Seed reference data if needed:
   ```bash
   npm run prisma:seed --workspace @dd-simple/api
   ```
7. Start the backend:
   ```bash
   npm run dev:api
   ```
8. Start the frontend:
   ```bash
   npm run dev:web
   ```

## Local PostgreSQL with Docker

- Start PostgreSQL:
  ```bash
  docker compose -f infra/docker-compose.yml up -d
  ```
- Stop PostgreSQL:
  ```bash
  docker compose -f infra/docker-compose.yml down
  ```

The local database uses PostgreSQL 16 and is configured in `infra/docker-compose.yml`.

## Prisma Commands

- Generate Prisma client:
  ```bash
  npm run prisma:generate --workspace @dd-simple/api
  ```
- Run Prisma migrations:
  ```bash
  npm run prisma:migrate --workspace @dd-simple/api
  ```
- Seed reference data:
  ```bash
  npm run prisma:seed --workspace @dd-simple/api
  ```
- Seed local demo data:
  ```bash
  npm run seed:demo --workspace @dd-simple/api
  ```
- Open Prisma Studio:
  ```bash
  npm run prisma:studio --workspace @dd-simple/api
  ```

## Backend Development

- Run the backend:
   ```bash
   npm run dev:api
   ```

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
- protected character CRUD endpoints under `/characters`

## Frontend Development

- Run the frontend:
  ```bash
  npm run dev:web
  ```

The frontend currently includes:

- login and registration pages
- protected routing
- My Characters page
- Create Character page
- Character Dashboard / Builder
- live character sheet preview
- ability score rolling
- class/species/background selection panels
- inventory sandbox
- tactical board prototype

## Current Scope

The current implementation includes:

- monorepo workspace structure
- React frontend scaffold and main application pages
- Express API scaffold and route structure
- local email/password authentication with bearer-token based sessions
- Prisma schema for PostgreSQL
- reference-data persistence for D&D 5e-inspired data
- character creation, listing, update, and deletion
- protected character data per user
- character builder and live character sheet prototype
- inventory prototype with drag-and-drop style item management
- tactical board prototype using local browser persistence
- basic CI workflow for frontend and backend builds

Google SSO/OAuth, production deployment, WebSocket-based realtime synchronization, full session management, and a complete rules engine are planned future improvements.

## Documentation

Project documentation is maintained in `docs/`.

Important documents:

- `docs/00-vision.md`
- `docs/01-project-plan.md`
- `docs/02-functional-specification.md`
- `docs/03-architecture.md`

## Acknowledgements

The project uses D&D 5e reference data from the open-source 5e-bits/5e-database project.

Source:
https://github.com/5e-bits/5e-database
