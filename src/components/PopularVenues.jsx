import { useNavigate } from 'react-router-dom'

function PopularVenues({ venues, loading }) {
  const navigate = useNavigate()
  const defaultVenues = [
    {
      id: '1',
      nameAr: 'قاعة اللؤلؤة',
      rating: 4.93,
      reviewCount: 111,
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    },
    {
      id: '2',
      nameAr: 'قاعة اللؤلؤة',
      rating: 4.93,
      reviewCount: 111,
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    },
    {
      id: '3',
      nameAr: 'قاعة اللؤلؤة',
      rating: 4.93,
      reviewCount: 111,
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400',
    },
  ]

  const displayVenues = venues.length > 0 ? venues : defaultVenues

  if (loading) {
    return (
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white border border-gray-50 rounded-xl w-[165px] flex-shrink-0 h-[161px] animate-pulse"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5">
      {displayVenues.map((venue) => (
        <div
          key={venue.id}
          onClick={() => navigate(`/venue/${venue.id}`)}
          className="bg-white border border-gray-50 rounded-xl w-[165px] flex-shrink-0 overflow-hidden relative cursor-pointer hover:shadow-md transition-shadow"
        >
          {/* Image */}
          <div className="h-[110px] relative">
            <img
              src={venue.images?.[0] || venue.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400'}
              alt={venue.nameAr || venue.name}
              className="w-full h-full object-cover"
            />
            {/* Favorite Icon */}
            <div className="absolute top-2.5 left-2.5 w-3.5 h-3.5">
              <svg viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 12.5L2.5 7.5C1.5 6.5 1 5.5 1 4.5C1 2.5 2.5 1 4.5 1C5.5 1 6.5 1.5 7 2.5C7.5 1.5 8.5 1 9.5 1C11.5 1 13 2.5 13 4.5C13 5.5 12.5 6.5 11.5 7.5L7 12.5Z"
                  fill="#EF92AB"
                  stroke="#EF92AB"
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>

          {/* Content */}
          <div className="p-2 flex flex-col items-end gap-1">
            <p className="text-sm font-semibold text-gray-700 text-right">
              {venue.nameAr || venue.name}
            </p>
            <div className="flex items-center gap-1 justify-end">
              <p className="text-[10px] text-gray-400 text-right">
                ({venue.reviewCount || 111} تقييم)
              </p>
              <p className="text-xs text-gray-700">
                {venue.rating || 4.93}
              </p>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 1L7.545 4.13L11 4.635L8.5 7.07L9.09 10.5L6 8.885L2.91 10.5L3.5 7.07L1 4.635L4.455 4.13L6 1Z"
                  fill="#FFD700"
                />
              </svg>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default PopularVenues

