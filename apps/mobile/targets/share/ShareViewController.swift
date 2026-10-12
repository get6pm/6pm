import UIKit

/// The share sheet's entry. Reading the receipt and showing its card replace this.
final class ShareViewController: UIViewController {
  override func viewDidAppear(_ animated: Bool) {
    super.viewDidAppear(animated)
    extensionContext?.completeRequest(returningItems: nil)
  }
}
