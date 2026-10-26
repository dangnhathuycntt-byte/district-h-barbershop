/**
 * Chỉ tăng cường trải nghiệm; mọi thông tin và liên kết đã có sẵn trong HTML.
 *  - "Sao chép mật khẩu": chép vào clipboard.
 *  - "Kết nối Wi-Fi": mở hướng dẫn tự nối (web không thể tự nối Wi-Fi) và chép mật khẩu.
 */

const password = document.querySelector<HTMLElement>('#wifi-password')
const statusLine = document.querySelector<HTMLElement>('[data-status]')
const guide = document.querySelector<HTMLElement>('#connect-guide')
const connectButton = document.querySelector<HTMLButtonElement>('[data-connect]')
const copyButton = document.querySelector<HTMLButtonElement>('[data-copy]')
const copyLabel = copyButton?.querySelector<HTMLElement>('[data-copy-label]')

function say(message: string): void {
  if (statusLine) statusLine.textContent = message
}

/** Dự phòng cho trình duyệt/ngữ cảnh không có Clipboard API (ví dụ mở bằng http). */
function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea')
  field.value = text
  field.setAttribute('readonly', '')
  field.style.cssText = 'position:fixed;top:0;left:0;opacity:0'
  document.body.append(field)
  field.select()
  field.setSelectionRange(0, text.length)
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    field.remove()
  }
}

/** Phải được gọi ngay trong sự kiện bấm của người dùng (Safari đòi như vậy). */
async function copyPassword(): Promise<boolean> {
  const text = password?.textContent?.trim()
  if (!text) return false
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return legacyCopy(text)
  }
}

let resetTimer: number | undefined
async function copyWithFeedback(): Promise<void> {
  const ok = await copyPassword()
  say(ok ? 'Đã sao chép mật khẩu.' : 'Không sao chép được. Hãy chạm giữ vào mật khẩu để chép thủ công.')
  if (!ok || !copyButton || !copyLabel) return
  const idle = copyLabel.textContent
  copyButton.dataset.state = 'done'
  copyLabel.textContent = copyButton.dataset.labelDone ?? 'Đã sao chép'
  window.clearTimeout(resetTimer)
  resetTimer = window.setTimeout(() => {
    delete copyButton.dataset.state
    if (idle) copyLabel.textContent = idle
  }, 2400)
}

copyButton?.addEventListener('click', () => {
  void copyWithFeedback()
})

connectButton?.addEventListener('click', () => {
  if (!guide) return
  const willOpen = !guide.classList.contains('is-open')
  guide.classList.toggle('is-open', willOpen)
  connectButton.setAttribute('aria-expanded', String(willOpen))
  if (willOpen) void copyWithFeedback()
})
