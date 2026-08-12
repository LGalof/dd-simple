# 04 Database

## Overview

D&D Simple stores persistent data in PostgreSQL and accesses it through Prisma. The database design separates reusable D&D reference data from user-owned gameplay data.

The Prisma schema is located at:

```text
apps/api/prisma/schema.prisma
```

Migrations are located at:

```text
apps/api/prisma/migrations/
```

## Model Groups

| Group | Main models | Purpose |
|---|---|---|
| Users | `User` | Stores application accounts and owns characters, dice rolls, hosted rooms, and room participation. |
| Characters | `Character` | Stores the main character record and selected species, class, background, alignment, level, HP, AC, speed, and subclass state. |
| Character build state | `CharacterAbilityScore`, `CharacterSkill`, `CharacterProficiency`, `CharacterChoice`, `CharacterFeatureChoiceSelection`, `CharacterLanguage` | Stores build selections and character-specific choices. |
| Character gameplay state | `CharacterCondition`, `CharacterHitPointState`, `CharacterSpellcastingState`, `CharacterResourceState` | Stores condition, HP, spellcasting, and resource state used during gameplay. |
| Inventory | `CharacterInventory`, `CharacterInventoryState` | Stores normalized inventory rows and serialized visual inventory workspace state. |
| Dice | `DiceRoll` | Stores dice-roll history connected to users and characters. |
| Rooms | `Room`, `RoomPlayer` | Stores room codes, room creators, players, selected characters, and board state. |
| Reference data | `RefAbilityScore`, `RefSkill`, `RefSpecies`, `RefSpeciesTrait`, `RefSpeciesSizeOption`, `RefSubspecies`, `RefLanguage`, `RefCondition`, `RefClass`, `RefClassLevel`, `RefClassFeature`, `RefClassProficiencyGrant`, `RefClassSkillChoice`, `RefClassSkillChoiceOption`, `RefClassPrimaryAbility`, `RefAlignment`, `RefBackground`, `RefBackgroundProficiencyGrant`, `RefBackgroundAbilityOption`, `RefBackgroundFeatGrant`, `RefProficiency`, `RefEquipment`, `RefRuleDocument` | Stores reusable D&D 5e-inspired rules and reference content. |

## Ownership Rules

- A `User` owns many `Character` records.
- A `Character` belongs to exactly one `User`.
- Character names are unique per user through the `(userId, name)` constraint.
- Character-related state tables are connected to the character through `characterId`.
- Specialized character-state records use one-to-one character relations where the schema stores a single state row for a character.
- A `DiceRoll` belongs to a user and character.
- A `Room` stores its creator user and creator character.
- A `RoomPlayer` connects a room, user, and character.
- A room player entry is unique by `(roomId, userId, characterId)`.

These rules allow the backend to scope user-owned data to the authenticated user.

## Reference Data and User-Owned Data

Reference data describes reusable game concepts such as ability scores, skills, species, classes, backgrounds, conditions, proficiencies, equipment, and rule documents.

User-owned data stores what a specific user or character selected or changed during play. Character records refer to reference data by index or relation while storing gameplay-specific values in user-owned tables.

## Character State

Character state is distributed across the base `Character` model and related tables. This keeps the main character record readable while allowing specialized state to evolve independently.

Character state includes:

- ability scores and base scores
- selected skills and proficiencies
- selected species, class, background, alignment, subclass, and feature choices
- selected languages
- HP and temporary HP
- conditions
- spellcasting state
- resource state

Dedicated state models store spell selections, slot usage, and character resource usage during gameplay.

## Inventory

Inventory uses two persistence forms:

- `CharacterInventory` stores normalized item rows for equipment that can be represented as database records.
- `CharacterInventoryState` stores the serialized visual inventory workspace.

The serialized workspace supports the grid-based inventory interface, including layout, containers, custom items, and visual state.

## Dice Rolls

`DiceRoll` stores roll type, formula, result, mode, individual dice values, modifier, reason, visibility, user, and character. Character queries include recent or full roll history depending on the endpoint.

## Rooms and Board State

`Room` stores a unique room code, creator identifiers, timestamps, joined players, and JSON board state. `RoomPlayer` stores the user and character that joined a room.

The tactical board state is stored as JSON so the frontend can persist rich board data such as tokens, terrain, fog, pins, templates, layers, settings, and initiative order.

## Migrations

Prisma schema and checked-in migrations define the database structure. Migrations cover the initial character schema, reference data, authentication data, character build and gameplay state, inventory state, spell and resource state, and persistent rooms.

Deployment uses Prisma migration commands to apply checked-in migrations to the target PostgreSQL database.

## Seed Data

The seed script loads D&D 5e-inspired reference data from local JSON files under:

```text
apps/api/prisma/seed-data/
```

The seed process populates ability scores, skills, species, classes, backgrounds, proficiencies, equipment, conditions, and rule documents used by the frontend and backend.
