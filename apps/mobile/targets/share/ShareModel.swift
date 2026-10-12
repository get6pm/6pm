import Foundation
import UIKit

/// The card as the domain returned it (`ShareCard`). Swift only shows it.
struct ShareCardData: Decodable {
  let amount: Int?
  let payee: String
  let payeeSure: Bool
  let code: String?
  let bank: String?
  let categoryId: String?
  let categoryName: String?
  let amountText: String
  let whenText: String
}

/// What the extension reads of the app's context file: its language and the user's categories.
struct ShareContext: Decodable {
  struct Category: Decodable, Identifiable {
    let id: String
    let name: String
  }

  let language: String
  let categories: [Category]
}

/// The share card's state: reading, then the card, its edits, and Confirm.
@MainActor
final class ShareModel: ObservableObject {
  enum Phase {
    case reading
    case ready
  }

  @Published private(set) var phase: Phase = .reading
  @Published private(set) var card: ShareCardData?
  @Published var editing = false {
    didSet {
      // The field opens on the amount as read, so it is changed rather than typed again.
      if editing, typedAmount.isEmpty, let read = card?.amountText, !read.isEmpty {
        readAmountShown = read.hasSuffix("₫") ? String(read.dropLast()) : read
        typedAmount = readAmountShown
      }
    }
  }
  private var readAmountShown = ""
  /// Set on Confirm or dismiss: the sheet slides away before the share sheet closes.
  @Published var leaving = false
  /// What was typed in the amount field, and how the domain reads it ("" while unread).
  @Published var typedAmount = "" {
    didSet { typedAmountText = readAmount(typedAmount) }
  }
  @Published private(set) var typedAmountText = ""
  @Published var typedName: String?
  @Published var categoryId: String?

  let text: ShareText
  let categories: [ShareContext.Category]
  let showsCompanion: Bool
  private let contextJson: String
  private var cardJson = "null"
  private var bridge: DomainBridge?

  init() {
    let contextData = GroupFiles.readSurface("context")
    let context = contextData.flatMap { try? JSONDecoder().decode(ShareContext.self, from: $0) }
    contextJson = contextData.flatMap { String(data: $0, encoding: .utf8) } ?? "null"
    categories = context?.categories ?? []
    text = ShareText(language: context?.language)
    showsCompanion = !ShareModel.serious()
  }

  /// Serious mode has no companion; the app says so in the widgets' snapshot.
  private static func serious() -> Bool {
    guard
      let data = GroupFiles.readSurface("snapshot"),
      let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return false }
    return object["serious"] as? Bool ?? false
  }

  /// Reads what was shared and asks the domain for its card.
  func read(_ items: [NSExtensionItem]) async {
    let contextJson = contextJson
    let result: (DomainBridge?, String) = await Task.detached(priority: .userInitiated) {
      let lines = await ReceiptReader.lines(from: items)
      let linesJson =
        (try? JSONEncoder().encode(lines)).flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
      guard let bridge = try? DomainBridge() else { return (nil, "null") }
      let now = ISO8601DateFormatter().string(from: Date())
      let json = (try? bridge.call("shareCard", [linesJson, contextJson, now])) ?? "null"
      return (bridge, json)
    }.value
    bridge = result.0
    cardJson = result.1
    card = try? JSONDecoder().decode(ShareCardData.self, from: Data(cardJson.utf8))
    categoryId = card?.categoryId
    phase = .ready
    // Nothing readable: the card opens on the amount, for it to be typed.
    if card?.amount == nil { editing = true }
  }

  // MARK: What the card shows

  var readLine: String {
    guard card?.amount != nil else { return text("unreadable") }
    if let bank = card?.bank { return text("readFromBank", ["bank": bank]) }
    return text("readHere")
  }

  /// The amount as the domain wrote it, edited or read.
  var amountText: String {
    typedAmount.isEmpty ? card?.amountText ?? "" : typedAmountText
  }

  var payee: String { typedName ?? card?.payee ?? "" }

  /// The help chip shows until the user has looked at the name.
  var payeeUnsure: Bool { typedName == nil && card?.payeeSure == false && !payee.isEmpty }

  var categoryName: String? {
    if let categoryId, let picked = categories.first(where: { $0.id == categoryId }) {
      return picked.name
    }
    return card?.categoryName
  }

  var canConfirm: Bool { !amountText.isEmpty }

  private func readAmount(_ typed: String) -> String {
    guard
      let bridge, !typed.isEmpty,
      let json = try? bridge.call("readAmount", [typed]),
      let object = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any]
    else { return "" }
    return object["amountText"] as? String ?? ""
  }

  // MARK: Confirm

  /// Writes the inbox item the domain makes from the card and the edits. False when there is
  /// nothing to write yet (no amount) or the group cannot be reached.
  func confirm() -> Bool {
    guard let bridge else { return false }
    var edits: [String: String] = [:]
    if !typedAmount.isEmpty, typedAmount != readAmountShown { edits["amountText"] = typedAmount }
    if let typedName { edits["payee"] = typedName }
    if let categoryId, categoryId != card?.categoryId { edits["categoryId"] = categoryId }
    guard
      let editsData = try? JSONSerialization.data(withJSONObject: edits),
      let editsJson = String(data: editsData, encoding: .utf8),
      let json = try? bridge.call("shareItem", [cardJson, editsJson]),
      let object = try? JSONSerialization.jsonObject(with: Data(json.utf8)) as? [String: Any],
      let item = object["item"] as? [String: Any],
      let id = item["id"] as? String,
      let data = try? JSONSerialization.data(withJSONObject: item)
    else { return false }
    do {
      try GroupFiles.writeInbox(id: id, json: data)
    } catch {
      return false
    }
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    return true
  }
}
