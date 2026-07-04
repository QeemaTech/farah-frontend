import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const pagesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/admin/pages')
const skip = new Set(['AdminLogin.jsx'])

for (const file of fs.readdirSync(pagesDir).filter((f) => f.endsWith('.jsx') && !skip.has(f))) {
  const filePath = path.join(pagesDir, file)
  let content = fs.readFileSync(filePath, 'utf8')
  if (!content.includes("from '../components/AdminLayout'")) continue

  content = content.replace(
    "import AdminLayout from '../components/AdminLayout'",
    "import AdminPage from '../components/AdminPage'",
  )
  content = content.replace(/<AdminLayout\b/g, '<AdminPage')
  content = content.replace(/<\/AdminLayout>/g, '</AdminPage>')
  fs.writeFileSync(filePath, content)
  console.log('migrated', file)
}
