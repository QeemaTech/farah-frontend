import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, LayoutDashboard } from 'lucide-react'
import { NAV_SECTION_ICONS } from '../../components/layout/navConfig'

const DASHBOARD_PATH = '/admin/dashboard'

function pathMatches(locationPath, itemPath) {
  return locationPath === itemPath || locationPath.startsWith(`${itemPath}/`)
}

function resolveActiveNavPath(locationPath, navPaths) {
  const matches = navPaths.filter((p) => pathMatches(locationPath, p))
  if (!matches.length) return null
  return matches.reduce((best, p) => (p.length > best.length ? p : best), matches[0])
}

function pathActive(locationPath, itemPath, navPaths) {
  return resolveActiveNavPath(locationPath, navPaths) === itemPath
}

export default function AdminSidebarNav({
  sections,
  sidebarOpen,
  isMobile,
  onNavigate,
}) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const rtl = i18n.language === 'ar'

  const [expanded, setExpanded] = useState(() => new Set())
  const [flyoutSection, setFlyoutSection] = useState(null)
  const flyoutRef = useRef(null)
  const triggerRefs = useRef({})

  const dashboardItem = sections.flatMap((s) => s.items).find((i) => i.path === DASHBOARD_PATH)

  const navPaths = useMemo(() => {
    const paths = sections.flatMap((s) => s.items.map((i) => i.path))
    if (dashboardItem?.path) paths.push(dashboardItem.path)
    return [...new Set(paths)]
  }, [sections, dashboardItem])

  const groups = useMemo(
    () =>
      sections
        .map((section) => ({
          ...section,
          items: section.items.filter((i) => i.path !== DASHBOARD_PATH),
        }))
        .filter((s) => s.items.length > 0),
    [sections]
  )

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev)
      groups.forEach((g) => {
        if (g.items.some((i) => pathActive(location.pathname, i.path, navPaths))) next.add(g.id)
      })
      return next
    })
  }, [location.pathname, groups, navPaths])

  useEffect(() => {
    const onDoc = (e) => {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target)) {
        const inTrigger = Object.values(triggerRefs.current).some((el) => el?.contains(e.target))
        if (!inTrigger) setFlyoutSection(null)
      }
    }
    if (flyoutSection) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [flyoutSection])

  const go = (path) => {
    navigate(path)
    onNavigate?.()
    setFlyoutSection(null)
  }

  const toggle = (sectionId) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) next.delete(sectionId)
      else next.add(sectionId)
      return next
    })
  }

  const renderLink = (item, nested = false) => {
    const active = pathActive(location.pathname, item.path, navPaths)
    const Icon = item.icon
    return (
      <button
        key={item.path}
        type="button"
        onClick={() => go(item.path)}
        className={`admin-sidebar-link ${nested ? 'admin-sidebar-link--nested' : ''} ${active ? 'admin-sidebar-link--active' : ''}`}
        title={!sidebarOpen ? t(item.labelKey) : undefined}
      >
        <Icon size={nested ? 16 : 18} className="shrink-0 opacity-90" aria-hidden />
        {sidebarOpen ? <span className="truncate text-start">{t(item.labelKey)}</span> : null}
      </button>
    )
  }

  const renderGroup = (section) => {
    const SectionIcon = NAV_SECTION_ICONS[section.id] || LayoutDashboard
    const isOpen = expanded.has(section.id)
    const hasActive = section.items.some((i) => pathActive(location.pathname, i.path, navPaths))
    const singleItem = section.items.length === 1

    if (singleItem && sidebarOpen) {
      const item = section.items[0]
      const Icon = item.icon
      const active = pathActive(location.pathname, item.path, navPaths)
      return (
        <div key={section.id} className="admin-nav-group">
          <button
            type="button"
            onClick={() => go(item.path)}
            className={`admin-nav-group__trigger ${active ? 'admin-nav-group__trigger--active' : ''}`}
          >
            <Icon size={18} className="shrink-0 opacity-90" />
            <span className="min-w-0 flex-1 truncate text-start">{t(item.labelKey)}</span>
          </button>
        </div>
      )
    }

    if (singleItem && !sidebarOpen) {
      const item = section.items[0]
      const Icon = item.icon
      const active = pathActive(location.pathname, item.path, navPaths)
      return (
        <div key={section.id} className="admin-nav-group admin-nav-group--collapsed">
          <button
            type="button"
            onClick={() => go(item.path)}
            className={`admin-nav-group__trigger admin-nav-group__trigger--icon-only ${active ? 'admin-nav-group__trigger--active' : ''}`}
            title={t(item.labelKey)}
          >
            <Icon size={20} />
          </button>
        </div>
      )
    }

    return (
      <div
        key={section.id}
        className={`admin-nav-group ${isOpen ? 'admin-nav-group--open' : ''} ${hasActive ? 'admin-nav-group--has-active' : ''}`}
      >
        <button
          type="button"
          ref={(el) => {
            triggerRefs.current[section.id] = el
          }}
          onClick={() => {
            if (!sidebarOpen) {
              setFlyoutSection(flyoutSection === section.id ? null : section.id)
              return
            }
            toggle(section.id)
          }}
          className={`admin-nav-group__trigger ${hasActive && !isOpen ? 'admin-nav-group__trigger--active' : ''}`}
          aria-expanded={sidebarOpen ? isOpen : undefined}
          title={!sidebarOpen ? t(section.labelKey) : undefined}
        >
          <SectionIcon size={18} className="shrink-0 opacity-90" />
          {sidebarOpen ? (
            <>
              <span className="min-w-0 flex-1 truncate text-start font-medium">{t(section.labelKey)}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 opacity-70 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </>
          ) : null}
        </button>

        {sidebarOpen && isOpen ? (
          <div className="admin-nav-group__panel">
            {section.items.map((item) => (
              <div key={item.path}>{renderLink(item, true)}</div>
            ))}
          </div>
        ) : null}

        {!sidebarOpen && flyoutSection === section.id ? (
          <div
            ref={flyoutRef}
            className="admin-nav-flyout"
            style={{
              position: 'fixed',
              top: triggerRefs.current[section.id]?.getBoundingClientRect().top ?? 0,
              ...(rtl
                ? { right: (triggerRefs.current[section.id]?.getBoundingClientRect().left ?? 76) - 8 }
                : { left: (triggerRefs.current[section.id]?.getBoundingClientRect().right ?? 76) + 8 }),
              zIndex: 60,
            }}
            dir={rtl ? 'rtl' : 'ltr'}
          >
            <p className="admin-nav-flyout__title">{t(section.labelKey)}</p>
            <ul className="m-0 list-none p-0">
              {section.items.map((item) => {
                const active = pathActive(location.pathname, item.path, navPaths)
                const Icon = item.icon
                return (
                  <li key={item.path}>
                    <button
                      type="button"
                      onClick={() => go(item.path)}
                      className={`admin-nav-flyout__link ${active ? 'admin-nav-flyout__link--active' : ''}`}
                    >
                      <Icon size={16} />
                      <span>{t(item.labelKey)}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <nav className="admin-sidebar-nav flex-1 overflow-y-auto overflow-x-hidden py-2">
      {dashboardItem ? (
        <div className="admin-nav-dashboard px-2 pb-1">
          {renderLink(dashboardItem)}
        </div>
      ) : null}
      <div className="admin-nav-groups space-y-0.5 px-1">{groups.map(renderGroup)}</div>
    </nav>
  )
}
