# Skill: Implement

Implement an approved spec with minimal, focused changes.

## Input

- Approved spec at `docs/specs/<feature-name>.md` (status: Approved)
- `docs/architecture.md`, `project-structure.md`, `docs/coding-standards.md`

## Steps

1. **Verify gate** — confirm spec exists and is approved; stop if not
2. **Plan files** — list files to create/modify aligned with project structure
3. **Implement incrementally** — domain first, then infrastructure, then presentation
4. **Add tests** — unit tests for business logic; integration tests for boundaries
5. **Self-check** — run linter and tests locally
6. **Summarize changes** — file list, key decisions, anything deferred

## Output

- Working code matching spec acceptance criteria
- Tests covering new behavior
- Brief implementation summary for review stage

## Constraints

- Change only what the spec requires
- No architecture changes without approved ADR
- No scope creep — defer extras to new spec
- Follow active rules: backend, frontend, security, testing
- Do not skip tests for "simple" changes
