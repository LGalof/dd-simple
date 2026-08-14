# ADR-008: Analyze the Monorepo with SonarQube in CI

## Context

D&D Simple contains TypeScript source and tests across the API, web, and shared
workspaces. The project needs consistent static analysis and test coverage
reporting without creating separate quality dashboards for every workspace.

## Decision

Analyze the repository as one SonarQube project from the existing GitHub
Actions workflow. Backend tests use c8 and frontend tests use Vitest's V8
coverage provider to generate LCOV reports before the SonarQube scan.

Keep analysis scope and report paths in the root `sonar-project.properties`
file. Store the analysis token in the GitHub secret `SONAR_TOKEN` and the
reachable server URL in the GitHub variable `SONAR_HOST_URL`. Skip only the
scan when these settings are absent so forks and unconfigured environments can
still build and test the application.

Apply the `D&D Simple New Code` quality gate to the project. It rejects new
issues, coverage below 80% on new code, unreviewed security hotspots, and more
than 3% duplication on new code. The first verified local analysis is the
baseline; existing technical debt stays visible without preventing gradual
improvement.

## Alternatives Considered

- Separate SonarQube projects for API, web, and shared: allows independent
  quality gates but adds administration and fragments the project overview.
- Local-only analysis: avoids CI configuration but produces inconsistent and
  non-repeatable results.
- Analysis without coverage: is simpler but omits an important quality signal
  already supported by the existing test suites.

## Consequences

### Benefits

- One quality dashboard represents the whole repository.
- Analysis and coverage are repeatable in CI.
- Existing tests continue to run even before SonarQube credentials are added.

### Trade-offs

- The SonarQube Server must be reachable from the selected GitHub runner.
- Coverage tools add development dependencies and make CI tests somewhat
  slower.
- LCOV source paths need normalization because tests run inside npm
  workspaces while SonarQube scans from the repository root.
