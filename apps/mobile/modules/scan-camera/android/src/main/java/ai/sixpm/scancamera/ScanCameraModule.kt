package ai.sixpm.scancamera

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.activity.result.PickVisualMediaRequest
import androidx.activity.result.contract.ActivityResultContracts
import expo.modules.kotlin.activityresult.AppContextActivityResultContract
import expo.modules.kotlin.activityresult.AppContextActivityResultLauncher
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.Serializable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

/**
 * Scan's camera and its reader: a live view that finds QR codes and receipts, the photo a receipt
 * is read from, and a picture picked from the gallery read the same way.
 */
class ScanCameraModule : Module() {
  private lateinit var picker: AppContextActivityResultLauncher<PickRequest, Uri?>
  private var picking = false

  private val context: Context
    get() = appContext.reactContext ?: throw ScanCameraException("context")

  override fun definition() = ModuleDefinition {
    Name("ScanCamera")

    RegisterActivityContracts { picker = registerForActivityResult(PickImage()) }

    /** A picture already on this phone (a `file://` or `content://` URI): a QR code, or a receipt. */
    AsyncFunction("readImage") Coroutine
      { uri: String ->
        val parsed = Uri.parse(uri)
        if (parsed.scheme != "file" && parsed.scheme != "content") throw ScanCameraException("uri")
        withContext(Dispatchers.Default) {
          ReceiptPhoto.readPicked(context, ReceiptPhoto.upright(context, parsed))
        }
      }

    /** A picture picked from the gallery, read: a QR code or a receipt; null when none was picked. */
    AsyncFunction("pickImage") Coroutine
      { ->
        if (picking) throw ScanCameraException("busy")
        picking = true
        val uri =
          try {
            withContext(Dispatchers.Main) { picker.launch(PickRequest()) }
          } finally {
            picking = false
          }
        if (uri == null) {
          null
        } else {
          withContext(Dispatchers.Default) {
            ReceiptPhoto.readPicked(context, ReceiptPhoto.upright(context, uri))
          }
        }
      }

    View(ScanCameraView::class) {
      Events("onCode", "onReceipt", "onRunning")

      Prop("active") { view: ScanCameraView, active: Boolean -> view.active = active }
      Prop("facing") { view: ScanCameraView, facing: String -> view.front = facing == "front" }
      Prop("torch") { view: ScanCameraView, torch: Boolean -> view.torch = torch }
      Prop("receipts") { view: ScanCameraView, receipts: Boolean -> view.receipts = receipts }

      /**
       * Takes the photo and reads the receipt in it. `seen` is where the live view last saw the
       * receipt (`[x0, y0, …, x3, y3]`), used when the photo alone does not show its edges.
       */
      AsyncFunction("capture") Coroutine
        { view: ScanCameraView, seen: List<Double>? ->
          val photo = withContext(Dispatchers.Main) { view.camera.capture() }
          val corners = seen?.let(::corners)
          val context = view.context.applicationContext
          withContext(Dispatchers.Default) {
            val image = ReceiptPhoto.upright(photo.jpeg, photo.rotation, photo.mirrored)
            ReceiptPhoto.read(context, image, corners)
          }
        }

      OnViewDestroys { view: ScanCameraView -> view.release() }
    }
  }

  /** `[x0, y0, …, x3, y3]` from the live view, when it is a whole quad inside the frame. */
  private fun corners(flat: List<Double>): DoubleArray? {
    if (flat.size != 8 || flat.any { !it.isFinite() || it < -0.05 || it > 1.05 }) return null
    return flat.toDoubleArray()
  }
}

/** The system photo picker for one picture: it needs no access to the library. */
internal class PickRequest : Serializable

private class PickImage : AppContextActivityResultContract<PickRequest, Uri?> {
  private val system = ActivityResultContracts.PickVisualMedia()

  override fun createIntent(context: Context, input: PickRequest): Intent =
    system.createIntent(
      context,
      PickVisualMediaRequest.Builder()
        .setMediaType(ActivityResultContracts.PickVisualMedia.ImageOnly)
        .build(),
    )

  override fun parseResult(input: PickRequest, resultCode: Int, intent: Intent?): Uri? =
    system.parseResult(resultCode, intent)
}
