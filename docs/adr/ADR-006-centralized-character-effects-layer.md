# ADR-006: Centralize Character Effects Derivation in the Backend

## Context

The character dashboard combines saved character choices, reference data, feature choices, species traits, subclasses, equipment, and temporary gameplay state. If each UI component or endpoint derives its own values, actions, defenses, resources, spells, stats, and weapon actions can drift apart.

## Decision

Use a central backend character-effects layer in `apps/api/src/services/character-effects.service.ts` and related modules. The layer resolves the effective character sources once, then derives normalized gameplay state for dashboard consumers. Persistence stores character choices and state; the effects layer turns those inputs into computed values.

## Alternatives Considered

- Derive values independently in UI components: gives immediate local control, but duplicates game logic and makes backend previews inconsistent.
- Derive values separately in each endpoint handler: keeps logic near routes, but repeats source resolution and makes behavior harder to test.

## Consequences

### Benefits

- Derived dashboard state uses shared character/source resolution.
- Actions, defenses, resources, spells, stats, and weapon actions follow the same interpretation of saved choices.
- The UI can display computed state without owning all rule parsing.
- Service-level tests can cover derivation behavior away from React components.

### Trade-offs

- The effects layer must stay organized as more rule cases are added.
- Some D&D rules still require explicit interpretation rather than automatic parsing from reference text.
