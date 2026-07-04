# Admin Dashboard (Frontend)

React admin SPA under `/admin/*`, separate from the customer mobile app in `src/pages/`.

## Full documentation

**[ADMIN_DASHBOARD_GUIDE.md](../../docs/ADMIN_DASHBOARD_GUIDE.md)** — single source of truth:

- Project structure, routes, and APIs for all ~50 pages
- Design system tokens and UI primitives
- Auth, roles (ADMIN / PROVIDER / vendor types), and sidebar rules
- Local development and migration roadmap

Also see [ADMIN_SEPARATION.md](./ADMIN_SEPARATION.md) for admin vs mobile separation.

## Quick structure

```
src/admin/
├── AdminApp.jsx           # Routes + Protected wrapper
├── components/
│   ├── AdminLayout.jsx  # Sidebar, header, notifications (most pages)
│   └── AdminPage.jsx    # Layout + PageHeader + loading (target standard)
├── design-system/       # Re-exports from src/components/ui/
├── pages/               # 50 page components
└── utils/
    ├── adminSession.js  # API_URL, auth, permissions
    └── adminApi.js      # Vendor mobile API helpers
```

## Design migration status (ADS)

| Layer | Status |
|-------|--------|
| **Tokens & layout** | All `/admin/*` pages (except login) use `AdminPage`, ADS blue sidebar, `PageHeader` |
| **Rich components** | `VendorWallet`, `VendorReports`, `Dashboard` use `Card` / `StatCard` / `ChartContainer` |
| **Page content** | Many pages still have legacy inner HTML; overridden via `globals.css` ADS compatibility rules |

Tokens and components: `src/styles/globals.css` (`--admin-*`), `src/components/ui/`.

**Recommended pattern for new work:**

```jsx
import AdminPage from '../components/AdminPage'
import { Card, StatCard } from '../design-system'
import { API_URL, adminAuthHeaders } from '../utils/adminSession'
```

## Local dev

1. `cd backend && npm run dev` (port 8001)
2. `cd admindashboard && npm run dev` (port 3000)
3. Open `http://localhost:3000/admin/login`
4. Use `VITE_API_URL=/api` so Vite proxies to the backend (see `.env.example`)
