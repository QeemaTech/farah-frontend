import { useState } from 'react'
import Drawer from './Drawer'

function AdditionsDrawer({ isOpen, onClose, onContinue, onSkip, selectedAdditions = [], onAdditionsChange }) {
  const [selected, setSelected] = useState(selectedAdditions || [])

  const additions = [
    {
      id: 'buffet',
      name: 'البوفيه',
      price: 50,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6V20C3 20.5304 3.21071 21.0391 3.58579 21.4142C3.96086 21.7893 4.46957 22 5 22H19C19.5304 22 20.0391 21.7893 20.4142 21.4142C20.7893 21.0391 21 20.5304 21 20V6L18 2H6Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M3 6H21" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8 10H16M8 14H16M8 18H16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'photographers',
      name: 'مصورين',
      price: 50,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 4H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      id: 'beautyExpert',
      name: 'خبيرة تجميل',
      price: 50,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 8V16M8 12H16" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  const toggleAddition = (id) => {
    const newSelected = selected.includes(id)
      ? selected.filter(item => item !== id)
      : [...selected, id]
    setSelected(newSelected)
    if (onAdditionsChange) {
      onAdditionsChange(newSelected)
    }
  }

  const handleContinue = () => {
    if (onContinue) {
      onContinue(selected)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="إضافات">
      <div className="flex flex-col gap-4 pb-20">
        <p className="text-sm text-gray-600 text-center">
          هل تريد إضافة خدمات أخري مع القاعة؟
        </p>

        {additions.map((addition) => {
          const isSelected = selected.includes(addition.id)
          return (
            <button
              key={addition.id}
              onClick={() => toggleAddition(addition.id)}
              className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
                isSelected
                  ? 'bg-[#edecf8] border-[#2d2871]'
                  : 'border-[#f2f2f2] bg-white'
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`text-[#2d2871] ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                  {addition.icon}
                </div>
                <span className="text-sm font-medium text-gray-800 text-right flex-1">
                  {addition.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  +{addition.price} $
                </span>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isSelected
                      ? 'border-[#2d2871] bg-[#2d2871]'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {isSelected && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M10 3L4.5 8.5L2 6"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom Buttons */}
      <div className="sticky bottom-0 bg-white rounded-t-2xl shadow-2xl pt-2.5 pb-8 px-5 border-t border-gray-100 mt-4">
        <div className="flex gap-3">
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-100 text-gray-800 rounded-[38px] py-3.5 text-base font-medium hover:bg-gray-200 transition-colors"
          >
            تخطی
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 bg-[#2d2871] text-white rounded-[38px] py-3.5 text-base font-bold hover:bg-[#1f1a5a] transition-colors"
          >
            إستمرار
          </button>
        </div>
      </div>
    </Drawer>
  )
}

export default AdditionsDrawer

