# ADR-005: Use Local Password Authentication with Signed Bearer Tokens

## Status

Accepted

## Context

D&D Simple needs account registration, login, protected character data, protected room access, and authenticated Socket.IO connections. The authentication approach should be understandable within the project and should not require an external identity provider for the submitted system.

## Decision

Use local email/password authentication with `crypto.scrypt` password hashing and HMAC-signed bearer tokens. After registration or login, the API returns a signed bearer token. REST clients send the token in the `Authorization` header, protected backend routes resolve the current user from the token, and Socket.IO uses the same token during connection authentication.

## Alternatives Considered

- OAuth/SSO: useful for delegated identity, but adds external provider configuration and callback flow complexity.
- Server-side cookie sessions: familiar for browser apps, but requires session storage and cookie handling across frontend/API deployment shapes.

## Consequences

### Benefits

- Authentication is implemented without adding a third-party identity dependency.
- REST and Socket.IO use one consistent user-resolution model.
- Character and room operations can scope data to the authenticated user.

### Trade-offs

- Token signing secrets must be configured securely outside local development.
- The local account model does not provide the account-management features of a full identity provider.
