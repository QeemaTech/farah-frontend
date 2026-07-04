/**
 * Utility functions for handling images (base64, URLs, etc.)
 */

/**
 * Check if a base64 string is complete (not truncated)
 */
export const isCompleteBase64 = (base64Str) => {
  if (!base64Str || typeof base64Str !== 'string') return false
  
  const trimmed = base64Str.trim()
  if (trimmed.length < 100) return false // Too short to be a valid image
  
  // Base64 strings should be divisible by 4 (with padding)
  // Check if it ends properly (with padding = or ==, or valid base64 char)
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/
  if (!base64Regex.test(trimmed)) return false
  
  // Check if length is reasonable for padding
  const remainder = trimmed.length % 4
  if (remainder === 1) return false // Invalid base64 length
  
  // If it ends with =, it should be properly padded
  if (trimmed.endsWith('=')) {
    const paddingCount = trimmed.match(/=+$/)?.[0]?.length || 0
    if (paddingCount > 2) return false // Invalid padding
  }
  
  return true
}

/**
 * Check if a string is a valid base64 image
 */
export const isValidBase64Image = (str) => {
  if (!str || typeof str !== 'string') return false
  
  const trimmed = str.trim()
  if (trimmed.length === 0) return false
  
  // Check if it's already a data URL
  if (trimmed.startsWith('data:image/')) {
    // Check if data URL is complete (has base64 data after comma)
    const commaIndex = trimmed.indexOf(',')
    if (commaIndex === -1 || commaIndex === trimmed.length - 1) {
      return false // No data after comma
    }
    const base64Data = trimmed.substring(commaIndex + 1)
    return isCompleteBase64(base64Data)
  }
  
  // Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return true
  }
  
  // Check if it's valid and complete base64
  return isCompleteBase64(trimmed)
}

// Cache for invalid images to avoid repeated warnings
const invalidImageCache = new Set()

/**
 * Normalize images field from API (Json array, JSON string, or single URL)
 */
export const parseImagesArray = (images) => {
  if (!images) return []
  if (Array.isArray(images)) {
    return images.filter((img) => img && typeof img === 'string' && img.trim() !== '')
  }
  if (typeof images === 'string') {
    const trimmed = images.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) {
          return parsed.filter((img) => img && typeof img === 'string' && img.trim() !== '')
        }
      } catch {
        /* fall through */
      }
    }
    return [trimmed]
  }
  return []
}

/**
 * Format image source for display
 * Handles base64, data URLs, and regular URLs
 */
export const formatImageSrc = (image, defaultImage = null) => {
  if (image == null || image === '') {
    return defaultImage || null
  }

  if (typeof image !== 'string') {
    return defaultImage || null
  }

  if (image.trim() === '') {
    return defaultImage || null
  }
  
  const trimmed = image.trim()
  
  
  const imageKey = trimmed.substring(0, 100) // Use first 100 chars as cache key
  
  // If it's already a data URL, validate it's complete
  if (trimmed.startsWith('data:image/')) {
    // Check if data URL is complete (not truncated)
    const commaIndex = trimmed.indexOf(',')
    if (commaIndex === -1 || commaIndex === trimmed.length - 1) {
      // Only warn once per unique invalid image
      if (!invalidImageCache.has(imageKey)) {
        invalidImageCache.add(imageKey)
      }
      return defaultImage || null
    }
    
    const base64Data = trimmed.substring(commaIndex + 1)
    
    // Check if this is a truncated image (common issue with old VARCHAR(191) data)
    // But still try to display it - browser might handle it
    if (base64Data.length < 100) {
      // Still return it - let the browser try to display it
      // The onError handler will show fallback if it fails
      invalidImageCache.delete(imageKey)
      return trimmed
    }
    
    // For images between 100-500 chars, be lenient (might be small icons)
    if (base64Data.length < 500) {
      // Still validate it's proper base64
      if (isCompleteBase64(base64Data)) {
        invalidImageCache.delete(imageKey)
        return trimmed
      }
    }
    
    if (!isCompleteBase64(base64Data)) {
      // Only warn once per unique invalid image - but don't spam console
      if (!invalidImageCache.has(imageKey)) {
        invalidImageCache.add(imageKey)
      }
      return defaultImage || null
    }
    
    // Valid image, remove from cache if it was there
    invalidImageCache.delete(imageKey)
    return trimmed
  }
  
  // If it's already an HTTP/HTTPS URL, return as is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  
  // If it starts with /uploads/, it's a relative path - construct full URL
  if (trimmed.startsWith('/uploads/')) {
    const API_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8001/api'
    const baseUrl = API_URL.replace('/api', '') // Remove /api to get base URL
    return `${baseUrl}${trimmed}`
  }
  
  // If it's valid base64 (without data: prefix), format it
  if (isValidBase64Image(trimmed)) {
    // Try to detect image type from base64
    // PNG usually starts with iVBORw0KGgo
    // JPEG usually starts with /9j/
    let mimeType = 'image/jpeg'
    const base64Start = trimmed.substring(0, 20)
    
    if (base64Start.includes('iVBORw0KGgo') || base64Start.startsWith('iVBORw0KGgo')) {
      mimeType = 'image/png'
    } else if (base64Start.includes('/9j/') || base64Start.startsWith('/9j/')) {
      mimeType = 'image/jpeg'
    } else if (base64Start.includes('R0lGODlh') || base64Start.includes('R0lGODdh')) {
      mimeType = 'image/gif'
    } else if (base64Start.includes('UklGR')) {
      mimeType = 'image/webp'
    }
    
    // Valid image, remove from cache if it was there
    invalidImageCache.delete(imageKey)
    return `data:${mimeType};base64,${trimmed}`
  }
  
  // If invalid or truncated, return null (don't use placeholder URLs)
  // Only warn once per unique invalid image
  if (!invalidImageCache.has(imageKey)) {
    invalidImageCache.add(imageKey)
    // Don't log the full truncated string to avoid console spam
  }
  return defaultImage || null
}

/**
 * Handle image load error
 */
export const handleImageError = (e, fallbackElement = null) => {
  // Hide the broken image
  e.target.style.display = 'none'
  
  // Show fallback element if provided
  if (fallbackElement) {
    fallbackElement.style.display = 'flex'
  }
  
}

