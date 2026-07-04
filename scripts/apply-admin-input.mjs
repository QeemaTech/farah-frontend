import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/admin/pages')

const SKIP = new Set(['AdminLogin.jsx', 'Dashboard.jsx'])

const INPUT_PATTERNS = [
  [/className=\{`w-full bg-white border-2 border-gray-200[^`]*`\}/g, 'className="admin-input"'],
  [/className="w-full bg-white border-2 border-gray-200[^"]*"/g, 'className="admin-input"'],
  [/className=\{`w-full bg-white border-2 border-gray-200 px-4[^`]*`\}/g, 'className="admin-input min-h-[88px]"'],
  [/className="w-full px-3 py-2 border border-gray-300[^"]*"/g, 'className="admin-input"'],
  [/className="w-full mt-2 bg-white border-2 border-gray-200[^"]*"/g, 'className="admin-input mt-2"'],
  [/focus:border-\[#2d2871\][^"']*/g, ''],
  [/focus:ring-2 focus:ring-\[#2d2871\]\/20[^"']*/g, ''],
  [/focus:ring-2 focus:ring-orange-500[^"']*/g, ''],
  [/border-t-2 border-b-2 border-\[#2d2871\]/g, 'border-2 border-[var(--admin-border)] border-t-[var(--admin-accent)]'],
  [/bg-gradient-to-r from-\[#2d2871\] to-\[#1f1a5a\][^"]*"/g, 'ads-btn ads-btn-primary"'],
  [/className="bg-\[#2d2871\] text-white[^"]*"/g, 'className="ads-btn ads-btn-primary"'],
  [/className=\{`[^`]*bg-gradient-to-r \$\{colors\.primary\}[^`]*`\}/g, 'className="ads-btn ads-btn-primary"'],
  [/rounded-xl px-5 py-2\.5 text-sm font-semibold text-white shadow-sm bg-gradient-to-r \$\{colors\.primary\} \$\{colors\.primaryHover\}[^"]*"/g, 'ads-btn ads-btn-primary"'],
]

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) files.push(...walk(p, files))
    else if (name.endsWith('.jsx')) files.push(p)
  }
  return files
}

let changed = 0
for (const file of walk(pagesDir)) {
  const base = path.basename(file)
  if (SKIP.has(base)) continue
  let text = fs.readFileSync(file, 'utf8')
  const orig = text
  for (const [re, rep] of INPUT_PATTERNS) {
    text = text.replace(re, rep)
  }
  if (text !== orig) {
    fs.writeFileSync(file, text)
    changed++
    console.log('updated:', path.relative(pagesDir, file))
  }
}
console.log(`Done. ${changed} files updated.`)
