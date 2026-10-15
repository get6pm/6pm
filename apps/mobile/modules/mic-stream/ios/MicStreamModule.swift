import AVFoundation
import ExpoModulesCore

/// The microphone for JS as 16 kHz mono 16-bit PCM, base64 in chunks of about 100 ms, for a
/// realtime transcriber. Nothing is written to disk. `onStop` says when iOS took the microphone
/// away (a call, Siri, another app, a headset change) so the session can end with what it heard.
public class MicStreamModule: Module {
  private let engine = AVAudioEngine()
  private var pending = Data()
  private var running = false
  private var observers: [NSObjectProtocol] = []
  private let lock = NSLock()

  /// 16 kHz, mono, Int16: what both transcribers take.
  private static let sampleRate: Double = 16_000
  /// 100 ms of audio at 2 bytes a sample.
  private static let chunkBytes = 3_200

  public func definition() -> ModuleDefinition {
    Name("MicStream")

    Events("onAudio", "onStop")

    AsyncFunction("start") { [weak self] in
      try self?.begin()
    }.runOnQueue(.main)

    AsyncFunction("stop") { [weak self] in
      self?.end(reason: nil)
    }.runOnQueue(.main)

    OnDestroy { [weak self] in
      self?.end(reason: nil)
    }
  }

  private func begin() throws {
    if running { return }
    let session = AVAudioSession.sharedInstance()
    try session.setCategory(.record, mode: .measurement, options: [.duckOthers])
    try session.setActive(true, options: .notifyOthersOnDeactivation)

    let input = engine.inputNode
    let inputFormat = input.outputFormat(forBus: 0)
    guard inputFormat.sampleRate > 0,
      let outputFormat = AVAudioFormat(
        commonFormat: .pcmFormatInt16, sampleRate: Self.sampleRate, channels: 1, interleaved: true),
      let converter = AVAudioConverter(from: inputFormat, to: outputFormat)
    else {
      try? session.setActive(false, options: .notifyOthersOnDeactivation)
      throw MicUnavailable()
    }
    lock.withLock { pending = Data() }

    input.installTap(onBus: 0, bufferSize: 1_024, format: inputFormat) { [weak self] buffer, _ in
      self?.take(buffer, with: converter, into: outputFormat)
    }
    engine.prepare()
    do {
      try engine.start()
    } catch {
      input.removeTap(onBus: 0)
      try? session.setActive(false, options: .notifyOthersOnDeactivation)
      throw error
    }
    running = true
    watch(session)
  }

  /// Resamples one buffer from the microphone and sends whole chunks on.
  private func take(
    _ buffer: AVAudioPCMBuffer, with converter: AVAudioConverter, into format: AVAudioFormat
  ) {
    let ratio = format.sampleRate / buffer.format.sampleRate
    let capacity = AVAudioFrameCount(Double(buffer.frameLength) * ratio) + 16
    guard let output = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: capacity) else { return }
    var given = false
    var failure: NSError?
    converter.convert(to: output, error: &failure) { _, status in
      if given {
        status.pointee = .noDataNow
        return nil
      }
      given = true
      status.pointee = .haveData
      return buffer
    }
    guard failure == nil, let samples = output.int16ChannelData, output.frameLength > 0 else {
      return
    }
    let bytes = Data(bytes: samples[0], count: Int(output.frameLength) * 2)
    var chunks: [Data] = []
    lock.withLock {
      pending.append(bytes)
      while pending.count >= Self.chunkBytes {
        chunks.append(pending.prefix(Self.chunkBytes))
        pending.removeFirst(Self.chunkBytes)
      }
    }
    for chunk in chunks {
      sendEvent("onAudio", ["chunk": chunk.base64EncodedString()])
    }
  }

  /// Stops the microphone, sends what is left, and hands the audio session back to other apps.
  private func end(reason: String?) {
    guard running else { return }
    running = false
    for observer in observers { NotificationCenter.default.removeObserver(observer) }
    observers = []
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
    let rest = lock.withLock { () -> Data in
      let rest = pending
      pending = Data()
      return rest
    }
    if !rest.isEmpty { sendEvent("onAudio", ["chunk": rest.base64EncodedString()]) }
    try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    if let reason { sendEvent("onStop", ["reason": reason]) }
  }

  private func watch(_ session: AVAudioSession) {
    let center = NotificationCenter.default
    observers.append(
      center.addObserver(
        forName: AVAudioSession.interruptionNotification, object: session, queue: .main
      ) { [weak self] note in
        let raw = note.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt
        if raw == AVAudioSession.InterruptionType.began.rawValue {
          self?.end(reason: "interrupted")
        }
      })
    observers.append(
      center.addObserver(
        forName: .AVAudioEngineConfigurationChange, object: engine, queue: .main
      ) { [weak self] _ in
        self?.end(reason: "interrupted")
      })
    observers.append(
      center.addObserver(
        forName: AVAudioSession.mediaServicesWereResetNotification, object: session, queue: .main
      ) { [weak self] _ in
        self?.end(reason: "interrupted")
      })
  }
}

/// The microphone has no usable input (none attached, or iOS gave it a format of 0 Hz).
struct MicUnavailable: Error, LocalizedError {
  var errorDescription: String? { "The microphone is not available" }
}
