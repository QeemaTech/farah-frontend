import { createContext, useContext, useEffect, useMemo, useState, createElement } from 'react'

const STORAGE_KEY = 'admin_ui_theme'

const AdminUiThemeContext = createContext(null)

export function AdminUiThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    return localStorage.getItem(STORAGE_KEY) || 'dark'
  })

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (v) => setThemeState(v === 'light' || v === 'dark' ? v : 'dark')
  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'))

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme])

  return createElement(AdminUiThemeContext.Provider, { value }, children)
}

export function useAdminUiTheme() {
  const ctx = useContext(AdminUiThemeContext)
  if (!ctx) {
    throw new Error('useAdminUiTheme must be used within AdminUiThemeProvider')
  }
  return ctx
}
