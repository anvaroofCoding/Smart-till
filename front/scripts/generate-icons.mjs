import sharp from 'sharp'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')
const svg = readFileSync(join(publicDir, 'favicon.svg'))

const sizes = [
  { name: 'favicon-48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'og-image.png', size: 1200, height: 630 },
]

for (const item of sizes) {
  const height = item.height ?? item.size
  await sharp(svg)
    .resize(item.size, height, { fit: 'contain', background: '#0f172a' })
    .png()
    .toFile(join(publicDir, item.name))
}

await sharp(svg)
  .resize(32, 32, { fit: 'contain', background: '#0f172a' })
  .toFile(join(publicDir, 'favicon.ico'))

console.log('Icons generated in public/')
