# 00 Vision

## Project

D&D Simple is a web application for supporting Dungeons & Dragons gameplay in a modern browser-based environment.

## Vision Statement

The platform will provide a digital toolkit for players and Dungeon Masters during live sessions. It is intended to combine core gameplay support tools into one coherent experience while remaining accessible for a university team to design, build, test, and present.

The long-term product vision is to combine:

- character management
- character dashboard / sheet support
- inventory management
- dice rolling
- session support
- virtual tabletop interaction
- realtime collaboration

## Initial Product Direction

The project is developed as a browser-based application with a React frontend, an Express backend, and PostgreSQL persistence.

The system is built around a clear separation between user-owned data and reusable D&D reference data.

User-owned data includes:

- users
- characters
- character ability scores
- character skills
- character proficiencies
- inventory items
- dice rolls

Reference data includes:

- ability scores
- skills
- species
- classes
- backgrounds
- proficiencies
- equipment
- generic rule documents

## Current Implementation Direction

The current implementation focuses on proving the core product experience:

- users can register and log in using a local email/password authentication flow
- protected routes prevent unauthenticated access to character pages
- users can create and manage their own characters
- the backend stores character data in PostgreSQL through Prisma
- the frontend provides a My Characters page and a Character Dashboard
- the Character Dashboard contains a builder sidebar and a live character sheet preview
- the system can load D&D reference data from the backend
- early inventory and tactical board prototypes exist for future iterations

## Planned Product Direction

The initial project vision includes Google SSO/OAuth, realtime WebSocket synchronization, session management, dice rolling, inventory management, and virtual tabletop functionality.

Some of these features are already represented as prototypes, but they are not all production-ready yet.

Planned improvements include:

- replacing or extending local authentication with Google SSO/OAuth
- making the inventory system persistent per character
- adding a real dice rolling system connected to character actions
- implementing session creation and joining
- adding Dungeon Master and player roles
- implementing WebSocket-based realtime synchronization
- connecting the tactical board to backend/session state
- preparing production deployment

## Product Boundaries

The project is inspired by Dungeons & Dragons 5e gameplay, but it does not aim to implement the full ruleset.

The system will not include:

- a complete implementation of all D&D rules
- voice or video communication
- a dedicated mobile application
- complex campaign management
- every possible class, spell, feat, item, or optional rule interaction

The goal is to create a focused, demonstrable system that supports the most important gameplay workflows for a university project.
