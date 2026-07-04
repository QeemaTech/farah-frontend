import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import MainHeader from '../components/MainHeader'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Venues() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoryId = searchParams.get('category')
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [availabilityDate, setAvailabilityDate] = useState('')

  const venuesFetchedRef = useRef(false)
  const fetchingRef = useRef(false)
  const fetchedParamsRef = useRef({ categoryId: null, date: null })

  const todayStr = () => {
    const d = new Date()
    return d.toISOString().split('T')[0]
  }

  const fetchVenues = async () => {
    if (fetchingRef.current) return
    
    fetchingRef.current = true
    try {
      setLoading(true)
      const params = {}
      if (categoryId) params.categoryId = categoryId
      if (availabilityDate) params.date = availabilityDate
      const response = await axios.get(`${API_URL}/mobile/venues`, { 
        params,
        timeout: 10000
      })
      setVenues(response.data.venues || [])
      fetchedParamsRef.current = { categoryId, date: availabilityDate }
      venuesFetchedRef.current = true
    } catch (error) {
      setVenues([])
      venuesFetchedRef.current = true
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  // Fetch venues on mount
  useEffect(() => {
    if (!venuesFetchedRef.current && !fetchingRef.current) {
      fetchVenues()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Refetch when category or availability date changes
  useEffect(() => {
    const paramsChanged =
      fetchedParamsRef.current.categoryId !== categoryId
      || fetchedParamsRef.current.date !== availabilityDate

    if (!paramsChanged || fetchingRef.current) {
      return
    }

    fetchVenues()
  }, [categoryId, availabilityDate])

  const filteredVenues = venues.filter((venue) =>
    venue.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    venue.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
 
    <>
       <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">

      {/* Decorative Background */}
      <div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
        <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
          <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Header */}
      <MainHeader />
      
      {/* Page Title */}
      <div className="absolute content-stretch flex items-center justify-between left-1/2 top-[90px] translate-x-[-50%] w-[350px] z-10">
        <div className="content-stretch flex items-center justify-center opacity-0 relative shrink-0 size-[32px]"></div>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          قاعات
        </p>
        <div className="flex items-center justify-center relative shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex-none rotate-[180deg] scale-y-[-100%]"
          >
            <div className="relative size-[32px]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#121212"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[18px] h-[691px] items-start left-[20px] top-[118px] w-[350px] overflow-y-auto pb-[100px]">
        {/* Search Bar */}
        <div className="bg-white content-stretch flex h-[48px] items-center justify-between px-[16px] py-0 relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 w-[350px]">
          <div className="relative shrink-0 size-[24px]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z"
                stroke="#121212"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M22 22L18 18"
                stroke="#121212"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0">
            <input
              type="text"
              placeholder="ابحث عن قاعة."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 text-right text-sm text-[#999] outline-none"
              dir="rtl"
            />
            <div className="flex items-center justify-center relative shrink-0">
              <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M11 20C15.9706 20 20 15.9706 20 11C20 6.02944 15.9706 2 11 2C6.02944 2 2 6.02944 2 11C2 15.9706 6.02944 20 11 20Z"
                    stroke="#121212"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 22L18 18"
                    stroke="#121212"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filter by availability date */}
        <div className="bg-white content-stretch flex h-[48px] items-center justify-between px-[16px] py-0 relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 w-[350px]">
          <label className="text-sm text-[#121212] shrink-0" htmlFor="venue-availability-date">
            متاحة في
          </label>
          <div className="flex items-center gap-2">
            <input
              id="venue-availability-date"
              type="date"
              min={todayStr()}
              value={availabilityDate}
              onChange={(e) => setAvailabilityDate(e.target.value)}
              className="text-sm text-[#121212] outline-none bg-transparent"
              dir="ltr"
            />
            {availabilityDate ? (
              <button
                type="button"
                onClick={() => setAvailabilityDate('')}
                className="text-xs text-[#EF92AB] shrink-0"
              >
                إلغاء
              </button>
            ) : null}
          </div>
        </div>

        {/* Venues List */}
        {loading ? (
          <div className="text-center py-10">جاري التحميل...</div>
        ) : (
          <div className="flex flex-col gap-[18px] w-full">
            {filteredVenues.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                {availabilityDate
                  ? 'لا توجد قاعات متاحة في هذا التاريخ'
                  : 'لا توجد قاعات متاحة'}
              </div>
            ) : (
              filteredVenues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigate(`/venue/${venue.id}`)}
                className="bg-white border border-[#f2f2f2] border-solid content-stretch cursor-pointer flex gap-[16px] items-start justify-end overflow-clip p-[10px] relative rounded-[16px] shrink-0 w-full"
              >
                <div className="content-stretch flex flex-[1_0_0] flex-col gap-[16px] items-end min-h-px min-w-px relative shrink-0">
                  <div className="content-stretch flex items-start justify-between relative shrink-0 w-full">
                    <div className="flex items-center justify-center relative shrink-0">
                      <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                        <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
                          <path
                            d="M7 12L0 0H14L7 12Z"
                            fill="#EF92AB"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col gap-[4px] items-end justify-center relative shrink-0">
                      <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.2] relative shrink-0 text-[#121212] text-[14px] text-right tracking-[0.28px] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                        {venue.nameAr || venue.name}
                      </p>
                      <div className="content-stretch flex flex-col font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] gap-[4px] items-end justify-center leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px] w-full">
                        <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          {venue.descriptionAr || venue.description || ''}
                        </p>
                        <p className="relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          {venue.location || venue.address || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-px items-center justify-center relative shrink-0">
                    <p className="font-['Poppins:Medium',sans-serif] leading-[1.2] not-italic relative shrink-0 text-[12px] text-[rgba(35,31,32,0.86)] tracking-[0.24px]">
                      {venue.rating ? venue.rating.toFixed(1) : '0.0'}
                    </p>
                    {[...Array(5)].map((_, i) => {
                      const rating = venue.rating || 0
                      const filled = i < Math.round(rating)
                      return (
                        <div key={i} className="flex items-center justify-center relative shrink-0">
                          <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path
                                d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                                fill={filled ? "#FFD700" : "#E0E0E0"}
                              />
                            </svg>
                          </div>
                        </div>
                      )
                    })}
                    {venue.reviewCount > 0 && (
                      <span className="text-[10px] text-gray-500 mr-1">({venue.reviewCount})</span>
                    )}
                  </div>
                  <div className="bg-[#2d2871] content-stretch flex h-[36px] items-center justify-center overflow-clip px-[16px] py-[8px] relative rounded-[24px] shrink-0 w-full">
                    <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[16px] text-white tracking-[0.32px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                      احجز موعد
                    </p>
                  </div>
                </div>
                <div className="h-[96px] relative rounded-[13px] shrink-0 w-[96.44px] overflow-hidden">
                  <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
                  {(() => {
                    // Handle images array or single image
                    const images = Array.isArray(venue.images) ? venue.images : (venue.images ? [venue.images] : (venue.image ? [venue.image] : []))
                    const imageSrc = images.length > 0 ? formatImageSrc(images[0]) : null
                    
                    return imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={venue.nameAr || venue.name}
                        className="absolute max-w-none object-cover rounded-[13px] size-full"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          const fallback = e.target.nextElementSibling
                          if (fallback) fallback.style.display = 'flex'
                        }}
                      />
                    ) : null
                  })()}
                  <div className="absolute inset-0 items-center justify-center bg-gray-200 rounded-[13px] hidden">
                    <span className="text-2xl">🏢</span>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        )}
      </div>
      {/* Bottom Navigation */}
   
  
    </div>
          <BottomNavigation />
          </>
  )
}

export default Venues

