# District H Barbershop: trang QR cho khách

Website tĩnh một trang + poster A4 để khách quét mã, vào Wi-Fi của tiệm, rồi (tuỳ chọn) tham gia nhóm Zalo và xem đường đi.

## Luồng của khách

```
Poster A4 trong tiệm
 ├─ Bước 1  Quét mã Wi-Fi   → camera đề nghị "Tham gia mạng", chạm xác nhận một lần.
 │                            Hoạt động cả khi điện thoại CHƯA có internet.
 └─ Bước 2  Quét mã website → trang này: nhóm Zalo (tự nguyện) + đường đi Google Maps.
                              Cần internet, nên quét sau khi đã vào Wi-Fi.
```

Vì sao poster có **hai** mã: quét QR thì không cần mạng, nhưng *mở trang web* thì cần. Khách hết data hoặc sóng yếu mà chỉ có mã website thì không mở được trang để lấy mật khẩu. Mã Wi-Fi in trên poster giải quyết đúng chỗ đó. Tên mạng và mật khẩu cũng được in chữ trên poster để gõ tay nếu không quét được.

> **Web không thể tự nối Wi-Fi cho điện thoại.** Trang này không bao giờ làm vậy và không nói như vậy. Nút "Kết nối Wi-Fi" sao chép mật khẩu và mở hướng dẫn tự chọn mạng. Muốn trang tự bật lên sau khi khách vào Wi-Fi thì cần *captive portal* trên router (xem mục cuối).

## Chạy trên máy

Cần Node.js 22.18 trở lên.

```bash
npm install
npm run dev        # http://localhost:5173 (poster xem ở /poster.html), sửa config là trang tự tải lại
npm run build      # kiểm tra kiểu (tsc) rồi build ra dist/
npm run preview    # xem bản build ở http://localhost:4173
npm run typecheck  # chỉ kiểm tra kiểu
```

## Cập nhật thông tin của tiệm

Mọi thông tin nằm ở **một file**: [`src/config.ts`](src/config.ts). Website, poster và mã QR đều đọc từ đó.

| Muốn đổi | Sửa trong `src/config.ts` |
| --- | --- |
| Tên Wi-Fi / mật khẩu | `wifi.ssid`, `wifi.password` (mật khẩu WPA dài 8–63 ký tự; `hidden: true` nếu mạng ẩn tên) |
| Link nhóm Zalo / Google Maps | `links.zalo`, `links.maps` (phải là `https://`) |
| Lời chào, lời cảm ơn, tên hiệu | `shop.welcome`, `shop.thanks`, `shop.wordmark` |
| Địa chỉ website sau khi deploy | `siteUrl` |
| Poster in mấy mã | `poster.qrCodes` |

Sau khi sửa: `npm run build` kiểm tra, rồi **in lại poster** nếu đổi Wi-Fi hoặc `siteUrl` (xem bên dưới). Config sai (mật khẩu quá ngắn, link không phải https…) sẽ báo lỗi tiếng Việt thay vì tạo mã hỏng.

Đổi mật khẩu Wi-Fi nghĩa là mã QR Wi-Fi cũ trên poster **không còn vào được mạng**: phải in poster mới.

## Mã QR và poster

| Lệnh | Việc làm |
| --- | --- |
| `npm run qr` | Xuất mã QR Wi-Fi (PNG 1200px+ in được, SVG vector) vào `print/qr/`. Không cần `siteUrl`, không cần Chrome. |
| `npm run print` | Xuất `print/poster-a4.pdf` (1 trang A4) + mã QR. Cần Chrome/Chromium (tự dò; hoặc đặt `CHROME_PATH`). **Từ chối chạy** nếu poster có mã website mà `siteUrl` còn trống. |
| `npm run verify:qr` | Giải mã lại các mã QR và so với config. Thêm `-- --files print/qr` để giải mã luôn các file PNG đã xuất. |

Mã QR dùng ECC mức M, vùng yên tĩnh 4 module, module đen thuần trên nền trắng (không tô màu thương hiệu để máy quét nhận chắc). Mã Wi-Fi hiện tại là 33×33 module; in ở cỡ trên poster thì mỗi module khoảng 2 mm.

