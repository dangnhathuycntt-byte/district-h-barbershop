/**
 * Dựng HTML (lúc build / lúc chạy dev) và các file QR từ `config.ts`.
 * File này chạy trên Node, không vào bundle của trình duyệt.
 */
import { config as baseConfig, type SiteConfig } from './config.ts'
import { esc } from './lib/html.ts'
import { icon } from './lib/icons.ts'
import { qrPng } from './lib/png.ts'
import { qrMatrix, qrSvg } from './lib/qr.ts'
import { wifiPayload } from './lib/wifi.ts'

/**
 * Cấu hình đang dùng. Đặt DISTRICT_H_SITE_URL để xem thử poster/QR với một địa chỉ tạm mà không sửa
 * src/config.ts (README, mục "Xem thử"). Địa chỉ thật luôn lấy từ siteUrl trong config.
 */
export const config: SiteConfig = process.env.DISTRICT_H_SITE_URL
  ? { ...baseConfig, siteUrl: process.env.DISTRICT_H_SITE_URL }
  : baseConfig

export type PageKind = 'home' | 'poster'

export interface Asset {
  type: string
  body: string | Buffer
}

const WIFI_QR_BASENAME = 'qr/district-h-wifi-qr'
const SITE_QR_BASENAME = 'qr/district-h-website-qr'

/** "Wi-Fi" không được ngắt dòng ở dấu gạch nối. */
const WIFI = '<span class="nw">Wi-Fi</span>'
const prose = (text: string): string => esc(text).replace(/Wi-Fi/g, WIFI)

/** Địa chỉ in trên poster: tên miền và đường dẫn mỗi phần liền một khối, chỉ được xuống dòng giữa hai phần. */
function urlText(url: string): string {
  const { origin } = new URL(url)
  const rest = url.slice(origin.length)
  return `<span class="nw">${esc(origin)}</span>${rest ? `<wbr><span class="nw">${esc(rest)}</span>` : ''}`
}

const isHttps = (value: string): boolean => {
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

/** Báo lỗi sớm, bằng tiếng Việt, khi config sai thay vì để ra mã QR hỏng. */
export function checkConfig(c: SiteConfig = config): void {
  const problems: string[] = []
  const ssidBytes = Buffer.byteLength(c.wifi.ssid)
  if (ssidBytes < 1 || ssidBytes > 32) problems.push('wifi.ssid phải dài 1 đến 32 byte.')
  if (c.wifi.password.length < 8 || c.wifi.password.length > 63) problems.push('wifi.password (WPA) phải dài 8 đến 63 ký tự.')
  if (!isHttps(c.links.zalo)) problems.push('links.zalo phải là địa chỉ https hợp lệ.')
  if (!isHttps(c.links.maps)) problems.push('links.maps phải là địa chỉ https hợp lệ.')
  if (c.siteUrl && !isHttps(c.siteUrl)) problems.push('siteUrl phải là địa chỉ https đầy đủ (ví dụ https://ten-mien.vn/) hoặc để rỗng.')
  if (c.poster.qrCodes.length === 0 || c.poster.qrCodes.some((q) => q !== 'wifi' && q !== 'site')) {
    problems.push("poster.qrCodes chỉ gồm 'wifi' và/hoặc 'site', ít nhất một mã.")
  }
  if (problems.length) throw new Error(`Cấu hình trong src/config.ts chưa đúng:\n- ${problems.join('\n- ')}`)
}

/** Poster có cần mã website mà siteUrl vẫn đang trống? Script in poster dùng hàm này để từ chối xuất file. */
export function posterNeedsSiteUrl(c: SiteConfig = config): boolean {
  return c.poster.qrCodes.includes('site') && !c.siteUrl
}

/* ------------------------------------------------------------------ */
/* File QR (PNG in được + SVG vector)                                  */
/* ------------------------------------------------------------------ */

export function buildQrAssets(c: SiteConfig = config): Map<string, Asset> {
  checkConfig(c)
  const assets = new Map<string, Asset>()

  const wifi = qrMatrix(wifiPayload(c.wifi))
  assets.set(`${WIFI_QR_BASENAME}.png`, { type: 'image/png', body: qrPng(wifi) })
  assets.set(`${WIFI_QR_BASENAME}.svg`, {
    type: 'image/svg+xml',
    body: qrSvg(wifi, { light: '#fff', label: `Mã QR Wi-Fi ${c.wifi.ssid}`, physicalSize: '100mm' }),
  })

  if (c.siteUrl) {
    const site = qrMatrix(c.siteUrl)
    assets.set(`${SITE_QR_BASENAME}.png`, { type: 'image/png', body: qrPng(site) })
    assets.set(`${SITE_QR_BASENAME}.svg`, {
      type: 'image/svg+xml',
      body: qrSvg(site, { light: '#fff', label: `Mã QR website ${c.shop.name}`, physicalSize: '100mm' }),
    })
  }
  return assets
}

/* ------------------------------------------------------------------ */
/* Phần dùng chung                                                     */
/* ------------------------------------------------------------------ */

function wordmark(c: SiteConfig, extraClass = ''): string {
  const { main, accent, sub } = c.shop.wordmark
  const letters = [...sub].map((ch) => `<span>${esc(ch)}</span>`).join('')
  return (
    `<h1 class="wordmark ${extraClass}">` +
    `<span class="sr-only">${esc(c.shop.name)}</span>` +
    `<span class="wordmark__main" aria-hidden="true">${esc(main)} <span class="wordmark__accent">${esc(accent)}</span></span>` +
    `<span class="wordmark__sub" aria-hidden="true">${letters}</span>` +
    `</h1>`
  )
}

/** Tên mạng / mật khẩu: giữ nguyên chữ, tắt dịch tự động của trình duyệt. */
function credentials(c: SiteConfig, ids = true): string {
  const id = (name: string) => (ids ? ` id="${name}"` : '')
  return (
    `<dl class="menu">` +
    `<div class="menu__row"><dt>Tên mạng</dt><dd${id('wifi-ssid')} translate="no">${esc(c.wifi.ssid)}</dd></div>` +
    `<div class="menu__row"><dt>Mật khẩu</dt><dd${id('wifi-password')} class="menu__secret" translate="no">${esc(c.wifi.password)}</dd></div>` +
    `</dl>`
  )
}

/* ------------------------------------------------------------------ */
/* Trang chủ                                                           */
/* ------------------------------------------------------------------ */

function homeHead(c: SiteConfig): string {
  const title = `${c.shop.name} · Wi-Fi, nhóm Zalo, đường đi`
  const description = `Kết nối Wi-Fi, tham gia nhóm Zalo và xem đường đi đến ${c.shop.name}.`
  const url = c.siteUrl ? `<link rel="canonical" href="${esc(c.siteUrl)}"><meta property="og:url" content="${esc(c.siteUrl)}">` : ''
  return [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}">`,
    // Trang có mật khẩu Wi-Fi công khai: không cho công cụ tìm kiếm lập chỉ mục.
    `<meta name="robots" content="noindex, nofollow">`,
    `<meta name="theme-color" content="#f3eee5">`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:title" content="${esc(title)}">`,
    `<meta property="og:description" content="${esc(description)}">`,
    url,
  ].join('\n    ')
}

