# AIDE Init — Review & Proposals

> Reviewed: 2026-07-06 | Scope: `aide init` logic, token efficiency, feature gaps

---

## 1. Logic Bugs & Correctness Gaps

### 1.1 `ensureMissingSurveyFiles` only checks the task template

**File:** `src/generator/init-flow.ts`

`ensureMissingSurveyFiles` is called on every `aide init` when a manifest already exists. It only checks for the task template file. If a persona's extra survey file was deleted (`roadmap.md` for PM, `backlog.md` for PO, etc.) and the user re-runs `aide init`, the missing file is **not recreated**. Only `aide configure` calls `ensurePersonaSurveyFile`.

**Fix:** Loop through `state.personas` in `ensureMissingSurveyFiles` and call `ensurePersonaSurveyFile` for each persona whose extra file is missing, mirroring what `runSurveyPhase` does.

---

### 1.2 Survey file changes don't trigger re-generation in `generated` phase

**File:** `src/generator/init-flow.ts`

The `generated` phase only watches the task-template hash for changes. If the user edits `AIDE_SURVEY/project.md`, `AIDE_SURVEY/coding-standards.md`, or any other survey file and re-runs `aide init`, the response is **"Already generated — nothing to do."** Agents and docs are not updated.

**Fix:** In the `generated` phase, compare hashes for ALL tracked `state.surveyFiles` against disk. For any file whose hash changed, re-generate the personas whose `requiredSurveyFiles` includes that file. Use the same scoping logic already present for task-template.

---

### 1.3 Removed providers/personas leave orphaned files

**File:** `src/generator/configure.ts`

`aide configure` warns "existing template files were kept on disk" when a provider or persona is removed. There is no cleanup path. Users deselecting Claude still have `.claude/` files on disk with no way to remove them short of `aide delete`.

**Fix:** Either add a `--clean-removed` flag to `aide configure`, or document `aide delete --provider claude` as a dedicated removal path (and implement it).

---

### 1.4 `initGitRepository` uses blocking `execSync`

**File:** `src/utils/fs.ts` — line 159

```ts
execSync('git init', { cwd: targetDir, stdio: 'pipe' });
```

This blocks the Node.js event loop and silently swallows stderr. It works today but is inconsistent with the rest of the async codebase.

**Fix:** Replace with `util.promisify(exec)` or the `execa` package for consistent async behaviour and proper error reporting.

---

### 1.5 `syncDocsFromSurvey` writes unconditionally

**File:** `src/generator/generate.ts` — line 152

```ts
await writeManagedFile(destinationPath, content, { force: true });
```

Even when survey content is unchanged between runs, the file is overwritten and the hash baseline is reset. This causes legitimate user edits to appear as "in sync" in `aide audit` when they were already present before re-generation.

**Fix:** Compare the content hash before writing. Skip the write if `hashContent(newContent) === generatedFiles[relativePath]`.

---

### 1.6 Schema version tracked but never validated

**File:** `src/utils/manifest.ts`

`schemaVersion: 1` is written to every `state.json` but `normalizeState` silently fills in defaults for any unrecognised or missing fields with no warning. If a user opens a project initialised with a future version of AIDE in an older CLI, they get silent degraded behaviour.

**Fix:** Check `state.schemaVersion` in `readManifest`. If it is higher than the current CLI's supported version, warn the user. Add a migration table for upgrading from older schemas.

---

## 2. Missing CLI Features

### 2.1 No `--dry-run` flag

Users cannot preview what `aide init` would create or overwrite without actually touching disk. This is a safety concern when running against an existing project for the first time.

**Proposed:** `aide init --dry-run` prints a list of files that would be written, regenerated, or skipped, then exits without writing anything.

---

### 2.2 No `--force-regen` / `aide regen` command

In the `generated` phase, there is no way to force re-generation of all agents from current survey content without workarounds (touching a file, going through `aide configure`).

**Proposed:** `aide init --force` re-generates all agents and docs regardless of phase. Or add a dedicated `aide regen [--personas <list>]` command for selective persona re-generation.

---

### 2.3 No `aide audit --json` output

`aide audit` is purely human-readable. CI pipelines cannot parse its output to gate on survey fill status or file drift.