Kiểm tra độc lập trên macOS, đọc thẳng file PDF ở 300 dpi bằng Apple Vision (cùng họ bộ đọc của Camera iPhone):

```bash
swift scripts/decode-vision.swift print/poster-a4.pdf
```

Muốn xem thử poster với một địa chỉ tạm mà không sửa config:

```bash
DISTRICT_H_SITE_URL=https://dia-chi-tam.example/ npm run print -- --out /tmp/xem-thu
```

(Đừng in và dán poster xem thử.)

### Wi-Fi nằm trong mã QR ra sao

Chuỗi `WIFI:T:WPA;S:<tên mạng>;P:<mật khẩu>;;` theo quy ước ZXing, được iOS Camera (11+) và Camera/Google Lens trên Android đọc. Ký tự `\ ; , : "` được escape; mật khẩu hoặc tên mạng chỉ gồm 0–9/a–f được bọc ngoặc kép để máy không hiểu nhầm là mã hex.

## Đang chạy: Cloudflare Tunnel trên máy này

Địa chỉ chính (poster và mã QR website trỏ về đây): **https://districth.dixxie.store/**

```
Điện thoại → Cloudflare → tunnel `dashboard-chamcong` → http://127.0.0.1:3020 → scripts/serve.ts → dist/
```

- `scripts/serve.ts` phục vụ thư mục `dist/` (không liệt kê thư mục, không đọc ra ngoài `dist/`, có `X-Robots-Tag: noindex`), chạy nền bằng LaunchAgent `~/Library/LaunchAgents/com.districth.site.plist` (tự chạy lại khi bị tắt).
- Tunnel có quy tắc `districth.dixxie.store → http://127.0.0.1:3020` trong `~/.cloudflared/config.yml` (bản sao lưu trước khi sửa: `config.yml.bak-20261026`); bản ghi DNS tạo bằng `cloudflared tunnel route dns`.
- **Cập nhật nội dung:** sửa `src/config.ts` rồi `npm run build`. Máy chủ đọc `dist/` theo từng yêu cầu nên không cần khởi động lại. Nếu đổi `siteUrl`/Wi-Fi thì chạy thêm `npm run print` và in lại poster.
- **Vận hành:**
  ```bash
  launchctl kickstart -k gui/$(id -u)/com.districth.site    # khởi động lại máy chủ tĩnh
  launchctl bootout gui/$(id -u)/com.districth.site         # dừng và gỡ
  tail ~/Library/Logs/com.districth.site.err.log            # xem lỗi
  launchctl kickstart -k gui/$(id -u)/com.cloudflare.cloudflared   # khởi động lại tunnel sau khi sửa config.yml (làm gián đoạn vài giây mọi tên miền phụ dùng chung tunnel)
  ```
- **`no-transform`:** máy chủ gửi `Cache-Control: ..., no-transform` ở mọi phản hồi. Nếu thiếu, Cloudflare tự chèn thẻ Web Analytics (`static.cloudflareinsights.com`) vào mọi trang của tên miền `dixxie.store`, trái với cam kết không analytics của trang này. Header cũng giữ ảnh mã QR không bị các bộ tối ưu ảnh của Cloudflare làm mờ.
- **Lưu ý độ sẵn sàng:** trang chỉ mở được khi máy này đang bật, đã đăng nhập, không ngủ và có mạng (LaunchAgent chỉ chạy sau khi đăng nhập). Mã **Wi-Fi** trên poster không phụ thuộc trang này nên vẫn dùng được; chỉ bước 2 (Zalo, đường đi) bị ảnh hưởng. Bản dự phòng GitHub Pages vẫn chạy nhưng poster không trỏ tới nó.
- Gỡ bỏ: `launchctl bootout` như trên, xoá quy tắc `districth.dixxie.store` trong `config.yml`, khởi động lại tunnel, rồi xoá bản ghi CNAME `districth` trên Cloudflare.

## Triển khai (GitHub Pages)

GitHub Pages hiện là **bản dự phòng**: `https://dangnhathuycntt-byte.github.io/district-h-barbershop/` (repo công khai `dangnhathuycntt-byte/district-h-barbershop`, tự deploy khi push lên `main`). Địa chỉ chính in trên poster là tên miền ở mục trên.

