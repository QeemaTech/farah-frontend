/**
 * Share app functionality
 * Supports native sharing API and fallback methods
 */

export const shareApp = async (settings, language = 'ar') => {
  const shareData = {
    title: language === 'ar' ? settings.appNameAr : settings.appName,
    text: language === 'ar' ? settings.shareMessageAr : settings.shareMessage,
    url: window.location.origin,
  }

  // Try native sharing API (mobile browsers)
  if (navigator.share) {
    try {
      await navigator.share(shareData)
      return { success: true, method: 'native' }
    } catch (error) {
      if (error.name !== 'AbortError') {
      }
      // Fall through to fallback methods
    }
  }

  // Fallback: Copy to clipboard
  try {
    const shareText = `${shareData.text}\n${shareData.url}`
    await navigator.clipboard.writeText(shareText)
    return { 
      success: true, 
      method: 'clipboard',
      message: language === 'ar' ? 'تم نسخ الرابط' : 'Link copied to clipboard'
    }
  } catch (error) {
    return { 
      success: false, 
      error: language === 'ar' ? 'فشل مشاركة التطبيق' : 'Failed to share app'
    }
  }
}

/**
 * Generate share links for different platforms
 */
export const getShareLinks = (settings, language = 'ar') => {
  const url = encodeURIComponent(window.location.origin)
  const title = encodeURIComponent(language === 'ar' ? settings.appNameAr : settings.appName)
  const text = encodeURIComponent(language === 'ar' ? settings.shareMessageAr : settings.shareMessage)

  return {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    email: `mailto:?subject=${title}&body=${text}%20${url}`,
    sms: `sms:?body=${text}%20${url}`,
  }
}

/**
 * Open share dialog for specific platform
 */
export const shareToPlatform = (platform, settings, language = 'ar') => {
  const links = getShareLinks(settings, language)
  const link = links[platform]

  if (link) {
    window.open(link, '_blank', 'width=600,height=400')
    return { success: true }
  }

  return { 
    success: false, 
    error: language === 'ar' ? 'منصة غير مدعومة' : 'Platform not supported'
  }
}


