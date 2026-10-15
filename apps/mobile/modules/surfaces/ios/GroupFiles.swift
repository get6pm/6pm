import Foundation

/// The App Group the app and its extensions share, and the files they hand each other through it.
/// Nothing in the group is a database and nothing holds a lock: every file is written whole and
/// renamed into place, readable after the first unlock, and left out of iCloud and Finder backups.
enum GroupFiles {
  /// The app's bundle id, also from inside an extension (whose id is the app's plus one part).
  static let appBundleId: String = {
    let id = Bundle.main.bundleIdentifier ?? ""
    guard Bundle.main.bundleURL.pathExtension == "appex" else { return id }
    return id.split(separator: ".").dropLast().joined(separator: ".")
  }()

  /// `group.ai.sixpm.app` or, for 6pm Dev, `group.ai.sixpm.app.dev`.
  static var groupId: String { "group.\(appBundleId)" }

  /// The host of universal links and the API for this build.
  static var host: String {
    appBundleId.hasSuffix(".dev") ? "dev.at6pm.app" : "at6pm.app"
  }

  enum Failure: Error {
    case noContainer
  }

  /// A folder in the group (`inbox`, `surfaces`), made on first use.
  static func folder(_ name: String) throws -> URL {
    guard
      let container = FileManager.default.containerURL(
        forSecurityApplicationGroupIdentifier: groupId)
    else { throw Failure.noContainer }
    var url = container.appendingPathComponent(name, isDirectory: true)
    if !FileManager.default.fileExists(atPath: url.path) {
      try FileManager.default.createDirectory(
        at: url, withIntermediateDirectories: true,
        attributes: [.protectionKey: FileProtectionType.completeUntilFirstUserAuthentication])
      var values = URLResourceValues()
      values.isExcludedFromBackup = true
      try url.setResourceValues(values)
    }
    return url
  }

  /// Writes the whole file to a temporary name and renames it into place.
  static func write(_ data: Data, to url: URL) throws {
    try data.write(to: url, options: [.atomic, .completeFileProtectionUntilFirstUserAuthentication])
    var url = url
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try url.setResourceValues(values)
  }

  /// Leaves one capture for the app to import. Extensions only ever write here.
  static func writeInbox(id: String, json: Data) throws {
    try write(json, to: folder("inbox").appendingPathComponent("\(id).json"))
  }

  /// What the app wrote for the extensions to read (`snapshot`, `context`), if anything yet.
  static func readSurface(_ name: String) -> Data? {
    guard let url = try? folder("surfaces").appendingPathComponent("\(name).json") else {
      return nil
    }
    return try? Data(contentsOf: url)
  }
}
