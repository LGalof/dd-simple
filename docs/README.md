# Documentation

| Document | Purpose |
|---|---|
| [Vision](00-vision.md) | Describes the original product vision, priorities, users, technical direction, and product boundaries. |
| [Project Plan](01-project-plan.md) | Describes the Scrum-based project approach, five iterations, team cooperation, and quality practices. |
| [Functional Specification](02-functional-specification.md) | Describes the current user-facing application workflows and functional scope. |
| [Architecture](03-architecture.md) | Describes the current monorepo architecture, runtime components, deployment shape, and major system flows. |
| [Database](04-database.md) | Describes the Prisma/PostgreSQL data model, ownership rules, reference data, migrations, and seeding approach. |
| [Testing](05-testing.md) | Describes test tools, test organization, commands, covered areas, and CI verification. |
| [Deployment](06-deployment.md) | Describes the Render deployment topology, environment variables, build/start commands, migrations, and health checks. |
| [API and Realtime](07-api-realtime.md) | Lists REST endpoints, authentication rules, room ownership rules, Socket.IO events, and synchronization flow. |
| [Project Management](08-project-management.md) | Describes the project workflow, issue tracking approach, team collaboration, and quality process. |
| [ADR-001: Use React, TypeScript, and Vite for the Frontend](adr/ADR-001-react-typescript-vite-frontend.md) | Records the frontend framework decision. |
| [ADR-002: Use Node.js, Express, and TypeScript for the Backend](adr/ADR-002-node-express-typescript-backend.md) | Records the backend framework decision. |
| [ADR-003: Use PostgreSQL and Prisma for Persistence](adr/ADR-003-postgresql-prisma-persistence.md) | Records the database and ORM decision. |
| [ADR-004: Use Socket.IO for Realtime Room Synchronization](adr/ADR-004-socketio-realtime-room-sync.md) | Records the realtime communication decision. |
| [ADR-005: Use Local Password Authentication with Signed Bearer Tokens](adr/ADR-005-local-bearer-token-authentication.md) | Records the authentication decision. |
| [ADR-006: Centralize Character Effects Derivation in the Backend](adr/ADR-006-centralized-character-effects-layer.md) | Records the character effects architecture decision. |
| [ADR-007: Persist Room Board State and Synchronize Snapshots](adr/ADR-007-persistent-room-board-state.md) | Records the persistent board synchronization decision. |
| [UML README](uml/README.md) | Lists the current UML diagrams. |
| [Use Case Overview](uml/use-case-overview.svg) | Shows the main user interactions with D&D Simple. |
| [Room Realtime Sequence](uml/sequence-room-realtime-sync.svg) | Shows the REST, persistence, and Socket.IO room board plus room-specific dice feed flow. |
| [Character Autosave Activity](uml/activity-character-edit-autosave.svg) | Shows character editing and autosave behavior. |
| [Production Deployment](uml/deployment-production.svg) | Shows the browser, Render service, and PostgreSQL topology. |
| [Current Prisma ER Overview](uml/er-current-prisma.svg) | Shows the main Prisma entities and relationships. |
