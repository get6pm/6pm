import SwiftUI
import UIKit

/// The faces the card is set in: Bricolage for the amount, IBM Plex Mono for the code, Material
/// Symbols for the help glyph (bundled in `fonts/`), and SF Pro for everything else.
enum ShareFont {
  private static let variation = UIFontDescriptor.AttributeName(
    rawValue: kCTFontVariationAttribute as String)
  private static let wght = 0x7767_6874
  private static let opsz = 0x6F70_737A
  private static let fill = 0x4649_4C4C

  private static func font(
    _ name: String, family: String, size: CGFloat, axes: [Int: CGFloat] = [:]
  ) -> UIFont {
    let base =
      UIFont(name: name, size: size)
      ?? UIFont(descriptor: UIFontDescriptor(fontAttributes: [.family: family]), size: size)
    guard !axes.isEmpty else { return base }
    return UIFont(descriptor: base.fontDescriptor.addingAttributes([variation: axes]), size: size)
  }

  /// Bricolage Grotesque at weight 500, its optical size following the size.
  static func amount(_ size: CGFloat) -> Font {
    Font(
      font(
        "BricolageGrotesque-Variable", family: "BricolageGrotesque", size: size,
        axes: [wght: 500, opsz: min(96, max(12, size))]))
  }

  static func mono(_ size: CGFloat) -> Font {
    Font(font("IBMPlexMono-Regular", family: "IBMPlexMono-Regular", size: size))
  }

  static func symbol(_ size: CGFloat) -> Font {
    Font(
      font(
        "MaterialSymbolsRounded-Variable", family: "MaterialSymbolsRounded", size: size,
        axes: [fill: 0, wght: 400, opsz: min(48, max(20, size))]))
  }

  /// CSS weights and UIKit's for SF Pro; 650 sits between semibold and bold.
  private static let weights: [(css: CGFloat, ui: CGFloat)] = [
    (400, UIFont.Weight.regular.rawValue), (500, UIFont.Weight.medium.rawValue),
    (600, UIFont.Weight.semibold.rawValue), (700, UIFont.Weight.bold.rawValue),
  ]

  /// SF Pro, as the prototype's -apple-system, at the prototype's CSS weight.
  static func body(_ size: CGFloat, weight: CGFloat = 400) -> Font {
    var ui = weights[0].ui
    for (lower, upper) in zip(weights, weights.dropFirst()) where weight >= lower.css {
      let t = min(1, (weight - lower.css) / (upper.css - lower.css))
      ui = lower.ui + (upper.ui - lower.ui) * t
    }
    return Font(UIFont.systemFont(ofSize: size, weight: UIFont.Weight(rawValue: ui)))
  }
}

/// The card's words, from the generated `Share.strings`, in the app's language when the app has
/// said which (the context file), else the phone's.
struct ShareText {
  private let bundle: Bundle

  init(language: String?) {
    if let language,
      let path = Bundle.main.path(forResource: language, ofType: "lproj"),
      let bundle = Bundle(path: path)
    {
      self.bundle = bundle
    } else {
      bundle = .main
    }
  }

  func callAsFunction(_ key: String, _ values: [String: String] = [:]) -> String {
    var text = bundle.localizedString(forKey: key, value: nil, table: "Share")
    for (name, value) in values { text = text.replacingOccurrences(of: "{\(name)}", with: value) }
    return text
  }
}

/// The prototype's motion: the house curve for the sheet, a fade when Reduce Motion is on.
enum ShareMotion {
  static let sheetSeconds = 0.42
  static let dismissDistance: CGFloat = 120

  static func sheet(reduceMotion: Bool) -> Animation {
    reduceMotion
      ? .easeInOut(duration: 0.2)
      : .timingCurve(0.2, 0.9, 0.25, 1.12, duration: sheetSeconds)
  }

  static func enter(reduceMotion: Bool) -> Animation {
    reduceMotion ? .easeInOut(duration: 0.2) : .timingCurve(0.2, 0.9, 0.2, 1, duration: 0.38)
  }
}

extension View {
  /// Letter spacing in em, as the prototype writes it.
  func trackingEm(_ em: CGFloat, size: CGFloat) -> some View {
    tracking(em * size)
  }
}
