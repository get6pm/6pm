package ai.sixpm.scancamera

import android.content.Context
import android.os.SystemClock
import android.util.Size
import android.view.Surface
import androidx.camera.core.Camera
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.ImageProxy
import androidx.camera.core.Preview
import androidx.camera.core.UseCaseGroup
import androidx.camera.core.resolutionselector.AspectRatioStrategy
import androidx.camera.core.resolutionselector.ResolutionSelector
import androidx.camera.core.resolutionselector.ResolutionStrategy
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.Observer
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import java.util.concurrent.Executors
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.math.max
import kotlinx.coroutines.suspendCancellableCoroutine

/** A photo as the camera took it: its JPEG, the turn that makes it upright, and whether to mirror. */
internal class TakenPhoto(val jpeg: ByteArray, val rotation: Int, val mirrored: Boolean)

/**
 * The camera behind Scan: CameraX showing the preview, reading each frame for a QR code (ML Kit)
 * and, ten times a second, for the receipt in view (the paper finder), and taking the
 * full-resolution photo a receipt is read from. Every frame and every use case keeps the 4:3 frame,
 * so the preview, the frames read and the photo show the same scene.
 *
 * Binding happens on the main thread; frames are read on `frames`.
 */
internal class ScanCameraSession(private val context: Context, private val preview: PreviewView) {
  /** A QR code's text, on the main thread; the same code again only after a second. */
  var onCode: ((String) -> Unit)? = null
  /** Where the receipt is, on the main thread: corners normalised in the upright frame (origin top
   * left), or empty once it is gone; and the frame's width over its height. */
  var onReceipt: ((List<Double>, Double) -> Unit)? = null
  /** The camera is running and showing frames, on the main thread. */
  var onRunning: ((Boolean) -> Unit)? = null

  private val main = ContextCompat.getMainExecutor(context)
  private val frames = Executors.newSingleThreadExecutor()
  private val photos = Executors.newSingleThreadExecutor()

  private val previewCase = Preview.Builder().setResolutionSelector(frame(null)).build()
  private val analysisCase =
    ImageAnalysis.Builder()
      .setResolutionSelector(
        frame(
          ResolutionStrategy(ANALYSIS_SIZE, ResolutionStrategy.FALLBACK_RULE_CLOSEST_LOWER_THEN_HIGHER)
        )
      )
      .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
      .setOutputImageFormat(ImageAnalysis.OUTPUT_IMAGE_FORMAT_YUV_420_888)
      .build()
  private val captureCase =
    ImageCapture.Builder()
      .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
      .setResolutionSelector(frame(ResolutionStrategy.HIGHEST_AVAILABLE_STRATEGY))
      .build()

  private var provider: ProcessCameraProvider? = null
  private var providerAsked = false
  private var camera: Camera? = null
  private var boundFront: Boolean? = null
  private var owner: LifecycleOwner? = null
  private var running = false
  private var released = false

  // What the view asks for, applied once the camera provider is ready.
  private var wantRunning = false
  private var wantFront = false
  private var wantTorch = false

  // Read on `frames`, written on main.
  @Volatile private var readsReceipts = true
  @Volatile private var mirrored = false

  // Only on `frames`.
  private var lastRead = 0L
  /** Looks in a row that found no receipt; it starts as if long gone. */
  private var misses = MISSES_REPORTED + 1

  // Only on main.
  private var lastCode: String? = null
  private var lastCodeAt = 0L

  private val streamObserver = Observer<PreviewView.StreamState> { state ->
    setRunning(state == PreviewView.StreamState.STREAMING && camera != null)
  }

  init {
    previewCase.surfaceProvider = preview.surfaceProvider
    analysisCase.setAnalyzer(frames, ::analyze)
  }

