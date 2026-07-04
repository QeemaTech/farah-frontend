import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { providerAPI } from '../services/api';
import { toast } from 'react-toastify';

function ProviderDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await providerAPI.getDashboardStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('فشل تحميل الإحصائيات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-['Cairo:Medium',sans-serif]">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 overflow-y-auto relative rounded-[32px] w-full max-w-[390px] min-h-screen mx-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h1 className="font-['Cairo:Bold',sans-serif] text-[20px] text-[#121212]">
            لوحة التحكم
          </h1>
          <button
            onClick={() => navigate('/')}
            className="text-[#2d2871] font-['Cairo:Medium',sans-serif] text-[14px]"
          >
            الرئيسية
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="p-5 grid grid-cols-2 gap-4">
        {/* Total Venues */}
        <div className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🏢</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="font-['Cairo:Bold',sans-serif] text-[28px] text-gray-900">
            {stats?.venues || 0}
          </p>
          <p className="font-['Cairo:Regular',sans-serif] text-[12px] text-gray-500">
            القاعات
          </p>
        </div>

        {/* Total Services */}
        <div className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">🎨</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="font-['Cairo:Bold',sans-serif] text-[28px] text-gray-900">
            {stats?.services || 0}
          </p>
          <p className="font-['Cairo:Regular',sans-serif] text-[12px] text-gray-500">
            الخدمات
          </p>
        </div>

        {/* Total Bookings */}
        <div className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">📅</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
          <p className="font-['Cairo:Bold',sans-serif] text-[28px] text-gray-900">
            {stats?.bookings || 0}
          </p>
          <p className="font-['Cairo:Regular',sans-serif] text-[12px] text-gray-500">
            الحجوزات
          </p>
        </div>

        {/* Total Earnings */}
        <div className="bg-white p-4 rounded-[16px] shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">💰</span>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <p className="font-['Cairo:Bold',sans-serif] text-[28px] text-gray-900">
            {stats?.totalEarnings || 0}
          </p>
          <p className="font-['Cairo:Regular',sans-serif] text-[12px] text-gray-500">
            إجمالي الأرباح (ريال)
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-4">
        <h2 className="font-['Cairo:Bold',sans-serif] text-[18px] text-[#121212] mb-4">
          إجراءات سريعة
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => navigate('/provider/bookings')}
            className="w-full bg-white border border-gray-200 p-4 rounded-[12px] flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-xl">📋</span>
              </div>
              <span className="font-['Cairo:Medium',sans-serif] text-[16px] text-gray-700">
                إدارة الحجوزات
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/provider/earnings')}
            className="w-full bg-white border border-gray-200 p-4 rounded-[12px] flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-xl">💵</span>
              </div>
              <span className="font-['Cairo:Medium',sans-serif] text-[16px] text-gray-700">
                تقرير الأرباح
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/provider/venues')}
            className="w-full bg-white border border-gray-200 p-4 rounded-[12px] flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-xl">🏛️</span>
              </div>
              <span className="font-['Cairo:Medium',sans-serif] text-[16px] text-gray-700">
                إدارة القاعات
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/provider/services')}
            className="w-full bg-white border border-gray-200 p-4 rounded-[12px] flex items-center justify-between hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <span className="text-xl">⚙️</span>
              </div>
              <span className="font-['Cairo:Medium',sans-serif] text-[16px] text-gray-700">
                إدارة الخدمات
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* Slaughter Management Links */}
          <button
            onClick={() => navigate('/provider/slaughter/products')}
            className="w-full bg-white border border-indigo-200 p-4 rounded-[12px] flex items-center justify-between hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <span className="text-xl">🐑</span>
              </div>
              <span className="font-['Cairo:Medium',sans-serif] text-[16px] text-indigo-900">
                إدارة منتجات الذبائح
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            onClick={() => navigate('/provider/slaughter/orders')}
            className="w-full bg-white border border-indigo-200 p-4 rounded-[12px] flex items-center justify-between hover:border-indigo-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                <span className="text-xl">📦</span>
              </div>
              <span className="font-['Cairo:Medium',sans-serif] text-[16px] text-indigo-900">
                طلبات الذبائح
              </span>
            </div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="h-20"></div>
    </div>
  );
}

export default ProviderDashboard;
