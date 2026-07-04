---
description: Redesign Farah Admin Dashboard pages using the Atlassian Design System (ADS). Use when asked to migrate, refactor, or build any admin page, component, or layout in the admindashboard project.
globs: admindashboard/src/**/*.{jsx,tsx,css,js,ts}
alwaysApply: false
---

# Atlassian Design System — Farah Admin Dashboard Skill

You are redesigning the **Farah Admin Dashboard** (`admindashboard/`) using the **Atlassian Design System (ADS)**. This project is a React + Vite SPA (`/admin/*`), currently with 47 Legacy pages, 1 Partial, and 2 New pages. Your job is to migrate or build pages to match ADS principles faithfully.

---

## 1. Core ADS Design Philosophy

Atlassian Design System is built for complex, data-heavy admin and B2B products. Every decision should reflect:

- **Clarity over decoration** — No shadows for depth, no gradient backgrounds, no decorative blobs.
- **Structured density** — Compact, information-dense layouts that respect the user's workflow.
- **Neutral palette with intentional color meaning** — Color carries status, not style.
- **Accessible by default** — Minimum 4.5:1 contrast, keyboard-navigable, ARIA roles.
- **Predictable interaction** — Users should never be surprised by what a component does.

---

## 2. Color Tokens (ADS-aligned, mapped to existing `--admin-*` tokens)

Replace existing tokens in `globals.css` under `body.admin-dashboard` with:

```css
body.admin-dashboard {
  /* Backgrounds */
  --admin-bg:             #F4F5F7;   /* ADS: Neutral100 — page background */
  --admin-surface:        #FFFFFF;   /* ADS: Neutral0   — cards, modals, inputs */
  --admin-surface-raised: #FFFFFF;   /* ADS: elevation.surface.raised */
  --admin-sidebar:        #0052CC;   /* ADS: Blue700    — primary nav */
  --admin-sidebar-hover:  #0747A6;   /* ADS: Blue800 */
  --admin-sidebar-active: #DEEBFF;   /* ADS: Blue50 — selected item bg (light tint) */

  /* Text */
  --admin-text:           #172B4D;   /* ADS: Neutral900 — primary text */
  --admin-text-muted:     #6B778C;   /* ADS: Neutral500 — secondary/helper text */
  --admin-text-disabled:  #A5ADBA;   /* ADS: Neutral300 */
  --admin-text-inverse:   #FFFFFF;   /* Text on dark bg (sidebar) */
  --admin-text-link:      #0052CC;   /* ADS: Blue700 */

  /* Brand / Actions */
  --admin-accent:         #0052CC;   /* ADS: Blue700 — primary buttons, focus */
  --admin-accent-hover:   #0747A6;   /* ADS: Blue800 */
  --admin-accent-subtle:  #DEEBFF;   /* ADS: Blue50  — selected row, badge bg */

  /* Semantic */
  --admin-success:        #00875A;   /* ADS: Green700 */
  --admin-success-subtle: #E3FCEF;
  --admin-warning:        #FF991F;   /* ADS: Yellow500 */
  --admin-warning-subtle: #FFFAE6;
  --admin-danger:         #DE350B;   /* ADS: Red600 */
  --admin-danger-subtle:  #FFEBE6;
  --admin-info:           #0065FF;   /* ADS: Blue500 */
  --admin-info-subtle:    #DEEBFF;

  /* Borders */
  --admin-border:         #DFE1E6;   /* ADS: Neutral200 */
  --admin-border-focused: #0052CC;
  --admin-border-input:   #DFE1E6;

  /* Radius — ADS uses very subtle rounding */
  --admin-radius-card:    3px;       /* ADS default card/panel */
  --admin-radius-control: 3px;       /* ADS inputs, buttons */
  --admin-radius-badge:   2px;
  --admin-radius-modal:   8px;       /* Modals get slightly more */

  /* Spacing scale (4px base) */
  --space-025: 2px;
  --space-050: 4px;
  --space-100: 8px;
  --space-150: 12px;
  --space-200: 16px;
  --space-300: 24px;
  --space-400: 32px;
  --space-500: 40px;
  --space-600: 48px;

  /* Typography */
  --font-body:    'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-heading: 'Inter', sans-serif;  /* ADS uses Inter throughout */

  /* Elevation (box-shadow) — ADS is intentionally flat */
  --elevation-card:   0 1px 1px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31);
  --elevation-raised: 0 4px 8px -2px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31);
  --elevation-modal:  0 8px 16px -4px rgba(9,30,66,0.25), 0 0 1px rgba(9,30,66,0.31);
}

[data-theme="dark"] body.admin-dashboard {
  --admin-bg:             #161A1D;
  --admin-surface:        #1D2125;
  --admin-surface-raised: #22272B;
  --admin-sidebar:        #1D2125;
  --admin-sidebar-hover:  #282E33;
  --admin-sidebar-active: #282E33;
  --admin-text:           #C7D1DB;
  --admin-text-muted:     #8C9BAB;
  --admin-text-disabled:  #4C6475;
  --admin-text-inverse:   #172B4D;
  --admin-text-link:      #4C9AFF;
  --admin-accent:         #4C9AFF;
  --admin-accent-hover:   #85B8FF;
  --admin-accent-subtle:  #1C2B41;
  --admin-border:         #2C333A;
  --admin-border-input:   #3B4045;
}
```

