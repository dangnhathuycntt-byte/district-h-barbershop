---
name: District H Barbershop
description: Trang landing QR và poster A4 của một tiệm cắt tóc, editorial tối giản, nền off-white ấm, chữ gần đen, nhấn đồng.
colors:
  paper: "#f3eee5"
  paper-deep: "#e9e2d4"
  ink: "#17130f"
  ink-soft: "#4b4339"
  muted: "#6a5f52"
  bronze: "#8a5a24"
  bronze-deep: "#6b4418"
  qr-white: "#ffffff"
typography:
  display:
    fontFamily: "'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "clamp(3.6rem, 21vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.86
    letterSpacing: "normal"
  headline:
    fontFamily: "'Barlow Condensed', 'Roboto Condensed', 'Arial Narrow', sans-serif"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "0.02em"
  body:
    fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "'Be Vietnam Pro', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.25
rounded:
  sm: "2px"
spacing:
  gutter: "1.25rem"
  gap: "0.75rem"
  block: "2rem"
components:
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.4rem"
    height: "3.25rem"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
---

# Design System: District H Barbershop

## Overview

Một thanh dao cạo thẳng: tối giản, nam tính, chỉ có logo của tiệm, chữ, đường kẻ mảnh và một điểm nhấn đồng. Trang được dùng trong vài giây, trên điện thoại, bởi khách đang ngồi chờ trong tiệm, nên mọi thứ phục vụ một việc: tuỳ chọn vào nhóm Zalo hoặc xem đường đi (Wi-Fi do mã QR trên poster lo, trang web không có).

Màu nền off-white ấm, chữ gần đen và điểm nhấn đồng do **brief của chủ tiệm chỉ định** (trình dò Impeccable báo `cream-palette`; đây là chủ ý, không phải mặc định). Phần còn lại (chữ condensed đậm, đường kẻ, bảng thông tin kiểu bảng giá) được chọn để tránh bộ mặt "serif + kem + đất nung" quen thuộc.

Không có thẻ (card) làm khung trang, không gradient, không emoji, không bóng đổ. Cấu trúc là các hàng ngăn bằng đường kẻ 1px.

## Colors

- **Paper (#f3eee5)**: nền trang web. **White (#ffffff)** chỉ dùng cho poster và nền mã QR, vì mã QR luôn là module đen thuần trên nền trắng.
- **Ink (#17130f)**: chữ chính, nút chính, đường kẻ nhấn. **Ink-soft (#4b4339)** cho đoạn văn phụ (tương phản ~8:1 trên paper). **Muted (#6a5f52)** cho chú thích nhỏ (~5,4:1).
- **Bronze (#8a5a24)**: duy nhất một điểm nhấn: đường kẻ dưới lời chào, khung focus, khung và số bước trên poster. Tương phản ~5,1:1 trên paper nên dùng được cho chữ nhỏ. **Bronze-deep (#6b4418)** chỉ còn dùng cho chữ trong khung nháp của poster (khi chưa có `siteUrl`).
- Quy tắc: không tô màu thương hiệu lên mã QR; không dùng đồng làm nền mảng lớn.

## Typography

- **Barlow Condensed 700** (tự host, subset latin + vietnamese): tiêu đề mục và số bước. Luôn in hoa.
- **Be Vietnam Pro 400/600** (tự host): mọi nội dung còn lại. Họ chữ thiết kế riêng cho dấu tiếng Việt, nên dấu chồng (ờ, ể, ặ) không bị dính.
- Thang: tiêu đề mục 2rem; thân 1rem/1.6; chú thích 0,9 đến 0,95rem. Đoạn văn tối đa 38 đến 44ch. `text-wrap: pretty` cho đoạn, `balance` cho tiêu đề. "Wi-Fi" luôn được bọc `nowrap` để không bị ngắt ở dấu gạch.
- Giá trị Wi-Fi dùng `tabular-nums` và `translate="no"`.

## Layout

- Mobile trước: một cột `min(100% - 2.5rem, 30rem)`. Các mục là hàng ngăn bằng đường kẻ `1px` (`--line`), khoảng đệm dọc 2rem.
- Từ 62rem: hai cột, logo bên trái (sticky, rộng 20rem; điện thoại 15rem), nội dung bên phải, chân trang trải cả hai cột.
- Poster A4 (210 x 297 mm): khung đồng 0,35mm cách mép 12mm; logo (cao 42mm, căn giữa), rồi bước 1 (mã Wi-Fi to nhất, thông tin gõ tay bên dưới), rồi bước 2 (mã website). Các module đen của mã canh thẳng mép chữ, vùng yên tĩnh 4 module nằm ngoài mép cột.

## Elevation & Depth

Phẳng hoàn toàn. Không bóng đổ trên website (poster chỉ có bóng khi xem trên màn hình để thấy mép giấy, tắt khi in). Phân cấp đến từ cỡ chữ, độ đậm và đường kẻ.

## Shapes

Góc gần vuông (`2px`), như lưỡi dao thẳng. Viền nút `1.5px`. Ô mã QR vuông, không bo.

## Components

- **Nút viền** (`button-outline`): viền ink 1,5px, nền trong suốt; hover/active đảo màu. Dùng cho "Tham gia nhóm Zalo" và "Xem đường đi", là hai nút duy nhất của trang chủ. Cao 3,25rem (52px), căn trái, icon Lucide 1,25rem nét 2px; liên kết ngoài có thêm mũi tên ở cuối.
- **Logo**: ảnh PNG nền trong suốt ở màu ink (`public/logo.png`), tạo từ ảnh logo trắng trên nền đen do chủ tiệm gửi (bản gốc ở `brand/logo-original.png`); không vẽ lại, không đổi tỷ lệ, không tô màu thương hiệu. Là tiêu đề `h1` của trang, chữ thay thế là tên tiệm.
- **Mã QR** (chỉ có trên poster): module đen thuần trên nền trắng, không bo, không viền trang trí.
- **Focus**: viền liền 3px bronze, cách 3px. **Chọn chữ**: nền bronze, chữ paper. Thanh cuộn, caret, accent-color đều theo bronze.
- **Chuyển động**: một khoảnh khắc duy nhất khi mở trang (logo "trồi lên", đường kẻ vẽ ra, lời chào hiện dần), đường cong ease-out mũ, tắt hoàn toàn với `prefers-reduced-motion`. Nội dung luôn hiện sẵn nếu hoạt ảnh không chạy.

## Do's and Don'ts

- **Do** giữ một điểm nhấn đồng, một khoảnh khắc chuyển động, và mọi thông tin trong HTML (không phụ thuộc JS).
- **Do** giữ mã QR đen thuần trên nền trắng với vùng yên tĩnh đủ 4 module.
- **Don't** thêm thẻ lồng nhau, gradient, emoji, bóng đổ, hay icon làm đồ trang trí; không đặt nhãn nhỏ (eyebrow) phía trên tiêu đề.
- **Don't** viết bất kỳ chữ nào nói rằng trang web tự kết nối Wi-Fi.
- **Don't** đưa mật khẩu Wi-Fi vào `<title>`, meta description hay thẻ chia sẻ (OG).
