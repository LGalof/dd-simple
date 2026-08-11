# ADR-002: Use Node.js, Express, and TypeScript for the Backend

## Status

Accepted

## Context

D&D Simple needs a backend that can expose REST endpoints, run Socket.IO for room synchronization, access PostgreSQL through Prisma, and remain understandable for a university team. The project also benefits from using TypeScript across frontend, backend, and shared code.

## Decision

Use Node.js with Express and TypeScript for the API service in `apps/api`. The backend is organized around route modules, controllers, services, middleware, and Prisma access. Socket.IO is attached to the same HTTP server as the Express application.

## Alternatives Considered

- NestJS: provides more structure, but adds framework concepts that are heavier than this service needs.
- Backend in another language/framework: could provide stronger built-in structure, but would remove the shared TypeScript workflow across frontend, backend, and the shared package.

## Consequences

### Benefits

- The same language and type system are used across the monorepo.
- Express supports a small REST API with simple route/controller/service boundaries.
- Socket.IO integrates cleanly with the Node HTTP server.

### Trade-offs

- Express leaves more architectural discipline to the project than a more opinionated framework.
- Validation, error handling, and service boundaries must remain consistent through local conventions.
