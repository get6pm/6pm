import Foundation

/// The card as the domain returned it (`ShareCard`). Swift only shows it.
struct ShareCardData: Decodable {
  struct Foreign: Decodable {
    let currency: String
    let amount: String
    let rate: String?
  }

  struct Currency: Decodable, Identifiable {
    let code: String
    let label: String
    var id: String { code }
  }

  /// An amount in pieces: the home currency's symbol on its own side, trimmed.
  struct Parts: Decodable {
    let prefix: String
    let number: String
    let suffix: String
  }

  let amount: Int?
  /// The home currency the card was read for.
  let home: String
  let payee: String
  let payeeSure: Bool
  let code: String?
  let bank: String?
  let categoryId: String?
  let categoryName: String?
  let amountText: String
  let amountParts: Parts
  let whenText: String
  let currency: String?
  /// The receipt printed no currency: the card offers this one as a chip to check.
  let currencyGuessed: Bool
  let printed: String?
  let foreign: Foreign?
  let inHomeText: String?
  let editText: String
  let decimalEntry: Bool
  let currencies: [Currency]
  let needsCheck: Bool

  static func decode(_ json: String) -> ShareCardData? {
    try? JSONDecoder().decode(ShareCardData.self, from: Data(json.utf8))
  }
}

extension Dictionary where Key == String, Value == String {
  /// The edits as the JSON the domain bundle reads, `{}` for none.
  var json: String {
    (try? JSONSerialization.data(withJSONObject: self)).flatMap {
      String(data: $0, encoding: .utf8)
    } ?? "{}"
  }
}

/// What the card shows with the edits applied (`shareShown`).
struct ShareShown: Decodable {
  let amountText: String
  let amountParts: ShareCardData.Parts
  let inHomeText: String?
  let decimalEntry: Bool
  let canConfirm: Bool
}

/// What the extension reads of the app's context file: its language, the user's categories, and
/// the host its API is on.
struct ShareContext: Decodable {
  struct Category: Decodable, Identifiable {
    let id: String
    let name: String
  }

  struct Trip: Decodable {
    let currency: String
  }

  let language: String
  let host: String
  let categories: [Category]
  let travel: Trip?
  /// The home currency; absent when it is đồng.
  let currency: String?

  var home: String { currency ?? "VND" }
}

extension ShareContext {
  /// Serious mode has no companion; the app says so in the widgets' snapshot.
  static func serious() -> Bool {
    guard
      let data = GroupFiles.readSurface("snapshot"),
      let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return false }
    return object["serious"] as? Bool ?? false
  }
}