  /** Starts or stops the camera facing front or back, setting it up the first time. */
  fun update(owner: LifecycleOwner, running: Boolean, front: Boolean, torch: Boolean, receipts: Boolean) {
    if (released) return
    readsReceipts = receipts
    wantRunning = running
    wantFront = front
    wantTorch = torch
    if (this.owner !== owner) {
      this.owner?.let { preview.previewStreamState.removeObserver(streamObserver) }
      this.owner = owner
      preview.previewStreamState.observe(owner, streamObserver)
    }
    val ready = provider
    if (ready != null) {
      apply(ready, owner)
    } else if (!providerAsked) {
      providerAsked = true
      val future = ProcessCameraProvider.getInstance(context)
      future.addListener(
        {
          val got = runCatching { future.get() }.getOrNull() ?: return@addListener
          provider = got
          val current = this.owner
          if (!released && current != null) apply(got, current)
        },
        main,
      )
    }
  }

  /** Stops the camera for good: the view is gone. */
  fun release() {
    if (released) return
    released = true
    unbind()
    owner?.let { preview.previewStreamState.removeObserver(streamObserver) }
    owner = null
    analysisCase.clearAnalyzer()
    frames.shutdown()
    photos.shutdown()
  }

  /** The full-resolution photo, with the turn that makes it upright. */
  suspend fun capture(): TakenPhoto {
    if (camera == null || !running) throw ScanCameraException("stopped")
    val front = mirrored
    return suspendCancellableCoroutine { continuation ->
      captureCase.takePicture(
        photos,
        object : ImageCapture.OnImageCapturedCallback() {
          override fun onCaptureSuccess(image: ImageProxy) {
            val result = runCatching {
              val buffer = image.planes[0].buffer
              val bytes = ByteArray(buffer.remaining())
              buffer.get(bytes)
              TakenPhoto(bytes, image.imageInfo.rotationDegrees, front)
            }
            image.close()
            if (continuation.isActive) {
              result.fold(continuation::resume, continuation::resumeWithException)
            }
          }

          override fun onError(exception: ImageCaptureException) {
            if (continuation.isActive) continuation.resumeWithException(exception)
          }
        },
      )
    }
  }

  // Binding

  private fun apply(provider: ProcessCameraProvider, owner: LifecycleOwner) {
    if (!wantRunning) {
      unbind()
      return
    }
    val selector = if (wantFront) CameraSelector.DEFAULT_FRONT_CAMERA else CameraSelector.DEFAULT_BACK_CAMERA
    if (boundFront != wantFront || camera == null) {
      val available = runCatching { provider.hasCamera(selector) }.getOrDefault(false)
      unbind()
      // With no such camera (an emulator without one) nothing is shown and nothing runs.
      if (!available) return
      val rotation = preview.display?.rotation ?: Surface.ROTATION_0
      analysisCase.targetRotation = rotation
      captureCase.targetRotation = rotation
      val group =
        UseCaseGroup.Builder()
          .addUseCase(previewCase)
          .addUseCase(analysisCase)
          .addUseCase(captureCase)
          .build()
      camera = runCatching { provider.bindToLifecycle(owner, selector, group) }.getOrNull()
      if (camera == null) return
      boundFront = wantFront
      mirrored = wantFront
      misses = MISSES_REPORTED + 1
    }
    val control = camera ?: return
    if (control.cameraInfo.hasFlashUnit()) control.cameraControl.enableTorch(wantTorch)
    setRunning(preview.previewStreamState.value == PreviewView.StreamState.STREAMING)
  }

  private fun unbind() {
    if (camera != null) {
      camera?.let { if (it.cameraInfo.hasFlashUnit()) it.cameraControl.enableTorch(false) }
      runCatching { provider?.unbind(previewCase, analysisCase, captureCase) }
    }
    camera = null
    boundFront = null
    setRunning(false)
  }

  private fun setRunning(next: Boolean) {
    val now = next && camera != null
    if (now == running) return
    running = now
    onRunning?.invoke(now)
  }

  // Frames

