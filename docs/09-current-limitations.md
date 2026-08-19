# Current Limitations

This document describes verified current implementation boundaries. It is not a wishlist and does not mean the listed areas are broken; it defines where the current system is intentionally narrower, simpler, or more manual than a complete D&D platform.

## Character / Rules

| Limitation | Current behavior | Consequence / trade-off |
|---|---|---|
| Complete D&D ruleset automation | Dashboard effects are derived by the implemented backend modules under `apps/api/src/services/character-effects/`. They combine active-source mapping, explicit feature and item cases, and text/rule inference. | Rules not represented in those modules may be displayed, saved, or summarized without full mechanical automation. |
| Supported class scope | The application's currently supported normalized character-progression flow is limited to `barbarian`, `bard`, `cleric`, `rogue`, and `wizard`. | Other class data may exist in checked-in reference inputs or audits, but it should not be treated as fully supported dashboard behavior. |
| Feature-choice mechanics | Feature choices are persisted and can contribute derived sources when the current code builds or recognizes those grants. | Some choices remain display-oriented or manual when no effect mapping exists. |
| Spellcasting preview inputs | Dashboard spellcasting UI state is autosaved, but the current derived-state preview request does not include `spellcastingState`. | Spell-management UI state and derived rules are related but not the same recomputation input. |

## Reference Data

| Limitation | Current behavior | Consequence / trade-off |
|---|---|---|
| Mixed seed inputs | `apps/api/prisma/seed.ts` reads active JSON input from `apps/api/prisma/seed-data/5e/mixed` and applies curated overrides from `apps/api/prisma/reference-overrides/`. | Reference behavior depends on both JSON files and TypeScript override modules. |
| Runtime source of truth | Normal runtime requests read PostgreSQL reference tables through Prisma, not the checked-in seed files. | Updating seed inputs or overrides requires reseeding the target database before runtime behavior changes. |
| Reference-data provenance | The schema stores reference rows and `sourceJson`, but it does not store an explicit seed version or provenance record. | Operators must use repository revision, migrations, and seed history to identify exactly which reference inputs populated a database. |

## Realtime / Rooms

| Limitation | Current behavior | Consequence / trade-off |
|---|---|---|
| Board synchronization model | Room board state is stored and synchronized as JSON snapshots. Socket updates include timestamp conflict checks, but concurrent changes are not merged field by field. | Concurrent board edits can be rejected and resynchronized or resolved through the latest accepted snapshot rather than being semantically merged. |
| Room permission model | Rooms use fixed creator/player/active-player permission rules rather than a configurable role and permission system. | The model fits the current DM/player room flow but is not intended as a general-purpose permission framework. |
| Room dice history length | Room dice feeds load the latest ten public persisted rolls whose `DiceRoll.roomId` matches the room. | Room history is a compact shared feed, not a complete campaign audit log. |

## Persistence

| Limitation | Current behavior | Consequence / trade-off |
|---|---|---|
| Dashboard autosave payload shape | `PATCH /characters/:id` receives a full `CharacterSavePayload`, not only changed fields. | Saves are larger than sparse patches, but the backend can validate and recalculate persisted character state from a complete build payload. |
| Character autosave conflicts | Autosave signatures prevent repeated identical frontend saves, and stale responses from the same browser session are ignored. The PATCH request does not include an `updatedAt` precondition or revision token. | Concurrent edits from multiple clients are handled as last-write-wins at the API persistence boundary. |
| Lifecycle saves | Browser lifecycle flushes are best-effort and only request `keepalive` when the JSON payload is small enough. | Closing or navigating away can still lose the last unsaved local edit if the browser does not complete the request. |
| Local browser state | Selected character data, dashboard UI state, and builder drafts can be stored in local storage. | Local state helps recovery and UX, but PostgreSQL remains authoritative after successful API saves. |

## Authentication

| Limitation | Current behavior | Consequence / trade-off |
|---|---|---|
| Local authentication | The implemented system uses local email/password registration and login with signed bearer tokens. Google OAuth/SSO remains original intent in `00-vision.md`, not current implementation. | The project avoids external identity-provider setup but does not provide delegated login or external account-management features. |
| Token storage | The frontend stores the bearer token in browser local storage and sends it on protected REST and Socket.IO requests. | The model is simple and consistent, but token lifetime and browser storage behavior are not equivalent to a full session-management product. |

## Deployment / Quality

| Limitation | Current behavior | Consequence / trade-off |
|---|---|---|
| SonarQube availability | CI runs build and coverage tests. The SonarQube scan runs only when `SONAR_TOKEN` and `SONAR_HOST_URL` are configured. | Unconfigured environments still validate the project, but static-analysis quality gates are enforced only when a reachable SonarQube server is configured. |
| End-to-end browser automation | Package scripts and CI cover builds, API tests, web tests, coverage, Prisma validation, and migrations. No Playwright/Cypress-style E2E script is configured in the current package scripts or CI workflow. | Full browser workflow validation depends on unit/component/service tests plus manual checks. |
