import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import StatusBar from '../components/StatusBar'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api'

function AdminUsers() {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [search])

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        params: { search, limit: 50 }
      })
      setUsers(response.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      <StatusBar />

      {/* Header */}
      <div className="absolute content-stretch flex items-center justify-between left-[20px] top-[66px] w-[350px] z-20">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center justify-center relative shrink-0 size-[32px] bg-white rounded-full shadow-sm"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="rotate-180">
            <path
              d="M15 18L9 12L15 6"
              stroke="#121212"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[24px] relative shrink-0 text-[#121212] text-[18px] text-center flex-1" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
          إدارة المستخدمين
        </p>
        <div className="w-[32px]"></div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[16px] items-center relative shrink-0 w-[350px] left-[20px] top-[132px] overflow-y-auto pb-[100px]">
        
        {/* Search Bar */}
        <div className="content-stretch flex gap-[8px] items-center relative shrink-0 w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في المستخدمين..."
            className="bg-white border border-[#e6e6e6] border-solid content-stretch flex flex-[1_0_0] h-[44px] items-center min-h-px min-w-px px-[16px] py-[12px] relative rounded-[12px] shrink-0 outline-none text-right"
            dir="rtl"
          />
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-10 w-full">جاري التحميل...</div>
        ) : (
          <div className="content-stretch flex flex-col gap-[12px] items-stretch relative shrink-0 w-full">
            {users.map((user) => (
              <div
                key={user.id}
                className="bg-white border border-[#f2f2f2] border-solid content-stretch flex flex-col gap-[12px] items-start p-[16px] relative rounded-[16px] shrink-0 w-full"
              >
                <div className="content-stretch flex items-center justify-between relative shrink-0 w-full">
                  <div className="content-stretch flex flex-col gap-[4px] items-end relative shrink-0">
                    <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] leading-[normal] relative shrink-0 text-[#121212] text-[16px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                      {user.name}
                    </p>
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                      {user.phone}
                    </p>
                    {user.email && (
                      <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                        {user.email}
                      </p>
                    )}
                  </div>
                  <div className={`px-[12px] py-[4px] rounded-[12px] ${
                    user.role === 'ADMIN' ? 'bg-[#2d2871]' :
                    user.role === 'PROVIDER' ? 'bg-[#EF92AB]' :
                    'bg-[#f2f2f2]'
                  }`}>
                    <p className={`font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[12px] ${
                      user.role === 'ADMIN' || user.role === 'PROVIDER' ? 'text-white' : 'text-[#666]'
                    }`} style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                      {user.role === 'ADMIN' ? 'مدير' :
                       user.role === 'PROVIDER' ? 'مزود' :
                       'عميل'}
                    </p>
                  </div>
                </div>
                {user.location && (
                  <div className="content-stretch flex gap-[4px] items-center justify-end relative shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M8 1C5.24 1 3 3.24 3 6C3 10.5 8 15 8 15C8 15 13 10.5 13 6C13 3.24 10.76 1 8 1Z"
                        stroke="#666"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] leading-[normal] relative shrink-0 text-[#666] text-[12px] text-right" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                      {user.location}
                    </p>
                  </div>
                )}
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-10 text-[#666]">لا توجد نتائج</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminUsers




