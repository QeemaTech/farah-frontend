import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../utils/translations'
import i18n from '../i18n'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('app_language') || 'ar'
  })

  useEffect(() => {
    localStorage.setItem('app_language', language)
    i18n.changeLanguage(language)
    const direction = language === 'ar' ? 'rtl' : 'ltr'
    
    // Update HTML direction and language
    document.documentElement.setAttribute('dir', direction)
    document.documentElement.setAttribute('lang', language)
    
    // Update body direction
    document.body.setAttribute('dir', direction)
    
    // Update body direction class
    document.body.classList.remove('rtl', 'ltr')
    document.body.classList.add(direction)
    
    // Update CSS custom properties for direction
    document.documentElement.style.setProperty('--direction', direction)
    document.documentElement.style.setProperty('--text-align', direction === 'rtl' ? 'right' : 'left')
  }, [language])

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar')
  }

  const t = (key, customTranslations = null) => {
    if (customTranslations && typeof customTranslations === 'object' && ('ar' in customTranslations || 'en' in customTranslations)) {
      return customTranslations[language] ?? customTranslations.ar ?? key
    }
    const fromI18n = i18n.t(key)
    if (fromI18n && fromI18n !== key) return fromI18n
    const trans = translations[key]
    if (trans) return trans[language] || trans.ar || key
    return key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

