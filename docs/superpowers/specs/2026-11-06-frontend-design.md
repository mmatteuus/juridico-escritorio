---
name: frontend-design
description: Design specification for the office front‑end based on the SISTEMA‑JURIDO vault documentation.
metadata:
  type: reference
---

# Front‑end Design Specification (2026‑11‑06)

## 1. Purpose & Success Criteria
- Build a **single‑page PWA** (`apps/office-pwa`) that serves as the **operational dashboard** for the law office.
- Users must see **their tasks, case dossier, documents, communication, and financial info** in a unified view.
- Must respect the **RBAC/ABAC permission model** defined in *02‑Hierarquia‑e‑permissoes.md* (tenant‑aware, role‑based, attribute‑scoped).
- Support **offline‑first** sync (see *11 Sincronização PWA‑offline‑first* in *01‑Visão‑do‑produto.md*) with visual indication of sync status.
- Provide **quick‑action shortcuts** (new case, task, document) as highlighted in the UX improvements list.
- Ensure **access‑control enforcement** on the UI layer: hide/disable actions the current user is not permitted to perform.

## 2. High‑Level Architecture
- **Monorepo layout** (see *03‑Arquitetura‑Neon‑Cloudflare.md*):
  - `apps/office-pwa` – React/Next.js (or Remix) PWA entry point.
  - `packages/ui` – shared UI components (already present under `src/components/ui`).
  - `packages/authz` – client‑side helpers that interpret permission policies from the backend.
  - `packages/api` – thin wrapper around the Cloudflare Worker API gateway (authentication, rate‑limit, RBAC checks).
- **Data fetching** via **React Query** (or TanStack Query) with **optimistic updates**; cached queries are **not** used for sensitive data (see Hyperdrive cache note).
- **Offline sync** uses **Workbox** service workers; queues mutations locally and replays when connectivity restores, respecting the `RLS` and tenant scoping.
- **Real‑time notifications** via Cloudflare Queues + WebSocket fallback; UI shows badge counts and toast alerts (`src/components/ui/sonner.tsx`).

## 3. Component Hierarchy (selected)
```
<AppShell>
  <GlobalSearch />
  <Sidebar>
    <NavigationMenu />
    <TeamList />
  </Sidebar>
  <Main>
    <Dashboard>
      <Inbox />
      <QuickActions />
    </Dashboard>
    <CaseView />
    <TaskList />
    <DocumentViewer />
  </Main>
  <Notifications />
</AppShell>
```
- All components live under `src/components/office/` (existing) or `src/components/ui/` (shared).
- Each page/component receives a **`usePermission` hook** that checks the current user's roles/attributes against the required permission string (e.g., `"case:read"`).

## 4. Routing & Pages
- **File‑based routing** (`src/routes/`):
  - `/` – Home/Dashboard (Inbox, quick actions).
  - `/casos` – List of cases (search, filter, pagination).
  - `/casos/$id` – Detailed case view with tabs for **Documents**, **Tasks**, **Communications**.
  - `/tarefas` – User’s task board.
  - `/financeiro` – Financial overview (honorários, pagamentos) – only visible to roles with `financeiro:*`.
- All routes are **protected** by `withAuth` HOC that redirects to login when unauthenticated.

## 5. State Management & Data Layer
- **Auth**: `useAuth` stores JWT from Worker gateway, decodes tenant & role claims.
- **Permissions**: `usePermission` reads the token and optionally fetches policy summary from `/api/policy` (cached per session).
- **Domain stores**: `src/features/demo/store.tsx` showcases a simple Zustand store; extend for cases, tasks, documents.
- **Sync queue**: `src/hooks/useOfflineQueue.tsx` buffers mutations (`createCase`, `updateTask`, etc.) and replays on reconnection.

## 6. UX Priorities (from Vision doc)
- **Universal quick‑action button** (floating FAB) to create case, task, document, client.
- **Unified inbox** badge showing items assigned, awaiting response, pending review.
- **Zero duplicate entry** – client/party search with auto‑complete that warns on duplicates.
- **Search bar** respecting RBAC (filters by tenant, role, case visibility).
- **Daily summary & priority alerts** – top‑right banner with links to high‑priority items.
- **Delegation & absence** UI to set out‑of‑office periods without giving full access.

## 7. Accessibility & Theming
- Use **Radix UI** primitives for accessible components.
- Provide **dark / light** themes via CSS variables; respect system preference.
- All interactive elements must have ARIA labels and keyboard shortcuts (e.g., `Ctrl+K` for global search).

## 8. Testing Strategy
- **Unit tests** for each UI component using **Vitest** + **React Testing Library**.
- **Integration tests** for routing and permission gating using **Playwright** (`playwright-mcp` skill may be used later).
- **Offline tests** simulate network loss and ensure queued mutations persist.

## 9. Open Questions (to be resolved before implementation)
1. Which UI library (Shadcn UI vs custom) should be the primary source for the design system?
2. Desired analytics provider for usage tracking (respecting LGPD)?
3. Exact shape of the auth token payload – confirm tenant and role claim keys.

---
*Please review this spec and let me know if any changes are needed before we generate the detailed implementation plan.*
