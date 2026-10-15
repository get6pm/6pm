import CryptoKit
import Foundation

/// One model file to fetch, as the JS catalogue pins it.
struct ModelFileSpec: Codable {
  let id: String
  let url: URL
  let fileName: String
  let bytes: Int64
  let sha256: String
}

/// Where model files live: `Application Support/models/<id>/<file>`, left out of iCloud and
/// device backups (a model is fetched again, never restored). The runtime's compiled programs go
/// to Caches, which iOS may clear when space runs low; the next load rebuilds them.
enum ModelFiles {
  static func root() throws -> URL {
    let support = try FileManager.default.url(
      for: .applicationSupportDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    var models = support.appendingPathComponent("models", isDirectory: true)
    try FileManager.default.createDirectory(at: models, withIntermediateDirectories: true)
    var values = URLResourceValues()
    values.isExcludedFromBackup = true
    try models.setResourceValues(values)
    return models
  }

  static func directory(_ id: String) throws -> URL {
    let dir = try root().appendingPathComponent(id, isDirectory: true)
    try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }

  static func cacheDirectory() throws -> URL {
    let caches = try FileManager.default.url(
      for: .cachesDirectory, in: .userDomainMask, appropriateFor: nil, create: true)
    let dir = caches.appendingPathComponent("local-model", isDirectory: true)
    try FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
    return dir
  }

  static func finalFile(_ spec: ModelFileSpec) throws -> URL {
    try directory(spec.id).appendingPathComponent(spec.fileName)
  }

  static func pendingFile(_ spec: ModelFileSpec) throws -> URL {
    try directory(spec.id).appendingPathComponent(spec.fileName + ".download")
  }

  static func resumeData(_ id: String) throws -> URL {
    try directory(id).appendingPathComponent("resume.data")
  }

  /// The pinned file a download was started for, kept beside it so a download that finishes
  /// while the app is closed can still be checked.
  static func manifest(_ id: String) throws -> URL {
    try directory(id).appendingPathComponent("download.json")
  }

  static func readManifest(_ id: String) -> ModelFileSpec? {
    guard let url = try? manifest(id), let data = try? Data(contentsOf: url) else { return nil }
    return try? JSONDecoder().decode(ModelFileSpec.self, from: data)
  }

  static func writeManifest(_ spec: ModelFileSpec) throws {
    try JSONEncoder().encode(spec).write(to: try manifest(spec.id), options: .atomic)
  }

  /// The SHA-256 the file in place was checked against when it was moved there.
  static func verifiedStamp(_ spec: ModelFileSpec) throws -> URL {
    try directory(spec.id).appendingPathComponent(spec.fileName + ".sha256")
  }

  /// The pinned file is in place: the pinned size, and checked against the pinned SHA-256.
  static func isReady(_ spec: ModelFileSpec) -> Bool {
    guard let url = try? finalFile(spec),
      let size = try? url.resourceValues(forKeys: [.fileSizeKey]).fileSize,
      let stamp = try? String(contentsOf: verifiedStamp(spec), encoding: .utf8)
    else { return false }
    return Int64(size) == spec.bytes && stamp == spec.sha256
  }

  static func freeBytes() -> Int64 {
    let home = URL(fileURLWithPath: NSHomeDirectory())
    let values = try? home.resourceValues(forKeys: [.volumeAvailableCapacityForImportantUsageKey])
    return values?.volumeAvailableCapacityForImportantUsage ?? 0
  }

  static func remove(_ id: String) throws {
    let dir = try root().appendingPathComponent(id, isDirectory: true)
    if FileManager.default.fileExists(atPath: dir.path) {
      try FileManager.default.removeItem(at: dir)
    }
  }

  /// SHA-256 of a file of several GB, read in pieces so memory stays flat.
  static func sha256(of url: URL) throws -> String {
    let handle = try FileHandle(forReadingFrom: url)
    defer { try? handle.close() }
    var hasher = SHA256()
    while true {
      let more: Bool = try autoreleasepool {
        guard let chunk = try handle.read(upToCount: 8 << 20), !chunk.isEmpty else { return false }
        hasher.update(data: chunk)
        return true
      }
      if !more { break }
    }
    return hasher.finalize().map { String(format: "%02x", $0) }.joined()
  }
}
