# ADR-003: Use PostgreSQL and Prisma for Persistence

## Status

Accepted

## Context

D&D Simple stores relational data for users, characters, inventory, dice rolls, rooms, room players, and reusable D&D reference data. The project needs migrations, typed database access, and support for richer JSON state where the tactical board or inventory workspace is easier to store as a snapshot.

## Decision

Use PostgreSQL as the primary database and Prisma as the schema, migration, and generated-client layer. The Prisma schema models reusable reference data separately from user-owned gameplay data. Checked-in Prisma migrations define database evolution, and selected JSON columns store rich state such as board or inventory snapshots.

## Alternatives Considered

- Raw SQL or a lighter query builder: gives more direct control, but would require more manual typing and migration discipline.
- Document database such as MongoDB: fits nested snapshots, but is less natural for the relational character, user, reference, and room data in this project.

## Consequences

### Benefits

- The database structure is visible in one Prisma schema.
- Migrations are checked in and can be applied consistently across environments.
- Prisma Client gives typed access to relational records and JSON fields.

### Trade-offs

- The project depends on Prisma tooling and generated client updates.
- Rich JSON state is flexible but cannot enforce every board or inventory shape at the relational level.
