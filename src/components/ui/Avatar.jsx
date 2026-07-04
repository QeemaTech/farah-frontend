export default function Avatar({ src, name = '', size = 40, className = '' }) {
  const initial = (name && name.trim().charAt(0).toUpperCase()) || 'A'
  const style = { width: size, height: size, minWidth: size, minHeight: size }

  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ring-2 ring-[var(--admin-border)] ${className}`}
        style={style}
      />
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#6366f1] text-sm font-bold text-white ${className}`}
      style={style}
    >
      {initial}
    </div>
  )
}
