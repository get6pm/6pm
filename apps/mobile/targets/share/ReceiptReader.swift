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

/// Turns the one thing shared (an image, a PDF or plain text) into receipt lines, on this iPhone.
/// Nothing is sent anywhere: images and scanned PDFs are read by Vision.
enum ReceiptReader {
  /// The extension has about 120 MB; a receipt at 2000 px on its long side reads as well as the
  /// original.
  static let maxPixels = 2000
  /// A PDF page with less text than this is a scan, and is read as a picture.
  static let minimumPdfText = 20

  static func lines(from items: [NSExtensionItem]) async -> [ReceiptLine] {
    let providers = items.flatMap { $0.attachments ?? [] }
    for provider in providers {
      if provider.hasItemConformingToTypeIdentifier(UTType.pdf.identifier) {
        return await pdfLines(provider)
      }
      if provider.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
        return await imageLines(provider)
      }
      if provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
        return await textLines(provider)
      }
    }
    return []
  }

  // MARK: Sources

  private static func imageLines(_ provider: NSItemProvider) async -> [ReceiptLine] {
    guard let item = try? await provider.loadItem(forTypeIdentifier: UTType.image.identifier)
    else { return [] }
    let source: CGImageSource?
    switch item {
    case let url as URL: source = CGImageSourceCreateWithURL(url as CFURL, nil)
    case let data as Data: source = CGImageSourceCreateWithData(data as CFData, nil)
    case let image as UIImage:
      guard let data = image.jpegData(compressionQuality: 0.95) else { return [] }
      source = CGImageSourceCreateWithData(data as CFData, nil)
    default: source = nil
    }
    guard let source, let image = downscaled(source) else { return [] }
    return recognise(image)
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

  /// The image no larger than `maxPixels` on its long side, upright.
  static func downscaled(_ source: CGImageSource) -> CGImage? {
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceShouldCacheImmediately: true,
      kCGImageSourceThumbnailMaxPixelSize: maxPixels,
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
