# Báo cáo kiểm chứng

Ngày 26/10/2026, macOS, Node 22.23.2, Vite 8.3.5, TypeScript 7.0.2. Kiểm tra trên trình duyệt Chromium tự động hoá; **chưa thử trên điện thoại thật** (xem cuối báo cáo).

## Tóm tắt

| Hạng mục | Kết quả |
| --- | --- |
| Kiểm tra kiểu `tsc --noEmit` | Đạt |
| `vite build` (build sạch từ đầu) | Đạt, 7 module, 77 ms |
| Config sai (mật khẩu < 8 ký tự, link `http`) | Build **thất bại** với mã thoát 1 và thông báo tiếng Việt, nên CI không deploy bản hỏng |
| Responsive (rộng 320, 360, 390, 412, 430, 768, 1440 px) | Không tràn ngang ở mọi cỡ (đo `scrollWidth - clientWidth = 0`) |
| axe-core 4.10.2 (WCAG 2.0/2.1/2.2 A+AA + best-practice) | **0 vi phạm** ở 3 trạng thái, đo trên trang chủ **cũ (còn mục Wi-Fi)**. **Chưa chạy lại** sau khi gỡ mục Wi-Fi (xem mục Thay đổi ngày 26/10) |
| Bàn phím | Thứ tự Tab hợp lý (6 điều khiển), khung focus bronze 3px, Enter mở hướng dẫn |
| Tắt JavaScript | Trang chủ hiện không còn JavaScript nào (0 thẻ `<script>`), nên mục này không còn áp dụng |
| Tải trang | ~59 KB (HTML 1,5 KB, CSS 2,1 KB, 6 font 55 KB; gzip; không JS). Trong HTML chỉ có 2 liên kết ngoài (Zalo, Google Maps) và địa chỉ canonical của chính trang |
| Giải mã QR | Xem bên dưới |
| Poster PDF | Đúng 1 trang A4 (210 × 297 mm); script chặn xuất nếu không phải 1 trang A4 |

## Thay đổi ngày 26/10: gỡ mục Wi-Fi khỏi trang chủ, thêm logo, bỏ poster.html khỏi bản đăng

Theo yêu cầu của chủ tiệm, trang chủ không còn mục Wi-Fi (tên mạng, mật khẩu, nút Kết nối Wi-Fi, Sao chép mật khẩu, hướng dẫn, mã QR và hai liên kết tải). Mã QR Wi-Fi giờ chỉ có ở `print/qr/` và trên poster. Cùng ngày, chủ tiệm gửi ảnh logo và giao mình tự quyết cách dùng: logo thay tên hiệu bằng chữ ở đầu trang chủ và đầu poster (file `public/logo.png`, tạo từ ảnh gốc `brand/logo-original.png`), và trang xem thử poster `poster.html` **không còn được đăng** cùng website (chỉ dựng khi `npm run print`). Các mục bên dưới nhắc tới những phần này mô tả **bản trước thay đổi**; mục này là bản hiện tại.

Đã kiểm lại trên bản mới:

- `tsc --noEmit` và `vite build` đạt. Bản build **không còn** thư mục `qr/`, **không còn** thẻ `<script>`, và HTML trang chủ không chứa chữ Wi-Fi, tên mạng hay mật khẩu.
- Bản đang chạy tại `districth.dixxie.store`: tiêu đề mới (Nhóm Zalo, đường đi); `/qr/district-h-wifi-qr.png` và `/poster.html` đều trả **404**; `/logo.png` trả 200; không có thẻ Cloudflare Analytics.
- Trình duyệt, rộng 390 px và 1440 px (trang có logo): không tràn ngang (đo `scrollWidth - clientWidth = 0`); logo nạp được (`naturalWidth > 0`); chỉ còn 2 liên kết (Zalo, Google Maps); đã xem ảnh chụp bố cục. Ở 390 px nút Zalo nằm trong màn hình đầu tiên (cao 844 px).
- `npm run print` chạy lại (đường xuất QR đã đổi sang ghi file trực tiếp thay vì chép từ bản build): poster vẫn đúng 1 trang A4; 4 file QR giải ra đúng bằng jsQR (đầy đủ và thu nhỏ 25%); Apple Vision đọc đủ 2 mã từ PDF (Wi-Fi ~66 mm, website ~41 mm). Các file QR xuất ra không khác bản đã commit (git không báo thay đổi). Poster có logo (cao 42 mm, căn giữa đầu trang) vẫn vừa 1 trang A4 và đã xem ảnh poster dựng lại ở 300 dpi.

**Chưa làm / còn lại:**

- **axe-core chưa chạy lại** trên trang chủ mới. Trang chỉ còn một phần nhỏ của trang đã đạt (tiêu đề, 2 nút liên kết, chân trang) nên rủi ro thấp, nhưng chưa có số liệu.
- Bản dự phòng GitHub Pages đã cập nhật theo commit `6d4b321` (workflow xanh): trang chủ mới 200, `/logo.png` 200, `/poster.html` và `/qr/district-h-wifi-qr.png` đều 404.
- Mật khẩu vẫn nằm trong repo công khai (`src/config.ts` và `print/poster-a4.pdf` đã commit) và trên poster in trong tiệm.
- **Logo chỉ có dạng ảnh điểm** (632 × 550 px, tạo từ ảnh gửi qua chat). In poster ở cỡ hiện tại (cao 42 mm) tương đương ~330 dpi nên đủ nét; in lớn hơn nhiều thì cần file vector từ người thiết kế logo. Chưa kiểm logo in thật trên giấy.
- Chưa có favicon từ logo (favicon vẫn là biểu tượng cũ).

## Mã QR

