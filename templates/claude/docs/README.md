# Shared documentation

Documentation for {{PROJECT_NAME}} is maintained in this directory.

Files are injected from the AIDE shared template layer during `aide init`.

See:

- `project.md` — product description, goal, target audience, key features (sourced from `AIDE_SURVEY/project.md`)
- `business.md` — business model, pricing, KPIs (sourced from `AIDE_SURVEY/business.md`)
- `architecture.md` — system design (sourced from `AIDE_SURVEY/architecture.md`)
- `coding-standards.md` — engineering conventions (sourced from `AIDE_SURVEY/coding-standards.md`)
- `decisions.md` — architecture decision records
- `changelog.md` — release history

`project.md`, `business.md`, `architecture.md`, and `coding-standards.md` are generated from `AIDE_SURVEY/` by `aide init` — edit the survey files, not these directly, then re-run `aide init`.

Specs for individual features live in `docs/specs/` (create when running `/spec`).