function homeBody(c: SiteConfig): string {
  const wifi = qrMatrix(wifiPayload(c.wifi))
  const wifiSvg = qrSvg(wifi, {
    light: '#fff',
    label: `Mã QR Wi-Fi ${c.wifi.ssid}`,
    className: 'qr__svg',
  })
  const external = `target="_blank" rel="noopener noreferrer"`

  return `
    <div class="page">
      <header class="masthead">
        ${wordmark(c)}
        <p class="welcome">${prose(c.shop.welcome)}</p>
        <span class="rule" aria-hidden="true"></span>
      </header>

      <main class="content">
        <section class="block" aria-labelledby="wifi-title">
          <h2 class="block__title" id="wifi-title">Wi-Fi</h2>
          ${credentials(c)}
          <div class="actions">
            <button type="button" class="btn btn--primary" data-connect aria-expanded="false" aria-controls="connect-guide">
              ${icon('wifi')}<span>Kết nối Wi-Fi</span>
            </button>
            <button type="button" class="btn" data-copy data-label-done="Đã sao chép">
              ${icon('copy', 'icon icon--idle')}${icon('check', 'icon icon--done')}<span data-copy-label>Sao chép mật khẩu</span>
            </button>
          </div>
          <p class="status" role="status" aria-live="polite" data-status></p>
          <div class="guide" id="connect-guide">
            <p>Trang web không thể tự nối điện thoại vào ${WIFI}, nên bạn chọn mạng theo các bước sau:</p>
            <ol>
              <li>Mở <strong>Cài đặt</strong>, vào mục <strong>${WIFI}</strong>.</li>
              <li>Chọn mạng <strong translate="no">${esc(c.wifi.ssid)}</strong>.</li>
              <li>Nhập hoặc dán mật khẩu rồi nhấn <strong>Kết nối</strong>.</li>
            </ol>
          </div>
          <div class="qr">
            <div class="qr__frame">${wifiSvg}</div>
            <div class="qr__text">
              <h3>Mã QR ${WIFI}</h3>
              <p>Quét bằng camera của một điện thoại khác để vào mạng ngay.</p>
              <p class="qr__downloads">
                <a href="${WIFI_QR_BASENAME}.png" download>${icon('download')}Tải PNG</a>
                <a href="${WIFI_QR_BASENAME}.svg" download>${icon('download')}Tải SVG</a>
              </p>
            </div>
            <p class="qr__note">Một số điện thoại cần quét mã ${WIFI} mới vào được mạng. Nếu không quét được, hãy chọn mạng và nhập mật khẩu bằng tay.</p>
          </div>
        </section>

        <section class="block" aria-labelledby="zalo-title">
          <h2 class="block__title" id="zalo-title">Nhóm Zalo</h2>
          <p>Tham gia nhóm Zalo của District H để nhận thông tin từ tiệm. Việc tham gia hoàn toàn tự nguyện, bạn có thể bỏ qua.</p>
          <div class="actions actions--single">
            <a class="btn" href="${esc(c.links.zalo)}" ${external}>
              ${icon('users')}<span>Tham gia nhóm Zalo</span>${icon('arrow-up-right', 'icon icon--trail')}
            </a>
          </div>
        </section>

        <section class="block" aria-labelledby="map-title">
          <h2 class="block__title" id="map-title">Đường đi</h2>
          <p>Mở Google Maps để xem đường đến ${esc(c.shop.name)}.</p>
          <div class="actions actions--single">
            <a class="btn" href="${esc(c.links.maps)}" ${external}>
              ${icon('map-pin')}<span>Xem đường đi</span>${icon('arrow-up-right', 'icon icon--trail')}
            </a>
          </div>
        </section>
      </main>

      <footer class="footer">
        <p class="footer__name">${esc(c.shop.name)}</p>
        <p>${esc(c.shop.thanks)}</p>
      </footer>
    </div>`
}

