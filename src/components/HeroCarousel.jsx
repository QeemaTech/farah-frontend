import { useState, useEffect } from 'react'

function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800',
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800',
    },
  ]

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <div className="flex flex-col gap-2">
      {/* Carousel Image */}
      <div className="h-[174px] rounded-xl overflow-hidden relative">
        <div className="relative w-full h-full">
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-opacity duration-500 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={slide.image}
                alt="Hero"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex items-center justify-center gap-2 h-1.5">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              index === currentSlide
                ? 'w-6 bg-primary-500'
                : 'w-1.5 bg-gray-300'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

export default HeroCarousel

