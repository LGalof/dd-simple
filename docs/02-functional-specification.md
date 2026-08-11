# 02 Functional Specification

## Functional Scope

D&D Simple provides browser-based support for Dungeons & Dragons gameplay. The application focuses on character workflows, gameplay dashboard tools, visual inventory management, dice rolling, rooms, and a synchronized tactical board for live play.

The system focuses on D&D 5e core mechanics. It supports common gameplay needs without attempting to automate every rule, spell, feat, item, subclass, or optional interaction.

## Authentication

Users create an account with an email address, password and display name. The backend stores password hashes and returns a bearer token after registration or login. The frontend stores the token in browser local storage and uses it for protected API requests.

Authenticated users can access their character list, character dashboard, room creation, room joining, and room board pages. Public pages include login, registration, the standalone inventory sandbox, and the standalone tactical board.

## Character Management

Users can create, list, select, open, edit, and delete their own characters. Character creation uses reference data for species, class, background, alignment, ability scores, skills, and proficiencies.

The character list supports selecting an active character for the dashboard. Character data is stored in PostgreSQL and is scoped to the authenticated user.

## Character Dashboard

The dashboard is the main gameplay surface for a selected character. It displays character identity, level, class, species, background, ability scores, HP, armor class, initiative, speed, proficiency bonus, skills, saving throws, actions, spells, resources, inventory, notes, and extra gameplay panels.

The dashboard supports:

- editing build and gameplay state
- viewing derived character values
- managing HP and temporary HP
- applying and removing conditions
- reviewing actions, attacks, and damage formulas
- managing spells and spell slots
- tracking class and character resources
- using inventory and equipment state during play

## Character Calculations

The application calculates commonly used character values such as ability modifiers, proficiency-related values, skill and saving throw values, initiative, HP, armor class, actions, attacks, damage previews, defenses, resources, and selected spell information.

Character calculations combine stored character choices, reference data, selected feature choices, resource state, spell state, and selected inventory/equipment effects.

## Autosave and Local State

The Character Dashboard uses debounced autosave for character edits. Changes are saved after a short delay and are also flushed during selected browser lifecycle events. The interface indicates active saving and save errors, with retry support after a failed save.

The frontend also stores local UI state, selected character state, and character-builder drafts in browser local storage. Draft restoration compares the local draft with the character revision loaded from the backend before applying it.

## Conditions and HP

Characters can track current HP, maximum HP, temporary HP, and conditions. Conditions are selected from reference data and stored with the character. HP state is stored separately from the base character record so it can be updated during gameplay.

## Inventory

The inventory system provides a visual grid-based workspace. Users can move items between containers, rotate items, merge or split stacks, equip items into equipment slots, track attunement, add reference equipment, create custom items, and export or import inventory state.

The dashboard inventory is character-scoped. It persists a full serialized workspace state for layout and custom data, and it also stores normalized inventory rows for reference-equipment items that can be represented relationally.

The standalone `/inventory` page is available as a public sandbox for trying the inventory interface without opening a character dashboard.

## Dice Rolling and History

The dice system supports standard dice such as d4, d6, d8, d10, d12, d20, and d100. Users can roll manually or click rollable values from the character sheet, including ability checks, saving throws, skills, initiative, attacks, and damage formulas.

Rolls support normal, advantage, and disadvantage modes where applicable. Character-associated rolls are saved and displayed as character roll history.

## Rooms and Sessions

Authenticated users can create rooms with one of their characters and join existing rooms by code. A room stores the creator, participating characters, joined players, and shared board state.

When a character joins a room, the board creates or reuses a matching player token so the character can participate in tactical play.

## Tactical Board

The tactical board supports map-style gameplay with a grid, terrain, tokens, token HP, armor class, speed, initiative, turn resources, notes, fog, markers, templates, measurement tools, layers, and import/export features.

The board can be used in two ways:

- standalone board mode through `/board`
- room board mode through `/room/:roomCode`

Standalone board mode stores board state in browser local storage. Room board mode loads and saves board state through the backend.

## Realtime Synchronization

Room board synchronization uses Socket.IO. A logged-in user joins a socket room with a room code and owned character. Board edits are sent as state updates to the server, saved to the room, and broadcast to other connected clients in the same room.

The synchronized state includes the tactical board data used during room play, including tokens, terrain, fog, pins, templates, layers, settings, and initiative order.

## Reference Data

The backend provides reference data for:

- ability scores
- alignments
- skills
- species
- classes
- backgrounds
- conditions
- proficiencies
- equipment
- rule documents

Reference data is reusable across users and is seeded into PostgreSQL separately from user-owned data.
