import ActivityKit
import Foundation

/// Starting, updating and ending the Live Activity. The app decides when; this only does it.
enum LiveActivities {
  static let kinds: Set<String> = ["pendingPay", "travel"]

  static var enabled: Bool { ActivityAuthorizationInfo().areActivitiesEnabled }

  static func list() -> [[String: String]] {
    Activity<SurfaceAttributes>.activities.map { activity in
      [
        "id": activity.id,
        "kind": activity.attributes.kind,
        "key": activity.attributes.key,
        "stateJson": activity.content.state.json,
      ]
    }
  }

  /// Starts an activity while the app is in the foreground; nil when iOS refuses one.
  static func start(kind: String, key: String, stateJson: String) -> String? {
    guard kinds.contains(kind), enabled else { return nil }
    let content = ActivityContent(state: SurfaceAttributes.ContentState(json: stateJson), staleDate: nil)
    return try? Activity.request(
      attributes: SurfaceAttributes(kind: kind, key: key), content: content, pushType: nil
    ).id
  }

  static func update(id: String, stateJson: String) async {
    guard let activity = find(id) else { return }
    await activity.update(
      ActivityContent(state: SurfaceAttributes.ContentState(json: stateJson), staleDate: nil))
  }

  static func end(id: String, finalStateJson: String?) async {
    guard let activity = find(id) else { return }
    let content = finalStateJson.map {
      ActivityContent(state: SurfaceAttributes.ContentState(json: $0), staleDate: nil)
    }
    await activity.end(content, dismissalPolicy: content == nil ? .immediate : .default)
  }

  private static func find(_ id: String) -> Activity<SurfaceAttributes>? {
    Activity<SurfaceAttributes>.activities.first { $0.id == id }
  }
}
