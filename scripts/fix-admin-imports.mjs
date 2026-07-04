import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const pagesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/admin/pages')

const SESSION_RE =
  /^import\s+\{[^}]+\}\s+from\s+['"]\.\.\/utils\/adminSession['"]\s*\r?\n/gm

function mergeSessionImports(content) {
  const names = new Set()
  let m
  const re = /^import\s+\{([^}]+)\}\s+from\s+['"]\.\.\/utils\/adminSession['"]/gm
  while ((m = re.exec(content)) !== null) {
    m[1].split(',').forEach((part) => {
      const n = part.trim().split(/\s+as\s+/)[0].trim()
      if (n) names.add(n)
    })
  }
  return names
}

for (const file of fs.readdirSync(pagesDir).filter((f) => f.endsWith('.jsx'))) {
  const filePath = path.join(pagesDir, file)
  let content = fs.readFileSync(filePath, 'utf8')

  const sessionNames = mergeSessionImports(content)

  content = content.replace(SESSION_RE, '')
  content = content.replace(
    /const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:8001\/api'\s*\r?\n/g,
    '',
  )
  content = content.replace(
    /const API = \(import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:8001'\)\.replace\(\/\\\/api\\\/?\$\/, ''\)\s*\r?\n/g,
    '',
  )
  content = content.replace(
    /import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:8001\/api'/g,
    'API_URL',
  )

  if (/\bAPI_URL\b/.test(content)) sessionNames.add('API_URL')
  if (/\badminAuthHeaders\b/.test(content)) sessionNames.add('adminAuthHeaders')
  if (/\bapiOrigin\b/.test(content)) sessionNames.add('apiOrigin')
  if (/\breadAdminUser\b/.test(content)) sessionNames.add('readAdminUser')
  if (/\bisFullAdminUser\b/.test(content)) sessionNames.add('isFullAdminUser')
  if (/\busesProviderApis\b/.test(content)) sessionNames.add('usesProviderApis')
  if (/\bisSlaughterOnlyVendor\b/.test(content)) sessionNames.add('isSlaughterOnlyVendor')
  if (/\bisVenueOnlyVendor\b/.test(content)) sessionNames.add('isVenueOnlyVendor')
  if (/\bhasPermission\b/.test(content)) sessionNames.add('hasPermission')
  if (/\bgetSlaughterApiMode\b/.test(content)) sessionNames.add('getSlaughterApiMode')
  if (/\bgetVenueVendorApiMode\b/.test(content)) sessionNames.add('getVenueVendorApiMode')

  if (sessionNames.size > 0) {
    const sorted = [...sessionNames].sort()
    const importLine = `import { ${sorted.join(', ')} } from '../utils/adminSession'\n`
    const importBlock = content.match(/^((?:import .+\n)+)/)
    if (importBlock) {
      content = importBlock[0] + importLine + content.slice(importBlock[0].length)
    } else {
      content = importLine + content
    }
  }

  // Slaughter files: use apiOrigin() instead of module-level API
  if (
    file.startsWith('Slaughter') ||
    file === 'AddSlaughterProduct.jsx'
  ) {
    if (/\$\{API\}/.test(content) || /\bAPI\b/.test(content)) {
      content = content.replace(/\$\{API\}/g, '${apiOrigin()}')
      content = content.replace(/\bAPI\b\/api/g, "apiOrigin() + '/api")
    }
  }

  fs.writeFileSync(filePath, content)
  console.log('fixed', file)
}
