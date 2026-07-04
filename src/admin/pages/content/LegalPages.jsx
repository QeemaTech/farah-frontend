import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Lock, ScrollText } from 'lucide-react'
import AdminPage from '../../components/AdminPage'
import { AdminContent } from '../../design-system'
import UiTabs from '../../../components/ui/UiTabs'
import ContentDocEditor from './ContentDocEditor'

const TABS = [
  { id: 'about', labelKey: 'nav.about', icon: FileText },
  { id: 'privacy', labelKey: 'nav.privacy', icon: Lock },
  { id: 'terms', labelKey: 'nav.terms', icon: ScrollText },
]

export default function LegalPages() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'about'
  const language = i18n.language === 'ar' ? 'ar' : 'en'

  useEffect(() => {
    if (!TABS.some((x) => x.id === tab)) {
      setSearchParams({ tab: 'about' }, { replace: true })
    }
  }, [tab, setSearchParams])

  const tabs = TABS.map((x) => ({
    id: x.id,
    label: t(x.labelKey),
    icon: x.icon,
  }))

  return (
    <AdminPage
      title={t('nav.legalContent', { defaultValue: language === 'ar' ? 'الصفحات القانونية' : 'Legal pages' })}
      subtitle={
        language === 'ar'
          ? 'من نحن، الخصوصية، والشروط والأحكام في مكان واحد'
          : 'About, privacy, and terms in one place'
      }
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.legalContent', { defaultValue: language === 'ar' ? 'الصفحات القانونية' : 'Legal pages' }) },
      ]}
    >
      <AdminContent>
        <UiTabs
          tabs={tabs}
          active={tab}
          onChange={(id) => setSearchParams({ tab: id })}
          className="mb-4"
        />
        <ContentDocEditor key={tab} endpoint={tab} language={language} />
      </AdminContent>
    </AdminPage>
  )
}
