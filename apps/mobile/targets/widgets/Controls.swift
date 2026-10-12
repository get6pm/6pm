import AppIntents
import SwiftUI
import WidgetKit

/// Control Center, the Lock Screen and the Action button take only SF Symbols, so the controls
/// wear `qrcode.viewfinder` and `plus` where the app draws Material Symbols. Each one opens its
/// screen through the universal link, which the app routes whether it was running or not.
@available(iOS 18.0, *)
enum ControlLink {
  static func url(_ path: String) -> URL {
    var components = URLComponents()
    components.scheme = "https"
    components.host = GroupFiles.host
    components.path = "/app/\(path)"
    return components.url ?? URL(fileURLWithPath: "/")
  }
}

/// "Scan QR": opens Scan to pay.
@available(iOS 18.0, *)
struct ScanQRControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "ScanQR") {
      ControlWidgetButton(action: OpenURLIntent(ControlLink.url("scan"))) {
        Label {
          Text("scan.title", tableName: "Intents")
        } icon: {
          Image(systemName: "qrcode.viewfinder")
        }
      }
    }
    .displayName(LocalizedStringResource("scan.title", table: "Intents"))
    .description(LocalizedStringResource("scan.description", table: "Intents"))
  }
}

/// "Quick add": opens Quick add.
@available(iOS 18.0, *)
struct QuickAddControl: ControlWidget {
  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: "QuickAdd") {
      ControlWidgetButton(action: OpenURLIntent(ControlLink.url("quick-add"))) {
        Label {
          Text("quickAdd.title", tableName: "Intents")
        } icon: {
          Image(systemName: "plus")
        }
      }
    }
    .displayName(LocalizedStringResource("quickAdd.title", table: "Intents"))
    .description(LocalizedStringResource("quickAdd.description", table: "Intents"))
  }
}
