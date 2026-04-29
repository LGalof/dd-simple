# 04 Database

## Planned Database

The backend is planned to use PostgreSQL as the primary relational database.

## Tooling Choice

Prisma is included as the ORM and schema management tool for the backend service.

## Initial Database Direction

- one PostgreSQL database
- Prisma schema managed from `apps/api/prisma/schema.prisma`
- environment configuration through `DATABASE_URL`

No business entities are implemented yet in this initial setup.

