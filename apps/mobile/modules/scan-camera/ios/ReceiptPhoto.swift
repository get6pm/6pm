import CoreImage
import ExpoModulesCore
import Foundation
import ImageIO
import UIKit
import Vision

/// A receipt's four corners in an upright image, normalised with the origin top left.
struct Corners {
  let topLeft: CGPoint
  let topRight: CGPoint
  let bottomRight: CGPoint
  let bottomLeft: CGPoint

  /// From `[x0, y0, …, x3, y3]` (top left, top right, bottom right, bottom left).
  init?(flat: [Double]) {
    guard flat.count == 8, flat.allSatisfy({ $0.isFinite && $0 >= -0.05 && $0 <= 1.05 }) else {
      return nil
    }
    topLeft = CGPoint(x: flat[0], y: flat[1])
    topRight = CGPoint(x: flat[2], y: flat[3])
    bottomRight = CGPoint(x: flat[4], y: flat[5])
    bottomLeft = CGPoint(x: flat[6], y: flat[7])
  }

  /// From Vision's observation, whose origin is bottom left.
  init(_ observation: VNRectangleObservation) {
    func flip(_ p: CGPoint) -> CGPoint { CGPoint(x: p.x, y: 1 - p.y) }
    topLeft = flip(observation.topLeft)
    topRight = flip(observation.topRight)
    bottomRight = flip(observation.bottomRight)
    bottomLeft = flip(observation.bottomLeft)
  }

  var flat: [Double] {
    [topLeft, topRight, bottomRight, bottomLeft].flatMap { [Double($0.x), Double($0.y)] }
  }

  /// The share of the image the quad covers (shoelace formula).
  var area: Double {
    let p = [topLeft, topRight, bottomRight, bottomLeft]
    var sum = 0.0
    for i in 0..<4 {
      let a = p[i]
      let b = p[(i + 1) % 4]
      sum += Double(a.x * b.y - b.x * a.y)
    }
    return abs(sum) / 2
  }
}

/// Reading a receipt photo on this iPhone: find the paper, cut it out square, read its lines.
/// Nothing is sent anywhere here; the copy for a closer look is handed back for the app to send
/// only when its own reading is unsure.
enum ReceiptPhoto {
  /// Large enough to straighten a long receipt without losing its small print.
  static let workPixels = 3000
  /// A receipt at 2000 px on its long side reads as well as the original (the share extension's
  /// size).
  static let readPixels = 2000
  /// The copy kept for a closer look: enough to read a receipt, small enough to send.
  static let lookPixels = 1600
  static let lookBytes = 1_500_000
  /// A quad smaller than this share of the picture is a label or a card, not the receipt.
  static let minimumArea = 0.04
  static let minimumConfidence: Float = 0.5

  private static let context = CIContext(options: [.cacheIntermediates: false])

