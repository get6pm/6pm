import ExpoModulesCore
import UIKit

/// A view text can be dropped on from another app, as a bank line dragged across from the bank
/// app beside 6pm in Split View: says when a drag is over it and hands over the dropped text.
public class DropTextModule: Module {
  public func definition() -> ModuleDefinition {
    Name("DropText")

    View(DropTextView.self) {
      Events("onDropText", "onDragOver")
    }
  }
}

final class DropTextView: ExpoView, UIDropInteractionDelegate {
  let onDropText = EventDispatcher()
  let onDragOver = EventDispatcher()

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    addInteraction(UIDropInteraction(delegate: self))
  }

  func dropInteraction(_ interaction: UIDropInteraction, canHandle session: UIDropSession) -> Bool {
    session.canLoadObjects(ofClass: NSString.self)
  }

  func dropInteraction(
    _ interaction: UIDropInteraction, sessionDidUpdate session: UIDropSession
  ) -> UIDropProposal {
    UIDropProposal(operation: .copy)
  }

  func dropInteraction(_ interaction: UIDropInteraction, sessionDidEnter session: UIDropSession) {
    onDragOver(["over": true])
  }

  func dropInteraction(_ interaction: UIDropInteraction, sessionDidExit session: UIDropSession) {
    onDragOver(["over": false])
  }

  func dropInteraction(_ interaction: UIDropInteraction, sessionDidEnd session: UIDropSession) {
    onDragOver(["over": false])
  }

  func dropInteraction(_ interaction: UIDropInteraction, performDrop session: UIDropSession) {
    _ = session.loadObjects(ofClass: NSString.self) { [weak self] items in
      let text = items.compactMap { $0 as? String }.joined(separator: "\n")
      guard !text.isEmpty else { return }
      DispatchQueue.main.async { self?.onDropText(["text": text]) }
    }
  }
}
