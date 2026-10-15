import SwiftUI
import UIKit

/// Colours and faces as the app wrote them into the snapshot: CSS colour strings from the look,
/// and the font files the widget bundles. Nothing here decides a colour; it only reads one.
extension Color {
  /// `#rgb`, `#rrggbb`, `#rrggbbaa` or `rgb(a)(r, g, b[, a])`; clear when it cannot be read.
  init(css: String?) {
    guard let css = css?.trimmingCharacters(in: .whitespaces), !css.isEmpty else {
      self = .clear
      return
    }
    if css.hasPrefix("#") {
      var hex = String(css.dropFirst())
      if hex.count == 3 { hex = hex.map { "\($0)\($0)" }.joined() }
      guard hex.count == 6 || hex.count == 8, let value = UInt64(hex, radix: 16) else {
        self = .clear
        return
      }
      let hasAlpha = hex.count == 8
      let rgb = hasAlpha ? value >> 8 : value
      self.init(
        .sRGB,
        red: Double((rgb >> 16) & 255) / 255,
        green: Double((rgb >> 8) & 255) / 255,
        blue: Double(rgb & 255) / 255,
        opacity: hasAlpha ? Double(value & 255) / 255 : 1)
      return
    }
    guard let open = css.firstIndex(of: "("), let close = css.lastIndex(of: ")") else {
      self = .clear
      return
    }
    let parts = css[css.index(after: open)..<close].split(separator: ",").compactMap {
      Double($0.trimmingCharacters(in: .whitespaces))
    }
    guard parts.count >= 3 else {
      self = .clear
      return
    }
    self.init(
      .sRGB, red: parts[0] / 255, green: parts[1] / 255, blue: parts[2] / 255,
      opacity: parts.count > 3 ? parts[3] : 1)
  }
}

enum SurfaceFont {
  private static let variation = UIFontDescriptor.AttributeName(
    rawValue: kCTFontVariationAttribute as String)
  private static let wght = 0x7767_6874
  private static let opsz = 0x6F70_737A
  private static let fill = 0x4649_4C4C

  /// The display face used when the snapshot names none (Golden Hour's).
  static let defaultDisplay = "BricolageGrotesque"

  private static func uiFont(_ name: String, size: CGFloat, axes: [Int: CGFloat]) -> UIFont {
    let base =
      UIFont(name: name, size: size)
      ?? UIFont(descriptor: UIFontDescriptor(fontAttributes: [.family: name]), size: size)
    let descriptor = base.fontDescriptor.addingAttributes([variation: axes])
    return UIFont(descriptor: descriptor, size: size)
  }

  private static func font(_ name: String, size: CGFloat, axes: [Int: CGFloat]) -> Font {
    Font(uiFont(name, size: size, axes: axes))
  }

  /// A filled Material Symbols glyph drawn to a template image. WidgetKit cannot archive the font
  /// with its FILL axis set (the widget then never draws), so filled glyphs travel as pictures and
  /// take their colour from `foregroundStyle`.
  static func filledGlyph(_ glyph: String, size: CGFloat, weight: CGFloat = 400) -> UIImage? {
    let font = uiFont(
      "MaterialSymbolsRounded", size: size,
      axes: [fill: 1, wght: weight, opsz: min(48, max(20, size))])
    let text = NSAttributedString(
      string: glyph, attributes: [.font: font, .foregroundColor: UIColor.black])
    let bounds = text.size()
    guard bounds.width > 0, bounds.height > 0 else { return nil }
    let format = UIGraphicsImageRendererFormat()
    format.scale = 3
    return UIGraphicsImageRenderer(size: bounds, format: format)
      .image { _ in text.draw(at: .zero) }
      .withRenderingMode(.alwaysTemplate)
  }

  /// The look's display face at a size, set as the app sets it: weight 500, optical size following
  /// the size where the face has that axis.
  static func display(_ name: String?, size: CGFloat, weight: CGFloat = 500) -> Font {
    font(name ?? defaultDisplay, size: size, axes: [wght: weight, opsz: min(96, max(12, size))])
  }

  /// A Material Symbols glyph at a size, filled or outlined.
  static func symbol(size: CGFloat, filled: Bool = false, weight: CGFloat = 400) -> Font {
    font(
      "MaterialSymbolsRounded", size: size,
      axes: [fill: filled ? 1 : 0, wght: weight, opsz: min(48, max(20, size))])
  }

  /// CSS weights and UIKit's for SF Pro; an in-between CSS weight (650) sits between its neighbours.
  private static let weights: [(css: CGFloat, ui: CGFloat)] = [
    (400, UIFont.Weight.regular.rawValue), (500, UIFont.Weight.medium.rawValue),
    (600, UIFont.Weight.semibold.rawValue), (700, UIFont.Weight.bold.rawValue),
  ]

  /// The interface face: SF Pro, as the prototype's -apple-system, at the prototype's weight.
  static func body(size: CGFloat, weight: CGFloat) -> Font {
    var ui = weights[0].ui
    for (lower, upper) in zip(weights, weights.dropFirst()) where weight >= lower.css {
      let t = min(1, (weight - lower.css) / (upper.css - lower.css))
      ui = lower.ui + (upper.ui - lower.ui) * t
    }
    return Font(UIFont.systemFont(ofSize: size, weight: UIFont.Weight(rawValue: ui)))
  }
}

extension View {
  /// Letter spacing in em, as the prototype writes it.
  func trackingEm(_ em: CGFloat, size: CGFloat) -> some View {
    tracking(em * size)
  }
}
