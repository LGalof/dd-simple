# Dashboard Derived-State Flow

## Purpose

This document explains how the Character Dashboard turns user edits into a backend-derived preview of combat statistics, actions, defenses, resources, and spells.

Derived dashboard state is preview state. It is recomputed from persisted character rows, runtime D&D reference data, and request overrides. It is not persisted by the derived-state endpoint.

## Trigger

The flow runs when `CharacterDashboardPage` has a selected character and the derived-state preview payload changes. Typical triggers are:

- selecting a different character
- changing level, class, subclass, species, subspecies, background, ability assignments, or feature choices
- changing dashboard resource state that is included in the derived-state preview payload
- initial dashboard hydration after character and reference data load

Spellcasting UI state is maintained locally and persisted by autosave, but it is not included in the current derived-state preview request payload.

## Main Components Involved

| Component | Role |
|---|---|
| `apps/web/src/pages/CharacterDashboardPage.tsx` | Coordinates selected character, builder state, preview payload, autosave, and dashboard rendering. |
| `apps/web/src/features/characters/hooks/useCharacterBuilder.ts` | Hydrates and mutates frontend builder state from persisted character data and reference options. |
| `apps/web/src/features/characters/hooks/useCharacterDerivedState.ts` | Watches preview inputs and manages derived-state loading/error/result React state. |
| `apps/web/src/features/characters/api/fetchCharacterDerivedState.ts` | Chooses GET or POST and calls the derived-state API. |
| `apps/web/src/features/characters/api/characterPreviewQuery.ts` | Defines preview override request shape and query-string builder. |
| `apps/web/src/features/characters/utils/buildCharacterPreview.ts` | Builds the local frontend preview character object. |
| `apps/web/src/features/characters/utils/buildFeatureChoiceSelections.ts` | Converts builder choices into normalized feature-choice selections. |
| `apps/api/src/routes/characters.ts` | Mounts authenticated character routes, including `/characters/:id/derived`. |
| `apps/api/src/middleware/auth.ts` | Validates bearer token and attaches the authenticated user to the request. |
| `apps/api/src/controllers/character.controller.ts` | Parses, validates, normalizes, and responds to derived-state requests. |
| `apps/api/src/services/character-effects.service.ts` | Loads character/reference data and builds the derived-state response. |
| `apps/api/src/services/character-effects/` | Implements active sources, stats, actions, defenses, resources, spells, items, and weapon actions. |

## State Boundaries

| State kind | Current implementation |
|---|---|
| Frontend local state | React builder state, selected reference options, local resource/spell UI state, and localStorage-backed dashboard UI state. |
| Preview/derived state | `previewCharacter`, `builderActionPreview`, and the `CharacterDerivedState` response. These can reflect unsaved user edits. |
| Persisted character state | Character rows owned by the user in PostgreSQL, including ability scores, choices, feature choices, HP state, spellcasting state, resource state, inventory, and proficiencies. |
| D&D reference data | Runtime reference rows in PostgreSQL, seeded from JSON and curated overrides. |
| Runtime PostgreSQL state | The source read by Prisma during the derived-state request. The derived response itself is not written back. |

## Detailed Step-by-Step Flow