---

## 3. Typography

ADS uses **Inter** with a strict type scale. Apply globally:

```css
body.admin-dashboard {
  font-family: var(--font-body);
  font-size: 14px;        /* ADS base body size */
  line-height: 20px;
  color: var(--admin-text);
  -webkit-font-smoothing: antialiased;
}

/* ADS Type Scale */
.ads-text-xs     { font-size: 11px; line-height: 16px; }
.ads-text-sm     { font-size: 12px; line-height: 16px; }
.ads-text-body   { font-size: 14px; line-height: 20px; }
.ads-text-body-lg{ font-size: 16px; line-height: 24px; }
.ads-heading-xs  { font-size: 14px; line-height: 16px; font-weight: 600; }
.ads-heading-sm  { font-size: 16px; line-height: 20px; font-weight: 600; }
.ads-heading-md  { font-size: 20px; line-height: 24px; font-weight: 500; }
.ads-heading-lg  { font-size: 24px; line-height: 28px; font-weight: 500; }
.ads-heading-xl  { font-size: 29px; line-height: 32px; font-weight: 500; }
```

---

## 4. Layout — AdminLayout & Sidebar

### Sidebar

ADS navigation sidebars are dark-blue (`#0052CC`), compact, and icon+label based.

```jsx
// AdminLayout sidebar structure
<nav
  style={{
    width: 240,
    minHeight: '100vh',
    backgroundColor: 'var(--admin-sidebar)',
    display: 'flex',
    flexDirection: 'column',
    padding: '0',
    gap: 0,
  }}
>
  {/* Logo area */}
  <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
    <img src={logo} alt="Farah" style={{ height: 32 }} />
  </div>

  {/* Nav items */}
  {navItems.map(item => (
    <NavItem key={item.key} item={item} />
  ))}
</nav>
```

**NavItem pattern:**
```jsx
<NavLink
  to={item.path}
  style={({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 20px',
    fontSize: 14,
    fontWeight: isActive ? 600 : 400,
    color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.8)',
    backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
    borderLeft: isActive ? '3px solid #FFFFFF' : '3px solid transparent',
    textDecoration: 'none',
    transition: 'background 0.1s',
  })}
>
  <item.icon size={16} />
  <span>{t(item.labelKey)}</span>
</NavLink>
```

### Page Shell

```jsx
// Every page should follow this shell
<div style={{
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--space-300)',
  padding: 'var(--space-400)',
  backgroundColor: 'var(--admin-bg)',
  minHeight: '100%',
}}>
  <PageHeader title={...} breadcrumbs={...} actions={...} />
  {/* page content */}
</div>
```

