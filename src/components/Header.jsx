function Header() {
  return (
    <div className="absolute top-[62px] left-0 right-0 px-5 flex items-center justify-between" dir="ltr">


              {/* User Info */}
      <div className="flex items-center gap-2.5">
        <div className="flex flex-col items-end gap-1.25">
          <p className="text-base font-bold text-gray-700 text-right">
            مروة السوداني
          </p>
          <div className="flex items-center gap-1.25">
            <p className="text-xs text-gray-400 text-right">
              مدينة نصر، القاهرة
            </p>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1C5.24 1 3 3.24 3 6C3 10.5 8 15 8 15C8 15 13 10.5 13 6C13 3.24 10.76 1 8 1Z"
                stroke="#4D4D4D"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 8.5C8.83 8.5 9.5 7.83 9.5 7C9.5 6.17 8.83 5.5 8 5.5C7.17 5.5 6.5 6.17 6.5 7C6.5 7.83 7.17 8.5 8 8.5Z"
                stroke="#4D4D4D"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {/* Avatar */}
        <div className="w-[50px] h-[50px] rounded-full shadow-md bg-gradient-to-br from-pink-200 to-pink-500 overflow-hidden">
          <div className="w-full h-full bg-pink-300"></div>
        </div>
      </div>
      {/* Notification Icon */}
      <div className="bg-white p-2.5 rounded-xl shadow-lg w-8 h-8 flex items-center justify-center">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8.13 2 5 5.13 5 9C5 14.25 2 16 2 16H22C22 16 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
            stroke="#121212"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 21C9 22.1 9.9 23 11 23H13C14.1 23 15 22.1 15 21"
            stroke="#121212"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>


    </div>
  )
}

export default Header

