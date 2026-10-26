/**
 * Máy chủ tĩnh nhỏ cho thư mục dist/, dùng phía sau Cloudflare Tunnel (hoặc để xem thử bản build).
 *
 *   npm run build && npm run serve      # http://127.0.0.1:3020
 *
 * Biến môi trường: PORT (mặc định 3020), HOST (mặc định 127.0.0.1), DIST (mặc định <dự án>/dist).
 * Không liệt kê thư mục, không đọc ra ngoài DIST. Đọc file theo từng yêu cầu nên build lại là có
 * nội dung mới ngay, không cần khởi động lại.
 */
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, resolve, sep } from 'node:path'

const root = resolve(process.env.DIST ?? join(import.meta.dirname, '..', 'dist'))
const port = Number(process.env.PORT ?? 3020)
const host = process.env.HOST ?? '127.0.0.1'

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
}

/**
 * Tệp có hash trong tên (assets/) đổi tên khi đổi nội dung nên được cache lâu; còn lại luôn hỏi lại.
 * `no-transform` ở mọi phản hồi: Cloudflare (và proxy nói chung) không được sửa nội dung. Nó chặn việc
 * Cloudflare tự chèn thẻ Web Analytics vào HTML (trang này cam kết không có analytics) và giữ ảnh mã QR
 * không bị các bộ tối ưu ảnh làm mờ module.
 */
function cacheControl(urlPath: string): string {
  if (urlPath.startsWith('/assets/')) return 'public, max-age=31536000, immutable, no-transform'
  if (urlPath.startsWith('/fonts/')) return 'public, max-age=86400, no-transform'
  return 'public, no-cache, no-transform'
}

function locate(urlPath: string): string | undefined {
  let decoded: string
  try {
    decoded = decodeURIComponent(urlPath)
  } catch {
    return undefined
  }
  if (decoded.includes('\0')) return undefined
  const target = resolve(root, `.${decoded}`)
  if (target !== root && !target.startsWith(root + sep)) return undefined
  try {
    const stat = statSync(target)
    if (stat.isFile()) return target
    if (stat.isDirectory()) {
      const index = join(target, 'index.html')
      return statSync(index).isFile() && decoded.endsWith('/') ? index : undefined
    }
  } catch {
    return undefined
  }
  return undefined
}

createServer((req, res) => {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    // Trang có mật khẩu Wi-Fi công khai: nói rõ với bộ máy tìm kiếm ở cả tầng HTTP.
    'X-Robots-Tag': 'noindex, nofollow',
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { ...headers, Allow: 'GET, HEAD' }).end()
    return
  }
  const urlPath = (req.url ?? '/').split('?')[0]!
  const file = locate(urlPath)
  if (!file) {
    res.writeHead(404, { ...headers, 'Content-Type': 'text/plain; charset=utf-8' }).end('Không tìm thấy trang này.')
    return
  }
  res.writeHead(200, {
    ...headers,
    'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
    'Content-Length': statSync(file).size,
    'Cache-Control': cacheControl(urlPath),
  })
  if (req.method === 'HEAD') {
    res.end()
    return
  }
  createReadStream(file)
    .on('error', () => res.destroy())
    .pipe(res)
}).listen(port, host, () => {
  console.log(`Phục vụ ${root} tại http://${host}:${port}`)
})