---

## 5. Components

### 5.1 Button

ADS buttons: `3px` radius, no heavy shadows, clear hierarchy.

```jsx
// Primary
<button className="ads-btn ads-btn-primary">Save changes</button>

// Subtle (ghost)
<button className="ads-btn ads-btn-subtle">Cancel</button>

// Danger
<button className="ads-btn ads-btn-danger">Delete</button>

// Link button
<button className="ads-btn ads-btn-link">View details</button>
```

```css
.ads-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  height: 32px;
  font-size: 14px;
  font-weight: 500;
  border-radius: var(--admin-radius-control);
  border: none;
  cursor: pointer;
  transition: background 0.1s, box-shadow 0.1s;
  white-space: nowrap;
}
.ads-btn-primary  { background: var(--admin-accent);  color: #fff; }
.ads-btn-primary:hover { background: var(--admin-accent-hover); }
.ads-btn-subtle   { background: var(--admin-accent-subtle); color: var(--admin-accent); }
.ads-btn-subtle:hover { background: #B3D4FF; }
.ads-btn-danger   { background: var(--admin-danger); color: #fff; }
.ads-btn-link     { background: transparent; color: var(--admin-text-link); padding: 0; height: auto; }
.ads-btn:focus-visible { outline: 2px solid var(--admin-border-focused); outline-offset: 2px; }
```

### 5.2 Input / Form Controls

```css
.admin-input {
  height: 40px;
  padding: 0 12px;
  font-size: 14px;
  font-family: var(--font-body);
  color: var(--admin-text);
  background: var(--admin-surface);
  border: 2px solid var(--admin-border-input);
  border-radius: var(--admin-radius-control);
  outline: none;
  transition: border-color 0.1s;
  width: 100%;
}
.admin-input:hover  { border-color: #B3BAC5; }
.admin-input:focus  { border-color: var(--admin-border-focused); background: var(--admin-surface); }
.admin-input::placeholder { color: var(--admin-text-muted); }
```

Label pattern:
```jsx
<div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
  <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
    {label}
    {required && <span style={{ color: 'var(--admin-danger)', marginLeft: 2 }}>*</span>}
  </label>
  <input className="admin-input" {...props} />
  {helperText && <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>{helperText}</span>}
  {error && <span style={{ fontSize: 12, color: 'var(--admin-danger)' }}>{error}</span>}
</div>
```

### 5.3 Card / Panel

ADS panels: flat white, very subtle shadow, 3px radius.

```jsx
<div style={{
  backgroundColor: 'var(--admin-surface)',
  borderRadius: 'var(--admin-radius-card)',
  boxShadow: 'var(--elevation-card)',
  padding: 'var(--space-300)',
}}>
  {title && (
    <div style={{
      fontSize: 16,
      fontWeight: 600,
      color: 'var(--admin-text)',
      marginBottom: 'var(--space-200)',
      paddingBottom: 'var(--space-200)',
      borderBottom: '1px solid var(--admin-border)',
    }}>
      {title}
    </div>
  )}
  {children}
</div>
```

### 5.4 Badge / Lozenge

ADS calls these "Lozenges" — pill-shaped status labels with semantic colors.

```jsx
const LOZENGE_STYLES = {
  success:  { bg: 'var(--admin-success-subtle)', color: 'var(--admin-success)' },
  warning:  { bg: 'var(--admin-warning-subtle)', color: '#974F0C' },
  danger:   { bg: 'var(--admin-danger-subtle)',  color: 'var(--admin-danger)' },
  info:     { bg: 'var(--admin-info-subtle)',    color: 'var(--admin-info)' },
  default:  { bg: '#F4F5F7',                     color: 'var(--admin-text-muted)' },
};

function Lozenge({ status = 'default', children }) {
  const s = LOZENGE_STYLES[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 6px',
      borderRadius: 2,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      backgroundColor: s.bg,
      color: s.color,
    }}>
      {children}
    </span>
  );
}
```

