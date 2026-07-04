import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Image, Smartphone } from 'lucide-react'
import AdminPage from '../../components/AdminPage'
import { AdminContent } from '../../design-system'
import UiTabs from '../../../components/ui/UiTabs'
import SlidersPanel from './SlidersPanel'
import OnboardingPanel from './OnboardingPanel'

const TABS = [
  { id: 'sliders', labelKey: 'nav.sliders', icon: Image },
  { id: 'onboarding', labelKey: 'nav.onboarding', icon: Smartphone },
]

export default function AppMediaPages() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'sliders'
  const language = i18n.language === 'ar' ? 'ar' : 'en'

  useEffect(() => {
    if (!TABS.some((x) => x.id === tab)) {
      setSearchParams({ tab: 'sliders' }, { replace: true })
    }
  }, [tab, setSearchParams])

  const tabs = TABS.map((x) => ({ id: x.id, label: t(x.labelKey), icon: x.icon }))

  return (
    <AdminPage
      title={t('nav.appMedia', { defaultValue: language === 'ar' ? 'محتوى التطبيق' : 'App content' })}
      subtitle={
        language === 'ar' ? 'السلايدر وشاشات الترحيب في مكان واحد' : 'Home sliders and onboarding screens in one place'
      }
      breadcrumbs={[
        { label: t('nav.dashboard'), path: '/admin/dashboard' },
        { label: t('nav.appMedia', { defaultValue: language === 'ar' ? 'محتوى التطبيق' : 'App content' }) },
      ]}
    >
      <AdminContent>
        <UiTabs tabs={tabs} active={tab} onChange={(id) => setSearchParams({ tab: id })} className="mb-4" />
        {tab === 'sliders' ? <SlidersPanel /> : <OnboardingPanel />}
      </AdminContent>
    </AdminPage>
  )
}
