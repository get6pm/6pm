import Foundation
import Security

/// The server's closer look at a receipt photo the phone could not settle (`POST /v1/receipts/
/// read`), asked as this device, exactly as the app's own device routes are. Any failure, a
/// slow answer or no credential leaves the phone's reading as it was. In on-device mode the photo
/// never leaves the phone.
enum ReceiptLook {
  /// How long the card waits before keeping what the phone read.
  static let timeout: TimeInterval = 20
  /// Photos looked at together at most.
  static let inFlight = 2

  private struct Request: Encodable {
    let image: String
    let language: String
    let currencyHint: String?
    /// Left out for đồng, as phones counting it always have.
    let homeCurrency: String?
  }

  /// Whether the server may be asked: not in on-device mode, which the app writes to the App
  /// Group (`surfaces/ai.json`, `{"mode":"device"}`) whenever the mode is chosen and at launch.
  static var allowed: Bool {
    guard let data = GroupFiles.readSurface("ai"),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else { return true }
    return json["mode"] as? String != "device"
  }

  /// The answer as JSON (`{receipt: …}`), or nil when there is none to use.
  static func ask(
    photo: Data, language: String, currencyHint: String?, homeCurrency: String?, host: String
  ) async -> String? {
    guard
      allowed,
      let token = DeviceCredential.token(),
      let url = URL(string: "https://\(host)/api/v1/receipts/read"),
      let body = try? JSONEncoder().encode(
        Request(
          image: photo.base64EncodedString(), language: language == "vi" ? "vi" : "en",
          currencyHint: currencyHint, homeCurrency: homeCurrency))
    else { return nil }
    var request = URLRequest(url: url, timeoutInterval: timeout)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Accept")
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    request.httpBody = body
    guard
      let (data, response) = try? await URLSession.shared.data(for: request),
      (response as? HTTPURLResponse)?.statusCode == 200
    else { return nil }
    return String(data: data, encoding: .utf8)
  }
}

/// The anonymous token the app registered this device with, where the app keeps it (the
/// keychain item `expo-secure-store` writes into the App Group's keychain group, which the
/// extension shares). Before the app has opened once there is none, and no photo leaves the phone.
enum DeviceCredential {
  private static let key = Data("sixpm.device-token".utf8)

  static func token() -> String? {
    let query: [String: Any] = [
      kSecClass as String: kSecClassGenericPassword,
      kSecAttrService as String: "app:no-auth",
      kSecAttrGeneric as String: key,
      kSecAttrAccount as String: key,
      kSecMatchLimit as String: kSecMatchLimitOne,
      kSecReturnData as String: true,
    ]
    var found: CFTypeRef?
    guard SecItemCopyMatching(query as CFDictionary, &found) == errSecSuccess,
      let data = found as? Data, let token = String(data: data, encoding: .utf8),
      !token.isEmpty
    else { return nil }
    return token
  }
}
