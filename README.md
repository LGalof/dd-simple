# D&D Simple

D&D Simple is a browser-based application that supports Dungeons & Dragons gameplay for players, Dungeon Masters, and groups playing live sessions. It combines character management, gameplay dashboards, inventory tools, dice rolling, rooms, and a synchronized tactical board in one web application.

Public application:

[https://dd-simple.onrender.com](https://dd-simple.onrender.com)

## Main Capabilities

- User registration and login.
- Character creation, listing, editing, deletion, and character selection.
- Character dashboard with statistics, HP, conditions, actions, spells, resources, notes, and autosave.
- Visual grid-based inventory with drag-and-drop item management, containers, equipment slots, attunement, and import/export support.
- Dice rolling for standard dice and character-sheet rolls, with character roll history.
- Room creation and joining by room code.
- Tactical board with maps, terrain, tokens, initiative, HP, fog, markers, templates, rulers, and Socket.IO synchronization.
- Reference data for D&D 5e-inspired abilities, skills, species, classes, backgrounds, equipment, proficiencies, conditions, and rule documents.

## Technology Stack

- React, TypeScript, Vite, and React Router for the frontend.
- Node.js, Express, TypeScript, and Socket.IO for the backend.
- PostgreSQL for persistent storage.
- Prisma for schema management, migrations, and database access.
- Shared TypeScript package for reusable types and utilities.
- Docker Compose for local PostgreSQL.
- GitHub Actions for continuous integration.
- Render for public deployment.

## Repository Structure

```text
apps/
  web/        React + TypeScript + Vite frontend
  api/        Node.js + TypeScript + Express + Socket.IO backend
packages/
  shared/     Shared TypeScript package
docs/
  adr/        Architecture decision records
  uml/        UML and diagram sources
infra/        Local infrastructure configuration
scripts/      Development and deployment helper scripts
.github/
  workflows/  CI workflow
```

## Local Setup on Windows

Run commands from the repository root in PowerShell.

1. Install dependencies:

   ```powershell
   npm install
   ```

2. Create the API environment file:

   ```powershell
   Copy-Item apps/api/.env.example apps/api/.env
   ```

3. Start local PostgreSQL:

   ```powershell
   docker compose -f infra/docker-compose.yml up -d postgres
   ```

4. Generate Prisma Client:

   ```powershell
   npm --workspace @dd-simple/api run prisma:generate
   ```

5. Run local migrations:

   ```powershell
   npm --workspace @dd-simple/api run prisma:migrate
   ```

6. Seed reference data:

   ```powershell
   npm --workspace @dd-simple/api run prisma:seed
   ```

7. Start the full local development environment:

   ```powershell
   npm run dev
   ```

The PowerShell development script starts PostgreSQL through Docker Compose when Docker is available, starts the API on `http://localhost:4000`, and starts the web app on `http://127.0.0.1:5173`.

To run services separately:

```powershell
docker compose -f infra/docker-compose.yml up -d postgres
npm run dev:api
npm run dev:web
```

## Local Setup on Linux

Run commands from the repository root in Bash.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the API environment file:

   ```bash
   cp apps/api/.env.example apps/api/.env
   ```

3. Start PostgreSQL:

   ```bash
   docker compose -f infra/docker-compose.yml up -d postgres
   ```

4. Generate Prisma Client:

   ```bash
   npm --workspace @dd-simple/api run prisma:generate
   ```

5. Run local migrations:

   ```bash
   npm --workspace @dd-simple/api run prisma:migrate
   ```

6. Seed reference data:

   ```bash
   npm --workspace @dd-simple/api run prisma:seed
   ```

7. Start the API:

   ```bash
   npm --workspace @dd-simple/api run dev
   ```

8. Start the web app in another terminal:

   ```bash
   npm --workspace @dd-simple/web run dev
   ```

## Build and Test

Build all workspaces:

```bash
npm run build
```

Run frontend tests:

```bash
npm --workspace @dd-simple/web run test
```

Run backend tests:

```bash
npm --workspace @dd-simple/api run test
```

Generate LCOV coverage reports for SonarQube:

```bash
npm --workspace @dd-simple/api run test:coverage
npm --workspace @dd-simple/web run test:coverage
```

## SonarQube

The repository is analyzed as one SonarQube project containing the API, web,
and shared TypeScript workspaces. Analysis settings are stored in
`sonar-project.properties`, and the CI workflow uploads the generated LCOV
coverage reports.

Start the local SonarQube Community Build and its dedicated PostgreSQL database:

```bash
npm run sonar:up
```

Open [http://localhost:9000](http://localhost:9000). Stop the local services
without deleting their persistent data with `npm run sonar:down`.

After generating coverage, run a local analysis by setting `SONAR_TOKEN` and
`SONAR_HOST_URL=http://localhost:9000`, then execute `npm run sonar`.

To enable analysis in GitHub Actions:

1. Create the `dd-simple` project in SonarQube Server.
2. Generate a project analysis token.
3. Add the token as the GitHub repository secret `SONAR_TOKEN`.
4. Add the reachable SonarQube Server URL as the GitHub repository variable
   `SONAR_HOST_URL`.

If either setting is absent, CI still builds and tests the project but skips
the SonarQube upload. A SonarQube instance running only on `localhost` is not
reachable from a GitHub-hosted runner; use a reachable server or a self-hosted
runner on the same network.

The project uses the `D&D Simple New Code` quality gate. CI waits for the gate
and fails when new code introduces issues, drops below 80% coverage, leaves
security hotspots unreviewed, or exceeds 3% duplication. Configure
`CORS_ALLOWED_ORIGINS` as a comma-separated allowlist when deploying the API to
another origin; local development and the public Render origin have safe
defaults.

Validate Prisma schema:

```bash
npx prisma validate --schema apps/api/prisma/schema.prisma
```

## Documentation

Project documentation starts at [docs/README.md](docs/README.md).

## Acknowledgements

The project uses D&D 5e reference data from the open-source 5e-bits/5e-database project:

https://github.com/5e-bits/5e-database
