# AIDE — AI Development Environment

**AIDE** (AI Development Environment) is an AI software engineering framework that bootstraps spec-driven, AI-assisted projects for **Cursor IDE** and **Claude Code**.

It behaves like an **AI Software Engineering OS**: rules, workflows, documentation, and agent configuration — generated in seconds.

---

## What is this?

AIDE is not a code generator. It is a structured engineering system that:

- Enforces **spec-before-code** discipline
- Provides **workflow skills** (Cursor) or **commands** (Claude)
- Ships a shared **docs layer** (vision, product, architecture, standards)
- Supports optional **MCP integrations** (Linear, GitHub)

AI is not a coder. AI is a collaborator inside a gated pipeline.

---

## Installation

```bash
npm install -g aide
```

For local development:

```bash
cd AIDE
npm install
npm run build
npm link
```

---

## Usage

```bash
# From your project directory — initializes in place (current folder)
cd my-existing-app
aide init

# Interactive multi-select for Cursor / Claude (or both)
# Space to toggle · Enter to confirm

# Non-interactive provider flags
aide init --provider cursor
aide init --provider claude
aide init --provider both
aide init --provider cursor,claude

# Initialize a specific directory
aide init --dir ./projects/my-app --provider cursor

# Skip git initialization
aide init --no-git
```

This adds AIDE files to the **current directory** (rules, skills, docs). Existing files are kept; only missing template files are created. Project name is taken from `package.json` or the folder name.

---

## Workflow

```
Idea → Spec → Implement → Review → QA → Done
```

| Stage | Cursor | Claude |
|-------|--------|--------|
| Spec | `spec` skill | `/spec` command |
| Plan | (in spec skill) | `/plan` command |
| Implement | `implement` skill | `/implement` command |
| Review | `review` skill | `/review` command |
| QA | `qa` skill | `/qa` command |
| Docs | `docs` skill | update `docs/changelog.md` |

**Gates:**

- No implementation without an approved spec
- No architecture changes without ADR + approval

---

## Philosophy

1. **AI is not a coder** — it operates inside constraints you define
2. **AI is a structured engineering system** — rules, skills, and docs shape behavior
3. **Everything must be spec-driven** — requirements are written before code

---

## Cursor vs Claude

| Aspect | Cursor Mode | Claude Mode |
|--------|-------------|-------------|
| Entry point | `AGENTS.md` | `CLAUDE.md` |
| Workflows | `.cursor/skills/*.md` | `commands/*.md` |
| Rules | `.cursor/rules/*.mdc` | Rules in `CLAUDE.md` |
| MCP config | `mcp.json` | — |
| Runtime | Cursor IDE (primary) | Claude Code (alternative) |

Both modes share identical `docs/` content from the shared template layer.

---

## Repository Structure

```
AIDE/
├── README.md
├── package.json
├── bin/aide.js              # CLI entry point
├── src/
│   ├── cli.ts
│   ├── generator/
│   │   ├── cursor-template.ts
│   │   ├── claude-template.ts
│   │   └── shared-template.ts
│   └── utils/
│       ├── fs.ts
│       └── logger.ts
├── templates/
│   ├── cursor/              # Cursor IDE template
│   ├── claude/              # Claude Code template
│   └── shared/docs/         # Shared documentation layer
└── examples/
    ├── cursor-project/
    └── claude-project/
```

---

## Generated Project Structure

### Cursor project

```
my-app/
├── AGENTS.md
├── mcp.json
├── project-structure.md
├── docs/
├── .cursor/rules/
└── .cursor/skills/
```

### Claude project

```
my-app/
├── CLAUDE.md
├── workflows.md
├── commands/
└── docs/
```

---

## Template Placeholders

During `aide init`, these placeholders are replaced:

| Placeholder | Value |
|-------------|-------|
| `{{PROJECT_NAME}}` | Project name argument |
| `{{DATE}}` | ISO date (YYYY-MM-DD) |

---

## Extending AIDE

- Add rules: `templates/cursor/.cursor/rules/`
- Add skills: `templates/cursor/.cursor/skills/`
- Add commands: `templates/claude/commands/`
- Update shared docs: `templates/shared/docs/`

Rebuild after TypeScript changes: `npm run build`

---

## License

MIT
