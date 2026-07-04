import { useEffect, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'

const ICON_TONES = ['indigo', 'emerald', 'amber', 'indigo']

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendPositive = true,
  iconTone,
}) {
  const [display, setDisplay] = useState(0)
  const showTrend = trend != null && trend !== ''
  const tone = iconTone || ICON_TONES[Math.abs(String(label).length) % ICON_TONES.length]

  useEffect(() => {
    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (!/^[\d.,\s-]+$/.test(trimmed.replace(/\s/g, ''))) {
        setDisplay(value)
        return
      }
      const n = parseFloat(trimmed.replace(/,/g, ''))
      if (!Number.isFinite(n)) {
        setDisplay(value)
        return
      }
      animateTo(n)
      return
    }
    if (typeof value === 'number' && Number.isFinite(value)) {
      animateTo(value)
      return
    }
    setDisplay(value ?? 0)
  }, [value])

  function animateTo(target) {
    const start = performance.now()
    const duration = 900
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setDisplay(Math.round(target * eased * 100) / 100)
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }

  return (
    <div className="ui-stat">
      {Icon ? (
        <div className={`ui-stat__icon ui-stat__icon--${tone}`}>
          <Icon size={22} aria-hidden />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="ui-stat__value">{display}</div>
        <div className="ui-stat__label">{label}</div>
        {showTrend ? (
          <span
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium"
            style={{ color: trendPositive ? 'var(--admin-success)' : 'var(--admin-danger)' }}
          >
            {trendPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {trend}
          </span>
        ) : null}
      </div>
    </div>
  )
}
