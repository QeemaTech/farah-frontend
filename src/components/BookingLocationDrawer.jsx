import { useState } from 'react'
import Drawer from './Drawer'

function BookingLocationDrawer({ isOpen, onClose, onNext, selectedLocation, onLocationChange, venueData }) {
  const [selected, setSelected] = useState(selectedLocation || 'another')
  const [showMap, setShowMap] = useState(false)
  const [mapLocation, setMapLocation] = useState(null)
  const [address, setAddress] = useState('')

  const options = [
    {
      id: 'artist',
      name: 'الموقع الخاص بالميكب ارتست',
      price: null,
    },
    {
      id: 'another',
      name: 'تحديد موقع آخر',
      price: 50,
    },
    {
      id: 'map',
      name: 'تحديد الموقع علي الخريطة',
      price: null,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.02944 7.02944 1 12 1C16.9706 1 21 5.02944 21 10Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  const handleSelect = (id) => {
    setSelected(id)
    if (onLocationChange) {
      onLocationChange(id)
    }
  }

  const handleNext = () => {
    if (onNext) {
      if (selected === 'map' && mapLocation) {
        onNext({
          location: 'map',
          locationAddress: address,
          locationLatitude: mapLocation.lat,
          locationLongitude: mapLocation.lng,
        })
      } else if (selected === 'another') {
        onNext({
          location: 'another',
          locationAddress: address || 'موقع آخر',
        })
      } else {
        onNext(selected)
      }
    }
  }

  const handleMapClick = () => {
    if (selected === 'map') {
      setShowMap(true)
    }
  }

  const handleMapSelect = (lat, lng) => {
    setMapLocation({ lat, lng })
    // Reverse geocode to get address (simplified - in production use a geocoding service)
    setAddress(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`)
    setShowMap(false)
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="موقع الحجز">
      <div className="flex flex-col gap-3 pb-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => {
              handleSelect(option.id)
              if (option.id === 'map') {
                setShowMap(true)
              }
            }}
            className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
              selected === option.id
                ? 'bg-[#edecf8] border-[#2d2871]'
                : 'border-[#f2f2f2] bg-white'
            }`}
          >
            <div className="flex items-center gap-3">
              {option.icon && <div className="text-[#2d2871]">{option.icon}</div>}
              <span className="text-sm font-medium text-gray-800 text-right">
                {option.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {option.price && (
                <span className="text-sm font-medium text-gray-800">
                  +{option.price} $
                </span>
              )}
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selected === option.id
                    ? 'border-[#2d2871]'
                    : 'border-gray-300'
                }`}
              >
                {selected === option.id && (
                  <div className="w-3 h-3 bg-[#2d2871] rounded-full"></div>
                )}
              </div>
            </div>
          </button>
        ))}

        {/* Address Input for 'another' location */}
        {selected === 'another' && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-right">
              عنوان الموقع
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="أدخل عنوان الموقع"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-right text-sm outline-none focus:border-[#2d2871]"
              dir="rtl"
            />
          </div>
        )}

        {/* Map Selection for 'map' location */}
        {selected === 'map' && (
          <div className="mt-2">
            {showMap ? (
              <div className="border border-gray-300 rounded-xl overflow-hidden">
                <div className="h-[300px] bg-gray-100 relative">
                  {/* Simple map interface - in production use Google Maps or similar */}
                  <iframe
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${(venueData?.longitude || 31.2357) - 0.01},${(venueData?.latitude || 30.0444) - 0.01},${(venueData?.longitude || 31.2357) + 0.01},${(venueData?.latitude || 30.0444) + 0.01}&layer=mapnik&marker=${venueData?.latitude || 30.0444},${venueData?.longitude || 31.2357}`}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                      <p className="text-sm text-gray-700">اضغط على الخريطة لتحديد الموقع</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-white border-t border-gray-200">
                  <button
                    onClick={() => {
                      // Get click coordinates (simplified - in production use map click handler)
                      const lat = venueData?.latitude || 30.0444
                      const lng = venueData?.longitude || 31.2357
                      handleMapSelect(lat, lng)
                    }}
                    className="w-full bg-[#2d2871] text-white rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    تأكيد الموقع المحدد
                  </button>
                </div>
              </div>
            ) : mapLocation ? (
              <div className="border border-gray-300 rounded-xl p-3 bg-gray-50">
                <p className="text-sm text-gray-700 mb-2">الموقع المحدد:</p>
                <p className="text-xs text-gray-600">{address}</p>
                <button
                  onClick={() => setShowMap(true)}
                  className="mt-2 text-sm text-[#2d2871] underline"
                >
                  تغيير الموقع
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowMap(true)}
                className="w-full border-2 border-dashed border-[#2d2871] rounded-xl px-4 py-3 text-[#2d2871] font-medium text-sm"
              >
                اضغط لتحديد الموقع على الخريطة
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* Bottom Button */}
      <div className="sticky bottom-0 bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5 border-t border-gray-100 mt-4">
        <button
          onClick={handleNext}
          className="w-full bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold hover:bg-[#1f1a5a] transition-colors"
        >
          التالي
        </button>
      </div>
    </Drawer>
  )
}

export default BookingLocationDrawer

