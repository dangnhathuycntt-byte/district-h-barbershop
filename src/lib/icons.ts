import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const cache = new Map<string, string>()

/**
 * Icon Lucide (ISC) nhúng thẳng vào HTML lúc build: không tải thêm file, không cần JS.
 * Kích thước do CSS (`.icon`) quyết định; luôn ẩn với trình đọc màn hình vì nút đã có chữ.
 */
export function icon(name: string, className = 'icon'): string {
  const key = `${name}|${className}`
  const hit = cache.get(key)
  if (hit) return hit

  const file = fileURLToPath(new URL(`../../node_modules/lucide-static/icons/${name}.svg`, import.meta.url))
  const svg = readFileSync(file, 'utf8')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s*(width|height)="24"/g, '')
    .replace(/<svg\s+class="[^"]*"/, `<svg class="${className}" aria-hidden="true" focusable="false"`)
    .replace(/\s+/g, ' ')
    .replace(/> </g, '><')
    .trim()
  cache.set(key, svg)
  return svg
}
