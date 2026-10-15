import ExpoModulesCore

/// Lets a model download finish while the app is closed: iOS wakes the app to hand over the file,
/// and the download sessions are reattached at launch so nothing is lost in between.
public class LocalModelAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    ModelDownloads.shared.reconnect()
    return true
  }

  public func application(
    _ application: UIApplication, handleEventsForBackgroundURLSession identifier: String,
    completionHandler: @escaping () -> Void
  ) {
    guard ModelDownloads.shared.owns(identifier) else { return completionHandler() }
    ModelDownloads.shared.backgroundCompletions[identifier] = completionHandler
    ModelDownloads.shared.reconnect()
  }
}
