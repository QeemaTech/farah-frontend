import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiUsers, FiDollarSign, FiChevronRight, FiMapPin, FiPackage } from 'react-icons/fi'
import axios from 'axios'
import { toast } from 'react-toastify'
import BackHeader from '../components/BackHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function SlaughterCalculator() {
  const navigate = useNavigate()
  const location = useLocation()

  const bookingId = location.state?.bookingId || null

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(false)

  const [formData, setFormData] = useState({
    guestCount: '',
    categoryId: '',
    productId: '',
    budget: '',
    region: 'الرياض',
  })

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const { data } = await axios.get(`${API}/api/mobile/slaughter/categories`)
        setCategories(data.categories || [])
      } catch {
        toast.error('تعذر تحميل بيانات الذبائح')
      } finally {
        setLoading(false)
      }
    }
    fetchCats()
  }, [])

  useEffect(() => {
    if (!formData.categoryId) {
      setProducts([])
      setFormData((prev) => ({ ...prev, productId: '' }))
      return
    }

    const fetchProducts = async () => {
      try {
        setLoadingProducts(true)
        const { data } = await axios.get(`${API}/api/mobile/slaughter/products`, {
          params: { categoryId: formData.categoryId, limit: 200 },
        })
        setProducts(data.products || [])
      } catch {
        toast.error('تعذر تحميل المنتجات')
        setProducts([])
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [formData.categoryId])

  const filteredProducts = useMemo(
    () => products.filter((p) => p.categoryId === formData.categoryId),
    [products, formData.categoryId],
  )

  const handleCalculate = async () => {
    if (!formData.guestCount || formData.guestCount < 1) {
      return toast.error('الرجاء إدخال عدد الضيوف')
    }

    try {
      setLoading(true)
      const { data } = await axios.post(`${API}/api/mobile/slaughter/calculate`, {
        guestCount: parseInt(formData.guestCount, 10),
        categoryId: formData.categoryId || undefined,
        productId: formData.productId || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        region: formData.region,
      })

      if (!data.suggestions?.length) {
        toast.info('لا توجد ذبائح متاحة تناسب الخيارات الحالية')
        setLoading(false)
        return
      }

      navigate('/slaughter/result', {
        state: {
          result: data,
          bookingId,
          region: formData.region,
        },
      })
    } catch {
      toast.error('حدث خطأ أثناء الحساب')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <BackHeader title="حاسبة الذبائح 🐑" />

      <div className="px-5 py-6 space-y-8 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-200"
        >
          <h2 className="text-xl font-bold mb-2">أرح رأسك، ودعنا نحسبها لك!</h2>
          <p className="text-sm text-indigo-100 opacity-90 leading-relaxed">
            أدخل عدد ضيوفك، اختر الفئة والمنتج، وسنقوم بحساب الكمية المناسبة من الذبائح لضمان كرم الضيافة بأفضل التكاليف.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FiUsers className="text-indigo-500" /> عدد الضيوف الكلي <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              placeholder="مثال: 150"
              value={formData.guestCount}
              onChange={(e) => setFormData({ ...formData, guestCount: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-lg text-center"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FiDollarSign className="text-green-500" /> الميزانية المقترحة (اختياري)
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="أدخل الميزانية بالريال"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">ر.س</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FiMapPin className="text-rose-500" /> مدينة التوصيل
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none"
            >
              <option value="الرياض">الرياض</option>
              <option value="جدة">جدة</option>
              <option value="الدمام">الدمام</option>
              <option value="مكة">مكة المكرمة</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">نوع الذبيحة المفضل (اختياري)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div
                onClick={() => setFormData({ ...formData, categoryId: '', productId: '' })}
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2
                  ${formData.categoryId === '' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                <span className="text-sm font-bold">الكل</span>
                <span className="text-[10px] opacity-70">عرض كل الأنواع</span>
              </div>

              {categories.map((c) => (
                <div
                  key={c.id}
                  onClick={() => setFormData({ ...formData, categoryId: c.id, productId: '' })}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2
                    ${formData.categoryId === c.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                >
                  {c.image && <img src={`${API}${c.image}`} alt={c.nameAr} className="w-8 h-8 object-contain drop-shadow-sm" />}
                  <span className="text-xs font-bold leading-tight">{c.nameAr}</span>
                </div>
              ))}
            </div>
          </div>

          {formData.categoryId && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <FiPackage className="text-purple-500" /> المنتج (اختياري)
              </label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                disabled={loadingProducts}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              >
                <option value="">{loadingProducts ? 'جاري التحميل...' : 'كل منتجات الفئة'}</option>
                {filteredProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameAr || p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </motion.div>

        <div className="pt-4">
          <button
            onClick={handleCalculate}
            disabled={loading}
            className={`w-full bg-gray-900 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-gray-300 flex items-center justify-center gap-2 transition-all active:scale-[0.98]
              ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-black hover:shadow-2xl hover:shadow-gray-400'}`}
          >
            {loading ? (
              <span className="animate-pulse">جاري الحساب...</span>
            ) : (
              <>
                احسب الآن <FiChevronRight className="text-xl" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
