import Foundation
import Metal

/// How a model is loaded, from the JS catalogue.
struct LoadOptions {
  let modelId: String
  let path: String
  /// `gpu` (Metal) or `cpu`. The simulator always gets `cpu`: its Metal is not the phone's.
  let backend: String
  let contextTokens: Int
  /// The model keeps a running state the runtime does not reset between conversations (Qwen3.5's
  /// linear attention), so each answer gets a fresh engine, built again in the background.
  let freshPerAnswer: Bool
}

/// Holds at most one loaded model. Every load, answer and unload runs on one serial queue, so
/// the runtime is never entered twice at once.
final class ModelHost {
  static let shared = ModelHost()

  private let queue = DispatchQueue(label: "ai.sixpm.local-model", qos: .userInitiated)
  private var engine: LiteRTEngine?
  private var options: LoadOptions?
  /// Read from any thread; written only on `queue`.
  private let loadedLock = NSLock()
  private var loadedId: String?

  var runsOnThisDevice: Bool {
    #if targetEnvironment(simulator)
      return true
    #else
      return MTLCreateSystemDefaultDevice() != nil
    #endif
  }

  func isLoaded(_ modelId: String) -> Bool {
    loadedLock.lock()
    defer { loadedLock.unlock() }
    return loadedId == modelId
  }

  func load(_ options: LoadOptions) async throws {
    try await run {
      if self.engine?.modelId == options.modelId, self.engine?.isStuck == false { return }
      self.drop()
      try self.build(options)
    }
  }

  func generate(_ request: GenerateRequest) async throws -> String {
    try await run {
      if self.engine == nil || self.engine?.isStuck == true, let options = self.options {
        self.drop(keepOptions: true)
        try self.build(options)
      }
      guard let engine = self.engine else { throw EngineFailure.createFailed }
      defer { self.refreshIfNeeded() }
      return try engine.generate(request)
    }
  }

  func unload() async {
    try? await run { self.drop() }
  }

  /// Under memory pressure the model goes first; the next answer loads it again.
  func unloadForMemory(then notify: @escaping (String) -> Void) {
    queue.async {
      guard let id = self.engine?.modelId else { return }
      self.drop(keepOptions: true)
      notify(id)
    }
  }

  private func build(_ options: LoadOptions) throws {
    let backend = runsOnSimulator ? "cpu" : options.backend
    engine = try LiteRTEngine(
      modelId: options.modelId, path: options.path, backend: backend,
      contextTokens: options.contextTokens, cacheDirectory: try ModelFiles.cacheDirectory().path)
    self.options = options
    setLoaded(options.modelId)
  }

  /// A model whose state outlives a conversation is rebuilt after each answer, before the next.
  private func refreshIfNeeded() {
    guard let options, options.freshPerAnswer else { return }
    queue.async {
      guard self.options?.modelId == options.modelId, self.engine != nil else { return }
      self.drop(keepOptions: true)
      try? self.build(options)
    }
  }

  private func drop(keepOptions: Bool = false) {
    engine = nil
    if !keepOptions { options = nil }
    setLoaded(nil)
  }

  private func setLoaded(_ id: String?) {
    loadedLock.lock()
    loadedId = id
    loadedLock.unlock()
  }

  private var runsOnSimulator: Bool {
    #if targetEnvironment(simulator)
      return true
    #else
      return false
    #endif
  }

  private func run<T>(_ work: @escaping () throws -> T) async throws -> T {
    try await withCheckedThrowingContinuation { continuation in
      queue.async { continuation.resume(with: Result(catching: work)) }
    }
  }
}
