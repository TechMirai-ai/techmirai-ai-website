import { deflateSync } from 'node:zlib'
import sharp from 'sharp'

// Minimal pure-Node PNG encoder (no external deps) — produces a solid-color
// placeholder image so the seed never depends on network access or real
// client photography. Extended below with sharp-based labelled/avatar
// variants: arbitrary text centering/measuring isn't practical to hand-roll
// a second time, and sharp's native build is already trusted repo-wide (see
// root package.json's pnpm onlyBuiltDependencies/allowBuilds).

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Buffer): number {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]!) & 0xff]! ^ (c >>> 8)
  }
  return (c ^ 0xffffffff) >>> 0
}

function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii')
  const lenBuf = Buffer.alloc(4)
  lenBuf.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0)
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf])
}

export type RGB = [number, number, number]

/** Two-tone solid-fill placeholder: a band of `accent` across the bottom third of `base`. */
export function createPlaceholderPng(
  width: number,
  height: number,
  base: RGB,
  accent: RGB = base,
): Buffer {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8 // bit depth
  ihdrData[9] = 2 // color type: truecolor (RGB)
  ihdrData[10] = 0
  ihdrData[11] = 0
  ihdrData[12] = 0
  const ihdr = pngChunk('IHDR', ihdrData)

  const rowBytes = width * 3
  const raw = Buffer.alloc((rowBytes + 1) * height)
  const bandStart = Math.floor(height * 0.7)
  for (let y = 0; y < height; y++) {
    const [r, g, b] = y >= bandStart ? accent : base
    const rowStart = y * (rowBytes + 1)
    raw[rowStart] = 0 // filter type: none
    for (let x = 0; x < width; x++) {
      const px = rowStart + 1 + x * 3
      raw[px] = r
      raw[px + 1] = g
      raw[px + 2] = b
    }
  }

  const idat = pngChunk('IDAT', deflateSync(raw))
  const iend = pngChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

/** Brand-neutral palette cycled across placeholder assets for visual variety. */
export const PLACEHOLDER_PALETTE: RGB[] = [
  [94, 166, 230],
  [43, 123, 185],
  [245, 158, 11],
  [22, 163, 74],
  [100, 116, 139],
  [168, 85, 247],
  [236, 72, 153],
  [20, 184, 166],
]

export function paletteColor(index: number): RGB {
  return PLACEHOLDER_PALETTE[index % PLACEHOLDER_PALETTE.length]!
}

function rgbToCss([r, g, b]: RGB): string {
  return `rgb(${r},${g},${b})`
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * A neutral grey rectangle with a centered text label burned into the
 * pixels — e.g. "PLACEHOLDER: Jamal portrait 1200×1500" per
 * docs/WORK-ORDER.md §5's exact template. Never a photo.
 */
export async function createLabelledPlaceholderPng(
  width: number,
  height: number,
  label: string,
  options: { background?: RGB; textColor?: RGB } = {},
): Promise<Buffer> {
  const background = options.background ?? [148, 163, 184]
  const textColor = options.textColor ?? [255, 255, 255]
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 20))
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${rgbToCss(background)}" />
    <text x="50%" y="50%" fill="${rgbToCss(textColor)}" font-family="sans-serif"
      font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle">${escapeXml(label)}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/**
 * A neutral flat-color circle with 1-2 letter initials — never a generated
 * face, per CLAUDE.md's "never use AI-generated pictures of people" rule.
 */
export async function createInitialsAvatarPng(
  initials: string,
  size: number,
  background: RGB = paletteColor(0),
): Promise<Buffer> {
  const fontSize = Math.round(size * 0.4)
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${rgbToCss(background)}" />
    <text x="50%" y="50%" fill="#FFFFFF" font-family="sans-serif" font-weight="bold"
      font-size="${fontSize}" text-anchor="middle" dominant-baseline="central">${escapeXml(
        initials.slice(0, 2).toUpperCase(),
      )}</text>
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}
