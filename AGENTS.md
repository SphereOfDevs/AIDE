<!-- managed-by: aide -->

# AGENTS — aide

> AI agent operating manual | Created: 2026-07-06

## Project Vision

aide is built spec-driven: every feature starts as a written specification, passes review, then gets implemented and validated. AI agents are engineering collaborators, not autonomous coders.

Read `docs/project.md` for problem statement, target audience, and key features.

## Architecture

Follow `docs/architecture.md` and `project-structure.md`. Module boundaries:

- Presentation → Application → Domain → Infrastructure

**Strict rule:** No architecture changes without an ADR in `docs/decisions.md` and explicit human approval.

## Workflow Pipeline

```
Idea → Spec → Implement → Review → QA → Done
```

| Stage | Skill | Gate |
|-------|-------|------|
| Idea | — | Problem validated against vision |
| Spec | `spec` | Spec document approved |
| Implement | `implement` | Spec exists and is approved |
| Review | `review` | Code complete for scope |
| QA | `qa` | Review passed |
| Done | `docs` | Changelog and docs updated |

## Strict Rules

1. **No implementation without spec** — run the `spec` skill first; block coding until spec is approved
2. **No architecture changes without approval** — write ADR, wait for confirmation
3. **No invented requirements** — ask when product scope is unclear
4. **Follow project structure** — place files per `project-structure.md`
5. **Minimal diffs** — change only what the spec requires
6. **Reference docs** — cite `docs/business.md`, `docs/coding-standards.md` in decisions

## Cursor Configuration

| Path | Purpose |
|------|---------|
| `.cursor/rules/` | Always-on behavior enforcement (including stack-specific rules) |
| `.cursor/skills/` | Stage-specific workflows |
| `.cursor/agents/` | Persona subagents (Programmer, PM, PO, Designer, QA, Business Analyst, Marketing Specialist) |
| `mcp.json` | Optional Linear and GitHub integrations |
| `docs/` | Shared product and engineering docs, generated from `AIDE_SURVEY/` |
| `AIDE_SURVEY/` | Fill this in — feeds `docs/` and every persona agent |
| `AIDE_INSTRUCTION.md` | How to use the generated AI team |

## MCP Integrations (Optional)

Enable in `mcp.json` when credentials are available:

- **Linear** — issue tracking, spec linkage
- **GitHub** — PRs, code review, CI status

## Agent Behavior

- Start every task by identifying the workflow stage
- Output structured artifacts (specs, review notes, QA checklists)
- Escalate ambiguity to the user before proceeding
- Update `docs/changelog.md` when shipping user-visible changes

## Getting Started

1. Fill in `AIDE_SURVEY/` and run `aide init` to generate your persona agents (see `AIDE_INSTRUCTION.md`)
2. Read `docs/project.md` and `docs/business.md`
3. Run `spec` skill for the first feature
4. After approval, run `implement` → `review` → `qa` → `docs`
5. Run `aide audit` periodically to check survey fill status and drift; `aide persona add` to grow the team
