import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { useLanguage } from '../contexts/LanguageContext'
import { FiSearch, FiX, FiHome, FiTarget, FiCalendar } from 'react-icons/fi'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import MainHeader from '../components/MainHeader'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Search() {
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [activeTab, setActiveTab] = useState('all') // all, venues, services, bookings
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState({
    venues: [],
    services: [],
    bookings: [],
  })

  const searchTimeoutRef = useRef(null)
  const lastSearchRef = useRef({ query: '', tab: '' })
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // Only search if query or tab actually changed
    const queryChanged = lastSearchRef.current.query !== searchQuery
    const tabChanged = lastSearchRef.current.tab !== activeTab
    
    if (!queryChanged && !tabChanged) {
      return
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch()
      } else {
        setResults({ venues: [], services: [], bookings: [] })
      }
      lastSearchRef.current = { query: searchQuery, tab: activeTab }
    }, 500) // Debounce search by 500ms

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery, activeTab])

  const performSearch = async () => {
    if (!searchQuery.trim()) {
      setResults({ venues: [], services: [], bookings: [] })
      return
    }

    if (fetchingRef.current) return
    fetchingRef.current = true
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const headers = token ? { Authorization: `Bearer ${token}` } : {}

      const searchPromises = []

      if (activeTab === 'all' || activeTab === 'venues') {
        searchPromises.push(
          axios.get(`${API_URL}/mobile/search`, {
            headers,
            params: { q: searchQuery.trim(), type: 'venues', limit: 10 },
            timeout: 8000
          }).then(res => ({ type: 'venues', data: res.data.results?.venues || res.data.venues || res.data.data?.venues || [] }))
            .catch((err) => {
              console.error('Error searching venues:', err)
              return { type: 'venues', data: [] }
            })
        )
      }

      if (activeTab === 'all' || activeTab === 'services') {
        searchPromises.push(
          axios.get(`${API_URL}/mobile/search`, {
            headers,
            params: { q: searchQuery.trim(), type: 'services', limit: 10 },
            timeout: 8000
          }).then(res => ({ type: 'services', data: res.data.results?.services || res.data.services || res.data.data?.services || [] }))
            .catch((err) => {
              console.error('Error searching services:', err)
              return { type: 'services', data: [] }
            })
        )
      }

      if (activeTab === 'all' || activeTab === 'bookings') {
        const token = localStorage.getItem('token')
        if (token) {
          searchPromises.push(
            axios.get(`${API_URL}/mobile/bookings`, {
              headers: { Authorization: `Bearer ${token}` },
              params: { limit: 10 },
              timeout: 8000
            }).then(res => {
              const bookings = (res.data.bookings || []).filter(booking => 
                booking.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.venue?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                booking.venue?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase())
              )
              return { type: 'bookings', data: bookings }
            })
            .catch((err) => {
              console.error('Error searching bookings:', err)
              return { type: 'bookings', data: [] }
            })
          )
        }
      }

      // Use Promise.allSettled instead of Promise.all to handle errors gracefully
      const searchResults = await Promise.allSettled(searchPromises)
      
      const newResults = { venues: [], services: [], bookings: [] }
      searchResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value && result.value.type && result.value.data) {
          newResults[result.value.type] = result.value.data
        }
      })
      
      setResults(newResults)
    } catch (error) {
      console.error('Error in performSearch:', error)
      setResults({ venues: [], services: [], bookings: [] })
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    performSearch()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setResults({ venues: [], services: [], bookings: [] })
  }

  const getTotalResults = () => {
    return results.venues.length + results.services.length + results.bookings.length
  }

  return (

    <>
    
    
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto pb-32">
      
      {/* Main Header */}
      <div className="max-w-[390px] mx-auto md:hidden">
        <MainHeader showNotifications={false} />
      </div>
      
      {/* Page Title */}
      <div className="max-w-[390px] mx-auto px-5 pt-28 pb-4 flex items-center justify-between">
        <div className="w-8"></div>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          {language === 'ar' ? 'البحث' : 'Search'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center relative shrink-0 size-[32px]"
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
      </div>

      {/* Main Content */}
      <div className="max-w-[390px] mx-auto px-5 flex flex-col gap-[18px] pb-8">
        {/* Search Bar */}
        <div className="bg-white content-stretch flex h-[48px] items-center justify-between px-[16px] py-0 relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 w-full">
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
          <form onSubmit={handleSearch} className="flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(e)
                }
              }}
              placeholder={language === 'ar' ? 'ابحث عن قاعة، خدمة، أو باكدج' : 'Search for venue, service, or package'}
              className="w-full text-right text-sm text-[#999] outline-none bg-transparent"
              dir="rtl"
            />
          </form>
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="flex items-center justify-center relative shrink-0 size-[24px]"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="#121212"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white content-stretch flex gap-[10px] items-center relative rounded-[16px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.07)] shrink-0 w-full p-[8px]">
          <button
            onClick={() => setActiveTab('all')}
            className={`content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px px-[12px] py-[8px] relative rounded-[24px] shrink-0 transition-colors ${
              activeTab === 'all'
                ? 'bg-[#2d2871]'
                : 'bg-[#f2f2f2]'
            }`}
          >
            <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[14px] tracking-[0.28px] whitespace-nowrap ${activeTab === 'all' ? 'text-white' : 'text-[#666]'}`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {language === 'ar' ? 'الكل' : 'All'}
            </p>
          </button>
          <button
            onClick={() => setActiveTab('venues')}
            className={`content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px px-[12px] py-[8px] relative rounded-[24px] shrink-0 transition-colors ${
              activeTab === 'venues'
                ? 'bg-[#2d2871]'
                : 'bg-[#f2f2f2]'
            }`}
          >
            <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[14px] tracking-[0.28px] whitespace-nowrap ${activeTab === 'venues' ? 'text-white' : 'text-[#666]'}`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {language === 'ar' ? 'القاعات' : 'Venues'}
            </p>
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px px-[12px] py-[8px] relative rounded-[24px] shrink-0 transition-colors ${
              activeTab === 'services'
                ? 'bg-[#2d2871]'
                : 'bg-[#f2f2f2]'
            }`}
          >
            <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[14px] tracking-[0.28px] whitespace-nowrap ${activeTab === 'services' ? 'text-white' : 'text-[#666]'}`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {language === 'ar' ? 'الخدمات' : 'Services'}
            </p>
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`content-stretch flex flex-[1_0_0] h-[36px] items-center justify-center min-h-px min-w-px px-[12px] py-[8px] relative rounded-[24px] shrink-0 transition-colors ${
              activeTab === 'bookings'
                ? 'bg-[#2d2871]'
                : 'bg-[#f2f2f2]'
            }`}
          >
            <p className={`font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[14px] tracking-[0.28px] whitespace-nowrap ${activeTab === 'bookings' ? 'text-white' : 'text-[#666]'}`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              {language === 'ar' ? 'الحجوزات' : 'Bookings'}
            </p>
          </button>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2871]"></div>
          </div>
        ) : (
          <div className="content-stretch flex flex-col gap-[18px] items-start relative shrink-0 w-full">
            {/* Venues Results */}
            {(activeTab === 'all' || activeTab === 'venues') && results.venues.length > 0 && (
              <div className="content-stretch flex flex-col gap-[18px] items-start relative shrink-0 w-full">
                {results.venues.map((venue) => (
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
                          {venue.rating || 0}
                        </p>
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center justify-center relative shrink-0">
                            <div className="flex-none rotate-[180deg] scale-y-[-100%]">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path
                                  d="M8 0L10.1631 5.52786L16 6.11146L11.8541 9.94428L13.0557 16L8 12.5279L2.94427 16L4.1459 9.94428L0 6.11146L5.83686 5.52786L8 0Z"
                                  fill="#FFD700"
                                />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="h-[96px] relative rounded-[13px] shrink-0 w-[96.44px] overflow-hidden">
                      <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
                      {(() => {
                        const venueImages = Array.isArray(venue.images) ? venue.images : (venue.images ? [venue.images] : [])
                        const venueImageSrc = venueImages.length > 0 ? formatImageSrc(venueImages[0]) : null
                        return venueImageSrc ? (
                          <img
                            src={venueImageSrc}
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
                      <div className="absolute inset-0 hidden items-center justify-center bg-gray-200 rounded-[13px]">
                        <FiHome className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Services Results */}
            {(activeTab === 'all' || activeTab === 'services') && results.services.length > 0 && (
              <div className="content-stretch flex flex-col gap-[18px] items-start relative shrink-0 w-full">
                {results.services.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => navigate(`/service/${service.id}`)}
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
                            {service.nameAr || service.name}
                          </p>
                          {service.price && (
                            <p className="font-['Poppins:Medium',sans-serif] leading-[1.2] relative shrink-0 text-[#2d2871] text-[14px] tracking-[0.28px]">
                              {service.price} {language === 'ar' ? 'ر.س' : 'SAR'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="h-[96px] relative rounded-[13px] shrink-0 w-[96.44px] overflow-hidden">
                      <div className="absolute bg-[#d9d9d9] inset-0 rounded-[13px]"></div>
                      {(() => {
                        const images = Array.isArray(service.images) ? service.images : (service.images ? [service.images] : [])
                        const imageSrc = images.length > 0 ? formatImageSrc(images[0]) : null
                        return imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={service.nameAr || service.name}
                            className="absolute max-w-none object-cover rounded-[13px] size-full"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              const fallback = e.target.nextElementSibling
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                        ) : null
                      })()}
                      <div className="absolute inset-0 hidden items-center justify-center bg-gray-200 rounded-[13px]">
                        <FiTarget className="w-8 h-8 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bookings Results */}
            {(activeTab === 'all' || activeTab === 'bookings') && results.bookings.length > 0 && (
              <div className="content-stretch flex flex-col gap-[18px] items-start relative shrink-0 w-full">
                {results.bookings.map((booking) => (
                  <div
                    key={booking.id}
                    onClick={() => navigate(`/booking/${booking.id}`)}
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
                            {booking.bookingNumber || booking.id?.substring(0, 8)}
                          </p>
                          <div className="content-stretch flex flex-col font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] gap-[4px] items-end justify-center leading-[1.2] relative shrink-0 text-[#999] text-[11px] tracking-[0.22px] w-full">
                            <p className="relative shrink-0" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                              {booking.venue?.nameAr || booking.venue?.name || '-'}
                            </p>
                            <p className="relative shrink-0 text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                              {new Date(booking.eventDate || booking.date || booking.createdAt).toLocaleDateString('ar-EG')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex gap-px items-center justify-center relative shrink-0">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'CONFIRMED' || booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                    <div className="h-[96px] relative rounded-[13px] shrink-0 w-[96.44px] overflow-hidden">
                      <div className="absolute bg-[#2d2871] inset-0 rounded-[13px] flex items-center justify-center">
                        <FiCalendar className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No Results */}
            {!loading && getTotalResults() === 0 && searchQuery && (
              <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-center justify-center p-[40px] relative rounded-[16px] shrink-0 w-full">
                <FiSearch className="w-16 h-16 text-gray-400" />
                <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#666] text-[16px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}
                </p>
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {language === 'ar' ? 'جرب البحث بكلمات مختلفة' : 'Try searching with different keywords'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!searchQuery && (
              <div className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-center justify-center p-[40px] relative rounded-[16px] shrink-0 w-full">
                <FiSearch className="w-16 h-16 text-gray-400" />
                <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#666] text-[16px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {language === 'ar' ? 'ابدأ البحث' : 'Start searching'}
                </p>
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#999] text-[12px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {language === 'ar' ? 'ابحث عن القاعات، الخدمات، أو الحجوزات' : 'Search for venues, services, or bookings'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
    
    </div>

    <BottomNavigation />
    </>
  )
}

export default Search


