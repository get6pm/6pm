import SwiftUI
import UIKit

/// The share sheet's entry: reads the shared receipts on this iPhone, shows a card for each in
/// turn, and on each Confirm leaves one inbox file for the app to import the next time it opens.
final class ShareViewController: UIViewController {
  private var model: ShareModel?
  private var finishing = false

  override func viewDidLoad() {
    super.viewDidLoad()
    view.backgroundColor = .clear
    let model = ShareModel()
    self.model = model
    let sheet = ShareSheetView(
      model: model,
      onConfirm: { [weak self] in self?.confirm() },
      onSkip: { [weak self] in self?.skip() },
      onCancel: { [weak self] in self?.cancel() })
    let host = UIHostingController(rootView: sheet)
    host.view.backgroundColor = .clear
    addChild(host)
    host.view.frame = view.bounds
    host.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(host.view)
    host.didMove(toParent: self)

    let items = (extensionContext?.inputItems as? [NSExtensionItem]) ?? []
    Task { await model.read(items) }
  }

  private func confirm() {
    guard !finishing, let model else { return }
    if model.confirm() == .done { finish { $0.completeRequest(returningItems: nil) } }
  }

  /// Skipping the last receipt ends the share; any confirmed before it are kept.
  private func skip() {
    guard !finishing, let model else { return }
    if model.skip() == .done { finish { $0.completeRequest(returningItems: nil) } }
  }

  private func cancel() {
    finish { $0.cancelRequest(withError: CocoaError(.userCancelled)) }
  }

  /// Lets the sheet slide away with the house curve before the share sheet closes.
  private func finish(_ close: @escaping (NSExtensionContext) -> Void) {
    guard !finishing else { return }
    finishing = true
    model?.leaving = true
    DispatchQueue.main.asyncAfter(deadline: .now() + ShareMotion.sheetSeconds) { [weak self] in
      if let context = self?.extensionContext { close(context) }
    }
  }
}
