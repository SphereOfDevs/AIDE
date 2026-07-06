# Skill: Refactor

Improve code structure without changing external behavior.

## Input

- Target module or technical debt description
- Current code and tests
- Optional ADR for structural pattern change

## Steps

1. **Confirm scope** — behavior-preserving only; no feature additions
2. **Baseline tests** — ensure existing tests pass before changes
3. **Identify smell** — duplication, coupling, naming, complexity
4. **Plan refactor** — small steps, each leaving tests green
5. **Execute incrementally** — one concern per commit when possible
6. **Verify** — full test suite passes; no behavior change
7. **Document** — note what changed and why in PR description

## Output

- Refactored code with passing tests
- Summary of structural improvements
- ADR update if boundaries changed

## Constraints

- No behavior changes — defer features to spec → implement flow
- No refactor mixed with feature work in same PR
- Architecture boundary changes require ADR + approval
- Stop if tests are insufficient — add tests first
