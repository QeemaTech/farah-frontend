import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAdminPageContext, defaultMeta } from '../contexts/AdminPageContext'

function metaSignature(meta) {
  return [
    meta.title,
    meta.subtitle,
    meta.pageLoading,
    meta.className,
    meta.showPageHeader,
    meta.breadcrumbs?.map((b) => (typeof b === 'string' ? b : `${b.label}|${b.path ?? ''}`)).join(';') ?? '',
  ].join('\0')
}

export default function useAdminPageMeta({
  title,
  layoutTitle,
  subtitle,
  breadcrumbs,
  action,
  pageLoading,
  loading,
  className,
  showPageHeader,
}) {
  const { setMeta } = useAdminPageContext()
  const location = useLocation()
  const actionRef = useRef(action)
  actionRef.current = action

  useLayoutEffect(() => {
    const next = {
      title: layoutTitle ?? title ?? '',
      subtitle: subtitle ?? '',
      breadcrumbs: breadcrumbs ?? [],
      action: actionRef.current ?? null,
      pageLoading: !!(pageLoading ?? loading),
      className: className ?? '',
      showPageHeader: showPageHeader !== false,
    }

    setMeta((prev) => (metaSignature(prev) === metaSignature(next) ? prev : next))

    return () => setMeta(defaultMeta)
    // breadcrumbs/action omitted from deps to avoid render loops (new object/element each render)
  }, [
    location.pathname,
    title,
    layoutTitle,
    subtitle,
    pageLoading,
    loading,
    className,
    showPageHeader,
    setMeta,
  ])
}
