import { ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const QEEMATECH_URL = 'https://www.qeematech.net/'
const QEEMATECH_LOGO = '/qeematech-logo.png'

export function PoweredByFooter({
  variant = 'auto',
  className = '',
  platformName,
  compact = false,
}) {
  const { t } = useTranslation()
  const resolvedName = platformName || t('app.name')
  const theme =
    variant === 'auto'
      ? document.documentElement.getAttribute('data-theme') === 'dark'
        ? 'dark'
        : 'light'
      : variant
  const isDark = theme === 'dark'
  const year = new Date().getFullYear()

  return (
    <footer className={`admin-powered-by ${className}`.trim()}>
      <div
        className={`admin-powered-by__inner ${compact ? 'admin-powered-by__inner--compact' : ''} ${isDark ? 'admin-powered-by__inner--dark' : ''}`}
      >
        <div className="admin-powered-by__copy">
          <p className="admin-powered-by__title">
            © {year} {resolvedName}
          </p>
          <p className="admin-powered-by__note">
            {t('footerRights')} · {t('loginSecureNote')}
          </p>
        </div>

        <div className="admin-powered-by__divider" aria-hidden />

        <div className="admin-powered-by__partner">
          <span className="admin-powered-by__label">{t('poweredBy')}</span>
          <a
            href={QEEMATECH_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="QEEMATECH — We Add A New Value"
            className="admin-powered-by__link"
          >
            <img src={QEEMATECH_LOGO} alt="QEEMATECH" className="admin-powered-by__logo" />
            <ExternalLink size={12} className="admin-powered-by__ext" aria-hidden />
          </a>
        </div>
      </div>
    </footer>
  )
}

export default PoweredByFooter
