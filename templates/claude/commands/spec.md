# Command: /spec

## Purpose

Transform a feature idea into a complete, reviewable specification. This command blocks all implementation until the spec is approved.

## Input

- Feature description or user story from the user
- Context: `docs/project.md`, `docs/business.md`, `docs/architecture.md`

## Expected Output

A spec file at `docs/specs/<feature-name>.md` containing:

1. **Metadata** — title, author, date, status (Draft)
2. **Summary** — one paragraph problem and solution
3. **User value** — who benefits and how
4. **Requirements** — functional and non-functional
5. **Acceptance criteria** — numbered, testable checklist
6. **Out of scope** — explicit exclusions
7. **Dependencies** — data, APIs, UI, third parties
8. **Architecture notes** — ADR needed? (yes/no + reason)
9. **Open questions** — unresolved items for user

## Step-by-Step Execution

1. Read `docs/project.md` — confirm idea aligns with project goals and target audience
2. Read `docs/business.md` — check MVP scope and KPI impact; flag if out of scope
3. Ask clarifying questions — stop if critical information is missing
4. Draft spec using the output template above
5. Create `docs/specs/` directory if it does not exist
6. Write spec file with status **Draft**
7. Present spec to user and request approval
8. On approval, update status to **Approved**
9. Do not proceed to `/plan` or `/implement` without **Approved** status

## Constraints

- Do not write code
- Do not invent requirements
- Do not skip acceptance criteria
- Keep spec focused — link to docs for background