### 5.5 Data Table

ADS tables: no zebra stripes by default, hover row highlight, header in all-caps small text.

```jsx
<div style={{ overflowX: 'auto' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
    <thead>
      <tr style={{ borderBottom: '2px solid var(--admin-border)' }}>
        {columns.map(col => (
          <th key={col.key} style={{
            padding: '8px 12px',
            textAlign: 'left',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--admin-text-muted)',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {col.label}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{
          borderBottom: '1px solid var(--admin-border)',
          transition: 'background 0.1s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#F4F5F7'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {columns.map(col => (
            <td key={col.key} style={{ padding: '10px 12px', color: 'var(--admin-text)' }}>
              {col.render ? col.render(row) : row[col.key]}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### 5.6 StatCard (KPI)

```jsx
function StatCard({ title, value, trend, icon: Icon, status = 'default' }) {
  return (
    <div style={{
      backgroundColor: 'var(--admin-surface)',
      borderRadius: 'var(--admin-radius-card)',
      boxShadow: 'var(--elevation-card)',
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </span>
        {Icon && <Icon size={16} color="var(--admin-text-muted)" />}
      </div>
      <span style={{ fontSize: 29, fontWeight: 500, color: 'var(--admin-text)', lineHeight: '32px' }}>
        {value}
      </span>
      {trend && (
        <span style={{ fontSize: 12, color: trend > 0 ? 'var(--admin-success)' : 'var(--admin-danger)' }}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </span>
      )}
    </div>
  );
}
```

### 5.7 PageHeader

```jsx
function PageHeader({ title, breadcrumbs = [], actions }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-300)' }}>
      <div>
        {breadcrumbs.length > 0 && (
          <nav style={{ display: 'flex', gap: 4, fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 4 }}>
            {breadcrumbs.map((crumb, i) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span>/</span>}
                {crumb.path ? (
                  <a href={crumb.path} style={{ color: 'var(--admin-text-link)', textDecoration: 'none' }}>{crumb.label}</a>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        <h1 style={{ fontSize: 24, fontWeight: 500, color: 'var(--admin-text)', margin: 0, lineHeight: '28px' }}>
          {title}
        </h1>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}
```

### 5.8 Modal

ADS modals: centered, white, 8px radius, strong overlay.

```jsx
function Modal({ isOpen, onClose, title, children, footer, width = 560 }) {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0,
      backgroundColor: 'rgba(9,30,66,0.54)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        backgroundColor: 'var(--admin-surface)',
        borderRadius: 'var(--admin-radius-modal)',
        boxShadow: 'var(--elevation-modal)',
        width, maxWidth: '90vw', maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-muted)', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div style={{ padding: '16px 24px', borderTop: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>{footer}</div>}
      </div>
    </div>
  );
}
```

### 5.9 Inline Message / Flag

ADS "Flag" component for toast-style notifications:

```jsx
function InlineMessage({ type = 'info', title, children }) {
  const colors = {
    info:    { border: 'var(--admin-info)',    bg: 'var(--admin-info-subtle)' },
    success: { border: 'var(--admin-success)', bg: 'var(--admin-success-subtle)' },
    warning: { border: 'var(--admin-warning)', bg: 'var(--admin-warning-subtle)' },
    danger:  { border: 'var(--admin-danger)',  bg: 'var(--admin-danger-subtle)' },
  };
  const c = colors[type];
  return (
    <div style={{
      borderLeft: `4px solid ${c.border}`,
      backgroundColor: c.bg,
      borderRadius: '0 3px 3px 0',
      padding: '12px 16px',
    }}>
      {title && <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>{title}</p>}
      <p style={{ margin: 0, fontSize: 14, color: 'var(--admin-text)' }}>{children}</p>
    </div>
  );
}
```

---

## 6. Migration Pattern for Legacy Pages

When refactoring any legacy page, follow this checklist:

```jsx
// BEFORE (legacy pattern)
<AdminLayout>
  <div className="p-6">
    <h1 style={{ color: '#1e293b', fontSize: 24 }}>Users</h1>
    <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
      ...
    </div>
  </div>
</AdminLayout>

// AFTER (ADS pattern)
import AdminPage from '../components/AdminPage';
import { StatCard, Card } from '../design-system';
import { API_URL, adminAuthHeaders } from '../utils/adminSession';

export default function UsersPage() {
  return (
    <AdminPage
      title="Users"
      breadcrumbs={[{ label: 'Home', path: '/admin/dashboard' }, { label: 'Users' }]}
      actions={
        <button className="ads-btn ads-btn-primary">
          Invite user
        </button>
      }
    >
      {/* Use design-system components, ADS tokens */}
    </AdminPage>
  );
}
```

**Key rules during migration:**
1. Replace all hardcoded hex colors with `--admin-*` tokens.
2. Replace `http://localhost:8001/api/...` URLs with `${API_URL}/...`.
3. Replace custom modals/popups with the `Modal` component.
4. Replace status strings with `<Lozenge>` component.
5. Replace `border-radius: 16px` with `var(--admin-radius-card)` (3px in ADS).
6. Replace box shadows with `var(--elevation-card)`.
7. Replace purple/indigo accent (`#6366f1`) with ADS blue (`#0052CC`).

---

## 7. Grid & Spacing

Use the 4px grid everywhere:

```jsx
// KPI stat cards row
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 'var(--space-200)' }}>
  <StatCard ... />
</div>

// Two-column layout
<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-300)' }}>
  <Card title="Main content">...</Card>
  <Card title="Sidebar info">...</Card>
</div>

// Full-width section spacing
<div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-300)' }}>
```

---

## 8. Icons

ADS uses **Atlaskit icons**. In this project, use **Lucide React** (already installed) as the equivalent:

- Navigation: `LayoutDashboard`, `Users`, `Building2`, `ShoppingBag`, `Wallet`, `BarChart2`, `Settings`
- Actions: `Plus`, `Pencil`, `Trash2`, `Eye`, `Download`, `Upload`, `RefreshCw`
- Status: `CheckCircle`, `AlertTriangle`, `XCircle`, `Info`
- Always size: `16` for inline/row icons, `20` for section headers, `24` for empty states.

---

## 9. Page-Specific Migration Priority (from roadmap)

Follow the roadmap in `ADMIN_DASHBOARD_GUIDE.md §11`:

**Phase A (highest priority):** Bookings, Users, Vendors, Settings  
**Phase B:** Venues, Services, Categories, Payments, CommissionReports  
**Phase C:** Slaughter module, Venue provider, CMS pages

When asked to work on any page, check its current "Design" status in Section 7 of the guide first.

---

## 10. RTL / Arabic Support

This project supports Arabic (`i18n.language === 'ar'`). When writing layout code:

```jsx
const isRTL = i18n.language === 'ar';

<div style={{
  direction: isRTL ? 'rtl' : 'ltr',
  // For sidebar border-left active indicator:
  borderLeft: !isRTL && isActive ? '3px solid #fff' : 'none',
  borderRight: isRTL && isActive ? '3px solid #fff' : 'none',
}}>
```

---

## 11. DO / DON'T Quick Reference

| ✅ DO | ❌ DON'T |
|-------|---------|
| Use `#0052CC` as primary accent | Use purple/indigo (`#6366f1`) |
| Use `3px` border-radius for controls | Use `16px` rounded cards |
| Use `box-shadow: var(--elevation-card)` | Use heavy drop shadows |
| Use `Inter` font | Use Alexandria for UI (use for Arabic content only) |
| Use `--admin-*` tokens everywhere | Hardcode hex colors inline |
| Use `${API_URL}/...` for API calls | Hardcode `http://localhost:8001` |
| Keep backgrounds neutral (`#F4F5F7`) | Use gradient or colored page backgrounds |
| Use semantic Lozenge for status | Use colored text or raw badges |
| Keep spacing on the 4px grid | Use arbitrary padding values |
