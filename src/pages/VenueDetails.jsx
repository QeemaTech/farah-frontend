import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import { formatImageSrc } from '../utils/imageUtils'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function VenueDetails() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [venue, setVenue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [showGallery, setShowGallery] = useState(false)

  const fetchedVenueIdRef = useRef(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    // Only fetch if venue ID changed and we're not already fetching
    if (fetchedVenueIdRef.current === id || fetchingRef.current || !id) {
      return
    }

    fetchVenueDetails()
  }, [id])

  const fetchVenueDetails = async () => {
    if (fetchingRef.current || !id) return
    
    fetchingRef.current = true
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/mobile/venues/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10000
      })
      setVenue(response.data.venue)
      setIsFavorite(response.data.venue?.isFavorite || false)
      fetchedVenueIdRef.current = id
    } catch (error) {
      // Silently fail if backend is not available
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ECONNREFUSED') {
        console.error('Error fetching venue details:', error)
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }

  const handleBook = () => {
    // Navigate to booking steps page, not directly to confirmation
    navigate('/booking/new', {
      state: {
        venue: {
          id: venue?.id,
          name: venue?.name,
          nameAr: venue?.nameAr,
          price: venue?.price,
          images: venue?.images,
          description: venue?.description,
          descriptionAr: venue?.descriptionAr,
          location: venue?.location,
          address: venue?.address,
        },
      },
    })
  }

  if (loading) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  if (!venue) {
    return (
      <div className="bg-white min-h-screen max-w-[390px] mx-auto flex items-center justify-center">
        <div className="text-center">جاري التحميل...</div>
      </div>
    )
  }

  const venueImages = venue.images && Array.isArray(venue.images) && venue.images.length > 0
    ? venue.images
    : (venue.image ? [venue.image] : [])
  
  const venueImage = venueImages.length > 0 
    ? formatImageSrc(venueImages[selectedImageIndex], 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800')
    : 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
  
  const venueName = venue.nameAr || venue.name || 'قاعة'
  const venueAddress = venue.address || venue.location || ''
  const venueDescription = venue.descriptionAr || venue.description || ''
  
  // Helper function to get map URL
  const getMapUrl = () => {
    if (venue.latitude && venue.longitude) {
      return `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`
    }
    if (venue.location) {
      return venue.location
    }
    if (venueAddress) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`
    }
    return null
  }

  const toggleFavorite = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        navigate('/login')
        return
      }

      if (isFavorite) {
        await axios.delete(`${API_URL}/mobile/venues/${id}/favorite`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      } else {
        await axios.post(`${API_URL}/mobile/venues/${id}/favorite`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
      }
      setIsFavorite(!isFavorite)
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
  

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-[20px] top-[20px] w-[350px] z-20">
        <div className="bg-white content-stretch flex items-center justify-center p-[10px] relative rounded-[12px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 size-[32px]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C8.13 2 5 5.13 5 9C5 14.25 2 16 2 16H22C22 16 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21C9 22.1 9.9 23 11 23H13C14.1 23 15 22.1 15 21"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center flex-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          اسم القاعة
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center relative shrink-0 size-[32px]"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18L15 12L9 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Main Content - Scrollable White Card */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-center shrink-0 w-[350px] left-[20px] top-[90px] overflow-y-auto pb-[140px]">
        
        {/* Hero Image with Gallery */}
        <div className="content-stretch flex flex-col items-center relative shrink-0 w-full">
          <div className="h-[280px] relative rounded-[16px] shrink-0 w-full overflow-hidden">
            <img
              src={venueImage}
              alt={venueName}
              className="absolute inset-0 max-w-none object-cover size-full cursor-pointer"
              onClick={() => venueImages.length > 1 && setShowGallery(true)}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
              }}
            />
            {venueImages.length > 1 && (
              <button
                onClick={() => setShowGallery(true)}
                className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
                {venueImages.length} صور
              </button>
            )}
            {venueImages.length > 1 && (
              <div className="absolute bottom-4 left-4 flex gap-2">
                {venueImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      idx === selectedImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Image Gallery Thumbnails */}
          {/* {venueImages.length > 1 && (
            <div className="flex gap-2 mt-4 w-full overflow-x-auto pb-2">
              {venueImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                    idx === selectedImageIndex ? 'border-[#2d2871]' : 'border-transparent'
                  }`}
                >
                  <img
                    src={formatImageSrc(img, 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200')}
                    alt={`${venueName} ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                    }}
                  />
                </button>
              ))}
            </div>
          )} */}
          
          {/* Venue Summary Card Overlaying Image */}
          <div className="bg-white content-stretch bottom-12 flex  items-start justify-between mb-[-60px] p-[12px] relative rounded-[12px] shadow-[0px_4px_9px_0px_rgba(0,0,0,0.08)] shrink-0 w-[330px] z-10">
            {/* Purple Heart Icon on Left */}

            <div className="content-stretch flex flex-col items-center justify-center relative shrink-0">
            <button
              onClick={toggleFavorite}
              className="bg-white content-stretch flex items-center justify-center p-[8px] relative rounded-[12px] shrink-0 size-[40px] shadow-sm"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={isFavorite ? "#2d2871" : "none"} stroke="#2d2871" strokeWidth="2">
                <path
                  d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span>
              {venue.pricePerHour || venue.price || 0 } EGP
            </span>

            </div>
     
            
            {/* Venue Info on Right */}
            <div className="content-stretch flex flex-col gap-[6px] items-end relative shrink-0 flex-1 mr-[8px]">
              <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[14px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                {venueName}
              </p>
              <a
                href={getMapUrl() || `https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M6 1C3.24 1 1 3.24 1 6C1 9.5 6 13 6 13C6 13 11 9.5 11 6C11 3.24 8.76 1 6 1Z"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M6 7.5C6.83 7.5 7.5 6.83 7.5 6C7.5 5.17 6.83 4.5 6 4.5C5.17 4.5 4.5 5.17 4.5 6C4.5 6.83 5.17 7.5 6 7.5Z"
                    stroke="#666"
                    strokeWidth="1.5"
                  />
                </svg>
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[10px] text-right underline" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {venueAddress || venue.location || 'عرض الموقع'}
                </p>
              </a>
              <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0">
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[1.5] relative shrink-0 text-[#666] text-[10px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  ({venue.reviewCount || 0} تقييم)
                </p>
                <p className="font-['Poppins:Regular',sans-serif] leading-[1.5] not-italic relative shrink-0 text-[#121212] text-[12px] text-right font-medium">
                  {venue.rating?.toFixed(2) || '0.00'}
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

        {/* Stats Cards */}
        <div className="content-stretch flex gap-[8px] items-stretch relative shrink-0 w-full mt-[20px]">
          {[
            { 
              label: 'السعر للساعة', 
              value: `${(venue.pricePerHour || venue.price || 0).toFixed(2).replace('.', ',')}`, 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d2871" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                </svg>
              ), 
              color: 'bg-[#fce9ee]' 
            },
            { 
              label: 'العملاء', 
              value: `+${venue.clients || 0}`, 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d2871" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ), 
              color: 'bg-[#fce9ee]' 
            },
            { 
              label: 'سعة الافراد', 
              value: String(venue.capacity || 0), 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d2871" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              ), 
              color: 'bg-[#fce9ee]' 
            },
            { 
              label: 'التقييم', 
              value: venue.rating?.toFixed(1) || '0.0', 
              icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d2871" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              ), 
              color: 'bg-[#fce9ee]' 
            },
          ].map((stat, idx) => (
            <div
              key={idx}
              className="bg-white content-stretch flex flex-[1_0_0] flex-col items-center min-h-px min-w-px pb-[12px] pt-0 px-0 relative rounded-[16px] shadow-[0px_8px_24px_0px_rgba(149,157,165,0.2)] shrink-0 overflow-hidden"
            >
              <div className={`${stat.color} content-stretch flex flex-col h-[40px] items-center justify-center p-[10px] relative shrink-0 w-full`}>
                <div className="text-[#2d2871]">
                  {stat.icon}
                </div>
              </div>
              <div className="content-stretch flex flex-col gap-[4px] items-center leading-[normal] relative shrink-0 text-center mt-[8px]">
                <p className="font-['Poppins:Bold',sans-serif] not-italic relative shrink-0 text-[#2d2871] text-[14px]">
                  {stat.value}
                </p>
                <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#6b779a] text-[9px] text-center" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                  {stat.label}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Description Section */}
        <div className="content-stretch flex flex-col gap-[8px] items-end leading-[normal] relative shrink-0 w-full mt-[8px]">
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-[#2d2871] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            الوصف
          </p>
          <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] min-w-full relative shrink-0 text-[#7e848e] text-[12px] text-justify leading-[1.6] w-full whitespace-pre-wrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
            {venueDescription || 'لوريم إيبسوم هو نص مؤقت يستخدم في التصميم والنشر لإظهار شكل الوثيقة أو الخط دون الاعتماد على محتوى معنوي. قد يستخدم لوريم إيبسوم كنص بديل قبل وضع النص'}
          </p>
        </div>

        {/* Image Gallery Section */}
        {venueImages.length > 1 && (
          <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-full mt-[8px]">
            <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              معرض الصور
            </p>
            <div className="w-full overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              <div className="flex gap-3" style={{ width: 'max-content' }}>
                {venueImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImageIndex(idx)
                      setShowGallery(true)
                    }}
                    className={`flex-shrink-0 w-[120px] h-[120px] rounded-[16px] overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex ? 'border-[#2d2871] shadow-lg' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={formatImageSrc(img, 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200')}
                      alt={`${venueName} ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=200'
                      }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Address Section */}
        <div className="content-stretch flex flex-col gap-[8px] items-end relative shrink-0 w-full mt-[8px]">
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#2d2871] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            العنوان
          </p>
          
          {/* Address Text */}
          {venueAddress && (
            <div className="w-full bg-[#f5f5f5] rounded-[12px] p-3 mb-2">
              <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] text-[#666] text-[12px] text-right leading-[1.6]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                {venueAddress}
              </p>
            </div>
          )}
          
          {/* Interactive Map */}
          <div className="h-[280px] relative rounded-[20px] shrink-0 w-full bg-[#f5f5f5] overflow-hidden border-2 border-gray-200">
            {venue.latitude && venue.longitude ? (
              <div className="w-full h-full relative">
                {/* OpenStreetMap - Works without API key */}
                <iframe
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${(parseFloat(venue.longitude) - 0.01).toFixed(6)},${(parseFloat(venue.latitude) - 0.01).toFixed(6)},${(parseFloat(venue.longitude) + 0.01).toFixed(6)},${(parseFloat(venue.latitude) + 0.01).toFixed(6)}&layer=mapnik&marker=${venue.latitude},${venue.longitude}`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  title={`Map for ${venueName}`}
                  className="w-full h-full"
                />
                <a
                  href={`https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-[#2d2871] text-xs font-medium transition-colors z-10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  <span>فتح في Google Maps</span>
                </a>
              </div>
            ) : venueAddress ? (
              <div className="w-full h-full relative">
                {/* Use Google Maps with address - this should work */}
                <iframe
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(venueAddress)}&hl=ar&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map for ${venueName}`}
                  className="w-full h-full"
                />
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(venueAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-[#2d2871] text-xs font-medium transition-colors z-10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  <span>فتح في Google Maps</span>
                </a>
              </div>
            ) : venue.location && (venue.location.includes('maps.google.com') || venue.location.includes('maps.app')) ? (
              <div className="w-full h-full relative">
                <iframe
                  src={venue.location.includes('/maps/') ? venue.location.replace('/maps/', '/maps/embed/') : `${venue.location}&output=embed`}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map for ${venueName}`}
                  className="w-full h-full"
                />
                <a
                  href={venue.location}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-white hover:bg-gray-50 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2 text-[#2d2871] text-xs font-medium transition-colors z-10"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                  <span>فتح في Google Maps</span>
                </a>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200">
                <div className="text-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="mx-auto mb-2 text-gray-400">
                    <path
                      d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11.5C13.38 11.5 14.5 10.38 14.5 9C14.5 7.62 13.38 6.5 12 6.5C10.62 6.5 9.5 7.62 9.5 9C9.5 10.38 10.62 11.5 12 11.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-gray-400 text-[12px]">لا يوجد موقع متاح</p>
                  <p className="text-gray-400 text-[10px] mt-1">No location available</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bg-white bottom-0 content-stretch flex flex-col items-center left-1/2 translate-x-[-50%] pb-0 pt-[10px] px-0 rounded-tl-[16px] rounded-tr-[16px] w-full max-w-[390px] z-30 shadow-[0px_-2px_10px_0px_rgba(0,0,0,0.1)]">
        <button
          onClick={handleBook}
          className="bg-[#2d2871] content-stretch cursor-pointer flex h-[55px] items-center justify-center p-[10px] relative rounded-[38px] shrink-0 w-[350px] hover:bg-[#1f1a5a] transition-colors"
        >
          <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[16px] text-white" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
            احجز موعد
          </p>
        </button>
        <div className="bg-white h-[35px] relative shrink-0 w-full">
          <div className="absolute bg-[rgba(27,27,27,0.85)] w-[134px] h-[5px] rounded-[2.5px] left-1/2 top-1/2 translate-x-[-50%] translate-y-[-50%]"></div>
        </div>
      </div>

      {/* Gallery Modal */}
      {showGallery && venueImages.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowGallery(false)}>
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 z-10 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6L18 18"/>
              </svg>
            </button>
            <div className="relative flex-1 flex items-center justify-center">
              <img
                src={formatImageSrc(venueImages[selectedImageIndex], 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800')}
                alt={`${venueName} ${selectedImageIndex + 1}`}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800'
                }}
              />
            </div>
            {venueImages.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : venueImages.length - 1))
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 18L9 12L15 6"/>
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedImageIndex((prev) => (prev < venueImages.length - 1 ? prev + 1 : 0))
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18L15 12L9 6"/>
                  </svg>
                </button>
                <div className="flex justify-center gap-2 mt-4">
                  {venueImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedImageIndex(idx)
                      }}
                      className={`h-2 rounded-full transition-all ${
                        idx === selectedImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-white text-center mt-2 text-sm">
                  {selectedImageIndex + 1} / {venueImages.length}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default VenueDetails
