# Command: /implement

## Purpose

Implement an approved spec according to the implementation plan.

## Input

- Approved spec: `docs/specs/<feature-name>.md`
- Implementation plan from `/plan`
- `docs/coding-standards.md`, `docs/architecture.md`

## Expected Output

- Source code in `src/` following project structure
- Tests in `tests/` covering new behavior
- Implementation summary:
  - Files changed
  - Acceptance criteria addressed
  - Deferred items (if any)
  - How to run/test locally

## Step-by-Step Execution

1. Verify spec is **Approved** and plan exists — stop if not
2. Create feature branch (if using git)
3. Implement in plan order — domain layer first
4. Write tests alongside or immediately after each module
5. Run linter and test suite — fix failures
6. Self-review against acceptance criteria checklist
7. Produce implementation summary for `/review`
8. Do not mark complete if tests fail or criteria unmet

## Constraints

- Minimal diffs — spec scope only
- No architecture changes without approved ADR
- No `any` types without justification
- Follow error handling and security standards
- Do not skip tests
