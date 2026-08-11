# 05 Testing

## Test Tools

D&D Simple uses TypeScript compilation, Vitest, Node's built-in test runner, Prisma validation, Docker Compose validation, and GitHub Actions CI.

| Area | Tool |
|---|---|
| Shared package build | TypeScript compiler |
| Frontend build | TypeScript compiler and Vite |
| Backend build | TypeScript compiler |
| Frontend tests | Vitest with `jsdom` |
| Backend tests | Node test runner with `tsx` |
| Database schema validation | Prisma CLI |
| Local infrastructure validation | Docker Compose |
| CI | GitHub Actions |

## Test Organization

Frontend tests are located in `apps/web/src/`. They cover character-builder behavior, dashboard autosave behavior, and dice rolling utilities.

Backend tests are located in `apps/api/src/`. Backend tests cover authentication, character-state persistence, migration behavior, and selected character-effects derivation logic.

## Local Test Commands

Build all workspaces:

```bash
npm run build
```

Run frontend tests:

```bash
npm --workspace @dd-simple/web run test
```

Run backend tests:

```bash
npm --workspace @dd-simple/api run test
```

Validate the Prisma schema:

```bash
npx prisma validate --schema apps/api/prisma/schema.prisma
```

Validate the local Docker Compose configuration:

```bash
docker compose -f infra/docker-compose.yml config
```

## Major Covered Areas

- Dice formula parsing and roll behavior.
- Dashboard autosave timing and retry behavior.
- Character-builder local draft handling.
- Authentication middleware behavior.
- Character gameplay-state persistence and related migration behavior.
- Selected character-effects derivation logic for dashboard actions, defenses, resources, spells, stats, sources, and weapon actions.

## CI Verification

The GitHub Actions workflow runs on pushes to `main` and on pull requests. The CI job:

- starts a PostgreSQL 16 service
- installs dependencies
- validates the Prisma schema
- generates Prisma Client
- applies migrations to the CI database
- runs backend tests
- runs frontend tests
- builds the shared package
- builds the web app
- builds the API

## Developer Validation Workflow

Before merging or presenting changes, developers should run the relevant workspace tests and the full build. Database-related changes should also run Prisma validation and migrations in a controlled local environment.
