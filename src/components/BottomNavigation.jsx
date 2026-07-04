import { useNavigate, useLocation } from 'react-router-dom'

function BottomNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const currentPath = location.pathname

  const isActive = (path) => {
    if (path === '/') {
      return currentPath === '/'
    }
    return currentPath.startsWith(path)
  }

  const navItems = [
    {
      path: '/',
      label: 'الرئيسية',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M9.02 2.84L3.63 7.04C2.73 7.74 2 9.23 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.77V10.5C22 9.28 21.19 7.74 20.2 7.05L14.02 2.72C12.62 1.74 10.37 1.79 9.02 2.84Z"
            fill={isActive('/') ? '#2D2871' : 'none'}
            stroke={isActive('/') ? 'none' : '#121212'}
            strokeWidth="2"
          />
          {isActive('/') && (
            <path
              d="M12 17.99V14.99"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
      ),
    },
    {
      path: '/services',
      label: 'الخدمات',
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="transform rotate-180"
        >
          <path
            d="M4 6H20M4 12H20M4 18H20"
            stroke={isActive('/services') ? '#2D2871' : '#121212'}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
    {
      path: '/booking',
      label: 'الحجوزات',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1 4 21 4.9 21 6V20C21 21.1 20.1 22 19 22H5C3.9 22 3 21.1 3 20V6C3 4.9 3.9 4 5 4Z"
            fill={isActive('/booking') ? '#2D2871' : 'none'}
            stroke={isActive('/booking') ? 'none' : '#121212'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      path: '/profile',
      label: 'حسابي',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
            stroke={isActive('/profile') ? '#2D2871' : '#121212'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
            stroke={isActive('/profile') ? '#2D2871' : '#121212'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="fixed bg-white bottom-0 content-stretch flex flex-col items-center left-1/2 -translate-x-1/2 max-w-[393px] w-full z-[1000] md:hidden">
      <div className="bg-white content-stretch flex items-center justify-center pb-[6px] pt-[12px] px-[16px] relative rounded-tl-[16px] rounded-tr-[16px] shadow-[0px_48px_100px_0px_rgba(17,12,46,0.15)] shrink-0 w-full">
        <div className="content-stretch flex items-center justify-center gap-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="content-stretch cursor-pointer flex flex-[1_0_0] flex-col items-center min-h-px min-w-px p-0 relative shrink-0"
            >
              {isActive(item.path) ? (
                <div className="bg-[#edecf8] content-stretch flex gap-[6px] items-center px-[12px] py-[8px] relative rounded-[100px] shrink-0">
                  <p className="font-['Poppins:Medium','Noto_Sans_Arabic:Regular',sans-serif] leading-[16px] relative shrink-0 text-[#2d2871] text-[12px]" style={{ fontVariationSettings: "'wdth' 100, 'wght' 400" }}>
                    {item.label}
                  </p>
                  <div className="relative shrink-0 size-[24px]">{item.icon}</div>
                </div>
              ) : (
                <div className="content-stretch flex items-start px-[12px] py-[8px] relative rounded-[100px] shrink-0">
                  <div className="relative shrink-0 size-[24px]">{item.icon}</div>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white h-[35px] relative shrink-0 w-full">
        <div className="absolute bg-[#4e5868] inset-[55.88%_32%_29.41%_32.27%] rounded-[2.5px]"></div>
      </div>
    </div>
  )
}

export default BottomNavigation
