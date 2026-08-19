# 01 Project Plan

## Development Approach

This document records the original project plan for D&D Simple. The initial plan divided the intended work into five Scrum-inspired iterations that moved from requirements and architecture toward gameplay features, synchronization, testing, and deployment.

The iteration descriptions below represent planned sequencing and intended scope. They should not be interpreted as proof that implementation later followed five strict sequential sprints. Actual execution evidence, team coordination, and project-management records are documented separately in the project-management documentation.

The team contains four members. Work is coordinated through Git, GitHub Issues, and a Kanban-style task board, with implementation changes reviewed through normal GitHub workflow and validated through local checks and CI.

## Team Cooperation

The team works across both Windows and Linux development environments. Documentation and commands therefore describe both PowerShell and Bash workflows where they differ.

The monorepo structure keeps frontend, backend, shared code, documentation, and infrastructure configuration in predictable locations so that team members can work on separate areas while using the same repository.

## Iteration 1: Requirements, Architecture, and Foundation

Objectives:

- Define the application purpose and target users.
- Establish the repository structure.
- Set up the React frontend and Express backend.
- Configure PostgreSQL and Prisma.
- Create the first database model for users, characters, and reference data.
- Prepare the initial character dashboard direction.
- Establish authentication.

Main work packages:

- requirements and vision documentation
- architecture decisions
- monorepo setup
- initial frontend pages
- initial backend routes
- Prisma schema and migrations
- local database setup
- authentication foundation

## Iteration 2: Character Creator and Character Sheet

Objectives:

- Build the character creation workflow.
- Support basic character attributes and modifiers.
- Display a usable character sheet and dashboard.
- Connect character state to the backend database.

Main work packages:

- character list and character creation pages
- character dashboard layout
- class, species, background, alignment, and level data
- ability score editing and derived modifiers
- HP, armor class, initiative, speed, proficiency, skills, and saving throws
- character update flow and dashboard persistence

## Iteration 3: Inventory, Sessions, and First Deployment

Objectives:

- Add visual inventory management.
- Add drag-and-drop item interaction.
- Introduce room/session creation and joining.
- Prepare the first deployed environment.

Main work packages:

- inventory workspace and item model
- containers, grids, equipment slots, and item movement
- character inventory persistence
- room creation and room code joining
- deployment setup for Render
- environment variable and database deployment preparation

## Iteration 4: Virtual Tabletop and Realtime Synchronization

Objectives:

- Build a virtual tabletop for live gameplay.
- Support token movement, turn order, HP, and tactical board tools.
- Synchronize important room board state between users.

Main work packages:

- tactical board grid
- terrain, tokens, HP, initiative, and turn tracking
- fog, markers, templates, ruler, and map tools
- Socket.IO room synchronization
- persistent board state for rooms
- room/player board token integration

## Iteration 5: Rules, Dice, Testing, and Final Deployment

Objectives:

- Improve rule-engine behavior.
- Add dice rolling and roll history.
- Polish user-facing workflows.
- Strengthen automated validation.
- Finalize deployment and documentation.

Main work packages:

- attack and damage calculations
- spell, resource, action, defense, and feature-effect handling
- manual dice roller and character-sheet dice rolls
- character-level dice history
- frontend and backend tests
- CI validation
- final deployment configuration
- final project documentation

## Quality Practices

- Git is used for version control and collaboration.
- GitHub Issues and a Kanban-style workflow are used for task planning.
- TypeScript is used across the frontend, backend, and shared package.
- Prisma migrations define database changes.
- CI validates Prisma, runs tests, and builds the workspaces.
- Documentation is maintained alongside the source code.
- Local development supports both Windows and Linux.
