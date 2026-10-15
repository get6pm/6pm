import Foundation

/// Why a download stopped, as the JS side names it.
enum DownloadFailure: String {
  case space, network, http, checksum, cancelled, storage
}

/// Fetches model files in a background `URLSession`: the download carries on with the app closed,
/// resumes from where it stopped, waits for Wi-Fi unless the person allowed cellular, and is
/// checked against its pinned SHA-256 before it counts as ready.
final class ModelDownloads: NSObject, URLSessionDownloadDelegate {
  static let shared = ModelDownloads()

  /// `{ id, state, received?, total?, reason? }` for the JS side; nil while no JS is running.
  var onEvent: (([String: Any]) -> Void)?
  /// iOS's completion handlers for events delivered while the app was in the background.
  var backgroundCompletions: [String: () -> Void] = [:]

  private let lock = NSLock()
  private var verifying = Set<String>()
  private var lastProgress: [String: Date] = [:]
  private let checkQueue = DispatchQueue(label: "ai.sixpm.local-model.verify", qos: .utility)

  private static let prefix = (Bundle.main.bundleIdentifier ?? "ai.sixpm.app") + ".local-model"
  static let wifiIdentifier = prefix + ".wifi"
  static let anyIdentifier = prefix + ".any"

  /// One session per identifier for the life of the app, made on first use from any thread.
  private var sessions: (wifi: URLSession, any: URLSession)?
  private var wifiSession: URLSession { connected().wifi }
  private var anySession: URLSession { connected().any }

  /// Reattaches to downloads iOS kept going while the app was closed.
  func reconnect() {
    _ = connected()
  }

  private func connected() -> (wifi: URLSession, any: URLSession) {
    lock.lock()
    defer { lock.unlock() }
    if let sessions { return sessions }
    let made = (
      wifi: makeSession(Self.wifiIdentifier, cellular: false),
      any: makeSession(Self.anyIdentifier, cellular: true)
    )
    sessions = made
    return made
  }

  func owns(_ identifier: String) -> Bool {
    identifier == Self.wifiIdentifier || identifier == Self.anyIdentifier
  }

  func start(_ spec: ModelFileSpec, allowCellular: Bool, minimumFree: Int64) async throws {
    if ModelFiles.isReady(spec) { return emit(spec.id, "ready") }
    let resumeURL = try ModelFiles.resumeData(spec.id)
    await stopTasks(spec.id, keepingResumeData: true)
    var resume = try? Data(contentsOf: resumeURL)
    // Resume data belongs to the file it was started for.
    if ModelFiles.readManifest(spec.id)?.sha256 != spec.sha256 { resume = nil }
    // Checked again here: space may have gone since the JS side looked.
    guard ModelFiles.freeBytes() >= minimumFree else { throw DownloadException(.space) }
    try ModelFiles.writeManifest(spec)
    try? FileManager.default.removeItem(at: resumeURL)

    let session = allowCellular ? anySession : wifiSession
    let task = resume.map { session.downloadTask(withResumeData: $0) }
      ?? session.downloadTask(with: spec.url)
    task.taskDescription = spec.id
    task.countOfBytesClientExpectsToReceive = spec.bytes
    task.resume()
    emit(spec.id, "downloading", ["received": 0, "total": spec.bytes])
  }

  /// Stops a download and keeps what came, so starting again picks up from there.
  func cancel(_ id: String) async {
    await stopTasks(id, keepingResumeData: true)
    emit(id, "failed", ["reason": DownloadFailure.cancelled.rawValue])
  }

  func delete(_ id: String) async throws {
    await stopTasks(id, keepingResumeData: false)
    try ModelFiles.remove(id)
    emit(id, "idle")
  }

  func state(_ spec: ModelFileSpec) async -> [String: Any] {
    if ModelFiles.isReady(spec) { return ["id": spec.id, "state": "ready"] }
    if isVerifying(spec.id) { return ["id": spec.id, "state": "verifying"] }
    for task in await tasks(spec.id) where task.state == .running || task.state == .suspended {
      return [
        "id": spec.id, "state": "downloading", "received": task.countOfBytesReceived,
        "total": spec.bytes,
      ]
    }
    return ["id": spec.id, "state": "idle"]
  }

  // MARK: - URLSessionDownloadDelegate

  func urlSession(
    _ session: URLSession, downloadTask: URLSessionDownloadTask, didWriteData bytesWritten: Int64,
    totalBytesWritten: Int64, totalBytesExpectedToWrite: Int64
  ) {
    guard let id = downloadTask.taskDescription, shouldReport(id) else { return }
    let total = totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : nil
    emit(id, "downloading", ["received": totalBytesWritten, "total": total ?? NSNull()])
  }

