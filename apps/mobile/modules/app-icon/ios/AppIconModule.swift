import ExpoModulesCore
import UIKit

/// The Home Screen icon: whether it can change, which alternate icon is showing, and switching to
/// another (or back to the app's own with nil). iOS shows its own alert after a switch.
public class AppIconModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppIcon")

    AsyncFunction("supportsAlternateIcons") { () -> Bool in
      UIApplication.shared.supportsAlternateIcons
    }.runOnQueue(.main)

    AsyncFunction("alternateIconName") { () -> String? in
      UIApplication.shared.alternateIconName
    }.runOnQueue(.main)

    AsyncFunction("setAlternateIconName") { (name: String?, promise: Promise) in
      UIApplication.shared.setAlternateIconName(name) { error in
        if let error {
          promise.reject(error)
        } else {
          promise.resolve(nil)
        }
      }
    }.runOnQueue(.main)
  }
}
