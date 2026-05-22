# ADR-005 Token Authentication

## Status

Accepted

## Context

D&D Simple needs account registration and login while keeping the initial university project scaffold small and understandable.

## Decision

The API stores user password hashes with Node.js `crypto.scrypt` and returns an HMAC-signed bearer token after registration or login. Protected API routes read the token from the `Authorization` header and resolve the current user before calling domain controllers.

## Consequences

- No new authentication runtime dependency is required for the first implementation.
- Character data is scoped to the authenticated user instead of the previous demo user.
- The `AUTH_SECRET` environment variable must be set outside local development.
- A future iteration can replace the simple signed token with JWT, refresh tokens, or cookie sessions without changing the character domain service contracts.
