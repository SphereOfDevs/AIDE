# Command: /qa

## Purpose

Validate that implementation meets all acceptance criteria before marking work Done.

## Input

- Approved spec with acceptance criteria
- Review verdict: **Approve**
- Runnable application or test environment

## Expected Output

QA report at `docs/specs/<feature-name>-qa.md`:

```markdown
## QA: <feature-name>

**Date:** YYYY-MM-DD  
**Verdict:** Pass | Fail

### Environment
- Branch / version:
- Browser / platform:

### Test Results
| # | Acceptance Criterion | Result | Evidence |
|---|---------------------|--------|----------|

### Defects
| ID | Severity | Description | Steps to Reproduce |
|----|----------|-------------|-------------------|

### Sign-off
- Ready for Done: Yes/No
- Follow-up items:
```

## Step-by-Step Execution

1. Verify review verdict is **Approve**
2. Build test matrix from spec acceptance criteria
3. Execute happy-path scenarios end-to-end
4. Execute error and edge-case scenarios
5. Verify UI states: loading, empty, error (if applicable)
6. Spot-check regression on adjacent features
7. Record pass/fail with screenshots or command output as evidence
8. Assign verdict:
   - **Pass** — all P0 criteria pass
   - **Fail** — return to `/implement` with defect list
9. On Pass, prompt user to update changelog and mark spec Done

## Constraints

- Do not pass QA with failing P0 criteria
- Do not add scope — file defects instead
- Security flows require negative test cases
- QA is verification, not re-specification
