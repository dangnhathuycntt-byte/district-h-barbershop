import { encode } from 'uqr'

/** Vùng yên tĩnh theo chuẩn QR: tối thiểu 4 module trống quanh mã. */
export const QUIET_ZONE = 4

export interface QrMatrix {
  size: number
  data: boolean[][]
}

/**
 * ECC 'M' (chịu được ~15% hư hại): với chuỗi Wi-Fi dài ~55 ký tự, M cho mã 33x33 module,
 * thưa hơn nên quét ở xa dễ hơn mức H. Poster dán tường vẫn dư sức chịu trầy xước nhẹ.
 */
export function qrMatrix(text: string): QrMatrix {
  const { data, size } = encode(text, { ecc: 'M', border: 0 })
  return { size, data }
}

/** Gộp các module đen liền nhau trên một hàng thành một đường vẽ để SVG nhỏ gọn. */
function modulePath(matrix: QrMatrix, offset: number): string {
  const parts: string[] = []
  matrix.data.forEach((row, y) => {
    let x = 0
    while (x < matrix.size) {
      if (!row[x]) {
        x += 1
        continue
      }
      let end = x
      while (end < matrix.size && row[end]) end += 1
      parts.push(`M${x + offset} ${y + offset}h${end - x}v1h-${end - x}z`)
      x = end
    }
  })
  return parts.join('')
}

export interface SvgOptions {
  /** Màu module. Luôn giữ đen/gần đen để máy quét nhận ra; không tô màu thương hiệu. */
  dark?: string
  /** Màu nền. Bỏ trống để trong suốt (đặt trên giấy trắng/nền sáng). */
  light?: string
  /** Mô tả cho người dùng đọc màn hình. */
  label: string
  className?: string
  /** Kích thước vật lý khi mở trong phần mềm in, ví dụ '100mm'. Bỏ trống để CSS tự quyết định. */
  physicalSize?: string
  /** Ghi số module (cả vùng yên tĩnh) vào biến CSS --qr-modules để CSS canh mép mã theo module đen. */
  exposeModules?: boolean
}

export function qrSvg(matrix: QrMatrix, options: SvgOptions): string {
  const full = matrix.size + QUIET_ZONE * 2
  const background = options.light ? `<rect width="${full}" height="${full}" fill="${options.light}"/>` : ''
  const cls = options.className ? ` class="${options.className}"` : ''
  const dims = options.physicalSize ? ` width="${options.physicalSize}" height="${options.physicalSize}"` : ''
  const vars = options.exposeModules ? ` style="--qr-modules:${full}"` : ''
  return (
    `<svg${cls}${vars} xmlns="http://www.w3.org/2000/svg"${dims} viewBox="0 0 ${full} ${full}" ` +
    `role="img" aria-label="${options.label}" shape-rendering="crispEdges">` +
    `${background}<path fill="${options.dark ?? '#000'}" d="${modulePath(matrix, QUIET_ZONE)}"/></svg>`
  )
}
