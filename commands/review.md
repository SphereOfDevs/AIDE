<!-- managed-by: aide -->

# Command: /review

## Purpose

Perform structured code review validating implementation against the approved spec and project standards.

## Input

- Implementation diff or changed files
- Approved spec: `docs/specs/<feature-name>.md`
- Implementation summary from `/implement`
- `docs/coding-standards.md`

## Expected Output

Review report (`docs/specs/<feature-name>-review.md` or PR comment):

```markdown
## Review: <feature-name>

**Reviewer:** Claude  
**Date:** YYYY-MM-DD  
**Verdict:** Approve | Request Changes | Block

### Spec Compliance
| # | Criterion | Status | Notes |
|---|-----------|--------|-------|

### Findings
| Severity | Location | Issue | Recommendation |
|----------|----------|-------|----------------|

### Security
- [ ] Input validated
- [ ] Auth enforced
- [ ] No secrets exposed

### Tests
- [ ] Unit tests adequate
- [ ] Integration coverage for boundaries

### Summary
Overall assessment and required actions.
```

## Step-by-Step Execution

1. Read approved spec — list all acceptance criteria
2. Examine each changed file against coding standards
3. Check architecture layer boundaries
4. Scan for security issues (injection, auth, secrets)
5. Evaluate test coverage vs acceptance criteria
6. Categorize findings: Blocker, Major, Minor, Nit
7. Assign verdict:
   - **Approve** — no blockers, criteria met
   - **Request Changes** — fixable issues
   - **Block** — spec not met or security risk
8. Save report and communicate verdict

## Constraints

- Block on unmet P0 acceptance criteria
- Be specific — file paths and line references
- Do not rewrite code unless asked
- Separate blockers from suggestions
