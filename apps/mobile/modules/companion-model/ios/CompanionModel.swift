import Foundation
#if canImport(FoundationModels)
import FoundationModels
#endif

/// Why the on-device model cannot answer, as the JS side names it.
enum CompanionModelUnavailable: String {
  case unsupportedOS
  case deviceNotEligible
  case appleIntelligenceNotEnabled
  case modelNotReady
  case unsupportedLanguage
}

enum CompanionModelError: Error {
  case unavailable(CompanionModelUnavailable)
}

#if canImport(FoundationModels)
/// A line in the companion's voice, with `{name}` placeholders for the values the phone fills.
@available(iOS 26.0, *)
@Generable
struct WordLine: Encodable {
  @Guide(description: "The line, writing every value only as its {name} placeholder.")
  var text: String
  @Guide(
    description: "How the companion looks while the line shows.",
    .anyOf(["calm", "happy", "wave", "nod", "think", "sleepy", "plain"]))
  var mood: String
}

/// A question read into a query, flat: the JS side turns it into the query it checks.
@available(iOS 26.0, *)
@Generable
struct ReadQuery: Encodable {
  @Guide(
    description: "What the question asks.",
    .anyOf([
      "afford", "weekend", "saveMore", "potFull", "today", "spend", "breakdown", "compare", "list",
      "bills", "howAmIDoing", "chat", "unknown",
    ]))
  var kind: String
  @Guide(
    description: "The span asked about, if any.",
    .anyOf([
      "today", "yesterday", "thisWeek", "lastWeek", "thisCycle", "lastCycle", "thisMonth",
      "lastMonth", "last7Days", "last30Days", "none",
    ]))
  var range: String
  @Guide(
    description: "For compare: the span to compare against, if named.",
    .anyOf([
      "today", "yesterday", "thisWeek", "lastWeek", "thisCycle", "lastCycle", "thisMonth",
      "lastMonth", "last7Days", "last30Days", "none",
    ]))
  var against: String
  @Guide(description: "One of their category names exactly as listed, or empty.")
  var category: String
  @Guide(description: "The place as they wrote it, or empty.")
  var merchant: String
  @Guide(description: "The pot's name from their pots, or empty.")
  var pot: String
  @Guide(description: "An amount in whole đồng, or 0.")
  var amount: Int
}
#endif

/// The on-device model (Apple Foundation Models). Every call is short and structured: the phone
/// computes every number, and this only reads a question or words a line.
enum CompanionModel {
  /// "available", or why not, for `language` ("en" or "vi").
  static func availability(language: String) -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      let model = SystemLanguageModel.default
      switch model.availability {
      case .available:
        let locale = Locale(identifier: language)
        return model.supportsLocale(locale)
          ? "available" : CompanionModelUnavailable.unsupportedLanguage.rawValue
      case .unavailable(.deviceNotEligible):
        return CompanionModelUnavailable.deviceNotEligible.rawValue
      case .unavailable(.appleIntelligenceNotEnabled):
        return CompanionModelUnavailable.appleIntelligenceNotEnabled.rawValue
      case .unavailable(.modelNotReady):
        return CompanionModelUnavailable.modelNotReady.rawValue
      case .unavailable:
        return CompanionModelUnavailable.modelNotReady.rawValue
      }
    }
    #endif
    return CompanionModelUnavailable.unsupportedOS.rawValue
  }

  /// Loads the model ahead of a call the app expects soon.
  static func prewarm() {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *), SystemLanguageModel.default.isAvailable {
      LanguageModelSession(instructions: "").prewarm()
    }
    #endif
  }

  /// Words a line; answers its JSON (`{"text","mood"}`).
  static func word(instructions: String, prompt: String) async throws -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      let session = LanguageModelSession(instructions: instructions)
      let response = try await session.respond(to: prompt, generating: WordLine.self)
      return try json(response.content)
    }
    #endif
    throw CompanionModelError.unavailable(.unsupportedOS)
  }

  /// Reads a question; answers the flat query's JSON.
  static func readQuestion(instructions: String, prompt: String) async throws -> String {
    #if canImport(FoundationModels)
    if #available(iOS 26.0, *) {
      let session = LanguageModelSession(instructions: instructions)
      let response = try await session.respond(to: prompt, generating: ReadQuery.self)
      return try json(response.content)
    }
    #endif
    throw CompanionModelError.unavailable(.unsupportedOS)
  }

  private static func json<T: Encodable>(_ value: T) throws -> String {
    String(decoding: try JSONEncoder().encode(value), as: UTF8.self)
  }
}
