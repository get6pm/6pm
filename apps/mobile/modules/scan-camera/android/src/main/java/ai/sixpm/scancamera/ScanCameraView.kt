package ai.sixpm.scancamera

import android.annotation.SuppressLint
import android.content.Context
import android.view.ViewGroup
import androidx.camera.view.PreviewView
import androidx.lifecycle.LifecycleOwner
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView

/** The live camera that finds QR codes and receipts. */
@SuppressLint("ViewConstructor")
class ScanCameraView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
  // The preview lays itself out to fill the view; React Native does not lay out native children.
  override val shouldUseAndroidLayout = true

  private val onCode by EventDispatcher()
  private val onReceipt by EventDispatcher()
  private val onRunning by EventDispatcher()

  // A TextureView, so the preview moves with the sheet it sits in, frame for frame.
  private val preview =
    PreviewView(context).apply {
      implementationMode = PreviewView.ImplementationMode.COMPATIBLE
      scaleType = PreviewView.ScaleType.FILL_CENTER
      layoutParams =
        LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT)
    }

  internal val camera = ScanCameraSession(context, preview)

  var active = false
    set(value) {
      field = value
      apply()
    }

  var front = false
    set(value) {
      field = value
      apply()
    }

  var torch = false
    set(value) {
      field = value
      apply()
    }

  var receipts = true
    set(value) {
      field = value
      apply()
    }

  init {
    clipChildren = true
    clipToOutline = true
    addView(preview)
    camera.onCode = { onCode(mapOf("data" to it)) }
    camera.onReceipt = { corners, aspect ->
      onReceipt(mapOf("corners" to corners, "aspect" to aspect))
    }
    camera.onRunning = { onRunning(mapOf("running" to it)) }
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    apply()
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    apply()
  }

  internal fun release() {
    camera.release()
  }

  /** The camera runs only while the view is on screen and asked to. */
  private fun apply() {
    val owner = appContext.currentActivity as? LifecycleOwner ?: return
    camera.update(
      owner,
      running = active && isAttachedToWindow,
      front = front,
      torch = torch,
      receipts = receipts,
    )
  }
}
