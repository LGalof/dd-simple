# 06 Deployment

## Public Deployment

D&D Simple is deployed publicly on Render at:

[https://dd-simple.onrender.com](https://dd-simple.onrender.com)

## Deployment Topology

The deployment consists of:

- a built React/Vite frontend
- a Node.js Express API
- a Socket.IO realtime server
- a PostgreSQL database
- Prisma migrations and reference-data seeding

The Express service serves the built frontend from `apps/web/dist` and handles REST API requests and Socket.IO connections on the same public host.

## Render Build and Start Commands

The repository build command compiles all workspaces:

```bash
npm run build
```

The API start command runs the compiled backend:

```bash
npm --workspace @dd-simple/api run start
```

During dependency installation, the root `postinstall` script generates Prisma Client and runs the Render deployment helper when `RENDER=true`.

## Environment Variables

The API requires:

| Variable | Purpose |
|---|---|
| `PORT` | Port used by the Render service. |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| `AUTH_SECRET` | Secret used to sign bearer tokens. |
| `RENDER` | Enables Render-specific deployment behavior when set to `true`. |

The frontend uses:

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | Public API base URL when frontend and backend are hosted separately. |

Secret values must be configured in Render environment settings and must not be committed to the repository.

## Migration and Seed Process

During Render deployment, the deployment helper prepares the database, applies checked-in Prisma migrations with `prisma migrate deploy`, and seeds the reference data required by the application.

For local development, developers can run:

```bash
npm --workspace @dd-simple/api run prisma:migrate
npm --workspace @dd-simple/api run prisma:seed
```

## Socket.IO on Render

The Socket.IO server is attached to the same HTTP server as the Express API. Clients authenticate the socket connection with the same token used by REST requests. Room board updates are sent through Socket.IO and persisted through the backend.

When the frontend and API use different public hosts, `VITE_API_BASE_URL` must point to the API host so both REST requests and Socket.IO connect to the correct service.

## Health Check

The health endpoint is:

https://dd-simple.onrender.com/health


## Local Relationship to Deployment

Local Windows and Linux development use the same package scripts, Prisma schema, migrations, and seed data as deployment. Docker Compose provides local PostgreSQL, while Render provides the hosted PostgreSQL environment for the public application.

## Safe Deployment Notes

- Keep `AUTH_SECRET` and `DATABASE_URL` in Render environment settings.
- Run checked-in Prisma migrations against the deployed database.
- Seed reference data after migrations.
- Verify `/health` after deployment.
- Verify login, character loading, room joining, and board synchronization after deployment.
