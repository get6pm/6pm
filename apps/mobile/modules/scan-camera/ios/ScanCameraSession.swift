import AVFoundation
import QuartzCore
import Vision

/// The camera behind Scan: one capture session that finds QR codes (the system's metadata
/// reader, as fast as the Camera app's) and the receipt in view (Vision's document segmentation,
/// ten times a second), and takes the full-resolution photo a receipt is read from.
///
/// Everything that touches the session runs on `queue`; frames are read on `frames`.
final class ScanCameraSession: NSObject, @unchecked Sendable {
  let session = AVCaptureSession()

  /// A QR code's text, on the main queue; the same code again only after a second.
  var onCode: ((String) -> Void)?
  /// Where the receipt is, on the frames queue: corners normalised in the upright frame (origin
  /// top left), or empty once it is gone; and the frame's width over its height.
  var onReceipt: (([Double], Double) -> Void)?
  /// The session is running and showing frames, on the main queue.
  var onRunning: ((Bool) -> Void)?

  private let queue = DispatchQueue(label: "app.6pm.scan-camera.session")
  private let frames = DispatchQueue(label: "app.6pm.scan-camera.frames")
  private let photoOutput = AVCapturePhotoOutput()
  private let videoOutput = AVCaptureVideoDataOutput()
  private let metadataOutput = AVCaptureMetadataOutput()
  private var input: AVCaptureDeviceInput?
  private var outputsAdded = false
  private var captures: [Int64: PhotoCapture] = [:]

  // Read on `frames`, written on `queue`: a lock keeps them whole.
  private let lock = NSLock()
  private var _readsReceipts = true
  private var readsReceipts: Bool {
    get { lock.withLock { _readsReceipts } }
    set { lock.withLock { _readsReceipts = newValue } }
  }

  // Only on `frames`.
  private var lastRead: CFTimeInterval = 0
  private var sawReceipt = false

  // Only on main.
  private var lastCode: (text: String, at: CFTimeInterval)?

  /// Seconds between two looks for the receipt: often enough for the outline to follow the
  /// paper, rare enough to leave the phone cool.
  static let receiptInterval: CFTimeInterval = 0.1
  /// The share of the frame below which a quad is not the receipt.
  static let minimumArea = 0.06

  /// Starts or stops the camera facing `position`, setting it up the first time.
  func update(running: Bool, position: AVCaptureDevice.Position, torch: Bool, receipts: Bool) {
    readsReceipts = receipts
    queue.async { [self] in
      if running {
        if input?.device.position != position { configure(position) }
        if !session.isRunning {
          session.startRunning()
          // With no camera (the simulator) the session runs, showing nothing.
          let started = session.isRunning && input != nil
          DispatchQueue.main.async { self.onRunning?(started) }
        }
        setTorch(torch)
      } else if session.isRunning {
        setTorch(false)
        session.stopRunning()
        DispatchQueue.main.async { self.onRunning?(false) }
      }
    }
  }

  func stop() {
    queue.async { [self] in
      if session.isRunning { session.stopRunning() }
    }
  }

  /// The full-resolution photo, as the camera encodes it (its orientation in its metadata).
  func capture() async throws -> Data {
    try await withCheckedThrowingContinuation { continuation in
      queue.async { [self] in
        guard session.isRunning else {
          continuation.resume(throwing: ScanCameraException("stopped"))
          return
        }
        let settings = AVCapturePhotoSettings(format: [AVVideoCodecKey: AVVideoCodecType.jpeg])
        settings.photoQualityPrioritization = .balanced
        let id = settings.uniqueID
        let capture = PhotoCapture { [weak self] result in
          self?.queue.async { self?.captures[id] = nil }
          continuation.resume(with: result)
        }
        captures[id] = capture
        photoOutput.capturePhoto(with: settings, delegate: capture)
      }
    }
  }

  // MARK: Setting up

  /// The back camera that can switch lenses by itself, so a receipt held close gets the macro
  /// lens as the Camera app does; the front camera when the iPhone Duo stands on a counter.
  private static func device(_ position: AVCaptureDevice.Position) -> AVCaptureDevice? {
    let types: [AVCaptureDevice.DeviceType] =
      position == .back
      ? [.builtInTripleCamera, .builtInDualWideCamera, .builtInWideAngleCamera]
      : [.builtInWideAngleCamera]
    for type in types {
      if let device = AVCaptureDevice.default(type, for: .video, position: position) {
        return device
      }
    }
    return nil
  }

  private func configure(_ position: AVCaptureDevice.Position) {
    guard let device = Self.device(position),
      let next = try? AVCaptureDeviceInput(device: device)
    else { return }
    session.beginConfiguration()
    defer { session.commitConfiguration() }
    if session.canSetSessionPreset(.photo) { session.sessionPreset = .photo }
    if let input { session.removeInput(input) }
    guard session.canAddInput(next) else { return }
    session.addInput(next)
    input = next
    if !outputsAdded { addOutputs() }
    orient(mirrored: position == .front)
    prepare(device)
  }

