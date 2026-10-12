import AppIntents
import ExtensionFoundation

@main
struct IntentsExtension: AppIntentsExtension {}

/// What Siri, Spotlight and the Action button offer without setting anything up. Siri has no
/// Vietnamese, so the spoken phrases are English; the titles follow the phone's language. Before
/// iOS 17.4 the shortcuts cannot say which iOS each needs, so there they are left to the Shortcuts
/// app, where "Log in 6pm" is still listed for the Wallet automation.
@available(iOS 17.4, *)
struct SixpmShortcuts: AppShortcutsProvider {
  static var appShortcuts: [AppShortcut] {
    AppShortcut(
      intent: LogSpendIntent(),
      phrases: [
        "Log in \(.applicationName)",
        "Log a spend in \(.applicationName)",
      ],
      shortTitle: LocalizedStringResource("logSpend.short", table: "Intents"),
      systemImageName: "plus.circle"
    )
    // Opening a screen from the extension takes `OpenURLIntent`, which iOS 17 does not have.
    if #available(iOS 18.0, *) {
      AppShortcut(
        intent: OpenScanIntent(),
        phrases: [
          "Scan QR in \(.applicationName)",
          "Scan to pay in \(.applicationName)",
        ],
        shortTitle: LocalizedStringResource("scan.title", table: "Intents"),
        systemImageName: "qrcode.viewfinder"
      )
      AppShortcut(
        intent: OpenQuickAddIntent(),
        phrases: ["Quick add in \(.applicationName)"],
        shortTitle: LocalizedStringResource("quickAdd.title", table: "Intents"),
        systemImageName: "plus"
      )
    }
  }
}
