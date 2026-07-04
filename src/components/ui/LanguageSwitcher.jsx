import { Globe } from 'lucide-react'
import { useLanguage } from '../../contexts/LanguageContext'

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage()

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      className="flex items-center gap-2 rounded-[var(--admin-radius-control)] border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-border)]/30"
      title={language === 'ar' ? 'English' : 'العربية'}
    >
      <Globe className="h-4 w-4" aria-hidden />
      <span>{language === 'ar' ? 'EN' : 'AR'}</span>
    </button>
  )
}
