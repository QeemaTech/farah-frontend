import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Onboarding() {
  const navigate = useNavigate()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const response = await axios.get(`${API_URL}/onboarding/mobile`)
      const fetchedSlides = response.data.slides || []
      if (fetchedSlides.length > 0) {
        setSlides(fetchedSlides)
      } else {
        // Default slides matching the images
        setSlides([
          {
            id: 1,
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
            title: 'كل ما تحتاجه لمناسبتك',
            titleAr: 'كل ما تحتاجه لمناسبتك',
            subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
            subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          },
          {
            id: 2,
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
            title: 'كل ما تحتاجه لمناسبتك',
            titleAr: 'كل ما تحتاجه لمناسبتك',
            subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
            subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          },
          {
            id: 3,
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
            title: 'كل ما تحتاجه لمناسبتك',
            titleAr: 'كل ما تحتاجه لمناسبتك',
            subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
            subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          },
          {
            id: 4,
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
            title: 'كل ما تحتاجه لمناسبتك',
            titleAr: 'كل ما تحتاجه لمناسبتك',
            subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
            subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          },
        ])
      }
    } catch (error) {
      console.error('Error fetching onboarding slides:', error)
      // Fallback to default slides on error
      setSlides([
        {
          id: 1,
          image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
          title: 'كل ما تحتاجه لمناسبتك',
          titleAr: 'كل ما تحتاجه لمناسبتك',
          subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
          title: 'كل ما تحتاجه لمناسبتك',
          titleAr: 'كل ما تحتاجه لمناسبتك',
          subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
          title: 'كل ما تحتاجه لمناسبتك',
          titleAr: 'كل ما تحتاجه لمناسبتك',
          subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
        },
        {
          id: 4,
          image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop',
          title: 'كل ما تحتاجه لمناسبتك',
          titleAr: 'كل ما تحتاجه لمناسبتك',
          subtitle: 'سجل الآن وجهز لمناسبتك بشكل مميز',
          subtitleAr: 'سجل الآن وجهز لمناسبتك بشكل مميز',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      handleStart()
    }
  }

  const handleStart = () => {
    localStorage.setItem('onboarding_completed', 'true')
    navigate('/login')
  }

  if (loading) {
    return (
      <div className="relative w-full h-screen max-w-[390px] mx-auto overflow-hidden bg-[#FFF8FA] rounded-[32px] flex items-center justify-center">
        <StatusBar />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2d2871]"></div>
      </div>
    )
  }

  const currentSlideData = slides[currentSlide] || slides[0]

  return (
    <div className="relative w-full h-screen max-w-[390px] mx-auto overflow-hidden bg-white rounded-[32px]">
      <StatusBar />

      {/* Top Section - Image (60% of screen) */}
      <div className="absolute top-0 left-0 right-0 h-[60%] z-0 overflow-hidden">
        <img
          src={currentSlideData?.image?.startsWith('data:') || currentSlideData?.image?.startsWith('http') 
            ? (currentSlideData?.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop')
            : (currentSlideData?.image ? `data:image/jpeg;base64,${currentSlideData.image}` : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop')}
          alt="Onboarding"
          className="w-full h-full object-cover"
          style={{ 
            transform: 'scale(1.05)',
          }}
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&h=1200&fit=crop'
          }}
        />
        {/* Curved overlay transition */}
        <div className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-b from-transparent via-[#FFF8FA]/50 to-[#FFF8FA]"></div>
      </div>

      {/* Bottom Section - Content (40% of screen) - Light Purple/Pink Background */}
      <div className="absolute bottom-0 left-0 right-0 h-[40%] z-10 bg-[#FFF8FA] rounded-t-[32px] flex flex-col items-center justify-between pt-[40px] pb-[20px] px-[20px]">
        {/* Text Content */}
        <div className="flex flex-col items-center gap-[12px] flex-1 justify-center">
          <h1 className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-[#2D2871] text-[24px] text-center leading-[1.3] px-[20px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            {currentSlideData?.titleAr || currentSlideData?.title || 'كل ما تحتاجه لمناسبتك'}
          </h1>
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666666] text-[15px] text-center leading-[1.6] max-w-[340px] px-[20px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            {currentSlideData?.subtitleAr || currentSlideData?.subtitle || 'سجل الآن وجهز لمناسبتك بشكل مميز'}
          </p>
        </div>

        {/* Pagination Dots */}
        <div className="flex items-center justify-center gap-[8px] mb-[20px]">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-[#2D2871] w-[24px] h-[8px]'
                  : 'bg-[#E0E0E0] w-[8px] h-[8px]'
              }`}
            />
          ))}
        </div>

        {/* Bottom Row: Back Button, Rings Icon, and Next/Start Button */}
        <div className="flex items-center justify-between w-full px-[8px] mb-[10px]">
          {/* Left: Back Button (Circular) */}
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`bg-[#2D2871] flex items-center justify-center rounded-full w-[48px] h-[48px] shadow-lg hover:opacity-90 transition-opacity ${
              currentSlide === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="rotate-180">
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Center: Wedding Rings Icon (Light Purple) */}
          <div className="flex items-center justify-center">
            <svg width="100" height="100" viewBox="0 0 120 120" fill="none" className="text-[#A0A0C0]">
              {/* Left Ring */}
              <ellipse
                cx="40"
                cy="60"
                rx="22"
                ry="28"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              {/* Right Ring */}
              <ellipse
                cx="80"
                cy="60"
                rx="22"
                ry="28"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
              />
              {/* Horizontal Lines connecting rings */}
              <path
                d="M28 60L48 60M72 60L92 60"
                stroke="currentColor"
                strokeWidth="2"
              />
              {/* Diamond on Top Ring */}
              <path
                d="M80 28L87 42L80 48L73 42Z"
                fill="currentColor"
                opacity="0.85"
              />
              <circle cx="80" cy="35" r="2" fill="white" opacity="0.7" />
            </svg>
          </div>

          {/* Right: Next Button or Start Button */}
          {currentSlide === slides.length - 1 ? (
            <button
              onClick={handleStart}
              className="bg-[#2D2871] flex items-center justify-center gap-[8px] px-[24px] py-[12px] rounded-[30px] shadow-lg hover:opacity-90 transition-opacity"
            >
              <span className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] text-white text-[16px] leading-[1.2]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                إبدأ الآن
              </span>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="bg-[#2D2871] flex items-center justify-center rounded-full w-[48px] h-[48px] shadow-lg hover:opacity-90 transition-opacity"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M7.5 15L12.5 10L7.5 5"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Home Indicator */}
        <div className="absolute bottom-[10px] left-1/2 transform -translate-x-1/2">
          <div className="bg-[rgba(27,27,27,0.85)] w-[134px] h-[5px] rounded-[2.5px]"></div>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
