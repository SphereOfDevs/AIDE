<!-- managed-by: aide -->

# Task Template — {{PROJECT_NAME}}

> Customize this template — it becomes `docs/task-template.md` and defines how PM/PO write new tasks.
> **Product Owner** creates tasks from this template in `docs/tasks/`. **Product Manager** may draft high-level tasks when no PO is configured; otherwise PM hands off to PO.

## How to use

1. Edit the **Task structure** section below to match how your team writes work items.
2. When creating a new task, copy the structure into `docs/tasks/<task-id>.md` (e.g. `docs/tasks/AIDE-001-user-login.md`).
3. Link the task from `docs/backlog.md` once it is ready for spec/implementation.
4. Export to your issue tracker (Linear, Jira, GitHub Issues) using the **Export fields** section if configured.

## Task structure

Use this structure for every new task file in `docs/tasks/`:

```markdown
# [TASK-ID] Title

> Status: Draft | Ready | In spec | In progress | Done
> Owner: PO | PM
> Priority: P0 | P1 | P2
> Created: YYYY-MM-DD

## Summary

_One paragraph: what and why._

## User story

**As a** _role_
**I want** _capability_
**So that** _outcome_

## Acceptance criteria

- [ ] _Criterion 1 — testable_
- [ ] _Criterion 2 — testable_

## Out of scope

- _Explicitly not included_

## Dependencies

- _APIs, designs, other tasks, or approvals needed_

## Notes

_Context, links, or open questions._
```

## Export fields

If you use an external tracker, map task fields here (PO fills in your tool's field names):

| AIDE field | Tracker field | Example |
|------------|---------------|---------|
| Title | _e.g. Summary_ | _example_ |
| Priority | _e.g. Priority_ | P0/P1/P2 |
| Acceptance criteria | _e.g. Description_ | _example_ |
| Status | _e.g. State_ | Draft |

_Replace this table with your tool's field mapping, or write "N/A — tasks stay in docs/tasks/ only"._

## Naming convention

How should task IDs and filenames be formatted?

_Replace this line — e.g. `PROJ-###`, `feature-short-desc`, or `AIDE-###-slug`._
