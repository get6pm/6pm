import AppIntents
import Foundation
import SwiftUI

/// Logs a spend from a Wallet tap (the automation passes the transaction's amount and merchant)
/// or from Siri (what was said, no merchant). It never starts the app: the domain bundle decides
/// the item, it is left in the App Group inbox, and the app files it on its next open. It returns
/// at once, because Wallet gives up on an automation that takes long.
struct LogSpendIntent: AppIntent {
  static let title = LocalizedStringResource("logSpend.title", table: "Intents")
  static let description = IntentDescription(
    LocalizedStringResource("logSpend.description", table: "Intents"))
  static let openAppWhenRun = false

  @Parameter(
    title: LocalizedStringResource("logSpend.amount", table: "Intents"),
    requestValueDialog: IntentDialog(
      LocalizedStringResource("logSpend.askAmount", table: "Intents")))
  var amount: String

  @Parameter(title: LocalizedStringResource("logSpend.merchant", table: "Intents"))
  var merchant: String?

  enum Failure: Error, CustomLocalizedStringResourceConvertible {
    case notLogged

    var localizedStringResource: LocalizedStringResource {
      LocalizedStringResource("logSpend.failed", table: "Intents")
    }
  }

  func perform() async throws -> some IntentResult & ProvidesDialog & ShowsSnippetView {
    let logged: LoggedSpend
    do {
      logged = try LoggedSpend.log(amount: amount, merchant: merchant, at: Date())
    } catch {
      throw Failure.notLogged
    }
    // Only Siri gets here: Wallet always names a merchant, and its unread amounts still log.
    if logged.needsAmount {
      throw $amount.needsValueError(
        IntentDialog(LocalizedStringResource("logSpend.askAmount", table: "Intents")))
    }
    let done = String(localized: "logSpend.logged", table: "Intents")
    return .result(
      dialog: IntentDialog(stringLiteral: "\(done) \(logged.title)"),
      view: LoggedSnippet(spend: logged))
  }
}

/// What the domain bundle answered for one spend, and the inbox file it left.
struct LoggedSpend {
  let needsAmount: Bool
  let title: String
  let amountText: String
  let safeAfterText: String?

  static func log(amount: String, merchant: String?, at now: Date) throws -> LoggedSpend {
    let context = GroupFiles.readSurface("context").flatMap { String(data: $0, encoding: .utf8) }
    let clock = ISO8601DateFormatter()
    clock.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
    let answer = try DomainBridge().call(
      "logSpend", [amount, merchant ?? "", context ?? "", clock.string(from: now)])
    guard
      let object = try JSONSerialization.jsonObject(with: Data(answer.utf8)) as? [String: Any]
    else { throw DomainBridge.Failure.threw("not an object") }

    if let item = object["item"] as? [String: Any], let id = item["id"] as? String {
      try GroupFiles.writeInbox(id: id, json: JSONSerialization.data(withJSONObject: item))
    }
    return LoggedSpend(
      needsAmount: object["needsAmount"] as? Bool ?? true,
      title: object["title"] as? String ?? "",
      amountText: object["amountText"] as? String ?? "",
      safeAfterText: object["safeAfterText"] as? String)
  }
}
