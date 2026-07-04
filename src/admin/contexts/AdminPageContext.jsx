import { createContext, useContext, useState, useMemo, useCallback } from 'react'

const defaultMeta = {
  title: '',
  subtitle: '',
  breadcrumbs: [],
  action: null,
  pageLoading: false,
  className: '',
  showPageHeader: true,
}

const AdminPageContext = createContext(null)

export function AdminPageProvider({ children }) {
  const [meta, setMetaState] = useState(defaultMeta)
  const setMeta = useCallback((updater) => {
    setMetaState((prev) => (typeof updater === 'function' ? updater(prev) : updater))
  }, [])
  const value = useMemo(() => ({ meta, setMeta }), [meta, setMeta])
  return <AdminPageContext.Provider value={value}>{children}</AdminPageContext.Provider>
}

export function useAdminPageContext() {
  const ctx = useContext(AdminPageContext)
  if (!ctx) {
    throw new Error('useAdminPageContext must be used within AdminPageProvider')
  }
  return ctx
}

export { defaultMeta }
