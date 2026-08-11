# 08 Project Management

## Workflow

D&D Simple is managed through a Scrum-inspired incremental workflow. Work is organized into five iterations that align with the project plan: foundation, character workflows, inventory and sessions, virtual tabletop and realtime synchronization, and final rules/testing/deployment work.

The team used GitHub Issues and a Kanban board to organize work. Implementation was integrated through the shared Git repository and verified with workspace builds, automated tests, and GitHub Actions.

## Team Collaboration

The project team has four members. Team members use the same repository, package scripts, Prisma schema, database setup, and documentation.

The repository structure supports parallel work:

- frontend work in `apps/web`
- backend and realtime work in `apps/api`
- shared utilities in `packages/shared`
- database changes through Prisma schema and migrations
- documentation in `docs`
- local infrastructure in `infra`

## Task Areas

Project work is grouped into these responsibility areas:

- requirements, architecture, and documentation
- frontend routing and page structure
- authentication and protected routes
- character creation and dashboard workflows
- reference-data loading and character calculations
- inventory interface and persistence
- dice rolling and roll history
- room creation and joining
- tactical board tools
- Socket.IO synchronization
- PostgreSQL schema, migrations, and seed data
- deployment support
- testing and CI

## Development Practices

- Feature work is committed to Git and integrated through the shared repository.
- Database changes are represented through Prisma schema changes and migrations.
- Developers run workspace builds and tests locally before integration.
- GitHub Actions validates Prisma, tests, and builds on push and pull request workflows.
- Documentation is updated with the codebase so project documents remain aligned with the system.

## Quality and Review

Quality is maintained through TypeScript, Prisma validation, automated tests, CI, code review, and shared documentation. Larger features are broken into smaller tasks so frontend, backend, database, and documentation work can be reviewed and tested independently.
