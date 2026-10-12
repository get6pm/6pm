import ActivityKit
import AppIntents
import Foundation

#if canImport(Surfaces)
  internal import Surfaces
#endif

/// "Paid" on the Live Activity of a payment that was waiting. It runs in the app's process, so it
/// is linked into the app and the widget; it only leaves an inbox event for the app to import and
/// ends the activity.
struct MarkPaidIntent: LiveActivityIntent {
  static let title = LocalizedStringResource("markPaid.title", table: "Surfaces")
  static let isDiscoverable = false

  @Parameter(title: LocalizedStringResource("markPaid.title", table: "Surfaces"))
  var spendId: String

  init() {}

  init(spendId: String) {
    self.spendId = spendId
  }

  func perform() async throws -> some IntentResult {
    let id = UUID().uuidString.lowercased()
    let event: [String: Any] = [
      "v": 1, "id": id, "kind": "paid", "spendId": spendId,
      "at": ISO8601DateFormatter().string(from: Date()),
    ]
    try GroupFiles.writeInbox(id: id, json: JSONSerialization.data(withJSONObject: event))
    for activity in Activity<SurfaceAttributes>.activities where activity.attributes.key == spendId {
      await activity.end(nil, dismissalPolicy: .immediate)
    }
    return .result()
  }
}
