# 01 Project Plan

## Delivery Approach

The project is delivered incrementally through iterations suitable for university coursework.

The team uses a task-based workflow with GitHub Issues and a Kanban-style project board. Tasks are grouped by iteration and moved through workflow states such as backlog, ready, in progress, review, testing, and done.

Development follows an incremental approach:

1. define the core idea and documentation
2. set up the repository and architecture
3. implement backend persistence and API endpoints
4. implement frontend workflows
5. validate, improve, deploy, and prepare the final presentation

## Team Practices

The project uses the following practices:

- maintain documentation in `docs/`
- keep development tasks visible in GitHub Issues / project board
- use Git commits to track implementation progress
- keep frontend and backend separated through a monorepo structure
- use TypeScript across frontend, backend, and shared types
- use Prisma migrations for database structure changes
- use CI build checks for frontend and backend validation
- review major changes before merging or presenting them as complete

## Iteration 1 – Foundation, Architecture, Data Model, and Basic Character System

### Planned focus

The first iteration focuses on establishing the project foundation.

Planned work:

- repository setup
- monorepo structure
- frontend scaffold
- backend scaffold
- PostgreSQL setup
- Prisma setup
- architecture documentation
- initial data model
- basic character model
- basic character dashboard
- authentication foundation

### Current implementation status

The current project already includes:

- npm workspace monorepo
- React + Vite frontend application
- Express + TypeScript backend API
- PostgreSQL local development environment through Docker Compose
- Prisma schema and migration support
- CI workflow for building frontend and backend
- shared TypeScript package
- backend health endpoint
- local authentication endpoints
- protected character endpoints
- character database schema
- reference data schema
- character CRUD API
- My Characters frontend page
- initial Character Dashboard frontend page

### Notes

The original project vision planned Google SSO/OAuth. The current implementation uses local email/password authentication with bearer tokens for the MVP foundation. Google SSO/OAuth remains a planned future improvement.

## Iteration 2 – Character Creator and Character Sheet

### Planned focus

The second iteration focuses on the core character creation and sheet experience.

Planned work:

- character creator flow
- ability scores
- ability score modifier calculations
- basic derived character statistics
- class/species/background selection
- live character sheet preview

### Current implementation status

The current project already includes significant work for this iteration:

- Create Character page
- My Characters page integration
- character selection and opening flow
- Character Dashboard / Builder layout
- species, background, and class selection panels
- ability score rolling
- ability assignment behavior
- live character preview
- HP preview and HP management
- skill calculations and proficiency display
- saving throw display
- passive senses display
- AC, initiative, speed, and proficiency bonus display
- manual Save Build action for persisting builder changes

### Notes

The functional specification describes auto-save as the desired behavior. The current implementation still uses a manual Save Build action. This is acceptable for the current project stage because it reduces persistence complexity while the builder state is still evolving. Auto-save can be added later.

## Iteration 3 – Inventory, Drag-and-Drop, Session Foundation, and First Deployment

### Planned focus

The third iteration focuses on inventory, drag-and-drop interaction, session foundations, and the first deployment.

Planned work:

- inventory system
- drag-and-drop inventory management
- session creation and joining
- first deployment

### Current implementation status

The current project already contains an inventory prototype:

- inventory sandbox page
- item containers
- equipment slots
- draggable item model
- item metadata such as weight, rarity, value, damage, AC bonus, and attack bonus
- local browser persistence for sandbox state
- integration of inventory workspace into the Character Dashboard

### Notes

The current inventory implementation is a frontend prototype. It is not yet fully connected to the backend character inventory model. Backend persistence exists in the Prisma schema, but full integration remains future work.

The project does not yet show a completed production deployment configuration in the repository.

## Iteration 4 – Virtual Tabletop and Realtime Synchronization

### Planned focus

The fourth iteration focuses on the virtual tabletop and realtime gameplay synchronization.

Planned work:

- virtual tabletop
- token movement
- map/grid display
- HP values on tokens
- initiative order
- WebSocket-based realtime synchronization

### Current implementation status

The current project already contains a tactical board prototype:

- board grid
- terrain painting
- draggable tokens
- token HP and initiative values
- initiative ordering
- board saving in browser storage
- browser-tab synchronization through local storage events

### Notes

The current tactical board is a frontend prototype. It is not yet connected to backend sessions or WebSocket realtime synchronization. It is useful as a UI and interaction prototype for the later realtime tabletop system.

## Iteration 5 – Rule Engine, Dice System, UI Polish, Testing, and Final Deployment

### Planned focus

The fifth iteration focuses on final gameplay logic, polish, testing, and deployment.

Planned work:

- rule engine improvements
- dice rolling system
- dice roll history
- UI improvements
- testing
- final deployment
- final presentation preparation

### Current implementation status

The current project already includes parts of the future rule engine foundation:

- ability modifier calculation
- proficiency bonus calculation in the frontend sheet
- HP calculation logic
- basic AC calculation
- initiative calculation
- skill and saving throw display
- dice roll table in the Prisma schema

### Notes

A full dice rolling system is not yet implemented as a complete gameplay feature. The database model supports dice rolls, but the UI/API workflow for general dice rolling still needs to be completed.

## Current Project Summary

Completed or partially completed areas:

- project setup
- development environment
- database foundation
- backend API foundation
- authentication foundation
- character CRUD
- reference-data API
- character builder prototype
- live character sheet
- inventory prototype
- tactical board prototype
- CI build validation

Main remaining areas:

- Google SSO/OAuth integration
- auto-save implementation
- backend-persistent inventory
- session system
- WebSocket realtime synchronization
- complete dice system
- rule engine expansion
- production deployment
- final testing and documentation polish