**Proposed:** `aide audit --json` outputs a structured JSON object:
```json
{
  "phase": "generated",
  "surveyFiles": { "AIDE_SURVEY/project.md": "filled" },
  "generatedFiles": { "docs/project.md": "in-sync" },
  "suggestions": []
}
```

---

### 2.4 No AIDE version recorded in `state.json`

The manifest tracks `schemaVersion` but not the AIDE package version that wrote the file. A future `aide upgrade` command has no baseline to diff against.

**Proposed:** Add `"aideVersion": "2.0.0"` to `state.json`. Use it in `aide audit` output and as the basis for the `aide upgrade` command.

---

### 2.5 No `aide upgrade` command

There is no way to refresh managed rules/skills/commands to their latest template versions without re-running the full init flow. Over time, generated files drift from updated templates.

**Proposed:** `aide upgrade` re-applies the latest managed-file versions for rules, skills, and commands, preserving survey files and user-edited content. Uses the `managedBy: aide` marker to identify safe-to-overwrite files.

---

## 3. Token Efficiency — Cursor Rules

### 3.1 `always.mdc` contains expensive "Read X before Y" instructions

**File:** `templates/cursor/.cursor/rules/always.mdc`

The "Documentation First" section instructs the AI to read three docs files before various tasks. Because this rule has `alwaysApply: true`, these instructions inject into **every single message**, including ones unrelated to features or code.

```md
## Documentation First            ← loaded on every message
- Read `docs/project.md` before feature proposals
- Read `docs/architecture.md` before structural changes
- Read `docs/coding-standards.md` before writing code
```

**Fix:** Remove "Documentation First" from `always.mdc`. Move these reading instructions into the specific skill files (`spec.md`, `implement.md`) where they are actually needed and will only load when those stages are active.

**Proposed lean `always.mdc` body** (≈40% smaller):

```md
# Workflow Gates — {{PROJECT_NAME}}

- Identify current stage: Idea · Spec · Implement · Review · QA · Done
- No code without an approved spec in `docs/specs/`
- No architecture changes without ADR in `docs/decisions.md` + approval
- Minimal diffs — only files required by the active spec
- Ask when scope is ambiguous; never invent requirements

## Prohibited
- Committing secrets or credentials
- `any` in TypeScript without justification
- Deleting tests to pass a build
- Implementing without referencing an approved spec
```

---

### 3.2 `security.mdc` should be glob-scoped, not always-on

**File:** `templates/cursor/.cursor/rules/security.mdc`

Security rules are not relevant when the AI is working on frontend components, test files, or markdown docs. Loading them on every message wastes context.

**Fix:** Add glob scoping to `security.mdc`:

```
globs: src/**/api/**,src/**/auth/**,**/*.controller.ts,**/*.service.ts,**/*.gateway.ts
alwaysApply: false
```

---

### 3.3 Programmer persona has no `tools:` restriction

**File:** `src/personas/registry.ts`

Every non-programmer persona has explicit `cursorTools`/`claudeTools` lists. The programmer has neither, which means its agent gets no `tools:` line in the generated frontmatter → unrestricted tool access in Cursor.

```ts
{
  key: 'programmer',
  // cursorTools: undefined  ← no restriction generated
  // claudeTools: undefined
}
```

**Fix:** Add explicit tool lists:

```ts
cursorTools: ['Read', 'Edit', 'Grep', 'Glob', 'Bash'],
claudeTools: ['Read', 'Edit', 'Grep', 'Glob', 'Bash'],
```

---

### 3.4 Add a `context.mdc` efficiency rule (opt-in)

A non-alwaysApply rule that skill files can pull in when the AI is doing analysis or search-heavy work:

