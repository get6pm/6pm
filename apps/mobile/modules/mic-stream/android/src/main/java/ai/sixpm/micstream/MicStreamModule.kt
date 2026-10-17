package ai.sixpm.micstream

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioRecordingConfiguration
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Base64
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.ByteArrayOutputStream

/**
 * The microphone for JS as 16 kHz mono 16-bit PCM, base64 in chunks of about 100 ms, for a
 * realtime transcriber. Nothing is written to disk. `onStop` says when Android took the microphone
 * away (a call, another app's audio or recording) so the session can end with what it heard.
 */
class MicStreamModule : Module() {
  private val lock = Any()
  private val main = Handler(Looper.getMainLooper())
  private val pending = ByteArrayOutputStream()
  private var record: AudioRecord? = null
  private var reader: Thread? = null
  private var focus: AudioFocusRequest? = null
  private var silencedWatch: AudioManager.AudioRecordingCallback? = null
  @Volatile private var running = false

  private val context: Context
    get() = appContext.reactContext ?: throw MicUnavailable()

  private val audioManager: AudioManager
    get() = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

  override fun definition() = ModuleDefinition {
    Name("MicStream")

    Events("onAudio", "onStop")

    AsyncFunction("start") { begin() }

    AsyncFunction("stop") { end(null) }

    OnDestroy { end(null) }
  }

  @SuppressLint("MissingPermission")
  private fun begin() {
    synchronized(lock) {
      if (running) return
      if (context.checkSelfPermission(Manifest.permission.RECORD_AUDIO) !=
        PackageManager.PERMISSION_GRANTED
      ) {
        throw MicUnavailable()
      }
      val minimum = AudioRecord.getMinBufferSize(SAMPLE_RATE, CHANNEL, ENCODING)
      if (minimum <= 0) throw MicUnavailable()

      val request = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
        .setAudioAttributes(
          AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_ASSISTANT)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build(),
        )
        .setOnAudioFocusChangeListener({ change -> focusChanged(change) }, main)
        .build()
      if (audioManager.requestAudioFocus(request) != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) {
        throw MicUnavailable()
      }

      val mic = try {
        AudioRecord(
          MediaRecorder.AudioSource.VOICE_RECOGNITION,
          SAMPLE_RATE,
          CHANNEL,
          ENCODING,
          maxOf(minimum * 2, CHUNK_BYTES * 4),
        )
      } catch (error: Exception) {
        audioManager.abandonAudioFocusRequest(request)
        throw MicUnavailable()
      }
      if (mic.state != AudioRecord.STATE_INITIALIZED) {
        mic.release()
        audioManager.abandonAudioFocusRequest(request)
        throw MicUnavailable()
      }
      try {
        mic.startRecording()
      } catch (error: Exception) {
        mic.release()
        audioManager.abandonAudioFocusRequest(request)
        throw MicUnavailable()
      }
      if (mic.recordingState != AudioRecord.RECORDSTATE_RECORDING) {
        mic.release()
        audioManager.abandonAudioFocusRequest(request)
        throw MicUnavailable()
      }

      pending.reset()
      record = mic
      focus = request
      running = true
      watchSilencing(mic)
      reader = Thread({ read(mic) }, "MicStream").also { it.start() }
    }
  }

  /** Reads the microphone until it stops, sending whole chunks on. */
  private fun read(mic: AudioRecord) {
    val buffer = ByteArray(CHUNK_BYTES)
    while (running) {
      val count = mic.read(buffer, 0, buffer.size)
      if (count < 0) {
        // The audio server went away or the recorder broke: end with what was heard.
        if (running) main.post { end("interrupted") }
        return
      }
      if (count > 0) take(buffer, count)
    }
  }

  private fun take(bytes: ByteArray, count: Int) {
    val chunks = mutableListOf<ByteArray>()
    synchronized(pending) {
      pending.write(bytes, 0, count)
      if (pending.size() >= CHUNK_BYTES) {
        val all = pending.toByteArray()
        var at = 0
        while (all.size - at >= CHUNK_BYTES) {
          chunks.add(all.copyOfRange(at, at + CHUNK_BYTES))
          at += CHUNK_BYTES
        }
        pending.reset()
        pending.write(all, at, all.size - at)
      }
    }
    for (chunk in chunks) send(chunk)
  }

  private fun send(chunk: ByteArray) {
    sendEvent("onAudio", mapOf("chunk" to Base64.encodeToString(chunk, Base64.NO_WRAP)))
  }

  /** Stops the microphone, sends what is left, and hands audio focus back to other apps. */
  private fun end(reason: String?) {
    val mic: AudioRecord
    val thread: Thread?
    val request: AudioFocusRequest?
    val watch: AudioManager.AudioRecordingCallback?
    synchronized(lock) {
      if (!running) return
      running = false
      mic = record ?: return
      thread = reader
      request = focus
      watch = silencedWatch
      record = null
      reader = null
      focus = null
      silencedWatch = null
    }
    if (watch != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      mic.unregisterAudioRecordingCallback(watch)
    }
    try {
      mic.stop()
    } catch (error: IllegalStateException) {
      // Already stopped by the system.
    }
    // The last read returns once the recorder stops; its audio joins what is left.
    if (thread != null && thread !== Thread.currentThread()) thread.join(JOIN_TIMEOUT_MS)
    mic.release()
    val rest = synchronized(pending) {
      val rest = pending.toByteArray()
      pending.reset()
      rest
    }
    if (rest.isNotEmpty()) send(rest)
    if (request != null) {
      try {
        audioManager.abandonAudioFocusRequest(request)
      } catch (error: Exception) {
        // The app is going away: focus goes with it.
      }
    }
    if (reason != null) sendEvent("onStop", mapOf("reason" to reason))
  }

  /** A call or another app's audio took focus: a short duck for a notification sound does not. */
  private fun focusChanged(change: Int) {
    if (change == AudioManager.AUDIOFOCUS_LOSS || change == AudioManager.AUDIOFOCUS_LOSS_TRANSIENT) {
      end("interrupted")
    }
  }

  /** Another app began recording and Android silenced this one: the microphone is gone. */
  private fun watchSilencing(mic: AudioRecord) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return
    val session = mic.audioSessionId
    val watch = object : AudioManager.AudioRecordingCallback() {
      override fun onRecordingConfigChanged(configs: MutableList<AudioRecordingConfiguration>) {
        val mine = configs.firstOrNull { it.clientAudioSessionId == session } ?: return
        if (mine.isClientSilenced) end("interrupted")
      }
    }
    mic.registerAudioRecordingCallback({ main.post(it) }, watch)
    silencedWatch = watch
  }

  private companion object {
    /** 16 kHz, mono, 16-bit: what both transcribers take. */
    const val SAMPLE_RATE = 16_000
    const val CHANNEL = AudioFormat.CHANNEL_IN_MONO
    const val ENCODING = AudioFormat.ENCODING_PCM_16BIT

    /** 100 ms of audio at 2 bytes a sample. */
    const val CHUNK_BYTES = 3_200

    /** A read blocks for at most one chunk once the recorder stops. */
    const val JOIN_TIMEOUT_MS = 500L
  }
}

/** The microphone has no usable input, its permission is off, or a call holds it. */
class MicUnavailable : CodedException("The microphone is not available")
