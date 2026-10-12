import AppIntents
import Foundation

/// A screen of the app, opened through its universal link (`https://<host>/app/<path>`), which the
/// app routes the same way whether it was running or not.
enum AppLink {
  static func url(_ path: String) -> URL {
    var components = URLComponents()
    components.scheme = "https"
    components.host = GroupFiles.host
    components.path = "/app/\(path)"
    // Built from fixed parts, so it is always a valid URL.
    return components.url ?? URL(fileURLWithPath: "/")
  }
}

/// "Scan QR in 6pm": opens Scan to pay.
@available(iOS 18.0, *)
struct OpenScanIntent: AppIntent {
  static let title = LocalizedStringResource("scan.title", table: "Intents")
  static let description = IntentDescription(
    LocalizedStringResource("scan.description", table: "Intents"))

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(AppLink.url("scan")))
  }
}

/// "Quick add in 6pm": opens Quick add.
@available(iOS 18.0, *)
struct OpenQuickAddIntent: AppIntent {
  static let title = LocalizedStringResource("quickAdd.title", table: "Intents")
  static let description = IntentDescription(
    LocalizedStringResource("quickAdd.description", table: "Intents"))

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(AppLink.url("quick-add")))
  }
}
