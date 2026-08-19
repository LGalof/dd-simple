# Dashboard Autosave Flow

## Purpose

This document explains how the Character Dashboard saves edited character build state to PostgreSQL.

Autosave is separate from derived-state preview. The preview flow recomputes display data; autosave persists the current build payload through `PATCH /characters/:id`.

## Trigger

Autosave is triggered when the dashboard save payload fingerprint changes. The hook also supports manual and lifecycle flushes.

Current triggers are:

- dashboard builder state changes
- dashboard resource or spellcasting state changes
- selected feature/background/species choices change
- the 900 ms debounce expires after a dirty payload
- the user manually saves or retries after an error
- lifecycle events such as blur, page hide, before unload, visibility hidden, and component unmount

## Main Components Involved

| Component | Role |
|---|---|
| `apps/web/src/pages/CharacterDashboardPage.tsx` | Builds `CharacterSavePayload`, calls autosave hook, and reconciles saved characters into React state. |
| `apps/web/src/features/characters/hooks/useDashboardAutosave.ts` | Fingerprints payloads, tracks save status, debounces, flushes, and reconciles responses. |
| `apps/web/src/features/characters/api/updateCharacter.ts` | Sends `PATCH /characters/:id` with the save payload. |
| `apps/web/src/lib/api.ts` | Adds JSON headers, bearer token, base URL, and optional `keepalive`. |
| `apps/api/src/routes/characters.ts` | Routes `PATCH /characters/:id` through authentication. |
| `apps/api/src/middleware/auth.ts` | Requires a bearer token and attaches the authenticated user. |
| `apps/api/src/controllers/character.controller.ts` | Validates and normalizes the mutation request body. |
| `apps/api/src/services/character.service.ts` | Performs ownership checks, validates references, recalculates persisted character fields, and writes in a transaction. |
| `apps/api/src/services/character-spellcasting-state.service.ts` | Normalizes and upserts persisted spellcasting UI state. |
| `apps/api/src/services/character-resource-state.service.ts` | Normalizes and upserts persisted resource UI state. |
| `apps/api/prisma/schema.prisma` | Defines character, choice, feature-choice, HP, spellcasting, resource, proficiency, and reference tables. |

## State Boundaries

| State kind | Current implementation |
|---|---|
| Frontend local state | Builder state, selected skill indexes, background/species choices, feature choices, spellcasting UI state, resource UI state, and localStorage dashboard UI cache. |
| Preview/derived state | `previewCharacter` and `CharacterDerivedState`; these may reflect unsaved edits and are not sent as the autosave response body. |
| Persisted character state | Rows written by `PATCH /characters/:id`, including character fields, ability scores, choices, feature choices, HP state, spellcasting state, resource state, skills, proficiencies, and related records. |
| D&D reference data | Runtime reference rows used by the backend to validate indexes and recalculate persisted derived fields such as max HP, AC, speed, and proficiencies. |
| Runtime PostgreSQL state | The authoritative saved character and reference tables accessed through Prisma. |

## Detailed Step-by-Step Flow

1. A user edits the dashboard. The edit updates React state in `CharacterDashboardPage` or in hooks/components it owns.
2. `CharacterDashboardPage` builds a full `CharacterSavePayload`. The current implementation does not build a sparse patch and does not send only changed fields.
3. The payload includes character identity fields and build state: name, species index, class index, subclass index, background index, alignment, level, current HP, HP settings, spellcasting state, resource state, skill indexes, choices, feature choices, and all six base ability scores.
4. `useDashboardAutosave()` creates a stable payload signature with sorted object keys and arrays in their existing order.
5. If the signature matches the last saved signature, the hook clears pending timers and sets its internal state to saved or idle.
6. If the signature differs, the hook marks its internal state dirty and starts a 900 ms debounce timer.
7. When the timer expires, `flushSave("debounced")` sends the current payload. Manual save/retry calls `flushSave("manual")`. Lifecycle handlers call `flushSave("lifecycle")`.
8. Lifecycle flushes request `keepalive` only when the JSON payload is at most 60,000 characters. Other flushes do not request keepalive.
9. `updateCharacter()` sends `PATCH /characters/:id` with the full `CharacterSavePayload` and bearer token.
10. `charactersRouter` applies `requireAuth`, so the request must include a valid bearer token.
11. The controller validates the body with `isCharacterMutationRequestBody()`, normalizes strings, choices, hit point state, spellcasting state, resource state, and ability score values, then calls `updateCharacterForUser()`.
12. `updateCharacterForUser()` opens a Prisma transaction and verifies the target character belongs to the authenticated user.
13. The service loads runtime reference data for species, class, background, skills, and related feature/choice validation.
14. The service validates selected references, class skill choices, subclass choice, background ability choices, and feature choices.
15. The service recalculates persisted character fields from the submitted base state and reference data:
    - effective ability scores
    - background ability bonuses
    - feature-choice ability bonuses
    - barbarian level-20 strength/constitution handling
    - max HP
    - current HP clamping
    - armor class
    - speed
    - skill proficiency rows
    - class/background/manual proficiency rows
16. The transaction writes the character and related rows, including HP state, ability scores, skills, choices, feature choices, languages, proficiencies, spellcasting state, and resource state.
17. The service refetches the updated character with related rows and returns it to the controller.
18. The frontend receives the updated character. If no newer save superseded it, the hook computes the saved signature from `getSavedDashboardPayload(updatedCharacter, requestPayload)`, updates `lastSavedSignature`, sets internal status to saved, records `lastSavedAt`, and calls `onSaved(updatedCharacter)`.
19. `CharacterDashboardPage` replaces the character in local React state. The builder and derived-state flows then render from the reconciled saved character and current local state.

