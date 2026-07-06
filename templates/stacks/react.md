## React

- Function components with hooks — no class components in new code
- Keep components small; extract logic into custom hooks
- Colocate state as close to usage as possible; lift only when actually shared
- Use a dedicated data-fetching layer (React Query/SWR or equivalent) — no ad-hoc `fetch` in components
- Memoize expensive computations with `useMemo`/`useCallback`, but don't over-memoize
- Prefer composition over prop drilling — use context sparingly and only for cross-cutting concerns
- Type all props explicitly; no implicit `any`
