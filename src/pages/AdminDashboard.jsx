import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function AdminDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/stats`)
      setStats(response.data.stats)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      <StatusBar />

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-[20px] top-[66px] w-[350px] z-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
            <path
              d="M15 18L9 12L15 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center flex-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          لوحة التحكم
        </p>
        <div className="w-[32px]"></div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[350px] left-[20px] top-[132px] overflow-y-auto pb-[100px]">
        
        {/* Stats Cards */}
        <div className="content-stretch flex flex-col gap-[12px] items-stretch relative shrink-0 w-full">
          <div className="grid grid-cols-2 gap-[12px] w-full">
            <div className="bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-white text-[12px] opacity-80" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                إجمالي المستخدمين
              </p>
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-white text-[24px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {stats?.totalUsers || 0}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-[#EF92AB] to-[#f8d3dd] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[12px] opacity-80" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                إجمالي القاعات
              </p>
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[24px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {stats?.totalVenues || 0}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-white text-[12px] opacity-80" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                إجمالي الخدمات
              </p>
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-white text-[24px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {stats?.totalServices || 0}
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-[#EF92AB] to-[#f8d3dd] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[12px] opacity-80" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                إجمالي الحجوزات
              </p>
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[24px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {stats?.totalBookings || 0}
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#2d2871] to-[#1f1a5a] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full">
            <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-white text-[12px] opacity-80" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              إجمالي الإيرادات
            </p>
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-white text-[28px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              {(stats?.totalRevenue || 0).toFixed(2)} $
            </p>
          </div>
          
          <div className="bg-[#fff3cd] content-stretch flex flex-col gap-[8px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full border-2 border-[#ffc107]">
            <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#856404] text-[12px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              حجوزات قيد الانتظار
            </p>
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#856404] text-[24px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              {stats?.pendingBookings || 0}
            </p>
          </div>
        </div>

        {/* Management Sections */}
        <div className="content-stretch flex flex-col gap-[12px] items-stretch relative shrink-0 w-full mt-[8px]">
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[16px] text-right w-full" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            الإدارة
          </p>
          
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white content-stretch flex items-center justify-between p-[16px] relative rounded-[16px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-gray-50 transition-colors"
          >
            <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0">
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                إدارة المستخدمين
              </p>
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                عرض وإدارة جميع المستخدمين
              </p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
              <path d="M9 18L15 12L9 6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/admin/venues')}
            className="bg-white content-stretch flex items-center justify-between p-[16px] relative rounded-[16px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-gray-50 transition-colors"
          >
            <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0">
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                إدارة القاعات
              </p>
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                عرض وتفعيل/تعطيل القاعات
              </p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
              <path d="M9 18L15 12L9 6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/admin/services')}
            className="bg-white content-stretch flex items-center justify-between p-[16px] relative rounded-[16px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-gray-50 transition-colors"
          >
            <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0">
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                إدارة الخدمات
              </p>
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                عرض وتفعيل/تعطيل الخدمات
              </p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
              <path d="M9 18L15 12L9 6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <button
            onClick={() => navigate('/admin/bookings')}
            className="bg-white content-stretch flex items-center justify-between p-[16px] relative rounded-[16px] shadow-[0px_2px_8px_0px_rgba(0,0,0,0.1)] shrink-0 w-full hover:bg-gray-50 transition-colors"
          >
            <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0">
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                إدارة الحجوزات
              </p>
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                عرض وتحديث حالة الحجوزات
              </p>
            </div>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
              <path d="M9 18L15 12L9 6" stroke="#121212" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard




