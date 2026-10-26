import { resolve } from 'node:path'
import { defineConfig, type Plugin, type ViteDevServer } from 'vite'

type Site = typeof import('./src/site.ts')

/**
 * Dựng trang từ src/config.ts:
 *  - thay <!--head--> và <!--app--> trong index.html / poster.html bằng HTML đã render sẵn,
 *  - tạo các file mã QR (qr/*.png, qr/*.svg) khi build, và phục vụ chúng khi chạy dev.
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
      s.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]!.replace(/^\//, '')
        if (!path.startsWith('qr/')) return next()
        const asset = (await loadSite()).buildQrAssets().get(path)
        if (!asset) return next()
        res.setHeader('Content-Type', asset.type)
        res.end(asset.body)
      })
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

    async generateBundle() {
      const { buildQrAssets } = await loadSite()
      for (const [fileName, asset] of buildQrAssets()) {
        this.emitFile({ type: 'asset', fileName, source: asset.body })
      }
    },
  }
}

export default defineConfig({
  // Đường dẫn tương đối: chạy được trên GitHub Pages (kể cả thư mục con), Cloudflare Pages, tên miền riêng.
  base: './',
  plugins: [districtH()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        poster: resolve(import.meta.dirname, 'poster.html'),
      },
    },
  },
})
