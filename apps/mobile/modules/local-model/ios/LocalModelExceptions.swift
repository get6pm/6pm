import ExpoModulesCore

/// A download that could not start. The JS side reads the reason from the code's last word.
final class DownloadException: Exception, @unchecked Sendable {
  let failure: DownloadFailure

  init(_ failure: DownloadFailure) {
    self.failure = failure
    super.init()
  }

  override var reason: String { "The model download could not start: \(failure.rawValue)" }
  override var code: String { "ERR_LOCAL_MODEL_\(failure.rawValue.uppercased())" }
}

/// Loading or answering failed. Codes: ERR_LOCAL_MODEL_UNAVAILABLE, _NOT_DOWNLOADED, _LOAD,
/// _TIMEOUT, _GENERATE.
final class LocalModelException: Exception, @unchecked Sendable {
  let kind: String
  let detail: String

  init(_ kind: String, _ detail: String = "") {
    self.kind = kind
    self.detail = detail
    super.init()
  }

  override var reason: String { detail.isEmpty ? "The local model failed: \(kind)" : detail }
  override var code: String { "ERR_LOCAL_MODEL_\(kind.uppercased())" }

  static func from(_ failure: EngineFailure) -> LocalModelException {
    switch failure {
    case .createFailed: return LocalModelException("load", "The model could not be loaded")
    case .conversationFailed: return LocalModelException("generate", "No conversation opened")
    case .streamFailed(let message): return LocalModelException("generate", message)
    case .timedOut, .stuck: return LocalModelException("timeout", "The answer took too long")
    }
  }
}
