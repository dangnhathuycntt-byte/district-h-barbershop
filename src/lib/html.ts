const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

/** Escape mọi giá trị lấy từ config trước khi đưa vào HTML. */
export const esc = (value: string): string => value.replace(/[&<>"']/g, (ch) => ENTITIES[ch]!)
