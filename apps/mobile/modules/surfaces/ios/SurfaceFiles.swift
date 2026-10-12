import Foundation
import WidgetKit

/// What the app writes for its widgets and extensions to draw, then tells WidgetKit to redraw.
enum SurfaceFiles {
  static let names: Set<String> = ["snapshot", "context"]

  static func write(name: String, json: String) throws {
    guard names.contains(name), let data = json.data(using: .utf8) else { return }
    try GroupFiles.write(data, to: GroupFiles.folder("surfaces").appendingPathComponent("\(name).json"))
    if name == "snapshot" { reloadWidgets() }
  }

  static func writeImage(name: String, pngBase64: String) throws {
    guard name.allSatisfy({ $0.isLetter || $0.isNumber || $0 == "-" }),
      let data = Data(base64Encoded: pngBase64)
    else { return }
    try GroupFiles.write(data, to: GroupFiles.folder("surfaces").appendingPathComponent("\(name).png"))
  }

  static func reloadWidgets() {
    WidgetCenter.shared.reloadAllTimelines()
    if #available(iOS 18.0, *) {
      ControlCenter.shared.reloadAllControls()
    }
  }
}
