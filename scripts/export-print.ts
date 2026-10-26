/**
 * Xuất file in: poster A4 (PDF) + mã QR (PNG in được, SVG vector).
 *
 *   npm run print                       # poster PDF + mã QR, ra thư mục print/
 *   npm run print -- --out ../tam      # ra thư mục khác
 *   npm run qr                          # chỉ xuất file mã QR (không cần siteUrl, không cần Chrome)
 *
 * Cần Chrome/Chromium để tạo PDF (tự dò; hoặc đặt CHROME_PATH). Từ chối chạy khi poster cần mã website
 * mà siteUrl còn trống, để không in ra poster thiếu mã.
 */
import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, normalize, resolve } from 'node:path'
import { buildQrAssets, checkConfig, config, posterNeedsSiteUrl } from '../src/site.ts'

const root = resolve(import.meta.dirname, '..')
const qrOnly = process.argv.includes('--qr-only')
const outIndex = process.argv.indexOf('--out')
const outDir = resolve(root, outIndex > -1 ? (process.argv[outIndex + 1] ?? 'print') : 'print')

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`)
  process.exit(1)
}

function findChrome(): string {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ]
  const found = candidates.find((path): path is string => Boolean(path) && existsSync(path as string))
  return found ?? fail('Không tìm thấy Chrome/Chromium. Cài Chrome hoặc đặt biến CHROME_PATH trỏ tới chương trình.')
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

/**
 * Phục vụ thư mục build qua http://127.0.0.1. Không mở bằng file:// vì Vite gắn `crossorigin`
 * cho CSS/font, và trình duyệt chặn các tài nguyên đó từ file:// (poster sẽ bị in không có style).
 */
function serve(dir: string): Promise<{ origin: string; close: () => void }> {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0]!)).replace(/^([/\\]\.\.)+/, '')
    const file = join(dir, path.endsWith('/') ? `${path}index.html` : path)
    try {
      res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' }).end(readFileSync(file))
    } catch {
      res.writeHead(404).end()
    }
  })
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number }
      done({ origin: `http://127.0.0.1:${port}`, close: () => server.close() })
    })
  })
}

/**
 * In PDF qua Chrome DevTools Protocol. Cờ --print-to-pdf của dòng lệnh bỏ qua @page { size: A4 }
 * và ra khổ Letter nhiều trang, nên phải gọi Page.printToPDF với preferCSSPageSize.
 */
async function printToPdf(chrome: string, url: string): Promise<Buffer> {
  const profile = mkdtempSync(join(tmpdir(), 'district-h-chrome-'))
  const browser = spawn(
    chrome,
    ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  )
  try {
    const endpoint = await new Promise<string>((resolveUrl, reject) => {
      let log = ''
      const timer = setTimeout(() => reject(new Error('Chrome không khởi động được trong 20 giây.')), 20_000)
      browser.stderr!.on('data', (chunk: Buffer) => {
        log += chunk.toString()
        const match = /DevTools listening on (ws:\/\/\S+)/.exec(log)
        if (match) {
          clearTimeout(timer)
          resolveUrl(match[1]!)
        }
      })
      browser.once('exit', () => reject(new Error('Chrome thoát sớm.')))
    })

    const socket = new WebSocket(endpoint)
    await new Promise<void>((resolveOpen, reject) => {
      socket.onopen = () => resolveOpen()
      socket.onerror = () => reject(new Error('Không kết nối được DevTools của Chrome.'))
    })

    let nextId = 0
    const pending = new Map<number, { ok: (value: any) => void; err: (error: Error) => void }>()
    const waiting: Array<{ method: string; session?: string; ok: () => void }> = []
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id !== undefined) {
        const entry = pending.get(message.id)
        pending.delete(message.id)
        if (message.error) entry?.err(new Error(message.error.message))
        else entry?.ok(message.result)
        return
      }
      const index = waiting.findIndex((w) => w.method === message.method && w.session === message.sessionId)
      if (index > -1) waiting.splice(index, 1)[0]!.ok()
    }
    const send = (method: string, params: object = {}, sessionId?: string): Promise<any> =>
      new Promise((ok, err) => {
        nextId += 1
        pending.set(nextId, { ok, err })
        socket.send(JSON.stringify({ id: nextId, method, params, sessionId }))
      })
    const once = (method: string, session: string): Promise<void> => new Promise((ok) => waiting.push({ method, session, ok }))

    const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
    await send('Page.enable', {}, sessionId)
    const loaded = once('Page.loadEventFired', sessionId)
    await send('Page.navigate', { url }, sessionId)
    await loaded
    await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true }, sessionId)
    const { data } = await send('Page.printToPDF', { preferCSSPageSize: true, printBackground: true }, sessionId)
    socket.close()
    return Buffer.from(data, 'base64')
  } finally {
    // Chờ Chrome thoát hẳn rồi mới dọn hồ sơ tạm; dọn không được thì bỏ qua, không làm hỏng việc xuất file.
    await new Promise<void>((done) => {
      browser.once('exit', () => done())
      browser.kill()
      setTimeout(done, 5_000)
    })
    try {
      rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
    } catch {
      /* thư mục tạm của hệ điều hành, sẽ tự được dọn */
    }
  }
}

