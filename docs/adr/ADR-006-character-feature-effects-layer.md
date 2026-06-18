# ADR-006 Character Feature Effects Layer

## Status

Accepted

## Context

The dashboard needs a consistent way to turn reference rules plus saved character choices into concrete gameplay results such as actions, defenses, and later derived stats. The previous implementation inferred actions and defenses in separate services, which duplicated logic and made subclass and heritage handling fragile.

## Decision

Introduce a central backend feature-effects layer in `apps/api/src/services/character-effects.service.ts`. This layer resolves the effective class, species, subclass, and subspecies for a character, builds the active feature source list, and derives normalized action and defense entries from that single source of truth.

## Consequences

- actions and defenses now use the same resolver instead of separate rule parsing paths
- subclass and species heritage choices can be applied consistently, including preview overrides
- future derived systems such as speed bonuses, AC bonuses, spell grants, and resource tracking can be added in one place
- the project now has a clearer separation between saved choices and computed character state
