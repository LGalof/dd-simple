# 00 Vision

## Project Purpose

D&D Simple is designed as a browser-based application for supporting Dungeons & Dragons 5e gameplay. The project brings together character tools, dice, inventory, sessions, and a virtual tabletop so that a group can use one shared digital environment during live play.

## Target Users

- Dungeons & Dragons players who need a digital character sheet and gameplay dashboard.
- Dungeon Masters who need session, map, token, and encounter support.
- Groups that want browser-based support during live gameplay.

## High-Priority Functionality

- Creation and editing of D&D characters.
- Display of key character information such as statistics, HP, initiative, armor class, and proficiency.
- Character dashboard for use during gameplay.
- Visual grid-based inventory with drag-and-drop item management.
- Dice system for d4, d6, d8, d10, d12, and d20.
- Virtual tabletop with maps, tokens, and characters.
- Realtime tabletop synchronization between multiple users.
- Session creation and joining through a code.
- Managing users inside a session.
- Dungeon Master and player roles.
- Attack and damage calculations.
- Modifiers, armor class, initiative, and bonus calculations.

## Medium-Priority Functionality

- Dice-roll history.
- Character statuses.
- NPC management.

## Lower-Priority Functionality

- Tabletop ruler and markers.
- Visual-interface improvements.

## Technical Direction

The planned technical architecture uses:

- React for the browser frontend.
- Express for the backend API.
- PostgreSQL for persistent data.
- Prisma for schema management and database access.
- WebSocket or equivalent realtime communication for tabletop synchronization.
- Drag-and-drop and graphical tabletop libraries where useful.
- Cloud hosting for the backend, database, and realtime layer.

## Data Persistence Direction

The application stores persistent user, character, inventory, dice, room, and board data in PostgreSQL. Reusable D&D reference data is stored separately from user-owned gameplay data so that character records can refer to shared rules, equipment, class, species, and background information.

## Cloud Deployment Direction

The application is intended to run as a cloud-hosted web system with a deployed frontend, backend API, PostgreSQL database, and realtime synchronization layer. Local development remains available for implementation and testing.

## Planned Integrations

Google SSO/OAuth was planned as an authentication integration. The product direction also allows use of supporting libraries for drag-and-drop inventory interaction, tactical-board rendering, and realtime communication.

## Product Boundaries

D&D Simple focuses primarily on D&D 5e and core gameplay mechanics. It does not include voice or video communication, a dedicated mobile application, complex campaign management, or complete automation of every rule, spell, feat, item, subclass, or optional interaction. Realtime synchronization focuses on important shared game state rather than every possible table interaction.
