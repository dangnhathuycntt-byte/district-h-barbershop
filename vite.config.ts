import { resolve } from 'node:path'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'

type Site = typeof import('./src/site.ts')

/**
 * Dựng trang từ src/config.ts:
 *  - thay <!--head--> và <!--app--> trong index.html / poster.html bằng HTML đã render sẵn,
 * File mã QR không được phát hành cùng website: chúng được xuất riêng bằng `npm run qr` / `npm run print`.
 */
function districtH(): Plugin {
  let server: ViteDevServer | undefined

  // Khi dev, nạp lại module qua Vite để sửa config là thấy ngay.
  const loadSite = async (): Promise<Site> =>
    server ? ((await server.ssrLoadModule('/src/site.ts')) as Site) : await import('./src/site.ts')

  return {
    name: 'district-h',

    configureServer(s) {
      server = s
    },

    handleHotUpdate({ file, server: s }) {
      if (/[\\/]src[\\/](config|site)\.ts$|[\\/]src[\\/]lib[\\/]/.test(file)) {
        s.ws.send({ type: 'full-reload' })
        return []
      }
    },

    async transformIndexHtml(html, ctx) {
      const { renderPage } = await loadSite()
      const { head, body } = renderPage(ctx.filename.endsWith('poster.html') ? 'poster' : 'home')
      return html.replace('<!--head-->', head).replace('<!--app-->', body)
    },
  }
}

// Trang poster có tên mạng và mật khẩu Wi-Fi nên chỉ được dựng khi in (`npm run print`), không đăng cùng website.
// Khi chạy `npm run dev`, /poster.html vẫn mở được để xem thử.
const withPoster = process.env.DISTRICT_H_WITH_POSTER === '1'

export default defineConfig({
  // Đường dẫn tương đối: chạy được trên GitHub Pages (kể cả thư mục con), Cloudflare Pages, tên miền riêng.
  base: './',
  plugins: [districtH()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        ...(withPoster && { poster: resolve(import.meta.dirname, 'poster.html') }),
      },
    },
  },
})
