# Reference Data Transformation Flow

## Purpose

This document describes how checked-in D&D reference inputs become runtime PostgreSQL reference tables, and how those tables are later used by the character builder and dashboard derived-state logic.

The implementation does not read seed JSON files during normal application requests. After seeding, runtime reference data comes from PostgreSQL through Prisma.

## Trigger

The flow is triggered when the API Prisma seed script runs, normally after the database schema has been migrated.

The seed script entry point is `apps/api/prisma/seed.ts`. It reads from `apps/api/prisma/seed-data/5e/mixed` and also applies curated TypeScript overrides from `apps/api/prisma/reference-overrides/`.

## Main Components Involved

| Component | Role |
|---|---|
| `apps/api/prisma/seed.ts` | Orchestrates raw JSON loading, curated overrides, normalization, upserts, and demo data seeding. |
| `apps/api/prisma/seed-data/5e/mixed/` | Active checked-in JSON seed source directory. |
| `apps/api/prisma/seed-data/5e/2024/` | Additional checked-in reference source directory, but not the active `DATA_DIR` in `seed.ts`. |
| `apps/api/prisma/reference-overrides/` | Curated 2024-style class, species, feat, and equipment overrides used by the seed. |
| `apps/api/prisma/schema.prisma` | Defines normalized reference tables, rule document storage, and character state tables. |
| `apps/api/src/services/reference.service.ts` | Reads seeded reference rows at runtime for reference endpoints. |
| `apps/api/src/routes/references.ts` | Public read-only reference API routes. |
| `apps/api/src/services/character-effects.service.ts` | Reads runtime reference data and character rows to compute derived dashboard state. |
| `apps/web/src/features/characters/utils/mapBuilderReferenceOptions.ts` | Converts runtime reference API responses into frontend builder option objects. |

## State Boundaries

| State kind | Current implementation |
|---|---|
| Seed source files | Checked-in JSON and TypeScript override inputs under `apps/api/prisma/`. They are used by the seed script, not by normal HTTP requests. |
| D&D reference data | The normalized and source-preserving reference rows inserted into PostgreSQL, such as `RefClass`, `RefSpecies`, `RefEquipment`, and `RefRuleDocument`. |
| Runtime PostgreSQL state | The database contents after migrations and seed. This is the runtime source of truth for references and persisted characters. |
| Prisma access layer | The generated Prisma client and service queries that read/write runtime PostgreSQL rows. |
| Derived dashboard state | A computed HTTP response assembled from reference rows plus a user-owned character. It is not stored as its own table. |
| Frontend local state | Builder selections, UI drafts, cached resource/spell UI state, and React state. These are not reference data sources of truth. |

## Detailed Step-by-Step Flow

1. The seed script loads environment variables and constructs a Prisma client.
2. `assertSeedDataDirExists()` checks that the active data directory exists. The active path in code is `seed-data/5e/mixed`.
3. `seedGenericRuleDocuments()` reads every configured JSON file from the active data directory and upserts each item into `RefRuleDocument` using the pair `(category, index)`.
4. `seedCurated2024FeatReferences()` replaces the runtime `feats` rule-document set with the curated feat references from `reference-overrides/feats2024.ts`.
5. Base reference tables are seeded from JSON:
   - ability scores
   - alignments
   - skills
   - species
   - languages
   - conditions
   - classes
   - backgrounds
   - proficiencies
   - equipment
6. Relationship and choice tables are rebuilt or upserted from the loaded data:
   - species traits, size options, and subspecies
   - class primary abilities, levels, features, proficiency grants, and skill choices
   - background proficiency grants, ability options, and feat grants
7. The seed applies curated data from `reference-overrides/`:
   - curated 2024 species traits and subspecies
   - curated 2024 class overrides for supported classes
   - curated 2024 feat rule documents
   - curated OGL magic items and explicit equipment entries used by current character effects
8. `ensureMinimumDemoReferences()` inserts minimal fallback references if expected rows are absent.
9. `seedDemoCharacter()` creates or updates the demo user, demo character, ability scores, skills, proficiencies, inventory rows, and dice rolls.
10. At runtime, reference HTTP routes read PostgreSQL reference rows through `reference.service.ts`.
11. The frontend builder maps those API responses into local option structures.
12. Dashboard derived-state requests call the character-effects service, which reads runtime reference rows and persisted character rows through Prisma, then returns computed stats/actions/defenses/resources/spells.

## Data Transformations

The seed keeps two parallel forms of reference data:

