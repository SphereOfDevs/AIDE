# Skill: Spec

Transform an idea into an approved, implementable specification.

## Input

- Feature idea or user story (from user or `docs/project.md`)
- Relevant context: `docs/project.md`, existing architecture

## Steps

1. **Validate alignment** — confirm the idea fits the project goal in `docs/project.md` and MVP scope in `docs/business.md`
2. **Clarify requirements** — ask targeted questions for ambiguous areas; do not assume
3. **Define scope** — explicit in-scope and out-of-scope items
4. **Write acceptance criteria** — testable, numbered checklist
5. **Identify dependencies** — APIs, data model, UI, third-party services
6. **Assess architecture impact** — flag if ADR required
7. **Produce spec document** — save to `docs/specs/<feature-name>.md`
8. **Request approval** — stop and wait for human sign-off before implement stage

## Output

Spec document containing:

- Title and summary
- Problem and user value
- Functional requirements
- Non-functional requirements (performance, security)
- Acceptance criteria (checkboxes)
- Out of scope
- Open questions (if any remain)
- Architecture notes / ADR reference

## Constraints

- Do not write implementation code during this skill
- Do not invent requirements — ask when information is missing
- Block downstream skills until spec status is **Approved**
- Keep spec under 200 lines; link to docs for detail
