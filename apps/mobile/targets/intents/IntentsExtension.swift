import AppIntents

@main
struct IntentsExtension: AppIntentsExtension {}

/// Logs a spend from Siri or a Wallet tap. Reading the amount and filing it replace this body.
struct LogSpendIntent: AppIntent {
  static let title = LocalizedStringResource("logSpend.title", table: "Intents")

  @Parameter(title: LocalizedStringResource("logSpend.amount", table: "Intents"))
  var amount: String

  @Parameter(title: LocalizedStringResource("logSpend.merchant", table: "Intents"))
  var merchant: String?

  func perform() async throws -> some IntentResult {
    .result()
  }
}
