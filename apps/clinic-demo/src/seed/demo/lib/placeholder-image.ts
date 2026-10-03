import { deflateSync } from 'node:zlib'

// Minimal pure-Node PNG encoder (no external deps) — produces a solid-color
// placeholder image so the demo seed never depends on network access or
// real client photography.

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
