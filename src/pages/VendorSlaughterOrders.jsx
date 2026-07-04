import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import axios from 'axios'
import { toast } from 'react-toastify'
import BackHeader from '../components/BackHeader'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8001'

const ORDER_STATUS_MAP = {
  PENDING:    { label: 'طلب جديد',    color: 'bg-amber-100 text-amber-700' },
  CONFIRMED:  { label: 'مؤكد',     color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'جار التحضير', color: 'bg-indigo-100 text-indigo-700' },
  DELIVERED:  { label: 'تم التسليم', color: 'bg-green-100 text-green-700' },
  CANCELLED:  { label: 'ملغي',     color: 'bg-red-100 text-red-700' },
}

export default function VendorSlaughterOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const token = () => localStorage.getItem('token')

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await axios.get(`${API}/api/mobile/vendor/slaughter/orders`, { 
        headers: { Authorization: `Bearer ${token()}` }
      })
      setOrders(data.orders || [])
    } catch { 
      toast.error('فشل تحميل طلبات الذبائح') 
    } finally { 
      setLoading(false) 
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.patch(`${API}/api/mobile/vendor/slaughter/orders/${id}/status`, { status: newStatus }, { 
        headers: { Authorization: `Bearer ${token()}` } 
      })
      toast.success('تم تحديث حالة الطلب')
      loadData()
    } catch { 
      toast.error('فشل تحديث الحالة') 
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      <BackHeader title="طلبات الذبائح 📦" />

      <div className="px-5 py-6 max-w-lg mx-auto space-y-6">
        
        <div>
          <h2 className="text-xl font-bold text-gray-800">الطلبات الواردة</h2>
          <p className="text-xs text-gray-500 mt-1">تحديث حالات الطلبات للتواصل مع العميل</p>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-400">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <span className="text-4xl">📦</span>
            <p className="text-gray-500 mt-2 text-sm">لا توجد طلبات حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const statusInfo = ORDER_STATUS_MAP[o.status] || { label: o.status, color: 'bg-gray-100 text-gray-700' }
              return (
                <motion.div 
                  key={o.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4"
                >
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-gray-50 pb-3">
                    <div>
                      <div className="text-xs text-indigo-600 font-bold mb-1">#{o.orderNumber}</div>
                      <h3 className="font-bold text-gray-800 text-sm">العميل: {o.customer?.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{o.customer?.phone}</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${statusInfo.color}`}>
                      {statusInfo.label}
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                    {o.items?.map(i => (
                      <div key={i.id} className="flex justify-between items-center text-sm">
                        <span className="font-bold text-gray-700">{i.product?.nameAr}</span>
                        <span className="text-gray-600 text-xs">× {i.quantity} ذبيحة</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-bold">الإجمالي للمورد</span>
                      <span className="font-black text-indigo-600">{o.items?.reduce((sum, i) => sum + (i.price * i.quantity), 0)} ر.س</span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="text-xs text-gray-600 space-y-1">
                    {o.booking && <p>🎯 <strong>مرتبط بحجز:</strong> {o.booking.venue?.nameAr} - {o.booking.bookingNumber}</p>}
                    <p>🚚 <strong>التوصيل:</strong> {o.deliveryType === 'venue' ? 'توصيل للقاعة' : 'توصيل خارجي'}</p>
                    {o.notes && <p className="bg-amber-50 text-amber-800 p-2 rounded mt-2">📝 <strong>ملاحظات العميل:</strong> {o.notes}</p>}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <label className="text-xs font-bold text-gray-700 block mb-2">تحديث حالة الطلب:</label>
                    <select 
                      value={o.status}
                      onChange={(e) => updateStatus(o.id, e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 transition-colors"
                    >
                      {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </div>

                </motion.div>
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}
