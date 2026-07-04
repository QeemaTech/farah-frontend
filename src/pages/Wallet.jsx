import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function Wallet() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchWalletData()
    }
  }, [user])

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      // Fetch payments for wallet transactions
      const response = await axios.get(`${API_URL}/bookings`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 50 }
      })

      // Calculate balance from completed bookings
      const completedBookings = (response.data.bookings || []).filter(
        b => b.status === 'COMPLETED' && b.paymentStatus === 'PAID'
      )
      const totalBalance = completedBookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0)
      setBalance(totalBalance)

      // Map bookings to transactions
      const mappedTransactions = completedBookings.map((booking, index) => ({
        id: booking.id,
        type: 'credit',
        title: booking.venue?.nameAr || booking.venue?.name || 'حجز',
        date: new Date(booking.createdAt).toLocaleDateString('ar-EG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        location: booking.venue?.location || '',
        amount: booking.finalAmount || 0,
      }))
      setTransactions(mappedTransactions)
    } catch (error) {
      console.error('Error fetching wallet data:', error)
      // Use default data if API fails
      setTransactions([
        {
          id: 1,
          type: 'credit',
          title: 'خدمة تصوير',
          date: '10 أكتوبر 2024',
          location: 'مدينة نصر، القاهرة',
          amount: 80,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white min-h-screen max-w-[390px] mx-auto relative">
      <StatusBar />

      {/* Header */}
      <div className="fixed top-[66px] left-1/2 transform -translate-x-1/2 w-full max-w-[390px] flex items-center justify-between px-5 bg-white z-10">
        <div className="w-8 h-8 opacity-0"></div>
        <h1 className="text-lg font-bold text-gray-800">المحفظة</h1>
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="transform rotate-180"
          >
            <path
              d="M15 18L9 12L15 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <div className="pt-[118px] pb-[93px] px-5 flex flex-col gap-6">
        {/* Wallet Illustration & Balance */}
        <div className="flex items-center gap-4">
          {/* Wallet Illustration Placeholder */}
          <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg
              width="48"
              height="48"
              viewBox="0 0 48 48"
              fill="none"
            >
              <path
                d="M8 12H40C41.1046 12 42 12.8954 42 14V38C42 39.1046 41.1046 40 40 40H8C6.89543 40 6 39.1046 6 38V14C6 12.8954 6.89543 12 8 12Z"
                stroke="#2d2871"
                strokeWidth="2"
              />
              <path
                d="M6 18H42"
                stroke="#2d2871"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* Balance */}
          <div className="flex-1">
            <p className="text-sm text-gray-600 text-right mb-1">رصيدك</p>
            <p className="text-3xl font-bold text-gray-800 text-right">
              {loading ? '...' : balance.toFixed(2)} <span className="text-lg">ر.س</span>
            </p>
          </div>
        </div>

        {/* Withdraw Button */}
        <button className="w-full bg-[#2d2871] text-white rounded-xl px-4 py-3 flex items-center justify-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M4 4H16V16C16 16.5523 15.5523 17 15 17H5C4.44772 17 4 16.5523 4 16V4Z"
              stroke="white"
              strokeWidth="1.5"
            />
            <path
              d="M8 8L10 6L12 8M10 6V14"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="text-base font-bold">سحب الرصيد</span>
        </button>

        {/* Transaction Log */}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-bold text-gray-800 text-right">
            سجل المعاملات
          </h3>

          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="text-center py-10">جاري التحميل...</div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">لا توجد معاملات</div>
            ) : (
              transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-white border border-[#f2f2f2] rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.type === 'credit'
                        ? 'bg-green-100'
                        : 'bg-red-100'
                    }`}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                    >
                      <circle
                        cx="10"
                        cy="10"
                        r="8"
                        stroke={transaction.type === 'credit' ? '#10b981' : '#ef4444'}
                        strokeWidth="1.5"
                      />
                      <path
                        d="M10 6V14M6 10H14"
                        stroke={transaction.type === 'credit' ? '#10b981' : '#ef4444'}
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div className="flex flex-col items-end">
                    <p className="text-sm font-medium text-gray-800 text-right">
                      {transaction.title}
                      {transaction.date && ` • ${transaction.date}`}
                    </p>
                    {transaction.location && (
                      <p className="text-xs text-gray-500 text-right">
                        {transaction.location}
                      </p>
                    )}
                  </div>
                </div>
                <p
                  className={`text-base font-bold ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.amount > 0 ? '+' : ''}
                  {transaction.amount.toFixed(2)} ر.س
                </p>
              </div>
            ))
            )}
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}

export default Wallet