  private func addOutputs() {
    if session.canAddOutput(photoOutput) {
      session.addOutput(photoOutput)
      photoOutput.maxPhotoQualityPrioritization = .balanced
    }
    videoOutput.alwaysDiscardsLateVideoFrames = true
    videoOutput.videoSettings = [
      kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarFullRange
    ]
    videoOutput.setSampleBufferDelegate(self, queue: frames)
    if session.canAddOutput(videoOutput) { session.addOutput(videoOutput) }
    if session.canAddOutput(metadataOutput) {
      session.addOutput(metadataOutput)
      if metadataOutput.availableMetadataObjectTypes.contains(.qr) {
        metadataOutput.metadataObjectTypes = [.qr]
      }
      metadataOutput.setMetadataObjectsDelegate(self, queue: .main)
    }
    outputsAdded = true
  }

  /// Frames and photos upright for a phone held upright; the front camera mirrored as its
  /// preview is.
  private func orient(mirrored: Bool) {
    for output in [videoOutput, photoOutput] as [AVCaptureOutput] {
      guard let connection = output.connection(with: .video) else { continue }
      if connection.isVideoRotationAngleSupported(90) { connection.videoRotationAngle = 90 }
      if connection.isVideoMirroringSupported {
        connection.automaticallyAdjustsVideoMirroring = false
        connection.isVideoMirrored = mirrored
      }
    }
  }

  /// Starts a lens-switching camera at its 1× lens, not its widest, and focuses continuously.
  private func prepare(_ device: AVCaptureDevice) {
    guard (try? device.lockForConfiguration()) != nil else { return }
    defer { device.unlockForConfiguration() }
    if let wide = device.virtualDeviceSwitchOverVideoZoomFactors.first {
      device.videoZoomFactor = CGFloat(truncating: wide)
    }
    if device.isFocusModeSupported(.continuousAutoFocus) { device.focusMode = .continuousAutoFocus }
    if device.isExposureModeSupported(.continuousAutoExposure) {
      device.exposureMode = .continuousAutoExposure
    }
  }

  private func setTorch(_ on: Bool) {
    guard let device = input?.device, device.hasTorch, device.isTorchAvailable else { return }
    let mode: AVCaptureDevice.TorchMode = on ? .on : .off
    guard device.torchMode != mode, (try? device.lockForConfiguration()) != nil else { return }
    device.torchMode = mode
    device.unlockForConfiguration()
  }
}

extension ScanCameraSession: AVCaptureMetadataOutputObjectsDelegate {
  func metadataOutput(
    _ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject],
    from connection: AVCaptureConnection
  ) {
    guard
      let text = metadataObjects.lazy
        .compactMap({ ($0 as? AVMetadataMachineReadableCodeObject)?.stringValue }).first
    else { return }
    let now = CACurrentMediaTime()
    if let last = lastCode, last.text == text, now - last.at < 1 { return }
    lastCode = (text, now)
    onCode?(text)
  }
}

extension ScanCameraSession: AVCaptureVideoDataOutputSampleBufferDelegate {
  func captureOutput(
    _ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer,
    from connection: AVCaptureConnection
  ) {
    guard readsReceipts else { return }
    let now = CACurrentMediaTime()
    guard now - lastRead >= Self.receiptInterval,
      let pixels = CMSampleBufferGetImageBuffer(sampleBuffer)
    else { return }
    lastRead = now
    let handler = VNImageRequestHandler(cvPixelBuffer: pixels, orientation: .up, options: [:])
    let corners = ReceiptPhoto.paper(handler, minimumArea: Self.minimumArea)?.flat ?? []
    // Nothing to say while there is still no receipt.
    if corners.isEmpty && !sawReceipt { return }
    sawReceipt = !corners.isEmpty
    let aspect = Double(CVPixelBufferGetWidth(pixels)) / Double(CVPixelBufferGetHeight(pixels))
    onReceipt?(corners, aspect)
  }
}

/// One photo on its way: hands its data back once, then is let go.
private final class PhotoCapture: NSObject, AVCapturePhotoCaptureDelegate, @unchecked Sendable {
  private var done: ((Result<Data, Error>) -> Void)?

  init(_ done: @escaping (Result<Data, Error>) -> Void) { self.done = done }

  func photoOutput(
    _ output: AVCapturePhotoOutput, didFinishProcessingPhoto photo: AVCapturePhoto, error: Error?
  ) {
    if let error {
      finish(.failure(error))
    } else if let data = photo.fileDataRepresentation() {
      finish(.success(data))
    } else {
      finish(.failure(ScanCameraException("photo")))
    }
  }

  private func finish(_ result: Result<Data, Error>) {
    done?(result)
    done = nil
  }
}
