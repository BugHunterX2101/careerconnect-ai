import fs from 'fs'
import path from 'path'

const distAssetsPath = path.resolve(process.cwd(), 'dist/assets')
const budgetKb = Number(process.env.BUNDLE_BUDGET_KB || 950)

if (!fs.existsSync(distAssetsPath)) {
  console.error('Bundle budget check failed: dist/assets not found. Run build first.')
  process.exit(1)
}

const files = fs.readdirSync(distAssetsPath)
const jsFiles = files.filter((file) => file.endsWith('.js'))

let biggest = { name: null, sizeKb: 0 }
for (const file of jsFiles) {
  const fullPath = path.join(distAssetsPath, file)
  const sizeKb = fs.statSync(fullPath).size / 1024
  if (sizeKb > biggest.sizeKb) {
    biggest = { name: file, sizeKb }
  }
}

if (!biggest.name) {
  console.error('Bundle budget check failed: no JS assets found in dist/assets.')
  process.exit(1)
}

console.log(`Largest JS bundle: ${biggest.name} (${biggest.sizeKb.toFixed(2)} KB)`) 
console.log(`Budget: ${budgetKb} KB`)

if (biggest.sizeKb > budgetKb) {
  console.error(`Bundle budget exceeded by ${(biggest.sizeKb - budgetKb).toFixed(2)} KB`) 
  process.exit(1)
}

console.log('Bundle budget check passed.')
