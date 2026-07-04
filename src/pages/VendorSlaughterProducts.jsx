import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiPlus, FiEdit2, FiTrash2, FiAlertCircle, FiCheckCircle } from 'react-icons/fi'
import axios from 'axios'
import { toast } from 'react-toastify'
import BackHeader from '../components/BackHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

export default function VendorSlaughterProducts() {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  
  const [formData, setFormData] = useState({
    categoryId: '', name: '', nameAr: '', description: '', descriptionAr: '',
    weightKg: '', servesMin: '', servesMax: '', price: '', region: '', isActive: true
  })
  const [imageFile, setImageFile] = useState(null)

  const token = () => localStorage.getItem('token')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      // Use the mobile vendor endpoint which only fetches this vendor's products
      const p1 = axios.get(`${API}/api/mobile/slaughter/categories`)
      const p2 = axios.get(`${API}/api/mobile/vendor/slaughter/products`, { 
        headers: { Authorization: `Bearer ${token()}` }
      })
      const [resCat, resProd] = await Promise.all([p1, p2])
      
      setCategories(resCat.data.categories || [])
      setProducts(resProd.data.products || [])
    } catch { 
      toast.error('فشل تحميل منتجات الذبائح') 
    } finally { 
      setLoading(false) 
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openModal = (p = null) => {
    setEditing(p)
    if (p) {
      setFormData({
        categoryId: p.categoryId, name: p.name, nameAr: p.nameAr, 
        description: p.description || '', descriptionAr: p.descriptionAr || '',
        weightKg: p.weightKg, servesMin: p.servesMin, servesMax: p.servesMax, 
        price: p.price, region: p.region || '', isActive: p.isActive
      })
    } else {
      setFormData({
        categoryId: categories[0]?.id || '', name: '', nameAr: '', description: '', descriptionAr: '',
        weightKg: '', servesMin: '', servesMax: '', price: '', region: '', isActive: true
      })
    }
    setImageFile(null)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
      if (imageFile) fd.append('image', imageFile)

      if (editing) {
        await axios.patch(`${API}/api/mobile/vendor/slaughter/products/${editing.id}`, fd, { 
          headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'multipart/form-data' }
        })
        toast.success('تم التعديل بنجاح')
      } else {
        await axios.post(`${API}/api/mobile/vendor/slaughter/products`, fd, { 
          headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'multipart/form-data' }
        })
        toast.success('تم إضافة المنتج بنجاح (بانتظار موافقة الإدارة)')
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ أثناء الحفظ')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    try {
      await axios.delete(`${API}/api/mobile/vendor/slaughter/products/${id}`, { 
        headers: { Authorization: `Bearer ${token()}` } 
      })
      toast.success('تم الحذف بنجاح')
      loadData()
    } catch { 
      toast.error('فشل الحذف') 
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <BackHeader title="منتجات الذبائح 🐑" />

      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">
        
        {/* Header with Add button */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">منتجاتك</h2>
            <p className="text-xs text-gray-500 mt-1">أضف ذبائح لعملاء تطبيق فرح</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-indigo-200"
          >
            <FiPlus /> إضافة جديد
          </button>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-4xl">🐑</span>
            <p className="text-gray-500 mt-2 text-sm">لا توجد منتجات لديك بعد</p>
            <p className="text-gray-400 text-xs">أضف منتجك الأول لتبدأ باستقبال الطلبات</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map(p => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3"
              >
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-50 rounded-xl flex items-center justify-center p-1 border border-gray-100 shrink-0">
                    {p.image ? <img src={`${API}${p.image}`} className="w-full h-full object-contain" /> : '🐑'}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-gray-800 text-sm">{p.nameAr}</h3>
                      <div className="flex gap-1">
                        <button onClick={() => openModal(p)} className="p-1.5 text-blue-500 bg-blue-50 rounded-md hover:bg-blue-100"><FiEdit2 size={12} /></button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-500 bg-red-50 rounded-md hover:bg-red-100"><FiTrash2 size={12} /></button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{p.category?.nameAr} • {p.weightKg} كجم</p>
                    <p className="text-indigo-600 font-black mt-1">{p.price} <span className="text-[10px] text-gray-400">ر.س</span></p>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-50">
                  {p.isApproved ? (
                    <span className="text-[10px] bg-green-50 text-green-600 px-2 py-1 rounded flex items-center gap-1"><FiCheckCircle/> معتمد ونشط</span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-1 rounded flex items-center gap-1"><FiAlertCircle/> بانتظار الاعتماد</span>
                  )}
                  {!p.isActive && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-1 rounded">مخفي مؤقتاً</span>}
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-bold text-lg">{editing ? 'تعديل المنتج' : 'إضافة ذبيحة جديدة'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-700 font-bold text-xl">&times;</button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">التصنيف <span className="text-red-500">*</span></label>
                  <select required value={formData.categoryId} onChange={e => setFormData({...formData, categoryId: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none">
                    <option value="">اختر التصنيف</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nameAr}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">الاسم (عربي) <span className="text-red-500">*</span></label>
                    <input required value={formData.nameAr} onChange={e => setFormData({...formData, nameAr: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" placeholder="مثال: نعيمي بلدي" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">الاسم (إنجليزي) <span className="text-red-500">*</span></label>
                    <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" placeholder="Naeemi Baladi" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">السعر (ر.س) <span className="text-red-500">*</span></label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">الوزن التقريبي (كجم) <span className="text-red-500">*</span></label>
                    <input type="number" step="0.1" required value={formData.weightKg} onChange={e => setFormData({...formData, weightKg: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">أقل عدد ضيوف يكفي <span className="text-red-500">*</span></label>
                    <input type="number" required value={formData.servesMin} onChange={e => setFormData({...formData, servesMin: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 mb-1 block">أقصى عدد ضيوف يكفي <span className="text-red-500">*</span></label>
                    <input type="number" required value={formData.servesMax} onChange={e => setFormData({...formData, servesMax: e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 mb-1 block">صورة المنتج</label>
                  <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>

                <label className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <input type="checkbox" checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})} className="w-4 h-4 text-indigo-600 rounded" />
                  المنتج متاح للبيع الآن
                </label>
                
                <div className="text-[10px] text-gray-500 leading-relaxed">
                  ملاحظة: المنتجات الجديدة تخضع للمراجعة والاعتماد من قبل إدارة التطبيق قبل ظهورها للعملاء.
                </div>
              </form>
            </div>
            
            <div className="p-5 border-t border-gray-100 flex gap-3 bg-gray-50">
              <button form="productForm" type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors">
                حفظ المنتج
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition-colors hover:bg-gray-50">
                إلغاء
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
