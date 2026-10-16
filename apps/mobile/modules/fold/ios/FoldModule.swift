import ExpoModulesCore
import UIKit

/// What the iPhone Duo's hinge and screen are doing, for JS: the hinge's status and angle, the
/// fold running across the window (a division) and what covers it (the island, an occlusion), in
/// window points. On any other iPhone, or a build from an SDK before iOS 27.1, the hinge is
/// unknown and there are no regions.
public class FoldModule: Module {
  private var tracker: FoldTracker?

  public func definition() -> ModuleDefinition {
    Name("Fold")

    Events("onFold")

    // Read on the JS thread: the last snapshot the main thread took, never UIKit itself.
    Function("current") { () -> [String: Any] in
      FoldTracker.latest
    }

    OnStartObserving {
      DispatchQueue.main.async {
        let tracker = FoldTracker { [weak self] snapshot in
          self?.sendEvent("onFold", snapshot)
        }
        self.tracker = tracker
        tracker.attach()
      }
    }

    OnStopObserving {
      DispatchQueue.main.async {
        self.tracker?.detach()
        self.tracker = nil
      }
    }
  }
}

/// Watches the key window: a hinge interaction for the hinge, and an invisible view that fills
/// the window and reads the reserved regions each time the window lays out (folding, unfolding,
/// turning and Split View all resize it).
final class FoldTracker {
  static let empty: [String: Any] = [
    "hinge": "unknown", "angle": NSNull(), "divisions": [], "occlusions": [],
  ]

  private static let lock = NSLock()
  private static var stored: [String: Any] = empty

  /// The last snapshot reported, safe to read from any thread.
  static var latest: [String: Any] {
    lock.lock()
    defer { lock.unlock() }
    return stored
  }

  private let onChange: ([String: Any]) -> Void
  private var probe: FoldProbeView?
  private var hingeInteraction: AnyObject?
  private var hinge = "unknown"
  private var angle: Double?
  private var last: NSDictionary?
  private var sceneObserver: NSObjectProtocol?

  init(onChange: @escaping ([String: Any]) -> Void) {
    self.onChange = onChange
  }

  func attach() {
    install()
    // Folding can hand the scene a new key window; follow it.
    sceneObserver = NotificationCenter.default.addObserver(
      forName: UIWindow.didBecomeKeyNotification, object: nil, queue: .main
    ) { [weak self] _ in self?.install() }
  }

  func detach() {
    if let observer = sceneObserver { NotificationCenter.default.removeObserver(observer) }
    sceneObserver = nil
    probe?.removeFromSuperview()
    probe = nil
    removeHinge()
  }

  private func keyWindow() -> UIWindow? {
    UIApplication.shared.connectedScenes
      .compactMap { $0 as? UIWindowScene }
      .flatMap(\.windows)
      .first(where: \.isKeyWindow)
  }

  private func install() {
    guard let window = keyWindow(), probe?.window !== window else { return }
    probe?.removeFromSuperview()
    removeHinge()
    let view = FoldProbeView(frame: window.bounds)
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.isUserInteractionEnabled = false
    view.alpha = 0
    view.onLayout = { [weak self] in self?.report() }
    window.addSubview(view)
    probe = view
    addHinge(to: window)
    report()
  }

  private func addHinge(to window: UIWindow) {
    #if compiler(>=6.4)
      if #available(iOS 27.1, *) {
        let interaction = UIHingeInteraction { [weak self] _, update in
          guard let self else { return }
          if let hinge = update.hinge {
            self.hinge = Self.name(hinge.status)
            self.angle = Double(hinge.angle)
          } else {
            self.hinge = "unknown"
            self.angle = nil
          }
          self.report()
        }
        window.addInteraction(interaction)
        hingeInteraction = interaction
      }
    #endif
  }

  private func removeHinge() {
    #if compiler(>=6.4)
      if #available(iOS 27.1, *), let interaction = hingeInteraction as? UIHingeInteraction {
        interaction.view?.removeInteraction(interaction)
      }
    #endif
    hingeInteraction = nil
  }

  #if compiler(>=6.4)
    @available(iOS 27.1, *)
    private static func name(_ status: UIHinge.Status) -> String {
      switch status {
      case .closed: return "closed"
      case .partiallyOpen: return "partial"
      case .fullyOpen: return "open"
      default: return "unknown"
      }
    }
  #endif

  func snapshot() -> [String: Any] {
    var divisions: [[String: Double]] = []
    var occlusions: [[String: Double]] = []
    #if compiler(>=6.4)
      if #available(iOS 27.1, *), let view = probe {
        divisions = view.reservedRegions(kind: .division).filter(\.isActive).map { Self.rect($0.frame) }
        occlusions = view.reservedRegions(kind: .occlusion).filter(\.isActive).map { Self.rect($0.frame) }
      }
    #endif
    return [
      "hinge": hinge,
      "angle": angle.map { $0 as Any } ?? NSNull(),
      "divisions": divisions,
      "occlusions": occlusions,
    ]
  }

  private static func rect(_ r: CGRect) -> [String: Double] {
    ["x": Double(r.minX), "y": Double(r.minY), "width": Double(r.width), "height": Double(r.height)]
  }

  /// Sends only what changed, so a scroll that relays the window out sends nothing.
  private func report() {
    let next = snapshot()
    let dictionary = next as NSDictionary
    if let last, last.isEqual(dictionary) { return }
    last = dictionary
    Self.lock.lock()
    Self.stored = next
    Self.lock.unlock()
    onChange(next)
  }
}

final class FoldProbeView: UIView {
  var onLayout: (() -> Void)?

  override func layoutSubviews() {
    super.layoutSubviews()
    onLayout?()
  }

  override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
    super.traitCollectionDidChange(previousTraitCollection)
    onLayout?()
  }
}