  /// The image upright, no larger than `pixels` on its long side.
  static func upright(_ data: Data, pixels: Int = workPixels) -> CGImage? {
    guard let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }
    let options: [CFString: Any] = [
      kCGImageSourceCreateThumbnailFromImageAlways: true,
      kCGImageSourceCreateThumbnailWithTransform: true,
      kCGImageSourceShouldCacheImmediately: true,
      kCGImageSourceThumbnailMaxPixelSize: pixels,
    ]
    return CGImageSourceCreateThumbnailAtIndex(source, 0, options as CFDictionary)
  }

  /// The paper in the picture, when Vision finds one large and sure enough.
  static func document(in image: CGImage) -> Corners? {
    paper(VNImageRequestHandler(cgImage: image, options: [:]), minimumArea: minimumArea)
  }

  /// The paper Vision sees: its document segmentation first, and where that finds nothing (it
  /// needs the Neural Engine, and misses paper on a busy table) the plainest rectangle in view.
  static func paper(_ handler: VNImageRequestHandler, minimumArea: Double) -> Corners? {
    let segmentation = VNDetectDocumentSegmentationRequest()
    let rectangles = VNDetectRectanglesRequest()
    // A receipt is long and narrow, and photographed at an angle.
    rectangles.minimumAspectRatio = 0.15
    rectangles.maximumAspectRatio = 1
    rectangles.quadratureTolerance = 30
    rectangles.minimumSize = 0.2
    rectangles.minimumConfidence = 0.7
    rectangles.maximumObservations = 1
    if (try? handler.perform([segmentation])) != nil,
      let found = segmentation.results?.first, found.confidence >= minimumConfidence
    {
      let corners = Corners(found)
      if corners.area >= minimumArea { return corners }
    }
    guard (try? handler.perform([rectangles])) != nil, let found = rectangles.results?.first
    else { return nil }
    let corners = Corners(found)
    return corners.area >= minimumArea ? corners : nil
  }

  /// The first QR code in the picture, for a screenshot of one picked from Photos.
  static func code(in image: CGImage) -> String? {
    let request = VNDetectBarcodesRequest()
    request.symbologies = [.qr]
    let handler = VNImageRequestHandler(cgImage: image, options: [:])
    guard (try? handler.perform([request])) != nil else { return nil }
    return request.results?.lazy.compactMap(\.payloadStringValue).first
  }

  /// The quad cut out of the image and squared up, as if photographed from straight above.
  static func straightened(_ image: CGImage, _ corners: Corners) -> CGImage? {
    let w = CGFloat(image.width)
    let h = CGFloat(image.height)
    // Core Image's origin is bottom left, in pixels.
    func vector(_ p: CGPoint) -> CIVector {
      CIVector(x: min(max(p.x, 0), 1) * w, y: (1 - min(max(p.y, 0), 1)) * h)
    }
    let output = CIImage(cgImage: image).applyingFilter(
      "CIPerspectiveCorrection",
      parameters: [
        "inputTopLeft": vector(corners.topLeft),
        "inputTopRight": vector(corners.topRight),
        "inputBottomRight": vector(corners.bottomRight),
        "inputBottomLeft": vector(corners.bottomLeft),
      ])
    return context.createCGImage(output, from: output.extent.integral)
  }

  /// The picture no larger than `pixels` on its long side.
  static func scaled(_ image: CGImage, to pixels: Int) -> CGImage {
    let long = max(image.width, image.height)
    guard long > pixels else { return image }
    let scale = CGFloat(pixels) / CGFloat(long)
    let ci = CIImage(cgImage: image).transformed(by: CGAffineTransform(scaleX: scale, y: scale))
    return context.createCGImage(ci, from: ci.extent.integral) ?? image
  }

  /// Vision's accurate recogniser, set as the share extension sets it: Vietnamese and English
  /// when this iPhone has Vietnamese, else English alone with language correction off so
  /// Vietnamese words are not "corrected" into English ones. Boxes are Vision's, origin bottom
  /// left.
  static func lines(_ image: CGImage) -> [[String: Any]] {
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
      return [
        "text": best.string,
        "box": [
          "x": Double(box.minX), "y": Double(box.minY), "w": Double(box.width),
          "h": Double(box.height),
        ],
        "confidence": Double(best.confidence),
      ]
    }
  }

  /// The JPEG for the server's closer look, under its size limit, base64.
  static func lookCopy(_ image: CGImage) -> String? {
    let picture = UIImage(cgImage: scaled(image, to: lookPixels))
    for quality in [0.7, 0.5, 0.35] {
      if let data = picture.jpegData(compressionQuality: quality), data.count <= lookBytes {
        return data.base64EncodedString()
      }
    }
    return nil
  }

  /// The cut-out receipt saved for the card to show while it is read.
  static func save(_ image: CGImage) throws -> URL {
    let directory = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
      .appendingPathComponent("scan", isDirectory: true)
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
    // One receipt at a time: what an earlier scan left is cleared.
    for old in (try? FileManager.default.contentsOfDirectory(at: directory, includingPropertiesForKeys: nil)) ?? [] {
      try? FileManager.default.removeItem(at: old)
    }
    guard let data = UIImage(cgImage: image).jpegData(compressionQuality: 0.85) else {
      throw ScanCameraException("encode")
    }
    let url = directory.appendingPathComponent("\(UUID().uuidString).jpg")
    try data.write(to: url, options: .atomic)
    return url
  }

  /// Reads a receipt photo: the paper found in it (or, failing that, where the live camera last
  /// saw it), squared up, saved, its lines read and a copy made for a closer look.
  static func read(_ data: Data, seen: Corners?) throws -> [String: Any] {
    guard let image = upright(data) else { throw ScanCameraException("image") }
    return try read(image, seen: seen)
  }

  static func read(_ image: CGImage, seen: Corners?) throws -> [String: Any] {
    let corners = document(in: image) ?? seen
    let receipt = corners.flatMap { straightened(image, $0) } ?? image
    let url = try save(receipt)
    let read = scaled(receipt, to: readPixels)
    return [
      "kind": "receipt",
      "uri": url.absoluteString,
      "width": receipt.width,
      "height": receipt.height,
      "cut": corners != nil,
      "lines": lines(read),
      "photo": lookCopy(receipt) as Any,
    ]
  }

  /// A picture from Photos: a QR code when it shows one, else read as a receipt.
  static func readPicked(_ data: Data) throws -> [String: Any] {
    guard let image = upright(data) else { throw ScanCameraException("image") }
    if let payload = code(in: image) { return ["kind": "code", "data": payload] }
    return try read(image, seen: nil)
  }
}

final class ScanCameraException: GenericException<String> {
  override var reason: String { "Scan camera: \(param)" }
}