| Transformation | Implementation detail |
|---|---|
| Raw JSON to rule documents | `seedGenericRuleDocuments()` stores complete JSON objects in `RefRuleDocument.sourceJson`, keyed by category and index. |
| Raw JSON to normalized tables | Dedicated seed functions extract stable fields such as `index`, `name`, `hitDie`, `baseSpeed`, and relationship references into normalized Prisma models. |
| Class filtering | The seed limits class, level, feature, and class-proficiency data to `barbarian`, `bard`, `cleric`, `rogue`, and `wizard`. |
| Class feature summaries | `seedClassFeatures()` stores the first description paragraph as `description` and later paragraphs as `details`. The full raw item remains in `sourceJson`. |
| Background options | `seedBackgroundReferenceData()` converts background proficiency, ability-score, and feat references into dedicated background relationship tables. |
| Class choices | `seedClassProficiencyData()` converts skill proficiency choice metadata into `RefClassSkillChoice` and `RefClassSkillChoiceOption` rows when the choice options are skill references. |
| Curated class overrides | `reference-overrides/*` modules create class, level, feature, subclass, and rule-document rows for the implemented 2024-style class behavior. |
| Curated feature choices | `reference-overrides/curatedClassHelpers.ts` generates rule-document `feature_specific` structures for subclass, ability-score improvement, and epic boon choices. |
| Curated feat choices | `reference-overrides/feats2024.ts` provides selected feat rule documents, including choice metadata where currently modeled. |
| Curated species data | `reference-overrides/species2024.ts` upserts species trait and subspecies records and matching rule documents. |
| Runtime builder options | `mapBuilderReferenceOptions.ts` turns API reference rows and `sourceJson` into frontend selection fields and preview sections. |
| Runtime effects | `character-effects` modules consume seeded rule documents and normalized rows, then apply explicit mappings and text/rule parsing that are implemented in code. |

Concrete example:

1. A class feature from the active seed JSON is stored as a `RefRuleDocument` in category `features`.
2. If the feature belongs to a supported class, selected summary fields are also stored in `RefClassFeature`.
3. Curated class override modules may upsert replacement or additional class feature rule documents.
4. The dashboard effects service loads active feature rule documents for the character level.
5. The effects modules convert only implemented feature effects into active sources, stats, actions, defenses, resources, or spells.

## Validation / Authorization

The seed script validates data structurally while loading:

- missing active seed directory fails before seeding
- missing JSON files fail the seed
- non-array JSON files fail the seed
- missing parent references are either skipped with a warning or raise an explicit error, depending on the seed function
- class skill options must resolve to known skill references before choice options are created

Reference HTTP routes in `apps/api/src/routes/references.ts` are public read-only routes. They do not use `requireAuth`.

Character-specific routes, including derived-state and autosave routes, are authenticated separately through `requireAuth` and only read or write characters owned by the authenticated user.

## Persistence Behavior

The seed writes to PostgreSQL through Prisma. The important persistence boundary is:

- checked-in seed files and overrides are seed inputs
- PostgreSQL reference tables are the runtime source of truth
- Prisma is the access layer over those tables
- derived dashboard state is computed from runtime rows and is not persisted

The seed uses a mix of upserts and delete/recreate operations. For example, species relationship rows, background grant rows, and class skill-choice rows are rebuilt from the current input, while many top-level reference rows are upserted by index.

The seed also writes demo runtime state, including the demo user and demo character. That demo state is ordinary PostgreSQL character state after seeding, not reference data.

## Error / Failure Handling

During seeding:

- missing seed directories or files throw errors
- invalid JSON shape throws errors
- missing optional parent records often produces console warnings and skips dependent rows
- the script catches unhandled failures, logs them, exits with status `1`, and disconnects Prisma in `finally`

At runtime:

- reference endpoint failures are handled by their controllers and returned as HTTP errors
- the frontend reference loader falls back to static builder reference data when reference loading fails or returns empty lists
- character-effects logic returns no derived state when the authenticated user does not own the requested character

## Relevant Implementation Files

- `apps/api/prisma/seed.ts`
- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/seed-data/5e/mixed/`
- `apps/api/prisma/seed-data/5e/2024/`
- `apps/api/prisma/reference-overrides/barbarian2024.ts`
- `apps/api/prisma/reference-overrides/bard2024.ts`
- `apps/api/prisma/reference-overrides/cleric2024.ts`
- `apps/api/prisma/reference-overrides/curatedClassHelpers.ts`
- `apps/api/prisma/reference-overrides/feats2024.ts`
- `apps/api/prisma/reference-overrides/rogue2024.ts`
- `apps/api/prisma/reference-overrides/species2024.ts`
- `apps/api/prisma/reference-overrides/wizard2024.ts`
- `apps/api/src/routes/references.ts`
- `apps/api/src/controllers/reference.controller.ts`
- `apps/api/src/services/reference.service.ts`
- `apps/api/src/services/character-effects.service.ts`
- `apps/api/src/services/character-effects/`
- `apps/web/src/features/references/api/fetchReferences.ts`
- `apps/web/src/features/characters/utils/mapBuilderReferenceOptions.ts`

## Design Rationale / Trade-Offs

The current design stores both normalized fields and full `sourceJson`. Normalized fields make common queries simple, while `sourceJson` preserves rule metadata that is too varied to model fully in relational tables.

Curated override modules let the project support the currently implemented 2024-style behavior without pretending that the raw data fully models every rule interaction. The trade-off is that supported rules live across both data files and TypeScript seed helpers.

The effects layer is intentionally backend-centered. Frontend builder state creates previews, but final derived dashboard data is recomputed from runtime PostgreSQL data and backend effect code.

## Current Limitations

- The active seed path is `seed-data/5e/mixed`; the seed error message still refers to `seed-data/5e/2024`.
- Only the classes listed in `SUPPORTED_CLASS_INDEXES` are seeded into the normalized supported-class flow.
- The seed does not store an explicit reference-data version or provenance row in PostgreSQL.
- Rule automation is limited to mappings, special cases, and parsing implemented in `character-effects`; unimplemented D&D rules remain descriptive or manual.
- Normal runtime requests do not re-read checked-in seed files. Updating reference JSON or overrides requires running the seed against the target database.
