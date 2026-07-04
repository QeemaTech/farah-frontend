import { useNavigate } from 'react-router-dom'

function ServiceCategories({ categories, loading }) {
  const navigate = useNavigate()
  // Default categories if API doesn't return data
  const defaultCategories = [
    {
      id: '1',
      nameAr: 'تقديم طعام',
      name: 'Food Catering',
      serviceCount: 245,
      icon: '🍽️',
    },
    {
      id: '2',
      nameAr: 'مصورين',
      name: 'Photographers',
      serviceCount: 245,
      icon: '📷',
    },
    {
      id: '3',
      nameAr: 'قاعات',
      name: 'Venues',
      serviceCount: 1000,
      icon: '🏛️',
    },
  ]

  const displayCategories = categories.length > 0 ? categories : defaultCategories

  if (loading) {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white h-20 rounded-[10px] shadow-sm animate-pulse"
            />
          ))}
        </div>
        <div className="flex gap-2.5">
          <div className="bg-white h-20 w-[110px] rounded-[10px] shadow-sm animate-pulse" />
          <div className="bg-white h-20 flex-1 rounded-[10px] shadow-sm animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      {/* First Row */}
      <div className="grid grid-cols-2 gap-2.5">
        {displayCategories.slice(0, 2).map((category) => (
          <div
            key={category.id}
            onClick={() => navigate(`/venues?category=${category.id}`)}
            className="bg-white h-20 rounded-[10px] shadow-sm p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-[47px] h-[70px] flex items-center justify-center text-4xl">
              {category.icon}
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs font-bold text-gray-700 text-right">
                {category.nameAr}
              </p>
              <p className="text-xs text-gray-400 text-right">
                +{category.serviceCount || category._count?.services || 0}{' '}
                {category.id === '1' ? 'مقدم طعام' : category.id === '2' ? 'مصور' : 'قاعة'}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Second Row */}
      <div className="flex gap-2.5">
        <div
          onClick={() => navigate('/services')}
          className="bg-white h-20 w-[110px] rounded-[10px] shadow-sm p-4 flex flex-col justify-between cursor-pointer hover:shadow-md transition-shadow"
        >
          <p className="text-xs font-bold text-gray-700 text-right">
            كل الخدمات
          </p>
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
        </div>
        {displayCategories.slice(2, 3).map((category) => (
          <div
            key={category.id}
            onClick={() => navigate(`/venues?category=${category.id}`)}
            className="bg-white h-20 flex-1 rounded-[10px] shadow-sm p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="w-[80px] h-[80px] flex items-center justify-center text-4xl">
              {category.icon}
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-xs font-bold text-gray-700 text-right">
                {category.nameAr}
              </p>
              <p className="text-xs text-gray-400 text-right">
                +{category.serviceCount || category._count?.services || 0} قاعة
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ServiceCategories

