# Architecture Decision Records — {{PROJECT_NAME}}

> Created: {{DATE}}

Record significant technical decisions here using the ADR format below.

---

## ADR-001: Project bootstrap with AIDE

**Date:** {{DATE}}  
**Status:** Accepted

### Context

Project initialized with the AIDE AI Development System for spec-driven development.

### Decision

Adopt the Idea → Spec → Implement → Review → QA → Done workflow with provider-specific agent configuration.

### Consequences

- All features require specs before implementation
- Architecture changes require ADR and approval
- AI agents must reference docs/ before structural changes

---

## ADR Template

Copy this template for new decisions.

### ADR-XXX: Title

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Deprecated | Superseded

### Context

What is the issue or force driving this decision?

### Decision

What is the change being proposed or enacted?

### Alternatives Considered

1. Option A — pros/cons
2. Option B — pros/cons

### Consequences

What becomes easier or harder as a result?

---

## Index

| ADR | Title | Status |
|-----|-------|--------|
| 001 | Project bootstrap with AIDE | Accepted |