## Data Transformations

| Step | Transformation |
|---|---|
| Builder state -> save payload | `buildCharacterSavePayload()` converts React builder state and selected references into `CharacterSavePayload`. |
| Persisted choices + current choices | `mergeCharacterChoices()` keeps current-build relevant persisted choices only when they are still applicable, then overlays current generated choices by key. |
| Persisted feature choices + current choices | `mergeCurrentBuildFeatureChoices()` keeps persisted feature choices whose feature key is not replaced by current selections, then overlays current selections by source and choice path. |
| Ability assignments -> payload ability scores | The frontend sends all six base scores, starting from persisted character scores and replacing them with builder assignments when present. |
| Payload -> backend normalized input | The controller trims strings, de-duplicates arrays, floors numeric state values, validates integer ranges, and normalizes optional nested state objects. |
| Base ability scores -> persisted effective scores | The service stores submitted base scores and computes effective scores after background and feature ability bonuses. |
| HP settings -> persisted HP | The service persists HP settings, computes max HP, and clamps current HP to the computed maximum. |
| Skill indexes -> skills and proficiencies | The service updates every skill row and recreates class, background, class-choice, and selected manual proficiency rows. |
| Spell/resource UI state -> JSON columns | Dedicated services normalize and upsert JSON fields for learned/prepared spells, slot usage, active resources, usage, and custom maxima. |

## Validation / Authorization

All character mutation routes require authentication through `requireAuth`.

The controller rejects invalid mutation bodies with `400`. Validation includes:

- required non-empty `name`, `speciesIndex`, `classIndex`, and `backgroundIndex`
- `skillIndexes` must be an array of strings
- `abilityScores` must include all six ability keys with integer values from 3 to 20
- optional `level` must be 1 to 20
- optional `currentHp` must be 0 to 999
- optional hit point, spellcasting, resource, choice, and feature-choice structures must match accepted shapes
- feature-choice selections must be unique by logical source and choice path

The service enforces ownership by loading the character with both `id` and `userId`. It also validates runtime reference indexes before writing:

- species
- class
- background
- selected skills
- selected subclass
- background ability options
- class skill choices
- feature choices

## Persistence Behavior

Autosave writes to PostgreSQL. The write is performed inside a Prisma transaction.

Persisted changes can include:

- `Character` scalar fields such as species, class, subclass, background, alignment, level, max HP, current HP, armor class, and speed
- `CharacterHitPointState`
- six `CharacterAbilityScore` rows
- all `CharacterSkill` rows
- `CharacterChoice` rows for current class, species, and background choices
- `CharacterFeatureChoiceSelection` rows for current valid feature choices
- `CharacterLanguage` rows for selected language choices
- `CharacterProficiency` rows for class, background, class-choice, and selected manual skill proficiency sources
- `CharacterSpellcastingState`
- `CharacterResourceState`

The autosave response is the updated `Character` object with included related state. The frontend uses that response for reconciliation rather than assuming the submitted payload is exactly what was stored.

## Error / Failure Handling

Frontend behavior:

- the autosave hook internally tracks `idle`, `dirty`, `saving`, `saved`, and `error`
- `dirty`: payload signature differs from the last saved signature and a debounce may be pending
- `saving`: a flush is in flight
- `saved`: the latest accepted response has been reconciled
- `error`: the latest matching save attempt failed
- stale responses are ignored when a newer character, payload signature, or request sequence has superseded them
- lifecycle flushes are best-effort and do not update React state after unmount
- the current dashboard UI does not render normal `dirty`, `saving`, `saved`, or `idle` status text
- when the internal status is `error`, the dashboard renders `Save failed.`, renders the captured save error message when present, and shows a `Retry save` button

Backend behavior:

- unauthenticated requests return `401`
- invalid ids or invalid payloads return `400`
- missing or non-owned characters return `404`
- invalid reference selections return request errors through the controller
- unexpected errors are logged and returned as `500`

## Relevant Implementation Files

- `apps/web/src/pages/CharacterDashboardPage.tsx`
- `apps/web/src/features/characters/hooks/useDashboardAutosave.ts`
- `apps/web/src/features/characters/api/updateCharacter.ts`
- `apps/web/src/lib/api.ts`
- `apps/api/src/routes/characters.ts`
- `apps/api/src/middleware/auth.ts`
- `apps/api/src/controllers/character.controller.ts`
- `apps/api/src/services/character.service.ts`
- `apps/api/src/services/character-spellcasting-state.service.ts`
- `apps/api/src/services/character-resource-state.service.ts`
- `apps/api/prisma/schema.prisma`

## Design Rationale / Trade-Offs

The frontend sends a full save payload because the backend recalculates multiple persisted fields from the complete build state and reference data. This keeps server-side validation and recalculation deterministic, but it means the request is not a minimal patch.

Fingerprint comparison prevents repeated saves of identical payloads. The debounce reduces write frequency while preserving a manual flush path and best-effort lifecycle flush path.

The backend transaction keeps the character row and related build-state rows consistent with each other. The response reconciliation step lets the frontend align with server normalization and recalculated fields.

## Current Limitations

- `PATCH /characters/:id` currently receives the full `CharacterSavePayload`, not a changed-field patch.
- There is no version or `updatedAt` precondition in the autosave request, so concurrent edits are last-write-wins at the API level.
- Lifecycle saves are best-effort browser requests and can be skipped by browser shutdown or payload size limits.
- The autosave hook ignores stale responses, but it does not cancel already-started HTTP requests.
- Local dashboard UI cache is useful for restoration, but PostgreSQL remains the persisted source of truth after a successful save.
