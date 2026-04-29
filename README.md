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
2. Start the frontend:
   ```bash
   npm run dev:web
   ```
3. Start the backend:
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
