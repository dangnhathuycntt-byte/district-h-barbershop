// Giải mã mã QR bằng Apple Vision (cùng họ bộ đọc của Camera iPhone). Chỉ chạy trên macOS.
//
//   swift scripts/decode-vision.swift print/poster-a4.pdf [thêm file .png ...]
//
// PDF được dựng ở 300 dpi trước khi giải mã, nên kiểm tra đúng thứ sẽ được in ra giấy.
// Đặt DECODE_SAVE_DIR=<thư mục> để lưu ảnh đã dựng (tiện xem bằng mắt).
import AppKit
import Foundation
import PDFKit
import Vision

func renderPDF(_ url: URL, dpi: CGFloat = 300) -> (CGImage, String)? {
    guard let doc = PDFDocument(url: url), let page = doc.page(at: 0) else { return nil }
    let box = page.bounds(for: .mediaBox)
    let scale = dpi / 72.0
    let w = Int(box.width * scale), h = Int(box.height * scale)
    guard let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpaceCreateDeviceRGB(),
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    ctx.setFillColor(CGColor(gray: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: ctx)
    let mm = String(format: "%.0f x %.0f mm, %d trang", box.width / 72 * 25.4, box.height / 72 * 25.4, doc.pageCount)
    return ctx.makeImage().map { ($0, mm) }
}

func loadImage(_ path: String) -> (CGImage, String)? {
    let url = URL(fileURLWithPath: path)
    if url.pathExtension.lowercased() == "pdf" { return renderPDF(url) }
    guard let src = CGImageSourceCreateWithURL(url as CFURL, nil),
          let img = CGImageSourceCreateImageAtIndex(src, 0, nil) else { return nil }
    return (img, "\(img.width) x \(img.height) px")
}

var exitCode: Int32 = 0
for path in CommandLine.arguments.dropFirst() {
    guard let (image, info) = loadImage(path) else {
        print("✗ Không mở được \(path)")
        exitCode = 1
        continue
    }
    if let dir = ProcessInfo.processInfo.environment["DECODE_SAVE_DIR"] {
        let rep = NSBitmapImageRep(cgImage: image)
        let name = URL(fileURLWithPath: path).deletingPathExtension().lastPathComponent + ".render.png"
        try? rep.representation(using: .png, properties: [:])?.write(to: URL(fileURLWithPath: dir).appendingPathComponent(name))
    }
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    do { try VNImageRequestHandler(cgImage: image, options: [:]).perform([request]) } catch {
        print("✗ \(path): \(error)")
        exitCode = 1
        continue
    }
    let found = request.results ?? []
    print("\(path)  [\(info)]  →  \(found.count) mã QR")
    for (index, obs) in found.enumerated() {
        let b = obs.boundingBox
        let sideMM = (b.width * CGFloat(image.width)) / 300 * 25.4
        print("  #\(index + 1) (\(String(format: "%.0f", sideMM)) mm): \(obs.payloadStringValue ?? "<không đọc được>")")
    }
}
exit(exitCode)
