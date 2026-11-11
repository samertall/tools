# TaskFlow — clarity for work in motion

An original, responsive task-management workspace built as a recovery-friendly starter for Samer Tallauze. The previous `taskflow` Vercel project had no deployments or recoverable source. This implementation does **not** claim to be its original code or use the unrelated Devpost TaskFlow application.

## Features

- Project-aware Kanban and accessible list views
- Create, edit, move and remove tasks; priority, owner, due date and project labels
- Search, priority filters and keyboard shortcuts (`/` to search, `N` to add, `Esc` to close)
- Progress overview and overdue insights
- Drag and drop between stages, with a keyboard-accessible status selector as an alternative
- Local persistence in the visitor's browser, plus JSON export
- Responsive desktop, tablet and mobile layouts, focus states and reduced-motion support

## Run and test

Serve this directory with a static HTTP server, such as `npx serve .`, and open the URL. To run the no-dependency model tests:

```sh
npm test
```

## Data and release limits

This is a **local-first MVP**, not a multi-user production SaaS. Tasks are stored in `localStorage` on each browser. There is no user authentication, server-side database, team synchronization, invite flow, email or AI integration yet. The names and tasks shown on first launch are explicitly illustrative. The pre-existing Neon integration on the Vercel project is intentionally untouched; no migrations or writes are performed.

Before general release, add authenticated server-side task storage, role-based workspace permissions, an export/import plan and end-to-end tests. Keep the Preview deployment protected during review.

## Source

An isolated branch of `samertall/tools`; it replaces that branch's tree only, leaving `tools/main` and other product branches untouched.