Repo đã có workflow [`.github/workflows/pages.yml`](.github/workflows/pages.yml): đẩy code lên nhánh `main` là tự build và đăng lên GitHub Pages.

1. Tạo repo trên GitHub rồi đẩy code lên nhánh `main`.
   **Lưu ý:** GitHub Pages miễn phí cần repo công khai, nên mã nguồn (kèm mật khẩu Wi-Fi trong `src/config.ts`) cũng công khai. Website vốn đã hiển thị mật khẩu cho bất kỳ ai có địa chỉ, nên mức lộ tương đương. Nếu muốn mã nguồn riêng tư, dùng Cloudflare Pages (bên dưới).
2. Vào **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Chờ workflow xanh ở tab **Actions**. Địa chỉ cuối cùng hiện ở bước *deploy* và ở **Settings → Pages**. Với tài khoản `ten-tai-khoan` và repo `ten-repo`, mặc định là `https://ten-tai-khoan.github.io/ten-repo/`.
4. (Khuyến nghị) Gắn tên miền ngắn: **Settings → Pages → Custom domain**, nhập ví dụ `wifi.ten-mien.vn`, rồi tại nơi quản lý DNS tạo bản ghi `CNAME` cho `wifi` trỏ về `ten-tai-khoan.github.io`. Tên miền ngắn cho mã QR ít chấm hơn nên quét dễ hơn khi in nhỏ. Bật **Enforce HTTPS** khi GitHub cấp xong chứng chỉ. (Tên miền gốc dạng `ten-mien.vn` cần bản ghi `A` theo hướng dẫn hiện hành của GitHub.)
5. **Chỉ khi đã có địa chỉ thật**: điền vào `siteUrl` trong `src/config.ts` (ví dụ `'https://wifi.ten-mien.vn/'`), rồi:

   ```bash
   npm run print                         # tạo poster PDF + mã QR website
   npm run verify:qr -- --files print/qr # xác nhận mã giải ra đúng địa chỉ
   ```

   In `print/poster-a4.pdf`. Đẩy code lên để website cũng có địa chỉ chuẩn (`canonical`).

**Không điền địa chỉ đoán trước.** Mã QR phải được tạo sau khi biết chắc địa chỉ cuối.

### Cloudflare Pages (thay thế, không cần repo công khai)

`npm run build`, rồi `npx wrangler login` và `npx wrangler pages deploy dist`. Hoặc nối repo (có thể riêng tư) và đặt Build command `npm run build`, Output `dist`, biến môi trường `NODE_VERSION=22`. Địa chỉ cuối hiển thị sau lần deploy đầu (`*.pages.dev`), hoặc gắn tên miền riêng trong dashboard.

### Khi đổi tên miền

Sửa `siteUrl` → `npm run print` → `npm run verify:qr -- --files print/qr` → in lại poster. Mã QR Wi-Fi không đổi nên không bị ảnh hưởng. Nên giữ tên miền cũ trỏ chuyển hướng (redirect) sang tên miền mới một thời gian để poster cũ còn dùng được.

## Riêng tư và công khai

- Mật khẩu Wi-Fi nằm trong HTML của trang (brief yêu cầu hiển thị rõ). Bất kỳ ai có địa chỉ đều thấy. Lớp chặn chính là thẻ `<meta name="robots" content="noindex, nofollow">` trên mỗi trang, để công cụ tìm kiếm không lập chỉ mục mật khẩu. `robots.txt` chỉ có tác dụng khi dùng tên miền riêng (ở địa chỉ dạng `tài-khoản.github.io/repo/` file không nằm ở gốc nên bị bỏ qua). Đây là hàng rào lịch sự, không phải bảo mật: ai biết địa chỉ vẫn xem được.
- Nếu lo ngại, dùng mạng khách (guest network) riêng với mật khẩu thay đổi định kỳ.
- Không có analytics, tracking, cookie hay banner cookie. Mã QR được tạo ngay trên máy lúc build; mật khẩu không gửi tới dịch vụ bên thứ ba nào. Trang không gọi tài nguyên ngoài (font, ảnh, script đều tự host). Chỉ có hai liên kết ra ngoài khi khách bấm: Zalo và Google Maps.
- Mật khẩu không nằm trong `<title>`, meta description hay thẻ chia sẻ.