/* ------------------------------------------------------------------ */
/* Poster A4                                                           */
/* ------------------------------------------------------------------ */

function posterHead(c: SiteConfig): string {
  return [
    `<title>Poster A4 · ${esc(c.shop.name)}</title>`,
    `<meta name="robots" content="noindex, nofollow">`,
    `<meta name="theme-color" content="#ffffff">`,
  ].join('\n    ')
}

function posterBody(c: SiteConfig): string {
  const wifiQr = qrSvg(qrMatrix(wifiPayload(c.wifi)), {
    label: `Mã QR Wi-Fi ${c.wifi.ssid}`,
    className: 'poster-qr',
    exposeModules: true,
  })

  const siteQr = c.siteUrl
    ? qrSvg(qrMatrix(c.siteUrl), { label: `Mã QR website ${c.shop.name}`, className: 'poster-qr', exposeModules: true })
    : `<div class="poster-qr poster-qr--draft" role="img" aria-label="Chưa có địa chỉ website"><p>Chưa có địa chỉ website</p><p>Điền <code>siteUrl</code> trong <code>src/config.ts</code> rồi build lại</p></div>`

  const numbered = c.poster.qrCodes.length > 1
  const num = (n: number) => (numbered ? `<span class="step__num" aria-hidden="true">${n}</span>` : '')

  const steps = c.poster.qrCodes.map((kind, index) => {
    if (kind === 'wifi') {
      return `
      <section class="step step--wifi${numbered ? '' : ' step--solo'}" aria-labelledby="p-wifi">
        <div class="step__qr">${wifiQr}</div>
        <div class="step__text">
          <h2 id="p-wifi">${num(index + 1)}<span>Kết nối ${WIFI}</span></h2>
          <p>Mở camera điện thoại, hướng vào mã rồi chạm vào thông báo hiện ra để tham gia mạng. Mã này dùng được cả khi điện thoại chưa có internet.</p>
        </div>
        <div class="step__creds">
          ${credentials(c, false)}
          <p class="step__note">Không quét được? Chọn đúng tên mạng và nhập mật khẩu ở trên.</p>
        </div>
      </section>`
    }
    return `
      <section class="step step--site" aria-labelledby="p-site">
        <div class="step__qr">${siteQr}</div>
        <div class="step__text">
          <h2 id="p-site">${num(index + 1)}<span>Nhóm Zalo và đường đi</span></h2>
          <p>Khi đã vào mạng, quét mã này để xem nhóm Zalo (không bắt buộc) và đường đi đến tiệm.</p>
          <p class="step__fallback">Hoặc mở địa chỉ: <strong translate="no">${c.siteUrl ? urlText(c.siteUrl) : 'chưa có địa chỉ'}</strong></p>
        </div>
      </section>`
  })

  return `
    <div class="sheet">
      <div class="frame">
        <header class="poster-head">${wordmark(c, 'wordmark--poster')}</header>
        <main class="steps">${steps.join('\n')}</main>
        <footer class="poster-foot"><p>${esc(c.shop.name)} · ${esc(c.shop.thanks)}</p></footer>
      </div>
    </div>`
}

/* ------------------------------------------------------------------ */

export function renderPage(kind: PageKind, c: SiteConfig = config): { head: string; body: string } {
  checkConfig(c)
  return kind === 'home' ? { head: homeHead(c), body: homeBody(c) } : { head: posterHead(c), body: posterBody(c) }
}
