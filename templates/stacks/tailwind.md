## Tailwind CSS

- Use Tailwind utility classes directly in markup — avoid wrapping every element in a custom CSS class
- Extract repeated utility combinations into components, not `@apply` chains
- Centralize design tokens (colors, spacing, typography) in `tailwind.config` — no magic hex values in markup
- Use the official Prettier plugin for consistent class ordering
- Prefer responsive/state variants (`md:`, `hover:`, `dark:`) over custom media queries
- Keep accessibility in mind — utility classes don't replace semantic HTML
