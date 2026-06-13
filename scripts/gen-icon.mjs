import sharp from 'sharp'

// Crop just the badge (cap + stethoscope shield) out of the full lockup so it
// stays legible at favicon size, then emit transparent square app icons.
const SRC = 'public/brand/logo.png' // transparent version

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H, channels } = info

const rowBlank = (y) => {
  for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * channels + 3] > 12) return false // any non-transparent pixel
  }
  return true
}

// Find the tallest band of fully-transparent rows in the vertical middle — the
// gap between the badge and the "Med En Poche" wordmark. Crop above it.
let best = { start: H, len: 0 }
let runStart = -1
for (let y = Math.floor(H * 0.3); y < Math.floor(H * 0.8); y++) {
  if (rowBlank(y)) {
    if (runStart < 0) runStart = y
  } else if (runStart >= 0) {
    if (y - runStart > best.len) best = { start: runStart, len: y - runStart }
    runStart = -1
  }
}
const cropH = Math.max(1, Math.min(H, best.len > 0 ? best.start : Math.floor(H * 0.6)))
console.log(`W=${W} H=${H} ch=${channels} gap.start=${best.start} gap.len=${best.len} cropH=${cropH}`)

// Two passes: sharp reorders trim before extract within one pipeline, so the
// crop and the trim must run as separate instances.
const topRegion = await sharp(SRC).extract({ left: 0, top: 0, width: W, height: cropH }).png().toBuffer()
const badge = await sharp(topRegion).trim().png().toBuffer()

const SIZE = 512
const square = sharp(badge).resize(SIZE, SIZE, {
  fit: 'contain',
  background: { r: 0, g: 0, b: 0, alpha: 0 },
})

await square.clone().png().toFile('app/icon.png')
await sharp(badge)
  .resize(180, 180, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
  .png()
  .toFile('app/apple-icon.png')

console.log(`cropped badge height=${cropH}px (gap at ${best.start}, len ${best.len}) → app/icon.png + app/apple-icon.png`)
