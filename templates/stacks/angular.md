## Angular

- Angular 17+ with standalone components — avoid `NgModule` for new code
- Use Signals for local component state; avoid RxJS unless the async pattern genuinely requires it
- Prefer the `inject()` function over constructor injection
- Lazy-load routes with standalone `loadComponent`
- `ChangeDetectionStrategy.OnPush` by default
- Co-locate template/styles with the component unless the team prefers separate files
- Use the Angular CLI schematics for new components/services to keep structure consistent