1. The dashboard chooses a selected character from the room URL query, local selected-character storage, or the first loaded character.
2. `useCharacterBuilder(character)` hydrates builder state from the persisted `Character` response and fetched reference options. If a compatible local builder draft exists and is newer than the persisted character, the hook can restore that local draft.
3. User interactions in the dashboard update frontend local state. Examples include level changes, ability assignments, class/subclass/species/background selections, feature choices, HP controls, and resource toggles.
4. `buildCharacterPreview()` creates `previewCharacter`, an in-memory frontend character preview. It applies current builder selections, background ability bonuses, selected ASI/feat ability bonuses, level-20 barbarian ability handling, preview HP, AC, speed, names, skill proficiency flags, and merged feature choices.
5. `CharacterDashboardPage` builds normalized feature-choice selections from generic class, background, and species choice builders.
6. `CharacterDashboardPage` builds `builderActionPreview`, the request preview payload. It includes ability scores, background index, class index, selected feat indexes, normalized feature choices, level, resource state, species index, subclass index, and subspecies index.
7. `useCharacterDerivedState(characterId, builderActionPreview)` fingerprints relevant preview inputs through React effect dependencies. When they change, it sets loading state and calls `fetchCharacterDerivedState()`.
8. `fetchCharacterDerivedState()` uses `POST /characters/:id/derived` when the preview contains body-only overrides such as ability scores, feature choices, resource state, or other body override fields. It uses `GET /characters/:id/derived` only when the request can be represented as query parameters.
9. `charactersRouter` routes the request through `requireAuth`. The middleware requires an `Authorization: Bearer <token>` header and resolves the user from the token.
10. The derived-state controller validates the character id, parses GET query overrides or validates the POST body, normalizes the preview overrides, and calls `findCharacterDerivedStateForUser(authenticatedUser.id, characterId, overrides)`.
11. The character-effects service reads the user-owned character from PostgreSQL through Prisma. It also reads reference rows for the effective class, background, species, level documents, feature documents, feat documents, subclass document, subspecies document, equipped inventory, and resource state when no resource override was sent.
12. The service resolves active sources from class features, selected subclass, selected feats, selected feature choices, species traits, selected subspecies traits, equipped item effects, and resource activation state.
13. The service derives:
    - stats from ability scores, proficiency bonus, passive sources, armor, shield, item bonuses, and speed rules
    - actions from weapon actions, active feature sources, and explicit action mappings
    - defenses from active sources, item effects, and implemented resistance/immunity/parsing logic
    - resources from active sources, level, proficiency bonus, ability modifiers, and implemented resource mappings
    - spells from class spellcasting metadata, active sources, fixed spell mappings, and implemented parsing
14. The controller returns JSON with `actions`, `activeSources`, `defenses`, `resources`, `selectedSubclassIndex`, `selectedSubspeciesIndex`, `spells`, and `stats`.
15. `useCharacterDerivedState()` stores the response in React state. `CharacterDashboardPage` passes it to dashboard components, and `CharacterSheet` rerenders with the new derived values.

## Data Transformations

| Step | Transformation |
|---|---|
| Persisted character -> builder state | `useCharacterBuilder` converts a persisted `Character` into editable React state and selected reference options. |
| Builder state -> frontend preview | `buildCharacterPreview` computes local display values such as effective ability scores, current/max HP preview, AC, speed, names, selected skills, and merged feature choices. |
| Builder state -> preview request | `CharacterDashboardPage` builds `builderActionPreview`, which contains only the override fields the backend needs to recompute derived state. |
| Preview request -> normalized overrides | The controller trims strings, clamps/parses level where applicable, removes empty feat indexes, normalizes feature choices, and normalizes resource state. |
| Persisted choices + preview choices -> merged choices | `mergeFeatureChoiceRecords()` keys selections by source type, source index, and choice path so preview choices replace matching persisted choices. |
| Reference rows -> active sources | `character-effects/sources.ts` converts level documents, feature documents, subclass/subspecies documents, feature-choice grants, species traits, feats, and items into normalized active sources. |
| Active sources -> derived response | Stats, actions, defenses, resources, spells, item effects, and weapon actions are calculated by focused modules under `character-effects/`. |

The backend uses a mix of data-driven mapping, explicit feature/equipment special cases, and generic text/rule parsing. For example, `character-effects/shared.ts` includes a passive effect registry and text parsing for armor class, initiative, saving throws, speed, and passive skills, while `actions.ts`, `defenses.ts`, `resources.ts`, and `spells.ts` include explicit rule mappings for currently implemented features.

## Validation / Authorization

