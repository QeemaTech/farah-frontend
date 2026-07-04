import React from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiChevronRight, FiCheckCircle, FiAward, FiTrendingDown, FiStar, FiShoppingCart } from 'react-icons/fi'
import BackHeader from '../components/BackHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

const fmt = (n) => Number(n || 0).toLocaleString('ar-SA')

const VatLines = ({ item }) => {
  if (item?.subtotalExVat == null) return null
  return (
    <div className="mt-2 space-y-0.5 text-xs text-gray-500 border-t border-gray-200 pt-2">
      <p>السعر (بدون ضريبة): <span className="font-semibold text-gray-700">{fmt(item.subtotalExVat)} ر.س</span></p>
      <p>ضريبة ({item.vatRate}%): <span className="font-semibold text-gray-700">{fmt(item.vatAmount)} ر.س</span></p>
      <p>الإجمالي شامل الضريبة: <span className="font-bold text-indigo-600">{fmt(item.totalInclVat)} ر.س</span></p>
    </div>
  )
}

const SuggestionCard = ({ item, title, icon: Icon, badgeColor, onSelect }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 relative overflow-hidden"
  >
    <div className={`absolute top-0 right-0 w-2 h-full ${badgeColor}`}></div>
    
    <div className="flex justify-between items-start mb-4">
      <div className="flex items-center gap-2">
        <div className={`p-2 rounded-xl ${badgeColor.replace('bg-', 'bg-opacity-10 text-').replace('-500', '-600')}`}>
          <Icon className="text-lg" />
        </div>
        <h3 className="font-bold text-gray-800 text-lg">{title}</h3>
      </div>
      {item.withinBudget && (
        <span className="bg-green-50 text-green-600 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
          <FiCheckCircle /> ضمن الميزانية
        </span>
      )}
    </div>

    <div className="flex gap-4 mb-5">
      <div className="w-20 h-20 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center p-2 shrink-0">
        {item.product.image ? (
          <img src={`${API}${item.product.image}`} alt={item.product.nameAr} className="w-full h-full object-contain drop-shadow-md" />
        ) : (
          <span className="text-3xl">🐑</span>
        )}
      </div>
      <div>
        <h4 className="font-bold text-gray-900 leading-tight mb-1">{item.product.nameAr}</h4>
        <div className="text-xs text-gray-500 mb-2 flex items-center gap-1">
          <span>{item.product.category?.nameAr}</span> • <span>المورد: {item.product.vendor?.name || 'فرح'}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-700">الوزن: {item.product.weightKg} كجم</div>
          <div className="bg-indigo-50 px-2 py-1 rounded text-xs font-semibold text-indigo-700">يكفي لـ {Math.floor((item.product.servesMin + item.product.servesMax)/2)} شخص</div>
        </div>
      </div>
    </div>

    <div className="bg-gray-50 rounded-2xl p-4 flex justify-between items-center mb-4">
      <div>
        <div className="text-xs text-gray-500 font-medium mb-1">الكمية المطلوبة</div>
        <div className="font-black text-xl text-indigo-600">{item.quantity} <span className="text-sm font-medium text-gray-500">ذبائح</span></div>
      </div>
      <div className="w-px h-10 bg-gray-200"></div>
      <div className="text-left">
        <div className="text-xs text-gray-500 font-medium mb-1">الإجمالي التقديري</div>
        <div className="font-black text-xl text-gray-900">{fmt(item.totalInclVat ?? item.totalPrice)} <span className="text-sm font-medium text-gray-500">ر.س</span></div>
        <VatLines item={item} />
      </div>
    </div>

    <button 
      onClick={() => onSelect(item)}
      className="w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
    >
      <FiShoppingCart /> متابعة الطلب بهذه التوصية
    </button>
  </motion.div>
)

export default function SlaughterResult() {
  const navigate = useNavigate()
  const location = useLocation()
  
  if (!location.state?.result) {
    return <Navigate to="/slaughter" replace />
  }

  const { result, bookingId, region } = location.state
  const { guestCount, budget, bestValue, premium, suggestions } = result

  const handleSelect = (item) => {
    navigate('/slaughter/order', {
      state: {
        orderData: {
          item,
          guestCount,
          bookingId,
          region
        }
      }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <BackHeader title="نتائج الحاسبة 📊" />

      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">
        
        {/* Summary Header */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex items-center justify-between"
        >
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">عدد الضيوف</p>
            <p className="text-2xl font-black text-indigo-600">{guestCount} <span className="text-sm text-gray-600 font-bold">شخص</span></p>
          </div>
          {budget && (
            <div className="text-left border-r border-gray-100 pr-5">
              <p className="text-xs text-gray-500 font-medium mb-1">الميزانية المقترحة</p>
              <p className="text-xl font-bold text-gray-800">{budget} <span className="text-xs text-gray-500">ر.س</span></p>
            </div>
          )}
        </motion.div>

        {/* Top Suggestions */}
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <FiAward className="text-amber-500" /> أبرز التوصيات المخصصة لك
          </h2>

          {bestValue && (
            <SuggestionCard 
              item={bestValue} 
              title="الخيار الأوفر" 
              icon={FiTrendingDown} 
              badgeColor="bg-green-500"
              onSelect={handleSelect}
            />
          )}

          {premium && premium.product.id !== bestValue?.product.id && (
            <SuggestionCard 
              item={premium} 
              title="الخيار الفاخر (أوزان كبيرة)" 
              icon={FiStar} 
              badgeColor="bg-amber-500"
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* All Other Options */}
        {suggestions.length > 2 && (
          <div className="pt-6 space-y-4">
            <h2 className="font-bold text-gray-800">خيارات أخرى متاحة ({suggestions.length})</h2>
            <div className="space-y-4">
              {suggestions.map((item, idx) => {
                if (item.product.id === bestValue?.product.id || item.product.id === premium?.product.id) return null;
                return (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-4 cursor-pointer hover:border-indigo-200 transition-colors"
                    onClick={() => handleSelect(item)}
                  >
                    <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center p-1 shrink-0">
                      {item.product.image ? <img src={`${API}${item.product.image}`} className="w-full h-full object-contain" /> : '🐑'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{item.product.nameAr}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">
                        الكمية: {item.quantity} • التكلفة: {fmt(item.totalInclVat ?? item.totalPrice)} ر.س
                        {item.vatAmount ? ` (شامل ضريبة ${item.vatRate}%)` : ''}
                      </p>
                    </div>
                    <FiChevronRight className="text-gray-400 shrink-0" />
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
