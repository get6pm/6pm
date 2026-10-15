import Foundation
import ImageIO
import PDFKit
import UIKit
import UniformTypeIdentifiers
import Vision

/// One line of a receipt as the domain reads it: the text, and for recognised text where it sat
/// (Vision's normalised box, origin bottom left) and how sure Vision was.
struct ReceiptLine: Encodable {
  struct Box: Encodable {
    let x: Double
    let y: Double
    let w: Double
    let h: Double
  }

  let text: String
  let box: Box?
  let confidence: Double?
}

/// One receipt as it was read: its lines, and for a photo a smaller copy of it for a closer look.
struct SharedReceipt {
  let lines: [ReceiptLine]
  /// A JPEG no larger than `ReceiptReader.lookPixels` on its long side; nil for a PDF or text.
  let photo: Data?
}

/// Turns what was shared (up to ten images, or one PDF, or plain text) into receipt lines, on
/// this iPhone. Nothing is sent anywhere here: images and scanned PDFs are read by Vision.
enum ReceiptReader {
  /// What was shared, one receipt each.
  enum Source {
    case image(NSItemProvider)
    case pdf(NSItemProvider)
    case text(NSItemProvider)
  }

  /// The extension has about 120 MB; a receipt at 2000 px on its long side reads as well as the
  /// original.
  static let maxPixels = 2000
  /// The copy kept for a closer look: enough to read a receipt, small enough to send.
  static let lookPixels = 1600
  static let lookBytes = 1_500_000
  /// A PDF page with less text than this is a scan, and is read as a picture.
  static let minimumPdfText = 20
  /// Photos are read one after another, each confirmed on its own card; more than ten at once is
  /// a camera roll, not a handful of receipts (the share sheet's rule says the same).
  static let maxImages = 10

  /// The receipts shared: every image (up to ten), else the one PDF or text.
  static func sources(from items: [NSExtensionItem]) -> [Source] {
    let providers = items.flatMap { $0.attachments ?? [] }
    let images = providers.filter { $0.hasItemConformingToTypeIdentifier(UTType.image.identifier) }
    if !images.isEmpty { return images.prefix(maxImages).map(Source.image) }
    for provider in providers {
      if provider.hasItemConformingToTypeIdentifier(UTType.pdf.identifier) { return [.pdf(provider)] }
      if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
        return [.text(provider)]
      }
    }
    return []
  }

  static func read(_ source: Source) async -> SharedReceipt {
    switch source {
    case .image(let provider): return await imageReceipt(provider)
    case .pdf(let provider): return SharedReceipt(lines: await pdfLines(provider), photo: nil)
    case .text(let provider): return SharedReceipt(lines: await textLines(provider), photo: nil)
    }
  }

  // MARK: Sources

  private static func imageReceipt(_ provider: NSItemProvider) async -> SharedReceipt {
    let none = SharedReceipt(lines: [], photo: nil)
    guard let item = try? await provider.loadItem(forTypeIdentifier: UTType.image.identifier)
    else { return none }
    let source: CGImageSource?
    switch item {
    case let url as URL: source = CGImageSourceCreateWithURL(url as CFURL, nil)
    case let data as Data: source = CGImageSourceCreateWithData(data as CFData, nil)
    case let image as UIImage:
      guard let data = image.jpegData(compressionQuality: 0.95) else { return none }
      source = CGImageSourceCreateWithData(data as CFData, nil)
    default: source = nil
    }
    guard let source else { return none }
    // One bitmap at a time, released before the next, to stay inside the extension's memory.
    let lines = autoreleasepool { downscaled(source).map(recognise) ?? [] }
    let photo = autoreleasepool { lookCopy(source) }
    return SharedReceipt(lines: lines, photo: photo)
  }

  /// The photo as a JPEG for the server's closer look, under its size limit.
  private static func lookCopy(_ source: CGImageSource) -> Data? {
    guard let image = downscaled(source, to: lookPixels) else { return nil }
    let picture = UIImage(cgImage: image)
    for quality in [0.7, 0.5, 0.35] {
      if let data = picture.jpegData(compressionQuality: quality), data.count <= lookBytes {
        return data
      }
    }
    return nil
  }

  private static func pdfLines(_ provider: NSItemProvider) async -> [ReceiptLine] {
    guard let item = try? await provider.loadItem(forTypeIdentifier: UTType.pdf.identifier)
    else { return [] }
    let document: PDFDocument?
    switch item {
    case let url as URL: document = PDFDocument(url: url)
    case let data as Data: document = PDFDocument(data: data)
    default: document = nil
    }
    // A receipt is one page; a longer PDF is read from its first.
    guard let page = document?.page(at: 0) else { return [] }
    let text = page.string ?? ""
    if text.trimmingCharacters(in: .whitespacesAndNewlines).count >= minimumPdfText {
      return plainLines(text)
    }
    let bounds = page.bounds(for: .mediaBox)
    let size = CGSize(width: bounds.width * 2, height: bounds.height * 2)
    let scale = min(1, CGFloat(maxPixels) / max(size.width, size.height))
    let picture = page.thumbnail(
      of: CGSize(width: size.width * scale, height: size.height * scale), for: .mediaBox)
    guard let image = picture.cgImage else { return [] }
    return recognise(image)
  }

  private static func textLines(_ provider: NSItemProvider) async -> [ReceiptLine] {
    guard let item = try? await provider.loadItem(forTypeIdentifier: UTType.plainText.identifier)
    else { return [] }
    switch item {
    case let text as String: return plainLines(text)
    case let data as Data: return plainLines(String(decoding: data, as: UTF8.self))
    case let url as URL where url.isFileURL:
      return plainLines((try? String(contentsOf: url, encoding: .utf8)) ?? "")
    default: return []
    }
  }

  // MARK: Reading

  static func plainLines(_ text: String) -> [ReceiptLine] {
    text.components(separatedBy: .newlines)
      .map { $0.trimmingCharacters(in: .whitespaces) }
      .filter { !$0.isEmpty }
      .map { ReceiptLine(text: $0, box: nil, confidence: nil) }
  }

  /// The image no larger than `pixels` on its long side, upright.
  static func downscaled(_ source: CGImageSource, to pixels: Int = maxPixels) -> CGImage? {
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceShouldCacheImmediately: true,
      kCGImageSourceThumbnailMaxPixelSize: pixels,
    ]
    return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
  }

  /// Vision's accurate recogniser, in Vietnamese and English when this iPhone has Vietnamese
  /// (listed as `vi-VT`), else English alone with language correction off so Vietnamese words are
  /// not "corrected" into English ones.
  static func recognise(_ image: CGImage) -> [ReceiptLine] {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    let supported = (try? request.supportedRecognitionLanguages()) ?? []
    if let vietnamese = supported.first(where: { $0.lowercased().hasPrefix("vi") }) {
      request.recognitionLanguages = [vietnamese, "en-US"]
      request.usesLanguageCorrection = true
    } else {
      request.recognitionLanguages = ["en-US"]
      request.usesLanguageCorrection = false
    }
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    guard (try? handler.perform([request])) != nil else { return [] }
    return (request.results ?? []).compactMap { observation in
      guard let best = observation.topCandidates(1).first else { return nil }
      let box = observation.boundingBox
      return ReceiptLine(
        text: best.string,
        box: .init(
          x: Double(box.minX), y: Double(box.minY), w: Double(box.width), h: Double(box.height)),
        confidence: Double(best.confidence))
    }
  }
}