  func urlSession(
    _ session: URLSession, downloadTask: URLSessionDownloadTask, didFinishDownloadingTo location: URL
  ) {
    guard let id = downloadTask.taskDescription, let spec = ModelFiles.readManifest(id) else { return }
    if let http = downloadTask.response as? HTTPURLResponse, !(200..<300).contains(http.statusCode) {
      return emit(id, "failed", ["reason": DownloadFailure.http.rawValue])
    }
    // The file at `location` is gone when this returns: move it now, check it afterwards.
    do {
      let pending = try ModelFiles.pendingFile(spec)
      try? FileManager.default.removeItem(at: pending)
      try FileManager.default.moveItem(at: location, to: pending)
    } catch {
      return emit(id, "failed", ["reason": DownloadFailure.storage.rawValue])
    }
    setVerifying(id, true)
    emit(id, "verifying")
    checkQueue.async { self.verify(spec) }
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    guard let id = task.taskDescription, let error = error as NSError? else { return }
    if let data = error.userInfo[NSURLSessionDownloadTaskResumeData] as? Data,
      let url = try? ModelFiles.resumeData(id)
    {
      try? data.write(to: url, options: .atomic)
    }
    let reason: DownloadFailure = error.code == NSURLErrorCancelled ? .cancelled : .network
    // A cancel made by `start` or `delete` is not news to the person.
    if reason == .network { emit(id, "failed", ["reason": reason.rawValue]) }
  }

  func urlSessionDidFinishEvents(forBackgroundURLSession session: URLSession) {
    guard let identifier = session.configuration.identifier else { return }
    DispatchQueue.main.async {
      self.backgroundCompletions.removeValue(forKey: identifier)?()
    }
  }

  // MARK: - Private

  private func verify(_ spec: ModelFileSpec) {
    defer { setVerifying(spec.id, false) }
    do {
      let pending = try ModelFiles.pendingFile(spec)
      let size = try pending.resourceValues(forKeys: [.fileSizeKey]).fileSize ?? 0
      guard Int64(size) == spec.bytes, try ModelFiles.sha256(of: pending) == spec.sha256 else {
        try? FileManager.default.removeItem(at: pending)
        try? FileManager.default.removeItem(at: ModelFiles.resumeData(spec.id))
        return emit(spec.id, "failed", ["reason": DownloadFailure.checksum.rawValue])
      }
      let final = try ModelFiles.finalFile(spec)
      try? FileManager.default.removeItem(at: final)
      try FileManager.default.moveItem(at: pending, to: final)
      try spec.sha256.write(to: ModelFiles.verifiedStamp(spec), atomically: true, encoding: .utf8)
      try? FileManager.default.removeItem(at: ModelFiles.manifest(spec.id))
      emit(spec.id, "ready")
    } catch {
      emit(spec.id, "failed", ["reason": DownloadFailure.storage.rawValue])
    }
  }

  private func makeSession(_ identifier: String, cellular: Bool) -> URLSession {
    let config = URLSessionConfiguration.background(withIdentifier: identifier)
    config.allowsCellularAccess = cellular
    config.allowsExpensiveNetworkAccess = cellular
    config.allowsConstrainedNetworkAccess = cellular
    config.isDiscretionary = false
    config.sessionSendsLaunchEvents = true
    return URLSession(configuration: config, delegate: self, delegateQueue: nil)
  }

  private func tasks(_ id: String) async -> [URLSessionTask] {
    let all = await wifiSession.allTasks + anySession.allTasks
    return all.filter { $0.taskDescription == id }
  }

  private func stopTasks(_ id: String, keepingResumeData: Bool) async {
    for task in await tasks(id) {
      guard let download = task as? URLSessionDownloadTask, keepingResumeData else {
        task.cancel()
        continue
      }
      if let data = await download.cancelByProducingResumeData(),
        let url = try? ModelFiles.resumeData(id)
      {
        try? data.write(to: url, options: .atomic)
      }
    }
  }

  /// Progress at most four times a second: enough for a bar, not a flood over the bridge.
  private func shouldReport(_ id: String) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    let now = Date()
    if let last = lastProgress[id], now.timeIntervalSince(last) < 0.25 { return false }
    lastProgress[id] = now
    return true
  }

  private func isVerifying(_ id: String) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    return verifying.contains(id)
  }

  private func setVerifying(_ id: String, _ on: Bool) {
    lock.lock()
    if on { verifying.insert(id) } else { verifying.remove(id) }
    lock.unlock()
  }

  private func emit(_ id: String, _ state: String, _ extra: [String: Any] = [:]) {
    onEvent?(extra.merging(["id": id, "state": state]) { _, new in new })
  }
}
