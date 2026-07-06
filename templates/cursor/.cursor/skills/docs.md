# Skill: Docs

Update documentation and changelog when work reaches Done.

## Input

- Completed feature with QA Pass
- Spec, implementation summary, QA report

## Steps

1. **Verify gate** — QA verdict is Pass
2. **Update changelog** — add entry under `[Unreleased]` in `docs/changelog.md`
3. **Update product doc** — mark feature status in `docs/project.md` if user-visible
4. **Update README** — setup or usage changes if applicable
5. **Archive spec** — set spec status to **Done** in `docs/specs/<feature>.md`
6. **API docs** — update endpoint or type documentation if public API changed
7. **Final summary** — what shipped, known limitations, follow-ups

## Output

- Updated `docs/changelog.md`
- Updated relevant docs (product, README, API)
- Spec marked Done
- Release notes draft (if preparing version tag)

## Constraints

- Do not document unimplemented features
- Changelog follows Keep a Changelog format
- User-facing language in changelog; technical detail in ADRs
- Link related ADRs and specs in changelog entries
