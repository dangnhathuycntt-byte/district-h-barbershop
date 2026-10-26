/**
 * THÔNG TIN CỦA TIỆM: sửa ở đây là đủ.
 * Website, poster và mã QR đều đọc từ file này (xem README, mục "Cập nhật thông tin").
 */

export interface SiteConfig {
  shop: {
    /** Tên đầy đủ, dùng cho tiêu đề trang và chân trang. */
    name: string
    /** Tên hiệu: `main` + `accent` ghép thành dòng lớn (chữ `accent` màu đồng), `sub` là dòng nhỏ bên dưới. */
    wordmark: { main: string; accent: string; sub: string }
    /** Lời chào ngắn ở đầu trang. */
    welcome: string
    /** Lời cảm ơn kín đáo ở chân trang. */
    thanks: string
  }
  wifi: {
    /** Tên mạng (SSID), gõ đúng từng chữ hoa/thường và khoảng trắng. */
    ssid: string
    password: string
    /** true nếu mạng bị ẩn tên. */
    hidden: boolean
  }
  links: {
    zalo: string
    maps: string
  }
  /**
   * Địa chỉ website thật SAU KHI deploy, ví dụ 'https://ten-mien.vn/'.
   * Để rỗng cho tới khi có địa chỉ thật; không điền địa chỉ đoán.
   * Khi rỗng, mã QR website chưa được tạo.
   */
  siteUrl: string
  poster: {
    /**
     * Poster in những mã nào, theo thứ tự từ trên xuống:
     *  - ['wifi', 'site']: Wi-Fi trước, website sau (dùng với router thường).
     *  - ['wifi']: chỉ mã Wi-Fi (dùng khi router đã bật captive portal trỏ về website).
     */
    qrCodes: Array<'wifi' | 'site'>
  }
}

export const config: SiteConfig = {
  shop: {
    name: 'District H Barbershop',
    wordmark: { main: 'DISTRICT', accent: 'H', sub: 'BARBERSHOP' },
    welcome: 'Chào mừng bạn đến District H. Kết nối Wi-Fi, ghé nhóm Zalo hoặc xem đường đi ngay bên dưới.',
    thanks: 'Cảm ơn bạn đã ghé tiệm.',
  },
  wifi: {
    ssid: 'District H barbershop 5g',
    password: '156haibatrung',
    hidden: false,
  },
  links: {
    zalo: 'https://zalo.me/g/qblcao077',
    maps: 'https://maps.app.goo.gl/z6VG47DSj9sHhTM7A?g_st=iz',
  },
  siteUrl: 'https://dangnhathuycntt-byte.github.io/district-h-barbershop/',
  poster: {
    qrCodes: ['wifi', 'site'],
  },
}