All `/characters` routes use `requireAuth`. Missing or invalid bearer tokens return `401`.

The derived-state controller validates:

- character id must be a string
- POST body must be a valid derived preview request object
- ability score overrides, when present, must include all six ability keys with integer values from 3 to 20
- level must be an integer from 1 to 20
- feature-choice selections must be valid and unique by logical selection key
- resource-state overrides must match the accepted object shape

Ownership is enforced in `findCharacterDerivedStateForUser()` by querying `prisma.character.findFirst({ where: { id, userId } })`. A character owned by another user is treated as not found.

Reference selection validity is checked during resolution. Invalid selected subclass or subspecies documents are ignored if they do not match the effective class or species.

## Persistence Behavior

The derived-state endpoint does not persist the preview request and does not update the character.

The service reads:

- persisted character state
- persisted feature choices
- persisted choices
- persisted inventory and inventory state
- persisted resource state only when no resource-state preview override is supplied
- runtime D&D reference data from PostgreSQL

The service returns computed derived state to the frontend. The response is held in React state and used for rendering until another preview request replaces it.

## Error / Failure Handling

Frontend behavior:

- If there is no token or no character id, `useCharacterDerivedState` clears derived state and stops loading.
- A derived-state `404` clears derived state without surfacing a dashboard error.
- Other request failures set `derivedStateError`, clear the current derived state, and stop loading.

Backend behavior:

- invalid ids or invalid preview request bodies return `400`
- unauthenticated requests return `401`
- missing or non-owned characters return `404`
- unexpected failures are logged and return `500`

When required effective class, background, or species reference rows are missing, the service returns empty derived collections with base stats for the effective level instead of throwing.

## Relevant Implementation Files

- `apps/web/src/pages/CharacterDashboardPage.tsx`
- `apps/web/src/features/characters/hooks/useCharacterBuilder.ts`
- `apps/web/src/features/characters/hooks/useCharacterDerivedState.ts`
- `apps/web/src/features/characters/api/fetchCharacterDerivedState.ts`
- `apps/web/src/features/characters/api/characterPreviewQuery.ts`
- `apps/web/src/features/characters/utils/buildCharacterPreview.ts`
- `apps/web/src/features/characters/utils/buildFeatureChoiceSelections.ts`
- `apps/web/src/features/characters/utils/featureChoiceGrants.ts`
- `apps/api/src/routes/characters.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/controllers/character.controller.ts`
- `apps/api/src/services/character-effects.service.ts`
- `apps/api/src/services/character-effects/actions.ts`
- `apps/api/src/services/character-effects/defenses.ts`
- `apps/api/src/services/character-effects/resources.ts`
- `apps/api/src/services/character-effects/shared.ts`
- `apps/api/src/services/character-effects/sources.ts`
- `apps/api/src/services/character-effects/spells.ts`
- `apps/api/src/services/character-effects/stats.ts`
- `apps/api/src/services/character-effects/weapon-actions.ts`

## Design Rationale / Trade-Offs

The dashboard sends preview overrides to the backend instead of deriving final effects entirely in the browser. This keeps effect rules centralized in the API and matches ADR-006.

The backend recomputes from persisted character state plus preview overrides. That lets the UI show unsaved changes while still using runtime PostgreSQL reference data and server-side rule logic.

The GET/POST split keeps simple preview queries cacheable and URL-shaped when possible, while POST handles body-only data such as ability scores, feature choices, and resource state.

## Current Limitations

- Derived state is best-effort automation for implemented mappings only. Some rules remain manual or summary-only.
- `spellcastingState` is not part of the derived-state preview request.
- Derived-state POST validates ability score overrides as a complete six-score object, not as sparse ability changes.
- GET preview requests cannot carry ability scores, feature choices, or resource state.
- The endpoint does not persist preview changes and does not perform conflict detection against unsaved frontend drafts.
- Missing effective class, background, or species references produce base/empty derived output rather than a detailed reference integrity error.
