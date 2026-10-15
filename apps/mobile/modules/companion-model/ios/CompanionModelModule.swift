import ExpoModulesCore

/// The on-device model for JS: read a question, word a line, say whether it can.
public class CompanionModelModule: Module {
  public func definition() -> ModuleDefinition {
    Name("CompanionModel")

    Function("availability") { (language: String) -> String in
      CompanionModel.availability(language: language)
    }

    Function("prewarm") {
      CompanionModel.prewarm()
    }

    AsyncFunction("word") { (instructions: String, prompt: String) async throws -> String in
      try await CompanionModel.word(instructions: instructions, prompt: prompt)
    }

    AsyncFunction("readQuestion") { (instructions: String, prompt: String) async throws -> String in
      try await CompanionModel.readQuestion(instructions: instructions, prompt: prompt)
    }
  }
}