Chuỗi Wi-Fi mong đợi: `WIFI:T:WPA;S:<tên mạng>;P:<mật khẩu>;;`, với giá trị lấy từ `src/config.ts` (không chép mật khẩu vào báo cáo)

- **jsQR** giải file PNG (`print/qr/district-h-wifi-qr.png`, 1230×1230 px) ra đúng từng ký tự, ở kích thước đầy đủ **và** khi thu nhỏ còn ~25% (mô phỏng quét từ xa).
- Đọc ngược chuỗi bằng bộ phân tích độc lập: tên mạng và mật khẩu đọc ngược ra đúng bằng giá trị trong config.
- **Apple Vision** (cùng họ bộ đọc Camera iPhone) đọc **trực tiếp file PDF poster ở 300 dpi**: tìm thấy đủ 2 mã, mã Wi-Fi vùng module rộng ~66 mm, mã website ~41 đến 42 mm, cả hai ra đúng nội dung.
- Mã website chỉ được tạo **sau khi** địa chỉ deploy trả 200 (poster cuối dùng `https://districth.dixxie.store/`; lần xuất trước dùng địa chỉ GitHub Pages). Trước đó, pipeline poster được thử bằng địa chỉ tạm `https://district-h-test.invalid/` (đuôi `.invalid` dành riêng cho thử nghiệm, không nằm trong sản phẩm).
- Poster cuối `print/poster-a4.pdf`: Vision đọc ra cả hai mã, mã website ~42 mm, đúng địa chỉ trên.
- (Bản trước 26/10; hiện website không còn đăng file QR để tải.) Tải mã QR trực tiếp từ bản **đang chạy trên GitHub Pages** rồi giải mã lại bằng jsQR: khớp ở kích thước đầy đủ và thu nhỏ 25%.
- Mã 33×33 module (Wi-Fi), ECC mức M, vùng yên tĩnh 4 module, module đen thuần trên nền trắng.

## Triển khai và bản đang chạy

- Repo công khai `dangnhathuycntt-byte/district-h-barbershop`; workflow GitHub Pages chạy xanh 2 lần (build trên Ubuntu/Node 22: `npm ci`, `tsc`, `vite build`; deploy 8 đến 11 s).
- Địa chỉ `https://dangnhathuycntt-byte.github.io/district-h-barbershop/` trả 200; trang chủ, `poster.html`, file QR PNG/SVG, font, CSS, `favicon.svg`, `robots.txt` đều 200 đúng loại tệp.
- Trên bản live: có `canonical` và `og:url` đúng địa chỉ, `noindex`, không tràn ngang ở 390 px, đủ 6 font đã nạp, nút sao chép ghi đủ 13 ký tự vào clipboard, **chỉ một nguồn request (chính trang)**, 0 cảnh báo/lỗi console.
- GitHub Pages nay là bản dự phòng; địa chỉ chính là `districth.dixxie.store` (mục dưới). Khi đổi tên miền, `siteUrl` đổi và phải in lại poster (xem README).

## Triển khai chính: Cloudflare Tunnel (`districth.dixxie.store`)

- Dịch vụ nền `com.districth.site` phục vụ `dist/` ở `127.0.0.1:3020`. Máy chủ tĩnh được thử trước trên cổng tạm: 404 cho `/qr/`, `/assets/`, `..%2f`, `%00`, `/..`; 405 cho POST; có `nosniff` và `X-Robots-Tag: noindex`.
- Cấu hình tunnel được sao lưu, kiểm tra bằng `cloudflared tunnel ingress validate` rồi mới khởi động lại. Trước và sau khi khởi động lại, các tên miền phụ khác giữ nguyên kết quả (`chamcong` 502 từ trước do dịch vụ ở cổng 3002 không chạy, `tm1400` 200, `rbx` 404).
- `https://districth.dixxie.store/`: HTTP/2 200; trang chủ, `poster.html`, file QR PNG/SVG, font, `favicon.svg`, `robots.txt` đều 200 đúng loại tệp; chứng chỉ TLS hợp lệ (hết hạn 03/12/2026, Cloudflare tự gia hạn).
- **Phát hiện và sửa:** lần tải đầu qua Cloudflare có thêm request tới `static.cloudflareinsights.com`: Cloudflare tự chèn thẻ Web Analytics ở edge cho cả zone `dixxie.store`, không phải code của dự án. Tài liệu Cloudflare nêu rằng header `Cache-Control` có `no-transform` ngăn việc chèn này; sau khi thêm vào máy chủ, đo lại trong trình duyệt chỉ còn **một nguồn request (chính trang)**, thẻ không còn trong DOM, 0 cảnh báo console. Việc này chỉ áp dụng cho tên miền phụ này; cài đặt analytics ở cấp zone của bạn không bị đổi.
- Mã QR cuối được tạo **sau khi** địa chỉ trả 200 và sạch: Vision đọc ra cả hai mã từ `print/poster-a4.pdf` (Wi-Fi ~66 mm, website ~41 mm); mã PNG tải về từ chính tên miền mới cũng giải ra đúng.

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
- Máy này tự chạy lại dịch vụ sau khi khởi động lại/ngủ/mất mạng (cấu hình `RunAtLoad` + `KeepAlive` đã có nhưng **chưa thử khởi động lại máy**) và độ ổn định khi dùng làm máy chủ liên tục.
- Hành vi mở nhóm Zalo (đã/chưa cài Zalo) và khả năng nhóm còn nhận người.
- Quét từ tờ in thật ở khoảng 1 m.
- Đọc màn hình thật (VoiceOver/TalkBack) và chế độ `prefers-reduced-motion` (chỉ đọc từ CSS, chưa chạy giả lập).
- Script `npm run print` mới chạy trên macOS với Google Chrome; Windows/Linux dựa vào bộ dò đường dẫn Chrome nhưng chưa thử.
