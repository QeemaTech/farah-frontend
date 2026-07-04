import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import MainHeader from '../components/MainHeader'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Home() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [topVenues, setTopVenues] = useState([])
  const [popularVenues, setPopularVenues] = useState([])
  const [sliders, setSliders] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentSlide, setCurrentSlide] = useState(0)

  const dataFetchedRef = useRef(false)
  const fetchingRef = useRef(false)

  const fetchData = async () => {
    if (fetchingRef.current || dataFetchedRef.current) {
      return
    }

    fetchingRef.current = true
    try {
      // Use mobile endpoint for home page data
      const homeRes = await axios.get(`${API_URL}/mobile/home?limit=5`, {
        timeout: 10000
      })
      const homeData = homeRes.data.data || {}

      setCategories(homeData.categories || [])
      setTopVenues(homeData.topVenues || [])
      setPopularVenues(homeData.popularVenues || [])
      setSliders(homeData.sliders || [])
      dataFetchedRef.current = true
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set empty arrays on error
      setCategories([])
      setTopVenues([])
      setPopularVenues([])
      setSliders([])
      dataFetchedRef.current = true
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Update slide interval when sliders change
  useEffect(() => {
    if (sliders.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % sliders.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [sliders.length])

  return (

    <>
        <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      {/* Status Bar */}
      {/* <StatusBar /> */}

      {/* Main Header */}
      <MainHeader />

      {/* Decorative Background */}
      <div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
        <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
          <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[20px] h-[619px] items-center left-1/2 top-[90px] translate-x-[-50%] w-[390px] overflow-y-auto pb-[100px]" dir="rtl">
        {/* Search Bar */}
        <div 
          onClick={() => navigate('/search')}
          className="bg-white content-stretch flex h-[48px] items-center justify-between px-[16px] py-0 relative rounded-[24px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 w-[350px] cursor-pointer"
        >
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
            <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#999] text-[14px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
              ابحث عن قاعة، خدمة، أو باكدج
            </p>
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

        {/* Hero Text */}
        <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right w-[350px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          كل ما تحتاجه لفرحك في مكان واحد!
        </p>

        {/* Hero Carousel - Sliders */}
        {sliders.length > 0 ? (
          <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-[350px]">
            <div className="h-[174px] relative rounded-[12px] shrink-0 w-full overflow-hidden">
              <div className="relative w-full h-full">
                {sliders.map((slider, index) => (
                  <div
                    key={slider.id}
                    onClick={() => slider.link && window.open(slider.link, '_blank')}
                    className={`absolute inset-0 transition-opacity duration-500 cursor-pointer ${
                      index === currentSlide ? 'opacity-100' : 'opacity-0'
                    }`}
                  >
                    <img
                      src={slider.image?.startsWith('data:') || slider.image?.startsWith('http') ? slider.image : `data:image/jpeg;base64,${slider.image}`}
                      alt={slider.titleAr || slider.title || 'Slider'}
                      className="absolute inset-0 max-w-none object-cover size-full"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Dots Indicator */}
            <div className="h-[6px] relative shrink-0 w-[30px] flex items-center justify-center gap-1">
              {sliders.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentSlide
                      ? 'w-6 bg-[#2d2871]'
                      : 'w-1.5 bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="content-stretch flex flex-col gap-[8px] items-center relative shrink-0 w-[350px]">
            <div className="h-[174px] relative rounded-[12px] shrink-0 w-full overflow-hidden bg-gray-200 flex items-center justify-center">
              <p className="text-gray-400">لا توجد صور متاحة</p>
            </div>
          </div>
        )}

        {/* Service Categories */}
        {categories.length > 0 && (
          <div className="content-stretch flex flex-col gap-[10px] items-start relative shrink-0 w-[350px]">
            {/* First Row - First 2 Categories */}
            {categories.slice(0, 2).length > 0 && (
              <div className="content-stretch flex gap-[10px] h-[80px] items-center relative shrink-0 w-full">
                {categories.slice(0, 2).map((category) => {
                  const imageSrc = formatImageSrc(category.image)
                  const serviceCount = category._count?.services || 0
                  
                  return (
                    <div
                      key={category.id}
                      onClick={() => navigate('/services', { state: { categoryId: category.id } })}
                      className="bg-white content-stretch flex flex-[1_0_0] h-full items-center justify-between min-h-px min-w-px p-[16px] relative rounded-[10px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.07)] shrink-0 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="h-[70px] relative shrink-0 w-[60px] bg-gray-100 rounded overflow-hidden">
                        {imageSrc ? (
                          <img 
                            src={imageSrc} 
                            alt={category.nameAr || category.name} 
                            className="w-full h-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-gray-400 text-xs">لا توجد صورة</span>
                          </div>
                        )}
                      </div>
                      <div className="content-stretch flex flex-col gap-[4px] items-end justify-center leading-[1.5] relative shrink-0 text-[12px] text-right">
                        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-[#121212]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                          {category.nameAr || category.name}
                        </p>
                        <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#666]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          +{serviceCount} {serviceCount === 1 ? 'خدمة' : 'خدمات'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            
            {/* Second Row - All Services + Venues */}
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0 w-full">
              <div className="bg-white content-stretch flex flex-col gap-[10px] h-[80px] items-start p-[16px] relative rounded-[10px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.07)] shrink-0 w-[110px] cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/services')}>
                <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[1.5] min-w-full relative shrink-0 text-[#121212] text-[12px] text-right w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                  كل الخدمات
                </p>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transform rotate-180">
                  <path
                    d="M15 18L9 12L15 6"
                    stroke="#121212"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="bg-white content-stretch flex h-[80px] items-center justify-between p-[16px] relative rounded-[10px] shadow-[0px_0px_14px_0px_rgba(0,0,0,0.07)] shrink-0 w-[230px] cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/venues')}>
                <div className="relative shrink-0 size-[80px] bg-gray-100 rounded overflow-hidden">
                  <img src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400' alt="Venue" className="w-full h-full object-cover" />
                </div>
                <div className="content-stretch flex flex-col gap-[4px] items-end justify-center leading-[1.5] relative shrink-0 text-[12px] text-right">
                  <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-[#121212]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                    قاعات
                  </p>
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#666]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    +{topVenues.length + popularVenues.length} قاعة
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slaughter Calculator Promo Banner */}
        <div 
          onClick={() => navigate('/slaughter')}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 content-stretch flex items-center justify-between p-[16px] relative rounded-[16px] shadow-lg shrink-0 w-[350px] cursor-pointer mt-2 overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 opacity-10 text-6xl">🐑</div>
          <div className="flex items-center gap-2 z-10 text-white">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="transform rotate-180 bg-white/20 rounded-full p-1">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex flex-col gap-1 z-10 text-right">
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-white text-[16px]">
              حاسبة الذبائح الجديدة!
            </p>
            <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] text-indigo-100 text-[12px]">
              احسب ذبائح فرحك واطلبها بسهولة
            </p>
          </div>
        </div>

        {/* Top 5 Venues */}
        {topVenues.length > 0 && (
          <div className="bg-[#fff8fa] content-stretch flex flex-col gap-[8px] items-end px-[20px] py-[10px] relative shrink-0 w-[390px]" dir="ltr">
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              افضل خمسة لهذا الشهر
            </p>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0 overflow-x-auto pb-2">
              {topVenues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigate(`/venue/${venue.id}`)}
                className="bg-white border border-[#f2f2f2] border-solid content-stretch cursor-pointer flex flex-col gap-[4px] items-end overflow-clip p-0 relative rounded-[12px] w-[165px] flex-shrink-0"
              >
                <div className="h-[110px] relative shrink-0 w-full">
                  <img
                    src={venue.images && Array.isArray(venue.images) && venue.images.length > 0 
                      ? (venue.images[0].startsWith('data:') || venue.images[0].startsWith('http') ? venue.images[0] : `data:image/jpeg;base64,${venue.images[0]}`)
                      : (venue.image?.startsWith('data:') || venue.image?.startsWith('http') ? venue.image : (venue.image ? `data:image/jpeg;base64,${venue.image}` : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'))}
                    alt={venue.nameAr || venue.name}
                    className="absolute inset-0 max-w-none object-cover size-full"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'
                    }}
                  />
                  <div className="absolute left-[140.01px] size-[14px] top-[9px]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 12.5L2.5 7.5C1.5 6.5 1 5.5 1 4.5C1 2.5 2.5 1 4.5 1C5.5 1 6.5 1.5 7 2.5C7.5 1.5 8.5 1 9.5 1C11.5 1 13 2.5 13 4.5C13 5.5 12.5 6.5 11.5 7.5L7 12.5Z"
                        fill="#EF92AB"
                        stroke="#EF92AB"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-center relative shrink-0 w-full" >
                  <div className="flex-none  w-full">
                    <div className="content-stretch flex flex-col items-end pb-[8px] pt-0 px-[8px] relative w-full">
                      <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] min-w-full relative shrink-0 text-[#121212] text-[14px] text-right w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                        {venue.nameAr || venue.name}
                      </p>
                      {(venue.address || venue.location) && (
                        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#666] text-[10px] text-right mb-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          {venue.address || venue.location}
                        </p>
                      )}
                      <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0 w-[108px]">
                        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#666] text-[10px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          ({venue.reviewCount || 0} تقييم)
                        </p>
                        <p className="font-['Poppins:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[12px] text-right">
                          {venue.rating?.toFixed(1) || '0.0'}
                        </p>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.5L6 8.885L2.91 10.5L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                            fill="#FFD700"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}

        {/* Most Requested */}
        {popularVenues.length > 0 && (
          <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-[350px]" dir="ltr">
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              الاكثر طلبا
            </p>
            <div className="content-stretch flex gap-[10px] items-center relative shrink-0 overflow-x-auto pb-2">
              {popularVenues.map((venue) => (
              <div
                key={venue.id}
                onClick={() => navigate(`/venue/${venue.id}`)}
                className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[4px] items-end relative rounded-[12px] w-[165px] flex-shrink-0"
              >
                <div className="h-[110.54px] relative rounded-tl-[11.858px] rounded-tr-[11.858px] shrink-0 w-full">
                  <img
                    src={venue.images && Array.isArray(venue.images) && venue.images.length > 0 
                      ? (venue.images[0].startsWith('data:') || venue.images[0].startsWith('http') ? venue.images[0] : `data:image/jpeg;base64,${venue.images[0]}`)
                      : (venue.image?.startsWith('data:') || venue.image?.startsWith('http') ? venue.image : (venue.image ? `data:image/jpeg;base64,${venue.image}` : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'))}
                    alt={venue.nameAr || venue.name}
                    className="absolute inset-0 max-w-none object-cover rounded-tl-[11.858px] rounded-tr-[11.858px] size-full"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'
                    }}
                  />
                  <div className="absolute left-[140.01px] size-[14px] top-[9px]">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path
                        d="M7 12.5L2.5 7.5C1.5 6.5 1 5.5 1 4.5C1 2.5 2.5 1 4.5 1C5.5 1 6.5 1.5 7 2.5C7.5 1.5 8.5 1 9.5 1C11.5 1 13 2.5 13 4.5C13 5.5 12.5 6.5 11.5 7.5L7 12.5Z"
                        fill="#EF92AB"
                        stroke="#EF92AB"
                        strokeWidth="1"
                      />
                    </svg>
                  </div>
                </div>
                <div className="flex items-center justify-center relative shrink-0">
                  <div className="flex-none ">
                    <div className="content-stretch flex flex-col items-end pb-[8px] pt-0 px-[8px] relative w-[165px]">
                      <p className="font-['Poppins:SemiBold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] min-w-full relative shrink-0 text-[#121212] text-[14px] text-right w-[min-content] whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                        {venue.nameAr || venue.name}
                      </p>
                      {(venue.address || venue.location) && (
                        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.2] relative shrink-0 text-[#666] text-[10px] text-right mb-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          {venue.address || venue.location}
                        </p>
                      )}
                      <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0 w-[108px]">
                        <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#666] text-[10px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                          ({venue.reviewCount || 0} تقييم)
                        </p>
                        <p className="font-['Poppins:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[12px] text-right">
                          {venue.rating?.toFixed(1) || '0.0'}
                        </p>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path
                            d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.5L6 8.885L2.91 10.5L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                            fill="#FFD700"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              ))}
            </div>
          </div>
        )}
      </div>

    
    </div>
    
      {/* Bottom Navigation */}
      <BottomNavigation />
    </>
  )
}

export default Home
