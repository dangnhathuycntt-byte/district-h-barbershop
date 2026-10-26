/**
 * Kiểm tra mã QR giải ra đúng đích, bằng bộ giải mã độc lập (jsQR) trên chính file PNG.
 *
 *   npm run verify:qr                         # tạo lại từ config rồi giải mã
 *   npm run verify:qr -- --files print/qr     # giải mã luôn các file PNG đã xuất ra đĩa
 *
 * Mỗi mã được thử ở kích thước đầy đủ và thu nhỏ còn ~25% (mô phỏng quét từ xa).
 */
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join, resolve } from 'node:path'
import jsQR from 'jsqr'
import { PNG } from 'pngjs'
import { buildQrAssets, config } from '../src/site.ts'
import { wifiPayload } from '../src/lib/wifi.ts'

interface Check {
  name: string
  png: Buffer
  expected: string
}

const fail = (message: string): never => {
  console.error(`✗ ${message}`)
  process.exit(1)
}

/** Đọc ngược chuỗi WIFI: theo quy ước ZXing, độc lập với code sinh mã. */
function parseWifi(payload: string): { ssid: string; password: string } {
  const body = payload.replace(/^WIFI:/, '')
  const fields: Record<string, string> = {}
  for (const match of body.matchAll(/([A-Z]):((?:\\.|[^;\\])*);/g)) fields[match[1]!] = match[2]!.replace(/\\(.)/g, '$1')
  const unquote = (v = '') => v.replace(/^"(.*)"$/, '$1')
  return { ssid: unquote(fields.S), password: unquote(fields.P) }
}

function decode(png: Buffer, shrink = 1): string | undefined {
  const image = PNG.sync.read(png)
  let { width, height, data } = image
  if (shrink > 1) {
    const w = Math.floor(width / shrink)
    const h = Math.floor(height / shrink)
    const out = Buffer.alloc(w * h * 4)
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        // trung bình khối shrink x shrink: giống ảnh bị nhoè khi chụp từ xa
        for (let c = 0; c < 4; c += 1) {
          let sum = 0
          for (let dy = 0; dy < shrink; dy += 1) for (let dx = 0; dx < shrink; dx += 1) sum += data[((y * shrink + dy) * width + (x * shrink + dx)) * 4 + c]!
          out[(y * w + x) * 4 + c] = Math.round(sum / (shrink * shrink))
        }
      }
    }
    width = w
    height = h
    data = out
  }
  return jsQR(new Uint8ClampedArray(data), width, height)?.data
}

const checks: Check[] = []
for (const [path, asset] of buildQrAssets(config)) {
  if (!path.endsWith('.png')) continue
  checks.push({
    name: `build/${basename(path)}`,
    png: asset.body as Buffer,
    expected: path.includes('wifi') ? wifiPayload(config.wifi) : config.siteUrl,
  })
}

const filesIndex = process.argv.indexOf('--files')
if (filesIndex > -1) {
  const dir = resolve(process.argv[filesIndex + 1] ?? fail('Thiếu thư mục sau --files'))
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.png'))) {
    const isWifi = file.includes('wifi')
    if (!isWifi && !config.siteUrl) continue
    checks.push({ name: `file/${join(basename(dir), file)}`, png: readFileSync(join(dir, file)), expected: isWifi ? wifiPayload(config.wifi) : config.siteUrl })
  }
}

let failures = 0
for (const check of checks) {
  const full = decode(check.png)
  const small = decode(check.png, 4)
  const ok = full === check.expected && small === check.expected
  if (!ok) failures += 1
  console.log(`${ok ? '✓' : '✗'} ${check.name}\n    đầy đủ: ${full === check.expected ? 'khớp' : `SAI (${full ?? 'không giải được'})`} · thu nhỏ 25%: ${small === check.expected ? 'khớp' : `SAI (${small ?? 'không giải được'})`}\n    nội dung: ${check.expected}`)
}

const parsed = parseWifi(wifiPayload(config.wifi))
const wifiFieldsOk = parsed.ssid === config.wifi.ssid && parsed.password === config.wifi.password
console.log(`${wifiFieldsOk ? '✓' : '✗'} Wi-Fi đọc ngược: tên mạng = "${parsed.ssid}", mật khẩu = "${parsed.password}"`)
if (!wifiFieldsOk) failures += 1

if (failures) fail(`${failures} kiểm tra không đạt.`)
console.log(`\n✓ ${checks.length} mã QR giải ra đúng đích.`)
