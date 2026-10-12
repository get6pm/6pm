import SwiftUI
import UIKit

/// The card Siri and Shortcuts show once a spend is logged: the companion, "Logged. Phở · Food",
/// what is safe today now, and the amount in the display face.
struct LoggedSnippet: View {
  let spend: LoggedSpend

  var body: some View {
    HStack(spacing: 12) {
      if let companion = Self.companion {
        Image(uiImage: companion)
          .resizable()
          .frame(width: 44, height: 44)
          .accessibilityHidden(true)
      }
      VStack(alignment: .leading, spacing: 2) {
        (Text("logSpend.logged", tableName: "Intents") + Text(verbatim: " \(spend.title)"))
          .font(.system(size: 15, weight: .semibold))
          .lineLimit(1)
        if let safe = spend.safeAfterText {
          Text(verbatim: safe)
            .font(.system(size: 13))
            .opacity(0.6)
            .lineLimit(1)
        }
      }
      .frame(maxWidth: .infinity, alignment: .leading)
      Text(verbatim: spend.amountText)
        .font(.custom("BricolageGrotesque", size: 26).weight(.medium))
        .monospacedDigit()
        .lineLimit(1)
        .minimumScaleFactor(0.7)
    }
    .foregroundStyle(ThemeTokens.PlainDay.btnFg)
    .padding(.vertical, 14)
    .padding(.horizontal, 16)
    .background(
      ThemeTokens.PlainDay.btnBg, in: RoundedRectangle(cornerRadius: 26, style: .continuous))
  }

  /// The happy companion at 44 pt the app draws into the App Group in the user's look; none until
  /// the app has drawn it.
  static var companion: UIImage? {
    guard
      let url = try? GroupFiles.folder("surfaces").appendingPathComponent("companion-happy-44.png"),
      let data = try? Data(contentsOf: url)
    else { return nil }
    return UIImage(data: data, scale: 3)
  }
}
