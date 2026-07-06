# Skill: QA

Validate implementation against spec before marking Done.

## Input

- Approved spec with acceptance criteria
- Implementation deployed or runnable locally
- Review verdict: Approve

## Steps

1. **Verify gates** — spec approved, review passed
2. **Build checklist** — convert acceptance criteria to test cases
3. **Execute happy path** — primary user flow end-to-end
4. **Execute edge cases** — errors, empty states, boundary inputs
5. **Cross-browser / platform** — if UI, check target platforms
6. **Regression spot-check** — adjacent features still work
7. **Record results** — pass/fail per criterion with evidence
8. **Verdict** — Pass (Done-ready) or Fail (return to Implement)

## Output

QA report:

```markdown
## QA: <feature-name>

### Verdict: Pass | Fail

### Test Results
| # | Criterion | Result | Notes |
|---|-----------|--------|-------|

### Issues Found
- ...

### Sign-off
Ready for Done: Yes/No
```

## Constraints

- Do not mark Done with failing P0 criteria
- File bugs with reproduction steps for failures
- QA is verification, not spec writing — no new scope
- Security-sensitive flows require explicit negative tests
