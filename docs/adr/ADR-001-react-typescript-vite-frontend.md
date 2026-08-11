# ADR-001: Use React, TypeScript, and Vite for the Frontend

## Status

Accepted

## Context

D&D Simple needs a browser frontend that can support a character dashboard, visual inventory, tactical board, forms, protected routes, and reusable UI pieces. The frontend also needs to share TypeScript conventions with the backend and shared package.

## Decision

Use React with TypeScript and Vite for the frontend application in `apps/web`. React components are used for pages, dashboard panels, inventory controls, board UI, and shared interface elements. Vite provides the development server and production build workflow.

## Alternatives Considered

- Vue: provides a comparable component model and TypeScript support, but offered no clear project-specific advantage over React for the dashboard, inventory, and tactical-board requirements.
- Server-rendered frontend: simpler for mostly static pages, but less suited to the interactive dashboard, inventory, and board surfaces.

## Consequences

### Benefits

- Component composition fits dashboard panels, reusable controls, and game-board UI.
- TypeScript is used consistently across frontend, backend, and shared packages.
- Vite keeps local development and production builds straightforward.

### Trade-offs

- Client-side state management must be kept organized as dashboard and board interactions grow.
- Complex interactive pages can produce large frontend bundles if code splitting is not managed.
