import Foundation
import JavaScriptCore

/// Runs `@6pm/domain`'s native entry (domain-native.js, generated) in JavaScriptCore. Swift hands
/// it JSON and shows what comes back: every amount, rule and word is decided by the domain.
final class DomainBridge {
  enum Failure: Error {
    case missingBundle
    case versionMismatch
    case threw(String)
    case notAFunction(String)
  }

  /// The `NATIVE_API_VERSION` this Swift was written against.
  static let apiVersion: Int32 = 3

  private let context: JSContext
  private let domain: JSValue
  private var lastError: String?

  init() throws {
    guard
      let url = Bundle.main.url(forResource: "domain-native", withExtension: "js"),
      let source = try? String(contentsOf: url, encoding: .utf8),
      let context = JSContext()
    else { throw Failure.missingBundle }
    self.context = context
    context.evaluateScript(source)
    guard let domain = context.objectForKeyedSubscript("SixpmDomain"), domain.isObject else {
      throw Failure.missingBundle
    }
    self.domain = domain
    guard domain.objectForKeyedSubscript("NATIVE_API_VERSION")?.toInt32() == Self.apiVersion else {
      throw Failure.versionMismatch
    }
    context.exceptionHandler = { [weak self] _, value in
      self?.lastError = value?.toString() ?? "unknown"
    }
  }

  /// Calls `SixpmDomain.<name>(...arguments)`, each argument and the result a JSON string.
  func call(_ name: String, _ arguments: [String]) throws -> String {
    guard let function = domain.objectForKeyedSubscript(name), !function.isUndefined else {
      throw Failure.notAFunction(name)
    }
    lastError = nil
    let result = function.call(withArguments: arguments)
    if let lastError { throw Failure.threw(lastError) }
    guard let json = result?.toString() else { throw Failure.threw("no result") }
    return json
  }
}
