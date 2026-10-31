# Decisions

Why this project is built the way it is, oldest first. One entry per decision that changes a
contract, a dependency, a data format or the architecture; IDs are consecutive and never reused.

### ADR-001: Adopt AIKit integration, AGL-1.1 licensing, and regression shield
- **Date**: 2026-10-31
- **Status**: Accepted
- **Context**: Afterimage was unmanaged and lacked AIKit project memory, licensing metadata, and automated tests, preventing it from meeting AIKit publish standards.
- **Decision**: Integrated project with AIKit memory (`.aikit/project.json`), adopted Aegean Game License 1.1 (`AGL-1.1`), seeded REUSE metadata and commercial terms, added `package.json` with Node.js test runner (`node --test tests`), created test harness and regression test suite covering PRNG determinism, daily challenges, scoring, and modes, and updated README to meet PRINCIPLE-005 cold-start requirements.
- **Consequences**: Afterimage satisfies all AIKit publish standards, runs automated tests in Phase 4, and passes all gates (test, mechanics, hygiene, guidelines, secrets).
