import { crc32, deflateSync } from 'node:zlib'
import { QUIET_ZONE, type QrMatrix } from './qr.ts'

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function chunk(type: string, body: Buffer): Buffer {
  const head = Buffer.alloc(8)
  head.writeUInt32BE(body.length, 0)
  head.write(type, 4, 'ascii')
  const tail = Buffer.alloc(4)
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), body])), 0)
  return Buffer.concat([head, body, tail])
}

/**
 * PNG xám 8-bit: module đen (0) trên nền trắng (255), có vùng yên tĩnh 4 module.
 * Số pixel mỗi module là số nguyên, nên cạnh module luôn sắc nét khi in.
 * `minPixels` là cạnh tối thiểu của ảnh; 1200px đủ in rõ ở cỡ 10 cm trở lên (300 dpi).
 */
export function qrPng(matrix: QrMatrix, minPixels = 1200): Buffer {
  const modules = matrix.size + QUIET_ZONE * 2
  const scale = Math.max(1, Math.ceil(minPixels / modules))
  const side = modules * scale

  const raw = Buffer.alloc((side + 1) * side, 255)
  for (let y = 0; y < side; y += 1) {
    const rowStart = y * (side + 1)
    raw[rowStart] = 0 // filter: none
    const moduleY = Math.floor(y / scale) - QUIET_ZONE
    if (moduleY < 0 || moduleY >= matrix.size) continue
    for (let x = 0; x < side; x += 1) {
      const moduleX = Math.floor(x / scale) - QUIET_ZONE
      if (moduleX >= 0 && moduleX < matrix.size && matrix.data[moduleY]![moduleX]) {
        raw[rowStart + 1 + x] = 0
      }
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(side, 0)
  header.writeUInt32BE(side, 4)
  header[8] = 8 // bit depth
  header[9] = 0 // grayscale
  // compression, filter, interlace = 0

  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
