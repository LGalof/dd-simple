# UML

| Diagram | Files | Purpose |
|---|---|---|
| Use Case Overview | [source](use-case-overview.puml), [SVG](use-case-overview.svg) | Main user interactions with D&D Simple. |
| Room Realtime Sequence | [source](sequence-room-realtime-sync.puml), [SVG](sequence-room-realtime-sync.svg) | REST, persistence, and Socket.IO room board plus room-specific dice feed flow. |
| Character Autosave Activity | [source](activity-character-edit-autosave.puml), [SVG](activity-character-edit-autosave.svg) | Character editing and autosave behavior. |
| Reference Data Transformation Flow | [source](flow-reference-data-transformation.puml), [SVG](flow-reference-data-transformation.svg) | Seed inputs, curated overrides, runtime reference persistence, and runtime usage. |
| Dashboard Derived-State Sequence | [source](sequence-dashboard-derived-state-flow.puml), [SVG](sequence-dashboard-derived-state-flow.svg) | User edits through preview payload, authenticated derived-state request, backend effects, and dashboard rerender. |
| Dashboard Autosave Sequence | [source](sequence-dashboard-autosave-flow.puml), [SVG](sequence-dashboard-autosave-flow.svg) | Full save payload fingerprinting, debounce/flush, authenticated PATCH, transaction persistence, and response reconciliation. |
| Production Deployment | [source](deployment-production.puml), [SVG](deployment-production.svg) | Browser, Render service, and PostgreSQL topology. |
| Current Prisma ER Overview | [source](er-current-prisma.puml), [SVG](er-current-prisma.svg) | Main database entities and relationships. |
| Character Creation DB Subset | [source](character-creation-db.puml), [PNG](character-creation-db.png) | Early partial character-creation/reference-data diagram retained for context; use the current Prisma ER overview for the current schema. |