  @androidx.annotation.OptIn(androidx.camera.core.ExperimentalGetImage::class)
  private fun analyze(image: ImageProxy) {
    try {
      val media = image.image ?: return
      val rotation = image.imageInfo.rotationDegrees
      val code =
        runCatching { Tasks.await(ReceiptPhoto.codes.process(InputImage.fromMediaImage(media, rotation))) }
          .getOrNull()
          ?.firstNotNullOfOrNull { it.rawValue }
      if (code != null) main.execute { deliver(code) }
      if (!readsReceipts) return
      val now = SystemClock.uptimeMillis()
      if (now - lastRead < RECEIPT_INTERVAL_MS) return
      lastRead = now
      val corners = receipt(image, rotation)
      misses = if (corners.isEmpty()) minOf(misses, MISSES_REPORTED) + 1 else 0
      // Nothing more to say once the receipt has been gone a while.
      if (misses > MISSES_REPORTED) return
      val turned = rotation % 180 != 0
      val aspect =
        if (turned) image.height.toDouble() / image.width else image.width.toDouble() / image.height
      main.execute { onReceipt?.invoke(corners, aspect) }
    } finally {
      image.close()
    }
  }

  private fun deliver(code: String) {
    val now = SystemClock.uptimeMillis()
    if (code == lastCode && now - lastCodeAt < 1000) return
    lastCode = code
    lastCodeAt = now
    onCode?.invoke(code)
  }

  /** The receipt in a frame: its brightness brought down to a small grid and searched. */
  private fun receipt(image: ImageProxy, rotation: Int): List<Double> {
    val plane = image.planes[0]
    val buffer = plane.buffer
    val rowStride = plane.rowStride
    val pixelStride = plane.pixelStride
    val step = max(1, (max(image.width, image.height) + GRID_PIXELS - 1) / GRID_PIXELS)
    val width = image.width / step
    val height = image.height / step
    if (width < 8 || height < 8) return emptyList()
    val grey = IntArray(width * height)
    // Four samples in each cell are enough to tell paper from table.
    val half = max(1, step / 2)
    for (gy in 0 until height) {
      for (gx in 0 until width) {
        val x0 = gx * step
        val y0 = gy * step
        var sum = 0
        for (dy in intArrayOf(0, half)) {
          for (dx in intArrayOf(0, half)) {
            sum += buffer.get((y0 + dy) * rowStride + (x0 + dx) * pixelStride).toInt() and 0xFF
          }
        }
        grey[gy * width + gx] = sum / 4
      }
    }
    val found = PaperFinder.find(grey, width, height, LIVE_MINIMUM_AREA) ?: return emptyList()
    return PaperFinder.upright(found, rotation, mirrored).toList()
  }

  /** The 4:3 frame every use case keeps, at `size` when one is given. */
  private fun frame(size: ResolutionStrategy?): ResolutionSelector {
    val builder =
      ResolutionSelector.Builder()
        .setAspectRatioStrategy(AspectRatioStrategy.RATIO_4_3_FALLBACK_AUTO_STRATEGY)
    if (size != null) builder.setResolutionStrategy(size)
    return builder.build()
  }

  private companion object {
    /** Frames read for codes and receipts: sharp enough for a small QR code across the counter. */
    val ANALYSIS_SIZE = Size(1280, 960)
    /** The long side of the grid the receipt is looked for in. */
    const val GRID_PIXELS = 160
    /** Milliseconds between two looks for the receipt: often enough for the outline to follow the
     * paper, rare enough to leave the phone cool. */
    const val RECEIPT_INTERVAL_MS = 100L
    /** Looks without a receipt still reported after one is lost: Scan lets a miss or two pass as
     * the finder's, so it needs to hear the receipt is still gone. */
    const val MISSES_REPORTED = 4
    /** The share of the frame below which a quad is not the receipt. */
    const val LIVE_MINIMUM_AREA = 0.06
  }
}