```mdc
---
description: Context window efficiency — read by spec and review skills
alwaysApply: false
---

## Reading docs efficiently
- Read only the relevant section from `docs/*`, not the full file
- Use `Grep` over full-file reads for large documents
- Quote specific headings, not entire files

## Response formatting
- Status in one sentence; checklists as bullets
- Omit boilerplate visible in the diff
- Do not repeat the user request verbatim
```

---

## 4. Token Efficiency — Claude Code

### 4.1 Lean CLAUDE.md

The generated `CLAUDE.md` is ~80 lines loaded at the start of every Claude Code session. The Documentation Map table (8 rows) is reference material — not instructions the AI needs on every turn.

**Fix:** Extract the full Documentation Map and Commands table into a linked `CLAUDE_REFERENCE.md`. Replace the table in `CLAUDE.md` with one line:

```md
See `CLAUDE_REFERENCE.md` for the full documentation map and command reference.
```

---

### 4.2 Model hints per persona for Claude agents

**File:** `src/generator/agent-files.ts`

All Claude agents are generated with `model: inherit`. For non-coding personas (PM, PO, Designer, Business Analyst, Marketing Specialist) that primarily read and write markdown, inheriting the full Sonnet/Opus model is wasteful.

**Proposed:** Add an optional `claudeModel` field to `PersonaDefinition`:

```ts
export interface PersonaDefinition {
  // ...existing fields...
  claudeModel?: 'claude-haiku-3-5' | 'claude-sonnet-4-5' | 'inherit';
}
```

Then emit `model: claude-haiku-3-5` in the frontmatter for lighter personas. Programmer and QA retain `model: inherit` to use the best available model for code generation.

---

## 5. New Feature Proposals

### 5.1 More stack templates

Currently: Angular, React, Node.js JS/TS, Tailwind.

| Stack | Fragment file | Cursor globs |
|-------|--------------|--------------|
| Vue 3 | `vue.md` | `**/*.vue` |
| Next.js | `next.md` | `**/*.tsx,**/pages/**,**/app/**` |
| Python (FastAPI) | `python-fastapi.md` | `**/*.py` |
| Go | `go.md` | `**/*.go` |
| .NET / C# | `dotnet.md` | `**/*.cs` |

---

### 5.2 Survey fill quality score in `aide audit`

Currently audit reports "filled" or "not filled" based purely on hash change. This misses cases where a file was edited but still contains `TODO` or unfilled placeholder sections.

**Proposed:** In `audit.ts`, scan each survey file for remaining `TODO`, `[your...]`, and unfilled section markers. Report a quality indicator:

```
AIDE_SURVEY/project.md — filled ✓
AIDE_SURVEY/business.md — partially filled (2 TODO sections remaining)
AIDE_SURVEY/architecture.md — not filled (still template default)
```

---

### 5.3 Git hook generation (optional)

Offer to generate `.git/hooks/pre-commit` that runs `aide audit --json` and fails the commit if:
- any generated file has drifted without re-running `aide init`
- any required survey file is still unfilled

Proposed flag: `aide init --git-hooks`

---

### 5.4 Post-generation hook

`aide init --post-hook <cmd>` runs a shell command after generation completes. Useful for running a formatter, sending a CI notification, or triggering a documentation build.

---

### 5.5 `aide info` command

A lightweight status command that prints current state without the full file-by-file audit:

```
Project:   my-app
Phase:     generated
Providers: cursor + claude
Personas:  Programmer, PM, QA
Stacks:    React, Tailwind
Updated:   2026-07-06
```

This is the "one-liner status" that `aide audit` doesn't provide without scrolling through all files.

---

## 6. Priority Matrix

| Proposal | Token Impact | Correctness | Effort |
|---|:---:|:---:|:---:|
| Remove "Documentation First" from `always.mdc` | High | — | Low |
| Glob-scope `security.mdc` | Medium | — | Low |
| Add `tools:` to programmer persona | Medium | — | Low |
| Survey change detection for all files (1.2) | — | High | Medium |
| `ensureMissingSurveyFiles` covers persona extras (1.1) | — | Medium | Low |
| `--dry-run` flag | — | — | Medium |
| `aide regen` / `--force-regen` | — | — | Low |
| `aide audit --json` | — | — | Low |
| AIDE version in `state.json` | — | — | Low |
| Lean CLAUDE.md (extract reference table) | Medium | — | Low |
| Claude model hints per persona | Medium | — | Medium |
| More stacks (Vue, Next.js, Python, Go) | — | — | Medium |
| Survey fill quality score in audit | — | — | Medium |
| `aide upgrade` command | — | — | High |
