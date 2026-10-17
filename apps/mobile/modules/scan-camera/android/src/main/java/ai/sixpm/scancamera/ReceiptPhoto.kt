package ai.sixpm.scancamera

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Matrix
import android.graphics.Paint
import android.net.Uri
import android.util.Base64
import androidx.exifinterface.media.ExifInterface
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.barcode.BarcodeScannerOptions
import com.google.mlkit.vision.barcode.BarcodeScanning
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.latin.TextRecognizerOptions
import expo.modules.kotlin.exception.CodedException
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.UUID
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.roundToInt

/**
 * Reading a receipt photo on this phone: find the paper, cut it out square, read its lines. Nothing
 * is sent anywhere here; the copy for a closer look is handed back for the app to send only when
 * its own reading is unsure. The same steps and limits as the iPhone's reader.
 */
internal object ReceiptPhoto {
  /** Large enough to straighten a long receipt without losing its small print. */
  private const val WORK_PIXELS = 3000
  /** A receipt at 2000 px on its long side reads as well as the original. */
  private const val READ_PIXELS = 2000
  /** The copy kept for a closer look: enough to read a receipt, small enough to send. */
  private const val LOOK_PIXELS = 1600
  private const val LOOK_BYTES = 1_500_000
  /** A quad smaller than this share of the picture is a label or a card, not the receipt. */
  const val MINIMUM_AREA = 0.04
  /** The long side of the grey picture the paper is looked for in. */
  private const val FIND_PIXELS = 400

