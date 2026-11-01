<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Frontend-only demo: all domain data lives in `src/features/demo` (types, fixtures, in-memory store); every list goes through `useOfficeView` so it is filtered by officeId and demo role. Why: simulate tenant isolation until a real backend replaces the store.
- Office routes live under `/o/$org/*`, wrapped by `AppShell` in `o.$org.tsx`. Why: shareable per-tenant URLs.
