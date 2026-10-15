import Foundation
import UIKit

/// The share sheet's state: the receipts shared (one card each, in turn), the current card's
/// edits, and Confirm or Skip.
@MainActor
final class ShareModel: ObservableObject {
  enum Phase {
    case reading
    case ready
  }

  /// What Confirm or Skip leaves: another card, or the end of the share.
  enum Step {
    case next
    case done
    case failed
  }

  /// One shared receipt, once read.
  struct Receipt {
    let linesJson: String
    /// Where the photo was taken (`{latitude, longitude}`), or "null".
    let placeJson: String
    var cardJson: String
    var card: ShareCardData?
    let photo: Data?
    var looking = false
  }

  @Published private(set) var phase: Phase = .reading
  @Published private(set) var receipts: [Receipt?] = [nil]
  @Published private(set) var index = 0
  @Published var editing = false {
    didSet {
      // The field opens on the amount as read, so it is changed rather than typed again.
      if editing, typedAmount.isEmpty, let read = card?.editText, !read.isEmpty {
        readAmountShown = read
        typedAmount = read
      }
    }
  }
  private var readAmountShown = ""
  /// Set on the last Confirm or a dismiss: the sheet slides away before the share sheet closes.
  @Published var leaving = false
  /// What was typed in the amount field ("" while unread).
  @Published var typedAmount = "" {
    didSet { refreshShown() }
  }
  /// The currency picked in Edit, when it is not the one read.
  @Published var currency: String? {
    didSet { refreshShown() }
  }
  @Published private(set) var shown: ShareShown?
  @Published var typedName: String?
  @Published var categoryId: String?

  let text: ShareText
  let categories: [ShareContext.Category]
  let showsCompanion: Bool
  private let context: ShareContext?
  private let contextJson: String
  private var bridge: DomainBridge?
  private var looks = 0
  private var waiting: [Int] = []

  init() {
    let contextData = GroupFiles.readSurface("context")
    context = contextData.flatMap { try? JSONDecoder().decode(ShareContext.self, from: $0) }
    contextJson = contextData.flatMap { String(data: $0, encoding: .utf8) } ?? "null"
    categories = context?.categories ?? []
    text = ShareText(language: context?.language)
    showsCompanion = !ShareContext.serious()
  }

  var total: Int { receipts.count }
  var receipt: Receipt? { receipts[index] }
  var card: ShareCardData? { receipt?.card }
  var looking: Bool { receipt?.looking ?? false }

  // MARK: Reading

  /// Reads each shared receipt in turn, showing the first as soon as it is read.
  func read(_ items: [NSExtensionItem]) async {
    let sources = ReceiptReader.sources(from: items)
    receipts = Array(repeating: nil, count: max(1, sources.count))
    if sources.isEmpty {
      receipts[0] = await readOne(nil)
      showCurrent()
      return
    }
    for (at, source) in sources.enumerated() {
      receipts[at] = await readOne(source)
      if at == index { showCurrent() }
      look(at)
    }
  }

  private func readOne(_ source: ReceiptReader.Source?) async -> Receipt {
    let contextJson = contextJson
    let made: (DomainBridge?, String, String, String, Data?) = await Task.detached(
      priority: .userInitiated
    ) {
      var shared = SharedReceipt(lines: [], photo: nil)
      if let source { shared = await ReceiptReader.read(source) }
      let linesJson =
        (try? JSONEncoder().encode(shared.lines)).flatMap { String(data: $0, encoding: .utf8) }
        ?? "[]"
      let placeJson =
        shared.place.flatMap { try? JSONEncoder().encode($0) }
        .flatMap { String(data: $0, encoding: .utf8) } ?? "null"
      guard let bridge = try? DomainBridge() else {
        return (nil, linesJson, placeJson, "null", shared.photo)
      }
      let json =
        (try? bridge.call("shareCard", [linesJson, contextJson, ShareModel.now(), placeJson]))
        ?? "null"
      return (bridge, linesJson, placeJson, json, shared.photo)
    }.value
    if bridge == nil { bridge = made.0 }
    return Receipt(
      linesJson: made.1, placeJson: made.2, cardJson: made.3, card: ShareCardData.decode(made.3),
      photo: made.4)
  }

  nonisolated private static func now() -> String {
    ISO8601DateFormatter().string(from: Date())
  }

  /// The current card, with its edits cleared.
  private func showCurrent() {
    guard receipt != nil else {
      phase = .reading
      return
    }
    typedAmount = ""
    readAmountShown = ""
    typedName = nil
    currency = nil
    categoryId = card?.categoryId
    editing = false
    refreshShown()
    phase = .ready
    // Nothing readable: the card opens on the amount, for it to be typed.
    if card?.amount == nil && card?.foreign == nil && !looking { editing = true }
  }

  // MARK: A closer look

