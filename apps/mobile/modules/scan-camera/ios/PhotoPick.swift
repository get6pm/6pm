import PhotosUI
import UIKit
import UniformTypeIdentifiers

/// The system photo picker for one picture. It runs out of process, so it needs no access to the
/// library: only the picture picked reaches 6pm.
@MainActor
final class PhotoPick: NSObject, PHPickerViewControllerDelegate {
  private static var active: PhotoPick?
  private var continuation: CheckedContinuation<Data?, Error>?

  /// The picked picture's data, or nil when the picker was closed without one.
  static func pick() async throws -> Data? {
    guard active == nil else { throw ScanCameraException("busy") }
    guard let host = topViewController() else { throw ScanCameraException("host") }
    let pick = PhotoPick()
    active = pick
    return try await withCheckedThrowingContinuation { continuation in
      pick.continuation = continuation
      var configuration = PHPickerConfiguration()
      configuration.filter = .images
      configuration.selectionLimit = 1
      let picker = PHPickerViewController(configuration: configuration)
      picker.delegate = pick
      host.present(picker, animated: true)
    }
  }

  func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
    picker.dismiss(animated: true)
    guard let provider = results.first?.itemProvider,
      provider.hasItemConformingToTypeIdentifier(UTType.image.identifier)
    else {
      finish(.success(nil))
      return
    }
    provider.loadDataRepresentation(forTypeIdentifier: UTType.image.identifier) { data, error in
      Task { @MainActor in
        if let data { self.finish(.success(data)) } else { self.finish(.failure(error ?? ScanCameraException("load"))) }
      }
    }
  }

  private func finish(_ result: Result<Data?, Error>) {
    continuation?.resume(with: result)
    continuation = nil
    PhotoPick.active = nil
  }

  private static func topViewController() -> UIViewController? {
    let windows = UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
    var top = (windows.first { $0.isKeyWindow } ?? windows.first)?.rootViewController
    while let next = top?.presentedViewController { top = next }
    return top
  }
}