  private val texts by lazy { TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS) }
  val codes by lazy {
    BarcodeScanning.getClient(
      BarcodeScannerOptions.Builder().setBarcodeFormats(Barcode.FORMAT_QR_CODE).build()
    )
  }

  /** A camera photo upright: turned by `rotation` degrees clockwise, mirrored for the front camera. */
  fun upright(jpeg: ByteArray, rotation: Int, mirrored: Boolean): Bitmap {
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size, bounds)
    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize(bounds) }
    val decoded =
      BitmapFactory.decodeByteArray(jpeg, 0, jpeg.size, options) ?: throw ScanCameraException("image")
    val matrix = Matrix()
    matrix.postRotate(rotation.toFloat())
    if (mirrored) matrix.postScale(-1f, 1f)
    return transformed(decoded, matrix)
  }

  /** A picture at `uri` (`file://` or `content://`) upright, as its EXIF says to turn it. */
  fun upright(context: Context, uri: Uri): Bitmap {
    val resolver = context.contentResolver
    val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    // Decoding only the bounds hands back no bitmap, so the stream itself says whether it opened.
    val stream = resolver.openInputStream(uri) ?: throw ScanCameraException("uri")
    stream.use { BitmapFactory.decodeStream(it, null, bounds) }
    val options = BitmapFactory.Options().apply { inSampleSize = sampleSize(bounds) }
    val decoded =
      resolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it, null, options) }
        ?: throw ScanCameraException("image")
    val orientation =
      runCatching {
          resolver.openInputStream(uri)?.use {
            ExifInterface(it)
              .getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
          }
        }
        .getOrNull() ?: ExifInterface.ORIENTATION_NORMAL
    val matrix = Matrix()
    when (orientation) {
      ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
      ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
      ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
      ExifInterface.ORIENTATION_TRANSPOSE -> matrix.apply { postRotate(90f); postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
      ExifInterface.ORIENTATION_TRANSVERSE -> matrix.apply { postRotate(270f); postScale(-1f, 1f) }
      ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
    }
    return transformed(decoded, matrix)
  }

  /** The power-of-two step that decodes no smaller than the work size. */
  private fun sampleSize(bounds: BitmapFactory.Options): Int {
    val long = max(bounds.outWidth, bounds.outHeight)
    var sample = 1
    while (long / (sample * 2) >= WORK_PIXELS) sample *= 2
    return sample
  }

  /** `bitmap` turned by `matrix` and brought down to the work size. */
  private fun transformed(bitmap: Bitmap, matrix: Matrix): Bitmap {
    val long = max(bitmap.width, bitmap.height)
    if (long > WORK_PIXELS) {
      val scale = WORK_PIXELS.toFloat() / long
      matrix.preScale(scale, scale)
    }
    if (matrix.isIdentity) return bitmap
    val out = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    if (out !== bitmap) bitmap.recycle()
    return out
  }

  /** The paper in the picture, when one large and clear enough is found. */
  fun document(image: Bitmap): DoubleArray? {
    val scale = FIND_PIXELS.toDouble() / max(image.width, image.height)
    val width = max(1, (image.width * scale).roundToInt())
    val height = max(1, (image.height * scale).roundToInt())
    val small = Bitmap.createScaledBitmap(image, width, height, true)
    val pixels = IntArray(width * height)
    small.getPixels(pixels, 0, width, 0, 0, width, height)
    if (small !== image) small.recycle()
    val grey = IntArray(pixels.size) { i ->
      val c = pixels[i]
      (Color.red(c) * 77 + Color.green(c) * 150 + Color.blue(c) * 29) shr 8
    }
    val found = PaperFinder.find(grey, width, height, MINIMUM_AREA) ?: return null
    return PaperFinder.upright(found, 0, false)
  }

  /** The first QR code in the picture, for a screenshot of one picked from the gallery. */
  fun code(image: Bitmap): String? =
    runCatching { Tasks.await(codes.process(InputImage.fromBitmap(image, 0))) }
      .getOrNull()
      ?.firstNotNullOfOrNull { it.rawValue }

  /** The quad cut out of the image and squared up, as if photographed from straight above. */
  fun straightened(image: Bitmap, corners: DoubleArray): Bitmap? {
    val w = image.width.toDouble()
    val h = image.height.toDouble()
    val p = DoubleArray(8) { i -> corners[i].coerceIn(0.0, 1.0) * if (i % 2 == 0) w else h }
    fun side(a: Int, b: Int) = hypot(p[b * 2] - p[a * 2], p[b * 2 + 1] - p[a * 2 + 1])
    var outW = max(side(0, 1), side(3, 2))
    var outH = max(side(0, 3), side(1, 2))
    val long = max(outW, outH)
    if (long < 8) return null
    if (long > WORK_PIXELS) {
      outW *= WORK_PIXELS / long
      outH *= WORK_PIXELS / long
    }
    val width = outW.roundToInt()
    val height = outH.roundToInt()
    val src = FloatArray(8) { p[it].toFloat() }
    val dst =
      floatArrayOf(0f, 0f, width.toFloat(), 0f, width.toFloat(), height.toFloat(), 0f, height.toFloat())
    val matrix = Matrix()
    if (!matrix.setPolyToPoly(src, 0, dst, 0, 4)) return null
    val out = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
    Canvas(out).drawBitmap(image, matrix, Paint(Paint.FILTER_BITMAP_FLAG or Paint.ANTI_ALIAS_FLAG))
    return out
  }

  /** The picture no larger than `pixels` on its long side. */
  private fun scaled(image: Bitmap, pixels: Int): Bitmap {
    val long = max(image.width, image.height)
    if (long <= pixels) return image
    val scale = pixels.toDouble() / long
    return Bitmap.createScaledBitmap(
      image,
      max(1, (image.width * scale).roundToInt()),
      max(1, (image.height * scale).roundToInt()),
      true,
    )
  }

  /**
   * ML Kit's Latin recogniser, whose languages include Vietnamese. Boxes are given as the iPhone's
   * Vision gives them, normalised with the origin bottom left, so the same parsers read both.
   */
  private fun lines(image: Bitmap): List<Map<String, Any>> {
    val text =
      runCatching { Tasks.await(texts.process(InputImage.fromBitmap(image, 0))) }.getOrNull()
        ?: return emptyList()
    val w = image.width.toDouble()
    val h = image.height.toDouble()
    return text.textBlocks.flatMap { block ->
      block.lines.mapNotNull { line ->
        val box = line.boundingBox ?: return@mapNotNull null
        mapOf(
          "text" to line.text,
          "box" to
            mapOf(
              "x" to box.left / w,
              "y" to 1 - box.bottom / h,
              "w" to box.width() / w,
              "h" to box.height() / h,
            ),
          "confidence" to line.confidence.toDouble(),
        )
      }
    }
  }

  /** The JPEG for the server's closer look, under its size limit, base64. */
  private fun lookCopy(image: Bitmap): String? {
    val picture = scaled(image, LOOK_PIXELS)
    try {
      for (quality in intArrayOf(70, 50, 35)) {
        val out = ByteArrayOutputStream()
        picture.compress(Bitmap.CompressFormat.JPEG, quality, out)
        if (out.size() <= LOOK_BYTES) return Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
      }
      return null
    } finally {
      if (picture !== image) picture.recycle()
    }
  }

  /** The cut-out receipt saved for the card to show while it is read. */
  private fun save(context: Context, image: Bitmap): Uri {
    val directory = File(context.cacheDir, "scan")
    directory.mkdirs()
    // One receipt at a time: what an earlier scan left is cleared.
    directory.listFiles()?.forEach { it.delete() }
    val file = File(directory, "${UUID.randomUUID()}.jpg")
    file.outputStream().use {
      if (!image.compress(Bitmap.CompressFormat.JPEG, 85, it)) throw ScanCameraException("encode")
    }
    return Uri.fromFile(file)
  }

  /**
   * Reads a receipt photo: the paper found in it (or, failing that, where the live camera last saw
   * it), squared up, saved, its lines read and a copy made for a closer look.
   */
  fun read(context: Context, image: Bitmap, seen: DoubleArray?): Map<String, Any?> {
    val corners = document(image) ?: seen
    val cut = corners?.let { straightened(image, it) }
    val receipt = cut ?: image
    val uri = save(context, receipt)
    val read = scaled(receipt, READ_PIXELS)
    val lines = lines(read)
    if (read !== receipt) read.recycle()
    return mapOf(
      "kind" to "receipt",
      "uri" to uri.toString(),
      "width" to receipt.width,
      "height" to receipt.height,
      "cut" to (cut != null),
      "lines" to lines,
      "photo" to lookCopy(receipt),
    )
  }

  /** A picture from the gallery: a QR code when it shows one, else read as a receipt. */
  fun readPicked(context: Context, image: Bitmap): Map<String, Any?> {
    code(image)?.let {
      return mapOf("kind" to "code", "data" to it)
    }
    return read(context, image, null)
  }
}

internal class ScanCameraException(reason: String) : CodedException("Scan camera: $reason")