  /// Asks the server about a photo the phone was unsure of, two at a time.
  private func look(_ at: Int) {
    guard let receipt = receipts[at], receipt.card?.needsCheck == true, receipt.photo != nil,
      context != nil, DeviceCredential.token() != nil
    else { return }
    receipts[at]?.looking = true
    waiting.append(at)
    lookNext()
  }

  private func lookNext() {
    while looks < ReceiptLook.inFlight, !waiting.isEmpty {
      let at = waiting.removeFirst()
      guard let photo = receipts[at]?.photo, let context else { continue }
      looks += 1
      Task {
        // The phone's guess (where the photo was taken, first) is the server's tie-breaker.
        let card = receipts[at]?.card
        let hint = card?.currencyGuessed == true ? card?.currency : context.travel?.currency
        let answer = await ReceiptLook.ask(
          photo: photo, language: context.language, currencyHint: hint, host: context.host)
        looked(at, answer)
      }
    }
  }

  private func looked(_ at: Int, _ answer: String?) {
    looks -= 1
    defer { lookNext() }
    guard var receipt = receipts[at] else { return }
    receipt.looking = false
    if let answer, let bridge,
      let json = try? bridge.call(
        "shareLook", [receipt.linesJson, answer, contextJson, Self.now(), receipt.placeJson]),
      let merged = ShareCardData.decode(json)
    {
      receipt.cardJson = json
      receipt.card = merged
    }
    receipts[at] = receipt
    if at == index { showCurrent() }
  }

  // MARK: What the card shows

  var readLine: String {
    if looking { return text("looking") }
    if card?.amount == nil, card?.foreign == nil {
      return text(card?.printed != nil && card?.currency == nil ? "unknownCurrency" : "unreadable")
    }
    if let bank = card?.bank { return text("readFromBank", ["bank": bank]) }
    return text("readHere")
  }

  /// "1 of 3" when several receipts were shared.
  var stepText: String? {
    total > 1 ? text("step", ["n": String(index + 1), "total": String(total)]) : nil
  }

  var amountText: String { shown?.amountText ?? card?.amountText ?? "" }

  /// Under a foreign amount: its đồng at the app's rate, or that there is no rate yet.
  var underLine: String? {
    if let inDong = shown?.inDongText { return text("inDong", ["amount": inDong]) }
    let chosen = currency ?? card?.currency ?? "VND"
    return chosen != "VND" && !amountText.isEmpty ? text("noRate") : nil
  }

  var decimalEntry: Bool { shown?.decimalEntry ?? card?.decimalEntry ?? false }

  /// A guessed currency the user has not picked yet: shown as a chip to check.
  var currencyUnsure: Bool { currency == nil && card?.currencyGuessed == true }

  /// The Currency row's value; the row shows only when the currency could be another.
  var currencyLabel: String? {
    guard let options = card?.currencies, !options.isEmpty else { return nil }
    let chosen = currency ?? card?.currency
    return options.first(where: { $0.code == chosen })?.label ?? text("chooseCategory")
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

  var canConfirm: Bool { !looking && (shown?.canConfirm ?? false) }

  private func edits(includeName: Bool) -> [String: String] {
    var edits: [String: String] = [:]
    if !typedAmount.isEmpty, typedAmount != readAmountShown { edits["amountText"] = typedAmount }
    // A currency picked on the card, even the one read, is no longer a guess.
    if let currency { edits["currency"] = currency }
    if includeName, let typedName { edits["payee"] = typedName }
    if includeName, let categoryId, categoryId != card?.categoryId {
      edits["categoryId"] = categoryId
    }
    return edits
  }

  private func refreshShown() {
    guard let bridge, let cardJson = receipt?.cardJson,
      let answer = try? bridge.call("shareShown", [cardJson, edits(includeName: false).json])
    else {
      shown = nil
      return
    }
    shown = try? JSONDecoder().decode(ShareShown.self, from: Data(answer.utf8))
  }

  // MARK: Confirm and Skip

  /// Writes the inbox item the domain makes from the card and the edits, then moves on.
  func confirm() -> Step {
    guard
      let bridge, let cardJson = receipt?.cardJson,
      let answer = try? bridge.call("shareItem", [cardJson, edits(includeName: true).json]),
      let object = try? JSONSerialization.jsonObject(with: Data(answer.utf8)) as? [String: Any],
      let item = object["item"] as? [String: Any],
      let id = item["id"] as? String,
      let data = try? JSONSerialization.data(withJSONObject: item)
    else { return .failed }
    do {
      try GroupFiles.writeInbox(id: id, json: data)
    } catch {
      return .failed
    }
    UINotificationFeedbackGenerator().notificationOccurred(.success)
    return advance()
  }

  /// Leaves this receipt out and moves on.
  func skip() -> Step {
    UIImpactFeedbackGenerator(style: .light).impactOccurred()
    return advance()
  }

  private func advance() -> Step {
    guard index + 1 < total else { return .done }
    index += 1
    showCurrent()
    return .next
  }
}
