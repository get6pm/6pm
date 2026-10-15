import CLiteRTLM
import Foundation

/// What one answer is asked with.
struct GenerateRequest {
  let system: String
  let prompt: String
  let maxTokens: Int
  /// 0 reads greedily: the same question always gets the same answer.
  let temperature: Float
  let timeout: TimeInterval
}

enum EngineFailure: Error {
  case createFailed
  case conversationFailed
  case streamFailed(String)
  case timedOut
  /// The runtime did not stop after a cancel; the engine may still be writing and is dropped.
  case stuck
}

/// One LiteRT-LM engine over a `.litertlm` file, called from one serial queue at a time.
/// Each answer is its own conversation: the system prompt and the question, nothing remembered.
final class LiteRTEngine {
  let modelId: String
  private let handle: OpaquePointer
  /// Set when a cancelled answer never finished: the engine must not be used or freed again.
  private(set) var isStuck = false

  /// Loads the model, compiling its GPU programs on the first load (cached in `cacheDirectory`).
  init(modelId: String, path: String, backend: String, contextTokens: Int, cacheDirectory: String)
    throws
  {
    litert_lm_set_min_log_level(kLiteRtLmLogSeverityError)
    guard let settings = litert_lm_engine_settings_create(path, backend, nil, nil) else {
      throw EngineFailure.createFailed
    }
    defer { litert_lm_engine_settings_delete(settings) }
    litert_lm_engine_settings_set_max_num_tokens(settings, Int32(contextTokens))
    litert_lm_engine_settings_set_cache_dir(settings, cacheDirectory)
    guard let engine = litert_lm_engine_create(settings) else { throw EngineFailure.createFailed }
    self.modelId = modelId
    self.handle = engine
  }

  deinit {
    // A stuck engine may still call back into memory it owns; leaking it is the safe choice.
    if !isStuck { litert_lm_engine_delete(handle) }
  }

  /// Blocks the calling queue until the answer is written, fails, or runs out of time.
  func generate(_ request: GenerateRequest) throws -> String {
    let conversation = try openConversation(request)
    let stream = AnswerStream()
    var message: [String: Any] = ["role": "user"]
    message["content"] = [["type": "text", "text": request.prompt]]
    let messageJson = try json(message)

    guard let args = litert_lm_conversation_optional_args_create() else {
      litert_lm_conversation_delete(conversation)
      throw EngineFailure.conversationFailed
    }
    defer { litert_lm_conversation_optional_args_delete(args) }
    litert_lm_conversation_optional_args_set_max_output_tokens(args, Int32(request.maxTokens))

    let box = Unmanaged.passRetained(stream).toOpaque()
    let status = litert_lm_conversation_send_message_stream(
      conversation, messageJson, nil, args, onChunk, box)
    guard status == 0 else {
      Unmanaged<AnswerStream>.fromOpaque(box).release()
      litert_lm_conversation_delete(conversation)
      throw EngineFailure.streamFailed("could not start (\(status))")
    }

    if stream.done.wait(timeout: .now() + request.timeout) == .timedOut {
      litert_lm_conversation_cancel_process(conversation)
      // The runtime ends a cancelled stream with a last chunk; give it a moment to arrive.
      if stream.done.wait(timeout: .now() + 5) == .timedOut {
        isStuck = true
        throw EngineFailure.stuck
      }
      litert_lm_conversation_delete(conversation)
      throw EngineFailure.timedOut
    }
    litert_lm_conversation_delete(conversation)
    if let error = stream.error { throw EngineFailure.streamFailed(error) }
    return stream.text
  }

  private func openConversation(_ request: GenerateRequest) throws -> OpaquePointer {
    // Greedy is top-k of one: the runtime's own greedy sampler is not built for every backend.
    let greedy = request.temperature <= 0
    guard let sampler = litert_lm_sampler_params_create(kLiteRtLmSamplerTypeTopP) else {
      throw EngineFailure.conversationFailed
    }
    defer { litert_lm_sampler_params_delete(sampler) }
    litert_lm_sampler_params_set_top_k(sampler, greedy ? 1 : 40)
    litert_lm_sampler_params_set_top_p(sampler, greedy ? 1 : 0.95)
    litert_lm_sampler_params_set_temperature(sampler, greedy ? 1 : request.temperature)
    litert_lm_sampler_params_set_seed(sampler, 0)

    guard let session = litert_lm_session_config_create() else {
      throw EngineFailure.conversationFailed
    }
    defer { litert_lm_session_config_delete(session) }
    litert_lm_session_config_set_sampler_params(session, sampler)
    litert_lm_session_config_set_max_output_tokens(session, Int32(request.maxTokens))

    guard let thinking = litert_lm_thinking_config_create(),
      let config = litert_lm_conversation_config_create()
    else { throw EngineFailure.conversationFailed }
    defer {
      litert_lm_thinking_config_delete(thinking)
      litert_lm_conversation_config_delete(config)
    }
    // Short answers in a fixed shape: the models' reasoning mode would only spend the time limit.
    litert_lm_thinking_config_set_enable_thinking(thinking, false)
    litert_lm_conversation_config_set_thinking_config(config, thinking)
    litert_lm_conversation_config_set_session_config(config, session)
    if !request.system.isEmpty {
      litert_lm_conversation_config_set_system_message(
        config, try json([["type": "text", "text": request.system]]))
    }
    guard let conversation = litert_lm_conversation_create(handle, config) else {
      throw EngineFailure.conversationFailed
    }
    return conversation
  }

  private func json(_ value: Any) throws -> String {
    let data = try JSONSerialization.data(withJSONObject: value)
    return String(decoding: data, as: UTF8.self)
  }
}

/// The answer as the runtime streams it, gathered for one blocking call.
private final class AnswerStream {
  let done = DispatchSemaphore(value: 0)
  var text = ""
  var error: String?
}

/// Called by the runtime on its own thread for each piece of the answer, then once more at the end.
private let onChunk: LiteRtLmStreamCallback = { data, chunk in
  guard let data else { return }
  let stream = Unmanaged<AnswerStream>.fromOpaque(data).takeUnretainedValue()
  if let error = litert_lm_stream_chunk_get_error(chunk) {
    stream.error = String(cString: error)
  } else if let raw = litert_lm_stream_chunk_get_text(chunk) {
    stream.text += textOf(String(cString: raw))
  }
  if stream.error != nil || litert_lm_stream_chunk_is_final(chunk) {
    stream.done.signal()
    Unmanaged<AnswerStream>.fromOpaque(data).release()
  }
}

/// The text parts of one streamed assistant message (`{"content":[{"type":"text","text":…}]}`).
private func textOf(_ message: String) -> String {
  guard let object = try? JSONSerialization.jsonObject(with: Data(message.utf8)) as? [String: Any]
  else { return "" }
  if let text = object["content"] as? String { return text }
  let parts = object["content"] as? [[String: Any]] ?? []
  return parts.compactMap { $0["type"] as? String == "text" ? $0["text"] as? String : nil }
    .joined()
}
