import { useState } from 'react'
import Drawer from './Drawer'

function CustomizeVenueDrawer({ isOpen, onClose, onNext, customization, onCustomizationChange }) {
  const [selected, setSelected] = useState(customization || {
    tables: 'with',
    kusha: 'withRoses',
    chairs: 'standard'
  })

  const options = [
    {
      category: 'tables',
      label: 'طاولات',
      items: [
        { id: 'without', name: 'بدون طاولات', price: 50 },
        { id: 'with', name: 'بطاولات', price: 50 },
      ]
    },
    {
      category: 'kusha',
      label: 'كوشة',
      items: [
        { id: 'withRoses', name: 'كوشة مع ورود', price: 50 },
        { id: 'standard', name: 'كوشة عادية', price: 50 },
      ]
    },
    {
      category: 'chairs',
      label: 'كراسي',
      items: [
        { id: 'withRoses', name: 'كراسي مع ورود', price: 50 },
        { id: 'standard', name: 'كراسي عادية', price: 50 },
      ]
    },
  ]

  const handleSelect = (category, id) => {
    const newSelected = { ...selected, [category]: id }
    setSelected(newSelected)
    if (onCustomizationChange) {
      onCustomizationChange(newSelected)
    }
  }

  const handleNext = () => {
    if (onNext) {
      onNext(selected)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="خصص قاعتك">
      <div className="flex flex-col gap-4 pb-20">
        {options.map((option) => (
          <div key={option.category} className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3">
              {option.items.map((item) => {
                const isSelected = selected[option.category] === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(option.category, item.id)}
                    className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors ${
                      isSelected
                        ? 'bg-[#edecf8] border-[#2d2871]'
                        : 'border-[#f2f2f2] bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800 text-right">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">
                        +{item.price} $
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-[#2d2871]'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <div className="w-3 h-3 bg-[#2d2871] rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
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

export default CustomizeVenueDrawer

