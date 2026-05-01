# D&D Simple

D&D Simple is a software project for building a web application that supports Dungeons & Dragons gameplay. The system is planned as a digital toolkit for character management, session support, and virtual tabletop workflows.

## Repository Structure

```text
apps/
  web/        React + TypeScript + Vite frontend
  api/        Node.js + TypeScript + Express backend
packages/
  shared/     Shared types and utilities
docs/
  uml/        UML diagrams
  adr/        Architecture decision records
infra/        Infrastructure support files
.github/
  workflows/  CI workflows
```

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy the backend environment file:
   ```bash
   copy apps\api\.env.example apps\api\.env
   ```
3. Start PostgreSQL:
   ```bash
   docker compose -f infra/docker-compose.yml up -d
   ```
4. Generate the Prisma client:
   ```bash
   npm run prisma:generate --workspace @dd-simple/api
   ```
5. Run Prisma migrations:
   ```bash
   npm run prisma:migrate --workspace @dd-simple/api
   ```
6. Start the backend:
   ```bash
   npm run dev:api
   ```
7. Start the frontend:
   ```bash
   npm run dev:web
   ```

## Local PostgreSQL with Docker

- Start PostgreSQL:
  ```bash
  docker compose -f infra/docker-compose.yml up -d
  ```
- Stop PostgreSQL:
  ```bash
  docker compose -f infra/docker-compose.yml down
  ```

## Prisma Commands

- Generate Prisma client:
  ```bash
  npm run prisma:generate --workspace @dd-simple/api
  ```
- Run Prisma migrations:
  ```bash
  npm run prisma:migrate --workspace @dd-simple/api
  ```
- Open Prisma Studio:
  ```bash
  npm run prisma:studio --workspace @dd-simple/api
  ```

## Backend Development

- Run the backend:
   ```bash
   npm run dev:api
   ```

## Current Scope

This initial setup includes:

- monorepo workspace structure
- React frontend scaffold
- Express API scaffold
- Prisma schema for PostgreSQL
- project documentation skeleton
- basic CI workflow

Business features, authentication, and realtime functionality are intentionally deferred.
