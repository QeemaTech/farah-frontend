import { useNavigate } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'

export default function BackHeader({ title = '', fallbackTo = '/home' }) {
  const navigate = useNavigate()

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }
    navigate(fallbackTo)
  }

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-lg mx-auto px-5 h-14 flex items-center gap-3">
        <button
          type="button"
          onClick={goBack}
          aria-label="عودة"
          className="w-9 h-9 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <FiArrowRight className="text-lg" />
        </button>
        <h1 className="text-[15px] font-bold text-gray-900 truncate">{title}</h1>
      </div>
    </div>
  )
}
