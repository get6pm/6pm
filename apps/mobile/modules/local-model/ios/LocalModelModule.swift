import ExpoModulesCore

struct FileSpecRecord: Record {
  @Field var id: String = ""
  @Field var url: String = ""
  @Field var fileName: String = ""
  @Field var bytes: Double = 0
  @Field var sha256: String = ""

  func spec() throws -> ModelFileSpec {
    guard let link = URL(string: url) else { throw LocalModelException("load", "Bad model URL") }
    return ModelFileSpec(
      id: id, url: link, fileName: fileName, bytes: Int64(bytes), sha256: sha256.lowercased())
  }
}

struct LoadRecord: Record {
  @Field var file: FileSpecRecord = FileSpecRecord()
  @Field var backend: String = "gpu"
  @Field var contextTokens: Int = 4096
  @Field var freshPerAnswer: Bool = false
}

struct GenerateRecord: Record {
  @Field var system: String = ""
  @Field var prompt: String = ""
  @Field var maxTokens: Int = 256
  @Field var temperature: Double = 0
  @Field var timeoutMs: Double = 20_000
}

/// The downloaded local model for JS: fetch it, check it, load it, write with it, let it go.
public class LocalModelModule: Module {
  private var memoryObserver: NSObjectProtocol?

  public func definition() -> ModuleDefinition {
    Name("LocalModel")

    Events("onDownload", "onUnloaded")

    OnCreate { [weak self] in
      ModelDownloads.shared.onEvent = { event in
        self?.sendEvent("onDownload", event)
      }
      ModelDownloads.shared.reconnect()
      self?.memoryObserver = NotificationCenter.default.addObserver(
        forName: UIApplication.didReceiveMemoryWarningNotification, object: nil, queue: nil
      ) { _ in
        ModelHost.shared.unloadForMemory { id in
          self?.sendEvent("onUnloaded", ["id": id, "reason": "memory"])
        }
      }
    }

    OnDestroy {
      ModelDownloads.shared.onEvent = nil
      if let observer = self.memoryObserver { NotificationCenter.default.removeObserver(observer) }
    }

    /// Physical memory in whole GB as phones are sold (an "8 GB" iPhone reports a little less).
    Function("memoryGb") { () -> Int in
      let gib = Double(ProcessInfo.processInfo.physicalMemory) / 1_073_741_824
      return Int(gib.rounded(.up))
    }

    /// `available`, or `unavailable` where the runtime cannot run (no Metal device).
    Function("availability") { () -> String in
      ModelHost.shared.runsOnThisDevice ? "available" : "unavailable"
    }

    Function("freeBytes") { () -> Double in
      Double(ModelFiles.freeBytes())
    }

    Function("isLoaded") { (id: String) -> Bool in
      ModelHost.shared.isLoaded(id)
    }

    AsyncFunction("load") { (options: LoadRecord) async throws in
      guard ModelHost.shared.runsOnThisDevice else { throw LocalModelException("unavailable") }
      let spec = try options.file.spec()
      guard ModelFiles.isReady(spec) else { throw LocalModelException("not_downloaded") }
      do {
        try await ModelHost.shared.load(
          LoadOptions(
            modelId: spec.id, path: try ModelFiles.finalFile(spec).path, backend: options.backend,
            contextTokens: options.contextTokens, freshPerAnswer: options.freshPerAnswer))
      } catch let failure as EngineFailure {
        throw LocalModelException.from(failure)
      }
    }

    AsyncFunction("generate") { (options: GenerateRecord) async throws -> String in
      let request = GenerateRequest(
        system: options.system, prompt: options.prompt, maxTokens: max(1, options.maxTokens),
        temperature: Float(max(0, options.temperature)),
        timeout: max(0.1, options.timeoutMs / 1000))
      do {
        return try await ModelHost.shared.generate(request)
      } catch let failure as EngineFailure {
        throw LocalModelException.from(failure)
      }
    }

    AsyncFunction("unload") { () async in
      await ModelHost.shared.unload()
    }

    AsyncFunction("downloadState") { (file: FileSpecRecord) async throws -> [String: Any] in
      await ModelDownloads.shared.state(try file.spec())
    }

    AsyncFunction("startDownload") {
      (file: FileSpecRecord, allowCellular: Bool, minimumFreeBytes: Double) async throws in
      try await ModelDownloads.shared.start(
        try file.spec(), allowCellular: allowCellular, minimumFree: Int64(minimumFreeBytes))
    }

    AsyncFunction("cancelDownload") { (id: String) async in
      await ModelDownloads.shared.cancel(id)
    }

    AsyncFunction("deleteModel") { (id: String) async throws in
      // Whatever is loaded lets go first: an engine must never outlive the file under it.
      await ModelHost.shared.unload()
      try await ModelDownloads.shared.delete(id)
    }
  }
}
