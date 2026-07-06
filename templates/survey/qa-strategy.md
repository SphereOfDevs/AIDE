<!-- managed-by: aide -->

# QA Strategy — {{PROJECT_NAME}}

> Owned by the QA agent. Fill this in with your real test strategy — this is what the QA persona reads and maintains.

## Test pyramid

Expected distribution and tooling per layer.

| Layer | Tooling | Coverage expectation |
|-------|---------|----------------------|
| Unit | _e.g. Jest_ | _e.g. business logic 80%+_ |
| Integration | _e.g. Supertest_ | _e.g. all API endpoints_ |
| E2E | _e.g. Playwright_ | _e.g. P0 user flows only_ |

## Regression policy

When and how is regression testing run? (e.g. "full suite on every PR", "smoke suite nightly")

_Replace this line with your answer._

## Environments

Where does QA run? (local, staging, dedicated QA environment)

_Replace this line with your answer._

## Bug severity definitions

| Severity | Definition |
|----------|------------|
| Blocker | _definition_ |
| Major | _definition_ |
| Minor | _definition_ |
