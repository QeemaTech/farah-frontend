import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import StatusBar from '../components/StatusBar'
import BottomNavigation from '../components/BottomNavigation'
import MainHeader from '../components/MainHeader'

function Profile() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const menuItems = [
    ...(user?.role === 'ADMIN' ? [{
      id: 0,
      title: 'لوحة التحكم',
      subtitle: 'إدارة النظام والبيانات.',
      action: () => window.location.href = '/admin/login',
    }] : []),
    {
      id: 1,
      title: 'تعديل الملف الشخصي',
      subtitle: 'حدّث معلومات شركتك.',
      action: () => navigate('/user-profile'),
    },
    {
      id: 2,
      title: 'القسائم',
      subtitle: 'اطّلع على قسائم الشراء الخاصة بك.',
      action: () => navigate('/profile/coupons'),
    },
    {
      id: 3,
      title: 'الإشعارات',
      subtitle: 'اطّلع على آخر التحديثات المهمة.',
      action: () => navigate('/profile/notifications'),
    },
    {
      id: 4,
      title: 'اللغه',
      subtitle: 'اختر اللغة التي تفضل استخدامها في التطبيق.',
      action: () => navigate('/profile/language'),
    },
    {
      id: 5,
      title: 'الدعم',
      subtitle: 'تواصل معنا وسنساعدك فورًا.',
      action: () => navigate('/support'),
    },
    {
      id: 6,
      title: 'مشاركة التطبيق',
      subtitle: 'شارك رابط التطبيق مع زملائك أو عملائك بسهولة.',
      action: () => {
        // Share app functionality will be handled by ShareApp component
        if (navigator.share) {
          navigator.share({
            title: 'فرح',
            text: 'جرب هذا التطبيق الرائع!',
            url: window.location.origin,
          })
        }
      },
    },
    {
      id: 7,
      title: 'الشروط و الاحكام',
      subtitle: 'راجع سياسات استخدام المنصة.',
      action: () => navigate('/terms'),
    },
    {
      id: 8,
      title: 'سياسة الخصوصية',
      subtitle: 'راجع سياسة الخصوصية الخاصة بنا.',
      action: () => navigate('/privacy'),
    },
  ]

  return (


    <>
    
    <div className="bg-white overflow-y-auto overflow-x-hidden relative rounded-[32px] w-full h-full max-w-[390px] min-h-screen mx-auto">
      {/* <StatusBar /> */}

      {/* Main Header */}
      <MainHeader onAvatarClick={() => navigate('/user-profile')} />

      {/* Decorative Background */}
      <div className="absolute contents left-[-249px] top-[-335px] pointer-events-none">
        <div className="absolute flex h-[342.961px] items-center justify-center left-[-176.77px] top-[-43.71px] w-[1314.758px] opacity-10">
          <div className="h-[342.961px] relative w-[1314.758px] bg-gradient-to-r from-[#EF92AB] to-transparent rounded-full"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute content-stretch flex flex-col gap-[12px] items-start left-[20px]  top-[90px] w-[350px] overflow-y-auto ">
        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
          <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full">
            {menuItems.map((item, index) => (
              <div key={item.id}>
                <button
                  onClick={item.action}
                  className="content-stretch flex gap-[8px] items-center justify-end relative shrink-0 w-full"
                >
                  <div className="overflow-clip relative shrink-0 size-[20px]">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="transform rotate-180">
                      <path
                        d="M7.5 15L12.5 10L7.5 5"
                        stroke="#121212"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="content-stretch flex flex-[1_0_0] flex-col gap-[4px] items-start leading-[18px] min-h-px min-w-px relative shrink-0 text-[12px] text-right whitespace-pre-wrap">
                    <p className="font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] relative shrink-0 text-[#121212] w-full" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
                      {item.title}
                    </p>
                    <p className="font-['Poppins:Regular','Noto_Sans_Arabic:Regular',sans-serif] relative shrink-0 text-[#666] w-full" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                      {item.subtitle}
                    </p>
                  </div>
                  <div className="bg-white content-stretch flex items-center justify-center relative rounded-[30px] shrink-0 size-[34px]">
                    <div className="relative shrink-0 size-[20px] bg-gray-200 rounded"></div>
                  </div>
                </button>
                {index < menuItems.length - 1 && (
                  <div className="flex h-px items-center justify-center relative shrink-0 w-[350px]">
                    <div className="flex-none rotate-[270deg]">
                      <div className="bg-[#edecf8] h-[350px] w-px"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

                {/* Action Buttons */}
                <div className="content-stretch flex flex-row  justify-center mt-4 gap-[10px] items-start relative shrink-0 w-[350px]">
                  <button
                    onClick={() => {
                      logout()
                      navigate('/splash')
                    }}
                    className="bg-[#f2f2f2] content-stretch flex gap-[10px] h-[46px] items-center justify-center px-[20px] py-[12px] relative rounded-[16px] shadow-[0px_1px_5px_0px_rgba(0,0,0,0.05)] shrink-0 w-[40%]"
                  >
            <div className="flex flex-col font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-[#121212] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              <p className="leading-[22px]">تسجيل خروج</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5M13.3333 13.3333L17.5 10M17.5 10L13.3333 6.66667M17.5 10H7.5"
                stroke="#121212"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button className="bg-[#feeef1] border-[#f2f2f2] border-[0.5px] border-solid content-stretch flex gap-[10px] h-[46px] items-center justify-center px-[20px] py-[12px] relative rounded-[16px] shadow-[0px_1px_5px_0px_rgba(0,0,0,0.05)] shrink-0 w-[40%]">
            <div className="flex flex-col font-['Poppins:Bold','Noto_Sans_Arabic:Bold',sans-serif] justify-center leading-[0] relative shrink-0 text-[#c83636] text-[14px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100, 'wght' 700" }}>
              <p className="leading-[22px]">حذف حساب</p>
            </div>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M15 5V16.6667C15 17.1087 14.8244 17.5326 14.5118 17.8452C14.1993 18.1577 13.7754 18.3333 13.3333 18.3333H6.66667C6.22464 18.3333 5.80072 18.1577 5.48816 17.8452C5.17559 17.5326 5 17.1087 5 16.6667V5M7.5 5V3.33333C7.5 2.89131 7.67559 2.46738 7.98816 2.15482C8.30072 1.84226 8.72464 1.66667 9.16667 1.66667H10.8333C11.2754 1.66667 11.6993 1.84226 12.0118 2.15482C12.3244 2.46738 12.5 2.89131 12.5 3.33333V5M12.5 9.16667V14.1667M7.5 9.16667V14.1667"
                stroke="#c83636"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
    
    
    </>

  )
}

export default Profile
