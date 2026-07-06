## Node.js (JavaScript)

- CommonJS or ESM — pick one per project and stay consistent
- Validate all external input at the boundary (no trusting request bodies)
- Use `async/await`; avoid callback-style APIs in new code
- Centralize error handling in middleware/handlers — no silent catches
- Structured JSON logging — no bare `console.log` in production paths
- Keep route handlers thin; business logic lives in dedicated service modules
