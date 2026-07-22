<!-- managed-by: aide -->

# Skill: Review

Perform structured code review against spec and standards.

## Input

- Implementation diff or changed files
- Approved spec at `docs/specs/<feature-name>.md`
- `docs/coding-standards.md`, relevant rules

## Steps

1. **Spec compliance** — map each acceptance criterion to implementation
2. **Architecture check** — verify layer boundaries and file placement
3. **Code quality** — naming, readability, error handling, types
4. **Security scan** — input validation, auth, secrets, injection risks
5. **Test adequacy** — behavior covered; edge cases considered
6. **Document findings** — categorize as blocker, suggestion, nit
7. **Verdict** — Approve, Request Changes, or Block

## Output

Review report:

```markdown
## Review: <feature-name>

### Verdict: Approve | Request Changes | Block

### Spec Compliance
- [ ] Criterion 1 — pass/fail + note
...

### Findings
| Severity | File | Issue | Recommendation |
|----------|------|-------|----------------|

### Summary
One paragraph overall assessment.
```

## Constraints

- Block merge if spec criteria unmet or security blockers exist
- Be specific — cite file and line where possible
- Do not rewrite code unless asked — recommend changes
- Distinguish blockers from optional improvements
