<!-- managed-by: aide -->

# Workflows — aide

> Pipeline reference for Claude Code | Created: 2026-07-06

## Overview

All work flows through a gated pipeline. Each stage produces an artifact. Do not skip gates.

```
┌──────┐   ┌──────┐   ┌──────┐   ┌───────────┐   ┌────────┐   ┌────┐   ┌──────┐
│ Idea │──▶│ Spec │──▶│ Plan │──▶│ Implement │──▶│ Review │──▶│ QA │──▶│ Done │
└──────┘   └──────┘   └──────┘   └───────────┘   └────────┘   └────┘   └──────┘
              │                      ▲                │
              └──── no code ─────────┘                │
              until approved                          │
                                                      ▼
                                              request changes
                                              → back to Implement
```

## Stage Definitions

### Idea

Informal problem or opportunity. Validate against `docs/project.md` before proceeding.

**Exit criteria:** Problem aligns with vision; worth specifying.

### Spec (`/spec`)

Written requirements with acceptance criteria. Saved to `docs/specs/<feature>.md`.

**Exit criteria:** Human approval — status set to **Approved**.

### Plan (`/plan`)

Implementation plan: files, order, tests, risks. No code yet.

**Exit criteria:** Plan reviewed; ready to implement.

### Implement (`/implement`)

Code and tests per plan and spec.

**Exit criteria:** All planned files written; tests pass locally.

### Review (`/review`)

Structured review against spec and standards.

**Exit criteria:** Verdict **Approve** — no blockers.

### QA (`/qa`)

Manual/automated validation of acceptance criteria.

**Exit criteria:** Verdict **Pass** — all P0 criteria met.

### Done

Update changelog, product docs, mark spec Done.

## Artifacts by Stage

| Stage | Artifact | Location |
|-------|----------|----------|
| Spec | Feature spec | `docs/specs/<feature>.md` |
| Plan | Implementation plan | In spec or `docs/specs/<feature>-plan.md` |
| Implement | Source + tests | `src/`, `tests/` |
| Review | Review report | In PR or `docs/specs/<feature>-review.md` |
| QA | QA report | `docs/specs/<feature>-qa.md` |
| Done | Changelog entry | `docs/changelog.md` |

## Rollback Rules

- QA Fail → return to Implement with bug list
- Review Request Changes → fix and re-review
- Spec change mid-implementation → pause, update spec, re-approve

## AI Behavior

- State current stage at start of each response
- Refuse implementation commands without approved spec
- Produce structured output matching command templates
