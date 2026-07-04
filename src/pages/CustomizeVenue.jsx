import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StatusBar from '../components/StatusBar'

function CustomizeVenue() {
  const navigate = useNavigate()
  const [selectedOptions, setSelectedOptions] = useState({
    tables: 'with',
    koshah: 'withRoses',
    chairs: 'normal',
  })

  const options = [
    {
      category: 'tables',
      id: 'without',
      name: 'بدون طاولات',
      price: 50,
    },
    {
      category: 'tables',
      id: 'with',
      name: 'بطاولات',
      price: 50,
    },
    {
      category: 'koshah',
      id: 'withRoses',
      name: 'كوشة مع ورود',
      price: 50,
    },
    {
      category: 'koshah',
      id: 'normal',
      name: 'كوشة عادية',
      price: 50,
    },
    {
      category: 'chairs',
      id: 'withRoses',
      name: 'كراسي مع ورود',
      price: 50,
    },
    {
      category: 'chairs',
      id: 'normal',
      name: 'كراسي عادية',
      price: 50,
    },
  ]

  const handleSelect = (category, id) => {
    setSelectedOptions({ ...selectedOptions, [category]: id })
  }

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      <StatusBar />

      {/* Header */}
      <div className="fixed top-[66px] left-1/2 transform -translate-x-1/2 w-full max-w-[390px] flex items-center justify-between px-5 bg-white z-10">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-800">خصص قاعتك</h1>
        <div className="w-8 h-8 opacity-0"></div>
      </div>

      {/* Main Content */}
      <div className="pt-[118px] pb-[100px] px-5 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <button
              key={`${option.category}-${option.id}`}
              onClick={() => handleSelect(option.category, option.id)}
              className={`border rounded-xl px-4 py-3 flex flex-col items-end gap-2 transition-colors ${
                selectedOptions[option.category] === option.id
                  ? 'bg-[#edecf8] border-[#2d2871]'
                  : 'border-[#f2f2f2]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedOptions[option.category] === option.id
                      ? 'border-[#2d2871]'
                      : 'border-gray-300'
                  }`}
                >
                  {selectedOptions[option.category] === option.id && (
                    <div className="w-3 h-3 bg-[#2d2871] rounded-full"></div>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-800 text-right">
                  {option.name}
                </span>
              </div>
              <span className="text-xs text-gray-600 text-right">
                +{option.price} $
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Action Button */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-[393px] bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5">
        <button
          onClick={() => navigate('/booking-confirmation')}
          className="w-full bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold"
        >
          التالي
        </button>
        <div className="h-[35px] flex items-center justify-center">
          <div className="w-[134px] h-1 bg-[#4e5868] rounded-full"></div>
        </div>
      </div>
    </div>
  )
}

export default CustomizeVenue




