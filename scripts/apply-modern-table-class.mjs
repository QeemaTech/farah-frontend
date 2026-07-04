/**
 * Adds class="ui-table" to <table> in admin pages that lack it (safe idempotent pass).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const pagesDir = path.join(__dirname, '../src/admin/pages')

const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.jsx'))

let changed = 0
for (const file of files) {
  const fp = path.join(pagesDir, file)
  let src = fs.readFileSync(fp, 'utf8')
  if (src.includes('ui-table')) continue
  const next = src.replace(/<table(\s+className=")([^"]*)(")/g, (m, pre, cls, post) => {
    if (cls.includes('ui-table')) return m
    return `<table${pre}ui-table ${cls}${post}`
  }).replace(/<table(?!\s+className)/g, '<table className="ui-table"')
  if (next !== src) {
    fs.writeFileSync(fp, next)
    changed++
    console.log('updated', file)
  }
}
console.log('done, files changed:', changed)