## Captive portal (tuỳ chọn trong tương lai)

Kiểu "quét Wi-Fi xong tự bật trang có nút vào nhóm Zalo" là **captive portal**: chức năng của *router/access point*, không phải của website. Router thường (VNPT, Viettel, FPT, TP-Link, Tenda, Xiaomi…) không có; **dự án này không giả lập nó**.

Nếu sau này shop dùng thiết bị hỗ trợ (MikroTik Hotspot, UniFi Guest Portal, TP-Link Omada, Ruijie, Aruba, OpenWrt + nodogsplash…), website này chính là trang để portal hiển thị:

1. Trong thiết bị, đặt trang chào/portal chuyển hướng tới địa chỉ website đã deploy.
2. Cho phép truy cập *trước khi đăng nhập* (walled garden / pre-authentication) tới tên miền website, `zalo.me` và tên miền Google Maps, nếu không các nút sẽ không mở được khi khách chưa có internet.
3. Đổi `poster.qrCodes` thành `['wifi']` rồi `npm run print`: poster chỉ cần mã Wi-Fi.
4. Thử thật trên iPhone và Android: trình duyệt nhỏ của hệ điều hành lúc đăng nhập Wi-Fi có thể hạn chế mở ứng dụng khác, kể cả liên kết Zalo.

## Việc cần thử trên máy thật trước khi in hàng loạt

Môi trường phát triển không có điện thoại, nên các điểm này **chưa được kiểm chứng trên máy thật**:

- [ ] iPhone: quét mã Wi-Fi bằng Camera → có hiện "Tham gia mạng" và vào được mạng `District H barbershop 5g`.
- [ ] Android (ít nhất một máy Samsung và một máy khác): quét bằng Camera hoặc Google Lens → có đề nghị kết nối.
- [ ] Cả hai máy: quét mã website → mở được trang; "Tham gia nhóm Zalo" mở đúng nhóm (cả khi đã cài Zalo và chưa cài); "Xem đường đi" mở đúng chỗ.
- [ ] In thử một tờ A4 và quét từ khoảng 1 m.
- [ ] Router phát băng tần 5 GHz: tên mạng có chữ "5g". Điện thoại đời cũ không thấy 5 GHz sẽ không vào được; cân nhắc có thêm mạng 2.4 GHz.

## Cấu trúc

```
src/config.ts          Thông tin của tiệm (file duy nhất cần sửa)
src/site.ts            Dựng HTML trang + poster và file QR từ config (chạy lúc build)
src/lib/               wifi (chuỗi WIFI:), qr (ma trận + SVG), png (PNG in được), icons, html
src/main.ts            JS tăng cường ~1 KB: sao chép mật khẩu, mở hướng dẫn
scripts/serve.ts       Máy chủ tĩnh cho dist/ (dùng sau Cloudflare Tunnel): npm run serve
src/styles/            base (màu, chữ), site (trang), poster (A4), fonts
public/fonts/          Font tự host (Barlow Condensed, Be Vietnam Pro: subset latin + vietnamese)
scripts/               export-print (PDF + QR), verify-qr (giải mã), decode-vision.swift (macOS)
print/qr/              Mã QR đã xuất (và print/poster-a4.pdf sau khi có siteUrl)
PRODUCT.md, DESIGN.md  Ngữ cảnh sản phẩm và hệ thống thiết kế
VERIFICATION.md        Báo cáo kiểm chứng: đã kiểm gì, kết quả, và những gì chưa kiểm được
```

Dung lượng một lần mở trang khoảng 61 KB (HTML 3,4 KB, CSS 2,5 KB, JS 1 KB, 6 file font 55 KB; số liệu nén gzip, font vốn đã nén).

## Giấy phép các thành phần

Icon [Lucide](https://lucide.dev) (ISC, nhúng lúc build); thư viện QR [`uqr`](https://github.com/unjs/uqr) (MIT, chỉ chạy lúc build); font Barlow Condensed và Be Vietnam Pro (SIL Open Font License, từ Google Fonts).
