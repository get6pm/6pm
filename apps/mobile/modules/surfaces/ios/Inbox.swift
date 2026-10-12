import Foundation

/// The app's side of the inbox: what the extensions left, oldest first, and removing what was saved.
enum Inbox {
  static func read() throws -> [[String: String]] {
    let folder = try GroupFiles.folder("inbox")
    let files = try FileManager.default.contentsOfDirectory(
      at: folder, includingPropertiesForKeys: [.creationDateKey], options: [.skipsHiddenFiles]
    ).filter { $0.pathExtension == "json" }
    let dated = files.map { url in
      (url, (try? url.resourceValues(forKeys: [.creationDateKey]).creationDate) ?? .distantPast)
    }
    return dated.sorted { $0.1 < $1.1 }.compactMap { url, _ in
      guard let json = try? String(contentsOf: url, encoding: .utf8) else { return nil }
      return ["id": url.deletingPathExtension().lastPathComponent, "json": json]
    }
  }

  static func remove(_ ids: [String]) throws {
    let folder = try GroupFiles.folder("inbox")
    for id in ids where !id.contains("/") {
      let url = folder.appendingPathComponent("\(id).json")
      if FileManager.default.fileExists(atPath: url.path) {
        try FileManager.default.removeItem(at: url)
      }
    }
  }
}
