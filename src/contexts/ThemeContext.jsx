import React, { createContext, useContext, useState, useEffect } from 'react'

const THEME_STORAGE_KEY = 'dashboard_primaryColor'

const colorMap = {
  blue: {
    primary: 'from-blue-500 to-blue-600',
    primaryHover: 'hover:from-blue-600 hover:to-blue-700',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    border: 'border-blue-200',
    ring: 'ring-blue-500',
    borderSpinner: 'border-blue-500',
  },
  indigo: {
    primary: 'from-indigo-500 to-indigo-600',
    primaryHover: 'hover:from-indigo-600 hover:to-indigo-700',
    bg: 'bg-indigo-50',
    text: 'text-indigo-600',
    border: 'border-indigo-200',
    ring: 'ring-indigo-500',
    borderSpinner: 'border-indigo-500',
  },
  purple: {
    primary: 'from-purple-500 to-purple-600',
    primaryHover: 'hover:from-purple-600 hover:to-purple-700',
    bg: 'bg-purple-50',
    text: 'text-purple-600',
    border: 'border-purple-200',
    ring: 'ring-purple-500',
    borderSpinner: 'border-purple-500',
  },
  green: {
    primary: 'from-green-500 to-green-600',
    primaryHover: 'hover:from-green-600 hover:to-green-700',
    bg: 'bg-green-50',
    text: 'text-green-600',
    border: 'border-green-200',
    ring: 'ring-green-500',
    borderSpinner: 'border-green-500',
  },
  red: {
    primary: 'from-red-500 to-red-600',
    primaryHover: 'hover:from-red-600 hover:to-red-700',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
    ring: 'ring-red-500',
    borderSpinner: 'border-red-500',
  },
  orange: {
    primary: 'from-orange-500 to-orange-600',
    primaryHover: 'hover:from-orange-600 hover:to-orange-700',
    bg: 'bg-orange-50',
    text: 'text-orange-600',
    border: 'border-orange-200',
    ring: 'ring-orange-500',
    borderSpinner: 'border-orange-500',
  },
  // Brand colors (Farah dashboard)
  brand: {
    primary: 'from-[#2d2871] to-[#1f1a5a]',
    primaryHover: 'hover:from-[#1f1a5a] hover:to-[#16124a]',
    bg: 'bg-[#EDECF8]',
    text: 'text-[#2d2871]',
    border: 'border-[#2d2871]/20',
    ring: 'ring-[#2d2871]',
    borderSpinner: 'border-[#2d2871]',
  },
}

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [primaryColor, setPrimaryColorState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(THEME_STORAGE_KEY)
      return saved && colorMap[saved] ? saved : 'brand'
    }
    return 'brand'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, primaryColor)
    }
  }, [primaryColor])

  const setPrimaryColor = (color) => {
    if (colorMap[color]) setPrimaryColorState(color)
  }

  const colors = colorMap[primaryColor] || colorMap.brand

  return (
    <ThemeContext.Provider value={{ colors, primaryColor, setPrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return {
      colors: colorMap.brand,
      primaryColor: 'brand',
      setPrimaryColor: () => {},
    }
  }
  return ctx
}

export { colorMap }