/** Chặn ngay nếu PDF không phải đúng 1 trang A4 (595 x 842 pt). */
function assertSingleA4Page(path: string): void {
  const text = readFileSync(path).toString('latin1')
  const pages = (text.match(/\/Type\s*\/Page[^s]/g) ?? []).length
  const box = /\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/.exec(text)
  const width = Number(box?.[1])
  const height = Number(box?.[2])
  const isA4 = Math.abs(width - 595.28) < 1.5 && Math.abs(height - 841.89) < 1.5
  if (pages !== 1 || !isA4) {
    fail(`PDF không đạt: ${pages} trang, khổ ${width} x ${height} pt (cần đúng 1 trang A4, 595 x 842 pt). Poster có thể bị tràn khổ.`)
  }
}

try {
  checkConfig(config)
} catch (error) {
  fail((error as Error).message)
}

function writeQrFiles(): void {
  rmSync(join(outDir, 'qr'), { recursive: true, force: true })
  mkdirSync(join(outDir, 'qr'), { recursive: true })
  for (const [name, asset] of buildQrAssets(config)) writeFileSync(join(outDir, name), asset.body)
}

if (qrOnly) {
  writeQrFiles()
  console.log(`✓ Đã xuất mã QR vào ${join(outDir, 'qr')}${config.siteUrl ? '' : ' (chưa có mã website vì siteUrl còn trống)'}`)
  process.exit(0)
}

if (posterNeedsSiteUrl(config)) {
  fail(
    'Poster có mã website nhưng siteUrl trong src/config.ts đang trống.\n' +
      '  Deploy trước, rồi điền địa chỉ thật vào siteUrl (xem README, mục "Triển khai"), sau đó chạy lại.\n' +
      "  Hoặc đổi poster.qrCodes thành ['wifi'] nếu router đã có captive portal.",
  )
}

const buildDir = mkdtempSync(join(tmpdir(), 'district-h-build-'))
try {
  console.log('→ Build website…')
  execFileSync('npx', ['vite', 'build', '--outDir', buildDir, '--emptyOutDir', '--logLevel', 'warn'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, DISTRICT_H_WITH_POSTER: '1' },
  })

  mkdirSync(outDir, { recursive: true })
  const pdf = join(outDir, 'poster-a4.pdf')
  console.log('→ Xuất poster A4 (PDF) bằng Chrome…')
  const site = await serve(buildDir)
  try {
    writeFileSync(pdf, await printToPdf(findChrome(), `${site.origin}/poster.html`))
  } finally {
    site.close()
  }
  assertSingleA4Page(pdf)

  writeQrFiles()
} finally {
  rmSync(buildDir, { recursive: true, force: true })
}

console.log(`\n✓ Đã xuất vào ${outDir}`)
console.log('   poster-a4.pdf, qr/*.png (in được), qr/*.svg (vector)')
console.log(`   Mã trên poster: ${config.poster.qrCodes.join(' + ')}${config.siteUrl ? `, website = ${config.siteUrl}` : ''}`)
console.log('   Kiểm tra: npm run verify:qr -- --files print/qr')
