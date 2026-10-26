# Báo cáo kiểm chứng

Ngày 26/10/2026, macOS, Node 22.23.2, Vite 8.3.5, TypeScript 7.0.2. Kiểm tra trên trình duyệt Chromium tự động hoá; **chưa thử trên điện thoại thật** (xem cuối báo cáo).

## Tóm tắt

| Hạng mục | Kết quả |
| --- | --- |
| Kiểm tra kiểu `tsc --noEmit` | Đạt |
| `vite build` (build sạch từ đầu) | Đạt, 7 module, 77 ms |
| Config sai (mật khẩu < 8 ký tự, link `http`) | Build **thất bại** với mã thoát 1 và thông báo tiếng Việt, nên CI không deploy bản hỏng |
| Responsive (rộng 320, 360, 390, 412, 430, 768, 1440 px) | Không tràn ngang ở mọi cỡ (đo `scrollWidth - clientWidth = 0`) |
| axe-core 4.10.2 (WCAG 2.0/2.1/2.2 A+AA + best-practice) | **0 vi phạm** ở 3 trạng thái: mobile đóng, mobile mở hướng dẫn, desktop |
| Bàn phím | Thứ tự Tab hợp lý (6 điều khiển), khung focus bronze 3px, Enter mở hướng dẫn |
| Tắt JavaScript | Mật khẩu, mã QR, liên kết và hướng dẫn vẫn hiện; nút chỉ-JS được ẩn |
| Tải trang | ~61 KB (HTML 3,4 KB, CSS 2,5 KB, JS 1,0 KB, 6 font 55 KB; gzip), **0 request tới bên thứ ba** |
| Giải mã QR | Xem bên dưới |
| Poster PDF | Đúng 1 trang A4 (210 × 297 mm); script chặn xuất nếu không phải 1 trang A4 |

## Mã QR

Chuỗi Wi-Fi mong đợi: `WIFI:T:WPA;S:<tên mạng>;P:<mật khẩu>;;`, với giá trị lấy từ `src/config.ts` (không chép mật khẩu vào báo cáo)

- **jsQR** giải file PNG (`print/qr/district-h-wifi-qr.png`, 1230×1230 px) ra đúng từng ký tự, ở kích thước đầy đủ **và** khi thu nhỏ còn ~25% (mô phỏng quét từ xa).
- Đọc ngược chuỗi bằng bộ phân tích độc lập: tên mạng và mật khẩu đọc ngược ra đúng bằng giá trị trong config.
- **Apple Vision** (cùng họ bộ đọc Camera iPhone) đọc **trực tiếp file PDF poster ở 300 dpi**: tìm thấy đủ 2 mã, mã Wi-Fi vùng module rộng ~66 mm, mã website ~41 đến 42 mm, cả hai ra đúng nội dung.
- Mã website chỉ được tạo **sau khi** địa chỉ deploy trả 200: `https://dangnhathuycntt-byte.github.io/district-h-barbershop/`. Trước đó, pipeline poster được thử bằng địa chỉ tạm `https://district-h-test.invalid/` (đuôi `.invalid` dành riêng cho thử nghiệm, không nằm trong sản phẩm).
- Poster cuối `print/poster-a4.pdf`: Vision đọc ra cả hai mã, mã website ~42 mm, đúng địa chỉ trên.
- Tải mã QR trực tiếp từ bản **đang chạy trên GitHub Pages** rồi giải mã lại bằng jsQR: khớp ở kích thước đầy đủ và thu nhỏ 25%.
- Mã 33×33 module (Wi-Fi), ECC mức M, vùng yên tĩnh 4 module, module đen thuần trên nền trắng.

## Triển khai và bản đang chạy

- Repo công khai `dangnhathuycntt-byte/district-h-barbershop`; workflow GitHub Pages chạy xanh 2 lần (build trên Ubuntu/Node 22: `npm ci`, `tsc`, `vite build`; deploy 8 đến 11 s).
- Địa chỉ `https://dangnhathuycntt-byte.github.io/district-h-barbershop/` trả 200; trang chủ, `poster.html`, file QR PNG/SVG, font, CSS, `favicon.svg`, `robots.txt` đều 200 đúng loại tệp.
- Trên bản live: có `canonical` và `og:url` đúng địa chỉ, `noindex`, không tràn ngang ở 390 px, đủ 6 font đã nạp, nút sao chép ghi đủ 13 ký tự vào clipboard, **chỉ một nguồn request (chính trang)**, 0 cảnh báo/lỗi console.
- Chưa gắn tên miền riêng. Khi đổi sang tên miền khác, `siteUrl` đổi và phải in lại poster (xem README).

## Liên kết

- Giá trị `href` khớp config; hai liên kết ngoài có `target="_blank" rel="noopener noreferrer"`.
- `https://maps.app.goo.gl/z6VG47DSj9sHhTM7A?g_st=iz`: trả 200 sau 3 lần chuyển hướng, đích là Google Maps "District H Barbershop, 156 Hai Bà Trưng, Quy Nhơn, Gia Lai".
- `https://zalo.me/g/qblcao077`: máy chủ phản hồi 302, không lỗi. **Chưa xác minh được** nhóm còn nhận thành viên, cũng như hành vi mở ứng dụng Zalo trên điện thoại.
- Liên kết tải `qr/district-h-wifi-qr.png|svg` trả 200, đúng loại tệp.

## Lỗi tìm thấy và đã sửa trong lúc kiểm chứng

1. `tsc` bắt lỗi biến `status` trùng với `window.status` của trình duyệt.
2. PDF poster đầu tiên ra **khổ Letter, 2 trang, không có style** (Chrome chặn CSS/font gắn `crossorigin` khi mở bằng `file://`). Sửa: in qua máy chủ HTTP cục bộ + Chrome DevTools Protocol với khổ A4, và thêm bước chặn nếu PDF không phải đúng 1 trang A4. Phát hiện được nhờ giải mã thẳng file PDF thay vì chỉ xem trang HTML.
3. Nội dung poster tràn ~5 mm ra ngoài khung A4. Đã thu gọn, giờ chừa ~7 mm.
4. "Wi-Fi" bị ngắt ở dấu gạch nối trên màn hình hẹp và trên poster. Đã giữ liền.
5. Dòng tên mạng rớt dòng không đồng đều so với dòng mật khẩu ở 320 đến 412 px. Đã chuyển sang nhãn trên giá trị ở màn hình hẹp.

Ghi chú: một ảnh chụp desktop ban đầu cho thấy hướng dẫn tự mở sẵn; chạy lại đúng chuỗi chụp 2 lần cùng kiểm tra trạng thái DOM thì sạch, không tái hiện được, và không có đường mã nào mở hướng dẫn nếu không có thao tác bấm.

## Chưa được kiểm chứng

- **Quét thật bằng iPhone và Android** (có hiện "Tham gia mạng", có vào được mạng 5 GHz). Mọi thiết bị đều cần người dùng chạm xác nhận một lần; không máy nào tự nối khi chỉ quét.
- Hành vi mở nhóm Zalo (đã/chưa cài Zalo) và khả năng nhóm còn nhận người.
- Quét từ tờ in thật ở khoảng 1 m.
- Đọc màn hình thật (VoiceOver/TalkBack) và chế độ `prefers-reduced-motion` (chỉ đọc từ CSS, chưa chạy giả lập).
- Script `npm run print` mới chạy trên macOS với Google Chrome; Windows/Linux dựa vào bộ dò đường dẫn Chrome nhưng chưa thử.
