/**
 * Chuỗi mã QR Wi-Fi theo định dạng ZXing (iOS Camera 11+ và Android Camera/Lens đều đọc được):
 *   WIFI:T:WPA;S:<ssid>;P:<mật khẩu>;H:true;;
 * Ký tự \ ; , : " phải thêm dấu \ phía trước.
 */

const escapeField = (value: string): string => value.replace(/([\\;,:"])/g, '\\$1')

/**
 * Giá trị chỉ gồm 0-9a-f bị một số máy hiểu là mã hex; ZXing quy ước bọc trong dấu ngoặc kép
 * để báo đây là chuỗi chữ. Mật khẩu hiện tại không bị ảnh hưởng, nhưng đổi sang toàn số thì có.
 */
const protectHex = (value: string): string => (/^[0-9a-f]+$/i.test(value) ? `"${value}"` : value)

export function wifiPayload(wifi: { ssid: string; password: string; hidden: boolean }): string {
  const ssid = protectHex(escapeField(wifi.ssid))
  const password = protectHex(escapeField(wifi.password))
  return `WIFI:T:WPA;S:${ssid};P:${password};${wifi.hidden ? 'H:true;' : ''};`
}
