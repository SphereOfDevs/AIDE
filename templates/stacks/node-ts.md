## Node.js (TypeScript)

- Domain-Driven Design (DDD) — model entities, value objects, and aggregates explicitly
- Clean Architecture layering: domain → application → infrastructure → presentation, dependencies point inward
- Strict TypeScript (`strict: true`); no `any`, use `unknown` and narrow
- Jest for unit and integration tests; one test file per module
- ESLint + Prettier enforced in CI, not just locally
- Dependency injection for infrastructure services (no `new` scattered through domain code)
- Repository pattern for persistence — domain code never imports an ORM directly
