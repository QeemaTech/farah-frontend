import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import AdminPage from '../components/AdminPage'
import { Clock, DollarSign, Save, ArrowLeft } from 'lucide-react'
import { getMobileVendorApiBase, getVenueApiConfig } from '../utils/adminSession'
import { useLanguage } from '../../contexts/LanguageContext'

function VenueSettings() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language } = useLanguage()
  const venueApi = getVenueApiConfig()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('working-hours') // 'working-hours', 'pricing', 'services'

  const [workingHours, setWorkingHours] = useState({
    workingHoursStart: '09:00',
    workingHoursEnd: '22:00',
  })

  const [pricing, setPricing] = useState({
    price: 0,
    pricePerHour: 0,
    commission: 10,
  })

  const [services, setServices] = useState([])
  const [servicePricing, setServicePricing] = useState({})

  useEffect(() => {
    fetchVenueData()
  }, [id])

  const fetchVenueData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')

      const [venueRes, servicesRes] = await Promise.all([
        axios.get(venueApi.detailUrl(id), { headers: venueApi.headers }),
        axios.get(`${getMobileVendorApiBase()}/services`, { headers: venueApi.headers, params: { limit: 1000 } }),
      ])

      if (venueRes.data.success) {
        const v = venueRes.data.venue
        setVenue(v)
        setWorkingHours({
          workingHoursStart: v.workingHoursStart || '09:00',
          workingHoursEnd: v.workingHoursEnd || '22:00',
        })
        setPricing({
          price: v.price || 0,
          pricePerHour: v.pricePerHour || 0,
          commission: v.commission || 10,
        })
      }

      if (servicesRes.data.success) {
        setServices(servicesRes.data.services || [])
        // Get venue services
        if (venueRes.data.success && venueRes.data.venue.services) {
          const venueServices = venueRes.data.venue.services
          const pricingMap = {}
          venueServices.forEach(vs => {
            pricingMap[vs.serviceId] = vs.service?.price || 0
          })
          setServicePricing(pricingMap)
        }
      }
    } catch (error) {
      console.error('Error fetching venue data:', error)
      alert('فشل تحميل بيانات القاعة')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveWorkingHours = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        venueApi.workingHoursUrl(id),
        workingHours,
        { headers: venueApi.headers }
      )

      alert('تم حفظ ساعات العمل بنجاح')
    } catch (error) {
      console.error('Error saving working hours:', error)
      alert(error.response?.data?.error || 'فشل حفظ ساعات العمل')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePricing = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        venueApi.pricingUrl(id),
        pricing,
        { headers: venueApi.headers }
      )

      alert('تم حفظ الأسعار بنجاح')
    } catch (error) {
      console.error('Error saving pricing:', error)
      alert(error.response?.data?.error || 'فشل حفظ الأسعار')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveServicePricing = async (serviceId) => {
    try {
      const token = localStorage.getItem('admin_token')
      await axios.patch(
        `${getMobileVendorApiBase()}/services/${serviceId}`,
        { price: servicePricing[serviceId] },
        { headers: venueApi.headers }
      )

      alert('تم حفظ سعر الخدمة بنجاح')
    } catch (error) {
      console.error('Error saving service pricing:', error)
      alert(error.response?.data?.error || 'فشل حفظ سعر الخدمة')
    }
  }

  if (loading) {
    return (
      <AdminPage title={language === 'ar' ? 'إعدادات القاعة' : 'Venue settings'} loading>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">جاري التحميل...</div>
        </div>
      </AdminPage>
    )
  }

  return (
    <AdminPage
      title={language === 'ar' ? 'إعدادات القاعة' : 'Venue settings'}
      breadcrumbs={[
        { label: language === 'ar' ? 'القاعات' : 'Venues', path: '/admin/venues' },
        { label: venue?.nameAr || venue?.name || '' },
      ]}
      action={
        <button type="button" onClick={() => navigate('/admin/venues')} className="ads-btn ads-btn-subtle gap-2">
          <ArrowLeft className="h-4 w-4" /> {language === 'ar' ? 'رجوع' : 'Back'}
        </button>
      }
    >
      <div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('working-hours')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'working-hours'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Clock className="inline mr-2 h-4 w-4" />
            ساعات العمل
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'pricing'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <DollarSign className="inline mr-2 h-4 w-4" />
            الأسعار
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'services'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            أسعار الخدمات
          </button>
        </div>

        {/* Working Hours Tab */}
        {activeTab === 'working-hours' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">ساعات العمل</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وقت البدء
                </label>
                <input
                  type="time"
                  value={workingHours.workingHoursStart}
                  onChange={(e) => setWorkingHours({ ...workingHours, workingHoursStart: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  وقت الانتهاء
                </label>
                <input
                  type="time"
                  value={workingHours.workingHoursEnd}
                  onChange={(e) => setWorkingHours({ ...workingHours, workingHoursEnd: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
            <button
              onClick={handleSaveWorkingHours}
              disabled={saving}
              className="mt-4 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">أسعار القاعة</h2>
            <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر الإجمالي ($)
                </label>
                <input
                  type="number"
                  value={pricing.price}
                  onChange={(e) => setPricing({ ...pricing, price: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  السعر بالساعة ($)
                </label>
                <input
                  type="number"
                  value={pricing.pricePerHour}
                  onChange={(e) => setPricing({ ...pricing, pricePerHour: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة العمولة (%)
                </label>
                <input
                  type="number"
                  value={pricing.commission}
                  onChange={(e) => setPricing({ ...pricing, commission: parseFloat(e.target.value) || 0 })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>
            </div>
            <button
              onClick={handleSavePricing}
              disabled={saving}
              className="mt-4 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        )}

        {/* Services Pricing Tab */}
        {activeTab === 'services' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">أسعار الخدمات</h2>
            <div className="overflow-x-auto">
              <table className="ui-table w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">اسم الخدمة</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">السعر الحالي ($)</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">السعر الجديد ($)</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((service) => (
                    <tr key={service.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {service.nameAr || service.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {service.price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="py-3 px-4">
                        <input
                          type="number"
                          value={servicePricing[service.id] || service.price || 0}
                          onChange={(e) => setServicePricing({
                            ...servicePricing,
                            [service.id]: parseFloat(e.target.value) || 0
                          })}
                          className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          min="0"
                          step="0.01"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleSaveServicePricing(service.id)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          حفظ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  )
}

export default VenueSettings

