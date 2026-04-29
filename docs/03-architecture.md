# 03 Architecture

## Overview

The project uses a monorepo structure with application and package boundaries.

## Layers

- `apps/web`: user-facing React application
- `apps/api`: backend API service using Express
- `packages/shared`: shared TypeScript definitions and utilities
- `docs`: project documentation and architecture records
- `.github/workflows`: automated build validation

## Architectural Intent

This structure supports:

- separation of concerns
- easier collaboration in a student team
- consistent TypeScript tooling
- future expansion into additional packages or services

