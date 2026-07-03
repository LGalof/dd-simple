# 05 Testing

## Testing Strategy

Testing will evolve in phases:

1. build verification in CI
2. unit tests for core backend and shared logic
3. frontend component and page tests
4. integration tests for API and database flows

## Current State

The project now has two layers of automated verification:

1. build verification in CI
2. backend unit tests for character effect derivation logic

The backend unit tests currently focus on the high-risk dashboard derivation paths:

- spell derivation from class and feature-choice sources
- protection against false-positive spell parsing
- feature-choice grant normalization used by derived dashboard state

Run them with:

```bash
npm run test --workspace @dd-simple/api
```
