# Command: /plan

## Purpose

Break an approved spec into an actionable implementation plan without writing production code.

## Input

- Approved spec at `docs/specs/<feature-name>.md` (status: **Approved**)
- `docs/architecture.md`, `docs/coding-standards.md`

## Expected Output

Implementation plan (append to spec or save as `docs/specs/<feature-name>-plan.md`):

1. **Overview** — approach summary
2. **File manifest** — create/modify/delete list with paths
3. **Implementation order** — sequenced steps (domain → infra → UI)
4. **Data model changes** — schema, migrations if any
5. **API changes** — endpoints, contracts
6. **Test plan** — unit, integration, e2e coverage map
7. **Risks** — technical risks and mitigations
8. **Estimates** — relative size (S/M/L) per step

## Step-by-Step Execution

1. Verify spec status is **Approved** — stop if not
2. Read spec acceptance criteria — each must map to a plan step
3. Read architecture docs — confirm module placement
4. List all files to create or modify per `project-structure` conventions
5. Order steps to keep system buildable at each increment
6. Define test cases from acceptance criteria
7. Flag ADR requirement if plan touches architecture boundaries
8. Write plan document
9. Present plan for user confirmation before `/implement`

## Constraints

- No production code in this command
- Every acceptance criterion must trace to a plan step
- No scope beyond the approved spec
- Stop if spec gaps discovered — return to `/spec`
